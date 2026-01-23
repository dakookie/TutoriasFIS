'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '@/lib/api/client';

interface User {
  userId: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: 'Administrador' | 'Tutor' | 'Estudiante';
  materias: string[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const response = await api.getSession();
      // El backend NestJS retorna { ok: true, usuario: {...} } o el usuario directo
      if ((response.success || response.ok) && response.usuario) {
        setUser(response.usuario as User);
      } else if (response.success && (response as any).userId) {
        // Si el usuario viene directo en la respuesta
        setUser(response as unknown as User);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = async (email: string, password: string) => {
    const response = await api.login(email, password);
    
    // El backend NestJS retorna { ok: true, token: '...', usuario: {...} }
    if ((response.success || response.ok) && response.usuario) {
      // Refrescar sesión para obtener datos completos del token
      await refreshSession();
      return { success: true };
    }
    
    return { 
      success: false, 
      message: response.message || response.mensaje || 'Error al iniciar sesión' 
    };
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}

// Hook para proteger rutas
export function useRequireAuth(allowedRoles?: string[]) {
  const { user, isLoading, isAuthenticated } = useAuth();

  const isAuthorized = React.useMemo(() => {
    if (!isAuthenticated) return false;
    if (!allowedRoles || allowedRoles.length === 0) return true;
    return user ? allowedRoles.includes(user.rol) : false;
  }, [isAuthenticated, user, allowedRoles]);

  return {
    user,
    isLoading,
    isAuthenticated,
    isAuthorized,
  };
}
