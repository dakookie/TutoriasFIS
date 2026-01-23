'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { tutoriaSchema, TutoriaFormData } from '@/lib/validations/tutoria';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api/client';
import { Input, Button, Alert, Card, CardContent, CardHeader, CardTitle, Select, LoadingScreen } from '@/components/ui';

interface Materia {
  _id: string;
  nombre: string;
  codigo?: string;
}

export default function NuevaTutoriaPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<TutoriaFormData>({
    resolver: zodResolver(tutoriaSchema),
    mode: 'onBlur',
    defaultValues: {
      modalidadAula: undefined,
    },
  });

  // Cargar materias del tutor
  useEffect(() => {
    if (authLoading) return;
    
    if (user?.rol !== 'Tutor') {
      router.replace('/dashboard');
      return;
    }

    const fetchMaterias = async () => {
      const response = await api.getMaterias();
      if (response.success && Array.isArray(response.data)) {
        // Filtrar solo las materias que el tutor puede dar
        const materiasDelTutor = response.data.filter((m: Materia) => 
          user.materias?.includes(m._id)
        );
        setMaterias(materiasDelTutor);
      }
    };

    fetchMaterias();
  }, [user, authLoading, router]);

  const onSubmit = async (data: TutoriaFormData) => {
    setApiError(null);

    const response = await api.crearTutoria({
      materia: data.materia,
      fecha: data.fecha,
      horaInicio: data.horaInicio,
      horaFin: data.horaFin,
      cuposOriginales: parseInt(data.cuposOriginales),
      ...(data.modalidadAula && { modalidadAula: data.modalidadAula }),
      ...(data.nombreAula && { nombreAula: data.nombreAula }),
      ...(data.enlaceAula && { enlaceAula: data.enlaceAula }),
    });

    if (response.success) {
      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard/tutor/tutorias');
      }, 2000);
    } else {
      setApiError(response.message || 'Error al crear tutoría');
    }
  };

  if (authLoading) {
    return <LoadingScreen />;
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Tutoría Creada!</h2>
            <p className="text-gray-600 mb-6">
              Tu tutoría ha sido creada como borrador. Publícala cuando estés listo.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Obtener fecha mínima (hoy)
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-2xl mx-auto">
      <Link 
        href="/dashboard/tutor/tutorias" 
        className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Volver a mis tutorías
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Crear Nueva Tutoría</CardTitle>
          <p className="text-gray-500">Completa los datos de tu tutoría</p>
        </CardHeader>

        <CardContent>
          {apiError && (
            <Alert variant="error" className="mb-4">
              {apiError}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Materia */}
            <Select
              label="Materia"
              placeholder="Selecciona una materia"
              options={materias.map((m) => ({
                value: m._id,
                label: `${m.nombre} (${m.codigo})`,
              }))}
              error={errors.materia?.message}
              {...register('materia')}
              required
            />

            {/* Fecha */}
            <Input
              label="Fecha"
              type="date"
              min={today}
              error={errors.fecha?.message}
              {...register('fecha')}
              required
            />

            {/* Horas */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Hora de Inicio"
                type="time"
                error={errors.horaInicio?.message}
                {...register('horaInicio')}
                required
              />
              <Input
                label="Hora de Fin"
                type="time"
                error={errors.horaFin?.message}
                {...register('horaFin')}
                required
              />
            </div>

            {/* Cupos */}
            <Input
              label="Número de Cupos"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Ej: 10"
              helperText="Solo números. Mínimo 1, máximo 50"
              error={errors.cuposOriginales?.message}
              {...register('cuposOriginales')}
              required
              onKeyPress={(e) => {
                // Solo permitir números
                if (!/[0-9]/.test(e.key)) {
                  e.preventDefault();
                }
              }}
            />

            {/* Modalidad (opcional) */}
            <Select
              label="Modalidad (opcional)"
              placeholder="Selecciona modalidad"
              options={[
                { value: 'Presencial', label: 'Presencial' },
                { value: 'Virtual', label: 'Virtual' },
              ]}
              error={errors.modalidadAula?.message}
              {...register('modalidadAula')}
            />

            {/* Ubicación/Enlace condicional */}
            {watch('modalidadAula') === 'Presencial' && (
              <Input
                label="Ubicación del Aula"
                type="text"
                placeholder="Ej: Aula 301, Edificio de Sistemas"
                error={errors.nombreAula?.message}
                {...register('nombreAula')}
              />
            )}

            {watch('modalidadAula') === 'Virtual' && (
              <>
                <Input
                  label="Nombre de la Sala"
                  type="text"
                  placeholder="Ej: Sala de Tutorías - Cálculo"
                  error={errors.nombreAula?.message}
                  {...register('nombreAula')}
                />
                <Input
                  label="Enlace de la Reunión"
                  type="url"
                  placeholder="https://meet.google.com/xxx-xxxx-xxx"
                  error={errors.enlaceAula?.message}
                  {...register('enlaceAula')}
                />
              </>
            )}

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => router.back()}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1"
                isLoading={isSubmitting}
              >
                Crear Tutoría
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
