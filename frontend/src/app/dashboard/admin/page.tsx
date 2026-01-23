'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, Badge, LoadingScreen, Alert, Button, Avatar } from '@/components/ui';
import api from '@/lib/api/client';
import { UserCheck, UserX, Users, FileText, Eye } from 'lucide-react';

interface Usuario {
  _id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
  materias?: string[];
  pdf?: string;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [solicitudesTutores, setSolicitudesTutores] = useState<Usuario[]>([]);
  const [solicitudesEstudiantes, setSolicitudesEstudiantes] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [tutoresRes, estudiantesRes] = await Promise.all([
        api.getSolicitudesTutores(),
        api.getSolicitudesEstudiantes(),
      ]);

      if (tutoresRes.success && Array.isArray(tutoresRes.data)) {
        setSolicitudesTutores(tutoresRes.data);
      }
      if (estudiantesRes.success && Array.isArray(estudiantesRes.data)) {
        setSolicitudesEstudiantes(estudiantesRes.data);
      }
    } catch {
      setError('Error al cargar solicitudes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    
    if (user?.rol !== 'Administrador') {
      router.replace('/dashboard');
      return;
    }

    fetchData();
  }, [user, authLoading, router]);

  const handleAprobar = async (id: string) => {
    setActionLoading(id);
    const response = await api.aprobarUsuario(id);
    if (response.success) {
      await fetchData();
    } else {
      setError(response.message || 'Error al aprobar');
    }
    setActionLoading(null);
  };

  const handleRechazar = async (id: string) => {
    setActionLoading(id);
    const response = await api.rechazarUsuario(id);
    if (response.success) {
      await fetchData();
    } else {
      setError(response.message || 'Error al rechazar');
    }
    setActionLoading(null);
  };

  if (authLoading || isLoading) {
    return <LoadingScreen />;
  }

  const totalPendientes = solicitudesTutores.length + solicitudesEstudiantes.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Panel de Administración
        </h1>
        <p className="text-gray-600">
          Gestiona las solicitudes de registro de usuarios
        </p>
      </div>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Pendientes</p>
                <p className="text-2xl font-bold text-gray-900">{totalPendientes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <UserCheck className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Tutores Pendientes</p>
                <p className="text-2xl font-bold text-gray-900">{solicitudesTutores.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Estudiantes Pendientes</p>
                <p className="text-2xl font-bold text-gray-900">{solicitudesEstudiantes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Solicitudes de Tutores */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Solicitudes de Tutores</CardTitle>
            <Badge variant="info">{solicitudesTutores.length} pendientes</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {solicitudesTutores.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No hay solicitudes de tutores pendientes
            </p>
          ) : (
            <div className="space-y-4">
              {solicitudesTutores.map((usuario) => (
                <div
                  key={usuario._id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <Avatar nombre={usuario.nombre} apellido={usuario.apellido} />
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {usuario.nombre} {usuario.apellido}
                      </h3>
                      <p className="text-sm text-gray-600">{usuario.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {usuario.pdf && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(usuario.pdf, '_blank')}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        PDF
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAprobar(usuario._id)}
                      isLoading={actionLoading === usuario._id}
                    >
                      <UserCheck className="h-4 w-4 mr-1" />
                      Aprobar
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleRechazar(usuario._id)}
                      isLoading={actionLoading === usuario._id}
                    >
                      <UserX className="h-4 w-4 mr-1" />
                      Rechazar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Solicitudes de Estudiantes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Solicitudes de Estudiantes</CardTitle>
            <Badge variant="success">{solicitudesEstudiantes.length} pendientes</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {solicitudesEstudiantes.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No hay solicitudes de estudiantes pendientes
            </p>
          ) : (
            <div className="space-y-4">
              {solicitudesEstudiantes.map((usuario) => (
                <div
                  key={usuario._id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <Avatar nombre={usuario.nombre} apellido={usuario.apellido} />
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {usuario.nombre} {usuario.apellido}
                      </h3>
                      <p className="text-sm text-gray-600">{usuario.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAprobar(usuario._id)}
                      isLoading={actionLoading === usuario._id}
                    >
                      <UserCheck className="h-4 w-4 mr-1" />
                      Aprobar
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleRechazar(usuario._id)}
                      isLoading={actionLoading === usuario._id}
                    >
                      <UserX className="h-4 w-4 mr-1" />
                      Rechazar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
