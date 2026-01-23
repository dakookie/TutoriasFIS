'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingScreen } from '@/components/ui';
import api from '@/lib/api/client';
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
  modalidadAula?: string;
  nombreAula?: string;
}

interface Materia {
  _id: string;
  nombre: string;
  codigo?: string;
}

export default function TutoriasDisponiblesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [tutorias, setTutorias] = useState<Tutoria[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [filtroMateria, setFiltroMateria] = useState<string>('Todas');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [solicitudLoading, setSolicitudLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchTutorias = async (materiaId?: string) => {
    setIsLoading(true);
    const response = await api.getTutoriasDisponibles(materiaId || undefined);
    if (response.success && Array.isArray(response.data)) {
      setTutorias(response.data);
    } else {
      setError('Error al cargar tutorías');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (authLoading) return;
    
    if (user?.rol !== 'Estudiante') {
      router.replace('/dashboard');
      return;
    }

    // Cargar materias para filtro
    const fetchMaterias = async () => {
      const response = await api.getMaterias();
      if (response.success && Array.isArray(response.data)) {
        setMaterias(response.data);
      }
    };

    fetchMaterias();
    fetchTutorias();
  }, [user, authLoading, router]);

  const handleFiltroChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFiltroMateria(value);
    fetchTutorias(value === 'Todas' ? undefined : value);
  };

  const handleSolicitar = async (tutoriaId: string) => {
    setSolicitudLoading(tutoriaId);
    setError(null);
    setSuccessMessage(null);

    const response = await api.crearSolicitud(tutoriaId);
    
    if (response.success) {
      setSuccessMessage('¡Solicitud enviada exitosamente!');
      // Refrescar lista para actualizar cupos
      await fetchTutorias(filtroMateria === 'Todas' ? undefined : filtroMateria);
    } else {
      setError(response.message || 'Error al enviar solicitud');
    }
    
    setSolicitudLoading(null);
  };

  if (authLoading || isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Tutorías Disponibles</h1>

      {/* Toast Container for messages */}
      {(error || successMessage) && (
        <div className="fixed top-20 right-4 z-50 space-y-2">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-lg">
              {successMessage}
            </div>
          )}
        </div>
      )}

      {/* Filtro por Materia */}
      <div className="mb-6 flex items-center">
        <label htmlFor="filtro-materia" className="text-gray-700 font-medium mr-3">
          Filtrar por Materia
        </label>
        <select
          id="filtro-materia"
          value={filtroMateria}
          onChange={handleFiltroChange}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
        >
          <option value="Todas">Todas</option>
          {materias.map((materia) => (
            <option key={materia._id} value={materia._id}>
              {materia.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Tabla de Tutorías Disponibles */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <table className="w-full">
          <thead className="bg-blue-100">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Materia</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Fecha</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Hora Inicio</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Hora Fin</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Tutor</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tutorias.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  {filtroMateria !== 'Todas'
                    ? 'No hay tutorías disponibles para esta materia'
                    : 'No hay tutorías disponibles en este momento'}
                </td>
              </tr>
            ) : (
              tutorias.map((tutoria) => (
                <tr key={tutoria._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-800">{tutoria.materiaNombre}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{formatDate(tutoria.fecha)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{formatTime(tutoria.horaInicio)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{formatTime(tutoria.horaFin)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{tutoria.tutorNombre}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleSolicitar(tutoria._id)}
                      disabled={tutoria.cuposDisponibles === 0 || solicitudLoading === tutoria._id}
                      className={`px-4 py-2 rounded text-sm font-medium transition ${
                        tutoria.cuposDisponibles === 0
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                      }`}
                    >
                      {solicitudLoading === tutoria._id ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Enviando...
                        </span>
                      ) : tutoria.cuposDisponibles === 0 ? (
                        'Sin cupos'
                      ) : (
                        'Solicitar'
                      )}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
