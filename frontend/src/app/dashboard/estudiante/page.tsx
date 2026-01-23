'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, Badge, LoadingScreen, Alert, Button } from '@/components/ui';
import api from '@/lib/api/client';
import { Calendar, Users, Clock, BookOpen } from 'lucide-react';
import { formatDate, formatTime } from '@/lib/utils';

interface Tutoria {
  _id: string;
  materiaNombre: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  cuposDisponibles: number;
  cuposOriginales: number;
  tutorNombre: string;
  publicada: boolean;
}

export default function EstudianteDashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [tutorias, setTutorias] = useState<Tutoria[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    
    if (user?.rol !== 'Estudiante') {
      router.replace('/dashboard');
      return;
    }

    const fetchTutorias = async () => {
      const response = await api.getTutoriasDisponibles();
      if (response.success && Array.isArray(response.data)) {
        setTutorias(response.data.slice(0, 5)); // Solo las primeras 5
      } else {
        setError('Error al cargar tutorías');
      }
      setIsLoading(false);
    };

    fetchTutorias();
  }, [user, authLoading, router]);

  if (authLoading || isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          ¡Hola, {user?.nombre}!
        </h1>
        <p className="text-gray-600">
          Bienvenido al sistema de tutorías de la Facultad de Ingeniería en Sistemas
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Tutorías Disponibles</p>
                <p className="text-2xl font-bold text-gray-900">{tutorias.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Materias</p>
                <p className="text-2xl font-bold text-gray-900">8</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Tutores Activos</p>
                <p className="text-2xl font-bold text-gray-900">12</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Próximas Tutorías */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Tutorías Disponibles</CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/dashboard/estudiante/tutorias')}
            >
              Ver todas
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && <Alert variant="error">{error}</Alert>}
          
          {tutorias.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No hay tutorías disponibles en este momento
            </p>
          ) : (
            <div className="space-y-4">
              {tutorias.map((tutoria) => (
                <div
                  key={tutoria._id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">
                      {tutoria.materiaNombre}
                    </h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(tutoria.fecha)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatTime(tutoria.horaInicio)} - {formatTime(tutoria.horaFin)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Tutor: {tutoria.tutorNombre}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={tutoria.cuposDisponibles > 0 ? 'success' : 'error'}>
                      {tutoria.cuposDisponibles} cupos
                    </Badge>
                    <Button
                      size="sm"
                      disabled={tutoria.cuposDisponibles === 0}
                    >
                      Solicitar
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
