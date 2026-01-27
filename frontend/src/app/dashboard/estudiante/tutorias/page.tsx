'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingScreen, Alert, Button } from '@/components/ui';
import api from '@/lib/api/client';
import { formatDate, formatTime } from '@/lib/utils';
import { Trash2 } from 'lucide-react';

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

interface Solicitud {
  _id: string;
  tutoria: {
    _id: string;
    materiaNombre: string;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    tutorNombre: string;
  };
  estado: 'Pendiente' | 'Aceptada' | 'Rechazada';
  fechaSolicitud: string;
}

export default function TutoriasDisponiblesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [tutorias, setTutorias] = useState<Tutoria[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [filtroMateria, setFiltroMateria] = useState<string>('Todas');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [solicitudLoading, setSolicitudLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

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

  const fetchSolicitudes = async () => {
    const response = await api.getMisSolicitudes();
    if (response.success && Array.isArray(response.data)) {
      setSolicitudes(response.data);
    }
  };

  const fetchData = async (materiaId?: string) => {
    await Promise.all([
      fetchTutorias(materiaId),
      fetchSolicitudes()
    ]);
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
    fetchData();
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
      // Refrescar datos para actualizar el estado
      await fetchData(filtroMateria === 'Todas' ? undefined : filtroMateria);
    } else {
      setError(response.message || 'Error al enviar solicitud');
    }
    
    setSolicitudLoading(null);
  };

  const handleEliminarSolicitud = async (solicitudId: string) => {
    if (!confirm('¿Estás seguro de que deseas cancelar esta solicitud?')) {
      return;
    }

    setDeleteLoading(solicitudId);
    setError(null);

    const response = await api.eliminarSolicitud(solicitudId);
    
    if (response.success) {
      setSuccessMessage('Solicitud cancelada exitosamente');
      // Refrescar datos
      await fetchData(filtroMateria === 'Todas' ? undefined : filtroMateria);
    } else {
      setError(response.message || 'Error al cancelar solicitud');
    }
    
    setDeleteLoading(null);
  };

  // Verificar si el usuario ya tiene una solicitud para una tutoría
  const tieneSolicitud = (tutoriaId: string) => {
    return solicitudes.some(sol => {
      const solTutoriaId = sol.tutoria?._id || sol.tutoria;
      return solTutoriaId === tutoriaId;
    });
  };

  // Obtener el estado de la solicitud para una tutoría
  const getEstadoSolicitud = (tutoriaId: string) => {
    const solicitud = solicitudes.find(sol => {
      const solTutoriaId = sol.tutoria?._id || sol.tutoria;
      return solTutoriaId === tutoriaId;
    });
    return solicitud?.estado;
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
                    {(() => {
                      const yaTieneSolicitud = tieneSolicitud(tutoria._id);
                      const estadoSolicitud = getEstadoSolicitud(tutoria._id);
                      const sinCupos = tutoria.cuposDisponibles === 0;
                      const cargando = solicitudLoading === tutoria._id;

                      if (yaTieneSolicitud) {
                        const badgeClass = estadoSolicitud === 'Aceptada' ? 'bg-green-100 text-green-800 border border-green-300' :
                                         estadoSolicitud === 'Rechazada' ? 'bg-red-100 text-red-800 border border-red-300' :
                                         'bg-yellow-100 text-yellow-800 border border-yellow-300';
                        return (
                          <span className={`px-3 py-2 rounded-lg text-sm font-medium ${badgeClass}`}>
                            {estadoSolicitud}
                          </span>
                        );
                      }

                      if (sinCupos) {
                        return (
                          <span className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-500 border border-gray-300">
                            Sin cupos
                          </span>
                        );
                      }

                      return (
                        <button
                          onClick={() => handleSolicitar(tutoria._id)}
                          disabled={cargando}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                        >
                          {cargando ? (
                            <span className="flex items-center">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              Enviando...
                            </span>
                          ) : (
                            'Solicitar'
                          )}
                        </button>
                      );
                    })()}
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
