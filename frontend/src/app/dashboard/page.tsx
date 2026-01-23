'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingScreen } from '@/components/ui';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    // Redirigir según el rol
    switch (user?.rol) {
      case 'Administrador':
        router.replace('/dashboard/admin');
        break;
      case 'Tutor':
        router.replace('/dashboard/tutor');
        break;
      case 'Estudiante':
        router.replace('/dashboard/estudiante');
        break;
      default:
        router.replace('/login');
    }
  }, [user, isLoading, isAuthenticated, router]);

  return <LoadingScreen message="Redirigiendo..." />;
}
