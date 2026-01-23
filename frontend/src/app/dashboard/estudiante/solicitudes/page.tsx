'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, Badge, LoadingScreen, Alert, Button } from '@/components/ui';
import api from '@/lib/api/client';
import { Calendar, Clock, User, X } from 'lucide-react';
import { formatDate, formatTime, getEstadoSolicitudColor } from '@/lib/utils';

interface Solicitud {
  _id: string;
  tutoria: {
    _id: string;
    materiaNombre: string;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    tutorNombre: string;
    modalidadAula?: string;
    nombreAula?: string;
    enlaceAula?: string;
  };
  estado: 'pendiente' | 'aceptada' | 'rechazada' | 'cancelada';
  createdAt: string;
}

export default function SolicitudesEstudiantePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState<string | null>(null);

  const fetchSolicitudes = async () => {
    const response = await api.getSolicitudesEstudiante();
    if (response.success && Array.isArray(response.data)) {
      setSolicitudes(response.data);
    } else {
      setError('Error al cargar solicitudes');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (authLoading) return;
    
    if (user?.rol !== 'Estudiante') {
      router.replace('/dashboard');
      return;
    }

    fetchSolicitudes();
  }, [user, authLoading, router]);

  const handleCancelar = async (solicitudId: string) => {
    if (!confirm('¿Estás seguro de cancelar esta solicitud?')) return;
    
    setCancelLoading(solicitudId);
    setError(null);

    const response = await api.cancelarSolicitud(solicitudId);
    
    if (response.success) {
      await fetchSolicitudes();
    } else {
      setError(response.message || 'Error al cancelar');
    }
    
    setCancelLoading(null);
  };

  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
      pendiente: 'warning',
      aceptada: 'success',
      rechazada: 'error',
      cancelada: 'default',
    };
    return variants[estado] || 'default';
  };

  const getEstadoLabel = (estado: string) => {
    const labels: Record<string, string> = {
      pendiente: 'Pendiente',
      aceptada: 'Aceptada',
      rechazada: 'Rechazada',
      cancelada: 'Cancelada',
    };
    return labels[estado] || estado;
  };

  if (authLoading || isLoading) {
    return <LoadingScreen />;
  }

  const solicitudesPendientes = solicitudes.filter(s => s.estado === 'pendiente');
  const solicitudesAceptadas = solicitudes.filter(s => s.estado === 'aceptada');
  const solicitudesOtras = solicitudes.filter(s => !['pendiente', 'aceptada'].includes(s.estado));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mis Solicitudes</h1>
        <p className="text-gray-600">Revisa el estado de tus solicitudes de tutoría</p>
      </div>

      {error && (
        <Alert variant="error">{error}</Alert>
      )}

      {/* Solicitudes Aceptadas */}
      {solicitudesAceptadas.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            ✅ Tutorías Confirmadas
          </h2>
          <div className="grid gap-4">
            {solicitudesAceptadas.map((solicitud) => (
              <Card key={solicitud._id} className="border-green-200 bg-green-50">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {solicitud.tutoria.materiaNombre}
                        </h3>
                        <Badge variant="success">Aceptada</Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="h-4 w-4 text-blue-500" />
                          <span>{formatDate(solicitud.tutoria.fecha)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="h-4 w-4 text-green-500" />
                          <span>{formatTime(solicitud.tutoria.horaInicio)} - {formatTime(solicitud.tutoria.horaFin)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <User className="h-4 w-4 text-purple-500" />
                          <span>{solicitud.tutoria.tutorNombre}</span>
                        </div>
                      </div>

                      {solicitud.tutoria.nombreAula && (
                        <p className="text-sm text-gray-600 mt-3">
                          📍 {solicitud.tutoria.nombreAula}
                        </p>
                      )}
                      
                      {solicitud.tutoria.enlaceAula && (
                        <a
                          href={solicitud.tutoria.enlaceAula}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          🔗 Unirse a la reunión virtual
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Solicitudes Pendientes */}
      {solicitudesPendientes.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            ⏳ Pendientes de Aprobación
          </h2>
          <div className="grid gap-4">
            {solicitudesPendientes.map((solicitud) => (
              <Card key={solicitud._id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {solicitud.tutoria.materiaNombre}
                        </h3>
                        <Badge variant="warning">Pendiente</Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="h-4 w-4 text-blue-500" />
                          <span>{formatDate(solicitud.tutoria.fecha)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="h-4 w-4 text-green-500" />
                          <span>{formatTime(solicitud.tutoria.horaInicio)} - {formatTime(solicitud.tutoria.horaFin)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <User className="h-4 w-4 text-purple-500" />
                          <span>{solicitud.tutoria.tutorNombre}</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancelar(solicitud._id)}
                      isLoading={cancelLoading === solicitud._id}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Otras Solicitudes */}
      {solicitudesOtras.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Historial
          </h2>
          <div className="grid gap-4">
            {solicitudesOtras.map((solicitud) => (
              <Card key={solicitud._id} className="opacity-75">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {solicitud.tutoria.materiaNombre}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {formatDate(solicitud.tutoria.fecha)} • {solicitud.tutoria.tutorNombre}
                      </p>
                    </div>
                    <Badge variant={getEstadoBadge(solicitud.estado)}>
                      {getEstadoLabel(solicitud.estado)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Sin solicitudes */}
      {solicitudes.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 mb-4">No tienes solicitudes de tutoría</p>
            <Button onClick={() => router.push('/dashboard/estudiante/tutorias')}>
              Explorar tutorías disponibles
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
