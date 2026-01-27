'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingScreen, Alert } from '@/components/ui';
import api from '@/lib/api/client';
import { formatDate, formatTime } from '@/lib/utils';

interface Solicitud {
  _id: string;
  tutoria: {
    _id: string;
    materiaNombre?: string;
    fecha?: string;
    horaInicio?: string;
    horaFin?: string;
    tutorNombre?: string;
    modalidadAula?: string;
    nombreAula?: string;
    enlaceAula?: string;
  };
  // Campos desnormalizados
  materia?: string;
  fecha?: string;
  horaInicio?: string;
  horaFin?: string;
  tutor?: string;
  estado: 'Pendiente' | 'Aceptada' | 'Rechazada';
  createdAt: string;
}

export default function SolicitudesEstudiantePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [solicitudToDelete, setSolicitudToDelete] = useState<string | null>(null);

  const fetchSolicitudes = async () => {
    const response = await api.getMisSolicitudes();
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

  const handleEliminar = async (solicitudId: string) => {
    setSolicitudToDelete(solicitudId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!solicitudToDelete) return;
    
    setCancelLoading(solicitudToDelete);
    setError(null);
    setShowDeleteModal(false);

    const response = await api.eliminarSolicitud(solicitudToDelete);
    
    if (response.success) {
      setSuccessMessage('Solicitud cancelada exitosamente');
      await fetchSolicitudes();
      setTimeout(() => setSuccessMessage(null), 3000);
    } else {
      setError(response.message || 'Error al eliminar solicitud');
    }
    
    setCancelLoading(null);
    setSolicitudToDelete(null);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setSolicitudToDelete(null);
  };

  const getEstadoClass = (estado: string) => {
    switch (estado) {
      case 'Aceptada':
        return 'bg-green-100 text-green-800';
      case 'Rechazada':
        return 'bg-red-100 text-red-800';
      case 'Pendiente':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  // Helper para obtener datos de la solicitud (usa desnormalizados o de tutoria)
  const getMateria = (sol: Solicitud) => sol.materia || sol.tutoria?.materiaNombre || 'N/A';
  const getFecha = (sol: Solicitud) => sol.fecha || sol.tutoria?.fecha || '';
  const getHoraInicio = (sol: Solicitud) => sol.horaInicio || sol.tutoria?.horaInicio || '';
  const getHoraFin = (sol: Solicitud) => sol.horaFin || sol.tutoria?.horaFin || '';
  const getTutor = (sol: Solicitud) => sol.tutor || sol.tutoria?.tutorNombre || 'N/A';
  const getTutoriaId = (sol: Solicitud) => sol.tutoria?._id || '';

  // Separar solicitudes aceptadas de las demás
  const solicitudesAceptadas = solicitudes.filter(s => s.estado === 'Aceptada');

  if (authLoading || isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Mis Solicitudes</h1>
      
      {error && (
        <Alert variant="error" className="mb-4">{error}</Alert>
      )}

      {successMessage && (
        <Alert variant="success" className="mb-4">{successMessage}</Alert>
      )}

      {/* Tabla de Tutorías Aceptadas - Acceso al Aula */}
      {solicitudesAceptadas.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
            Tutorías Aceptadas
          </h2>
          <p className="text-gray-600 mb-4 text-sm">
            Estas son las tutorías a las que puedes acceder. Haz clic en &quot;Ir al Aula&quot; para entrar.
          </p>
          <div className="bg-white rounded-lg shadow-md overflow-hidden border-2 border-green-200">
            <table className="w-full">
              <thead className="bg-green-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Materia</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Fecha</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Hora Inicio</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Hora Fin</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Tutor</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {solicitudesAceptadas.map((solicitud) => (
                  <tr key={solicitud._id} className="hover:bg-green-50">
                    <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                      {getMateria(solicitud)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {formatDate(getFecha(solicitud))}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {formatTime(getHoraInicio(solicitud))}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {formatTime(getHoraFin(solicitud))}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {getTutor(solicitud)}
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={`/aula/${getTutoriaId(solicitud)}`}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm font-medium transition inline-flex items-center"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Ir al Aula
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tabla de Historial de Solicitudes */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
          Historial de Solicitudes
        </h2>
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-blue-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Materia</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Fecha</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Hora Inicio</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Hora Fin</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Tutor</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Estado</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {solicitudes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    No tienes solicitudes de tutorías
                  </td>
                </tr>
              ) : (
                solicitudes.map((solicitud) => {
                  const puedeEliminar = solicitud.estado === 'Pendiente';
                  const estadoClass = getEstadoClass(solicitud.estado);
                  
                  return (
                    <tr key={solicitud._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {getMateria(solicitud)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {formatDate(getFecha(solicitud))}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {formatTime(getHoraInicio(solicitud))}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {formatTime(getHoraFin(solicitud))}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {getTutor(solicitud)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${estadoClass}`}>
                          {solicitud.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {puedeEliminar && (
                            <button
                              onClick={() => handleEliminar(solicitud._id)}
                              disabled={cancelLoading === solicitud._id}
                              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm font-medium transition disabled:opacity-50"
                            >
                              {cancelLoading === solicitud._id ? 'Cancelando...' : 'Cancelar'}
                            </button>
                          )}
                          {solicitud.estado === 'Aceptada' && (
                            <a
                              href={`/aula/${getTutoriaId(solicitud)}`}
                              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm font-medium transition inline-block"
                            >
                              Ir al Aula
                            </a>
                          )}
                          {solicitud.estado === 'Rechazada' && (
                            <span className="text-gray-400 text-sm">Solicitud rechazada</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de confirmación para eliminar */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Confirmar cancelación</h2>
                <button
                  onClick={cancelDelete}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                <p className="text-gray-600">
                  ¿Estás seguro de que deseas cancelar esta solicitud? Esta acción no se puede deshacer.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelDelete}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded font-medium transition"
                >
                  No, volver
                </button>
                <button
                  onClick={confirmDelete}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-medium transition"
                >
                  Sí, cancelar solicitud
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
