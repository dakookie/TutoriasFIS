'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, Badge, LoadingScreen, Alert, Button } from '@/components/ui';
import api from '@/lib/api/client';
import { Calendar, Clock, Plus, MoreVertical, Eye, Edit, Trash2, Send } from 'lucide-react';
import { formatDate, formatTime } from '@/lib/utils';

interface Tutoria {
  _id: string;
  materiaNombre: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  cuposDisponibles: number;
  cuposOriginales: number;
  publicada: boolean;
  activa: boolean;
  modalidadAula?: string;
  nombreAula?: string;
}

export default function TutoriasTutorPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [tutorias, setTutorias] = useState<Tutoria[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const fetchTutorias = async () => {
    if (!user) return;
    
    const response = await api.getTutoriasTutor(user.userId);
    if (response.success && Array.isArray(response.data)) {
      setTutorias(response.data);
    } else {
      setError('Error al cargar tutorías');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (authLoading) return;
    
    if (user?.rol !== 'Tutor') {
      router.replace('/dashboard');
      return;
    }

    fetchTutorias();
  }, [user, authLoading, router]);

  const handlePublicar = async (id: string) => {
    setActionLoading(id);
    const response = await api.publicarTutoria(id);
    if (response.success) {
      await fetchTutorias();
    } else {
      setError(response.message || 'Error al publicar');
    }
    setActionLoading(null);
    setMenuOpen(null);
  };

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta tutoría?')) return;
    
    setActionLoading(id);
    const response = await api.eliminarTutoria(id);
    if (response.success) {
      await fetchTutorias();
    } else {
      setError(response.message || 'Error al eliminar');
    }
    setActionLoading(null);
    setMenuOpen(null);
  };

  if (authLoading || isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Tutorías</h1>
          <p className="text-gray-600">Gestiona todas tus tutorías</p>
        </div>
        <Button onClick={() => router.push('/dashboard/tutor/tutorias/nueva')}>
          <Plus className="h-5 w-5 mr-2" />
          Nueva Tutoría
        </Button>
      </div>

      {error && (
        <Alert variant="error">{error}</Alert>
      )}

      {/* Lista de Tutorías */}
      {tutorias.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 mb-4">No has creado ninguna tutoría aún</p>
            <Button onClick={() => router.push('/dashboard/tutor/tutorias/nueva')}>
              <Plus className="h-5 w-5 mr-2" />
              Crear mi primera tutoría
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tutorias.map((tutoria) => (
            <Card key={tutoria._id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {tutoria.materiaNombre}
                      </h3>
                      <Badge variant={tutoria.publicada ? 'success' : 'warning'}>
                        {tutoria.publicada ? 'Publicada' : 'Borrador'}
                      </Badge>
                      {tutoria.modalidadAula && (
                        <Badge variant="info">
                          {tutoria.modalidadAula}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(tutoria.fecha)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatTime(tutoria.horaInicio)} - {formatTime(tutoria.horaFin)}
                      </span>
                      <span>
                        <strong>{tutoria.cuposDisponibles}</strong>/{tutoria.cuposOriginales} cupos disponibles
                      </span>
                    </div>

                    {tutoria.nombreAula && (
                      <p className="text-sm text-gray-500 mt-1">
                        📍 {tutoria.nombreAula}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMenuOpen(menuOpen === tutoria._id ? null : tutoria._id)}
                    >
                      <MoreVertical className="h-5 w-5" />
                    </Button>

                    {menuOpen === tutoria._id && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                        {!tutoria.publicada && (
                          <button
                            onClick={() => handlePublicar(tutoria._id)}
                            disabled={actionLoading === tutoria._id}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Send className="h-4 w-4" />
                            Publicar
                          </button>
                        )}
                        <button
                          onClick={() => {
                            router.push(`/dashboard/tutor/tutorias/${tutoria._id}/editar`);
                            setMenuOpen(null);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Edit className="h-4 w-4" />
                          Editar
                        </button>
                        <button
                          onClick={() => handleEliminar(tutoria._id)}
                          disabled={actionLoading === tutoria._id}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
