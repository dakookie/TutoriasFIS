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
    materiaNombre: string;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    tutorNombre: string;
    modalidadAula?: string;
    nombreAula?: string;
    enlaceAula?: string;
  };
  estado: 'Pendiente' | 'Aceptada' | 'Rechazada';
  createdAt: string;
}

export default function SolicitudesEstudiantePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      await fetchSolicitudes();
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

  if (authLoading || isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Mis Solicitudes</h2>
      
      {error && (
        <Alert variant="error" className="mb-4">{error}</Alert>
      )}

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
                <td colSpan={7} className="text-center py-4 text-gray-500">
                  No se encontraron solicitudes de tutorías enviadas
                </td>
              </tr>
            ) : (
              solicitudes.map((solicitud) => {
                const puedeEliminar = solicitud.estado === 'Pendiente';
                const puedeIrAlAula = solicitud.estado === 'Aceptada';
                const estadoClass = getEstadoClass(solicitud.estado);
                
                return (
                  <tr key={solicitud._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {solicitud.tutoria.materiaNombre}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {formatDate(solicitud.tutoria.fecha)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {formatTime(solicitud.tutoria.horaInicio)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {formatTime(solicitud.tutoria.horaFin)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {solicitud.tutoria.tutorNombre}
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
                        {puedeIrAlAula && (
                          <a
                            href={`/aula/${solicitud.tutoria._id}`}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm font-medium transition inline-block"
                          >
                            Ir al Aula
                          </a>
                        )}
                        {solicitud.estado === 'Rechazada' && (
                          <span className="text-gray-400">-</span>
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

      {/* Modal de confirmación para eliminar */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Confirmar eliminación</h2>
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
                  ¿Estás seguro de que deseas eliminar esta solicitud? Esta acción no se puede deshacer.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelDelete}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded font-medium transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-medium transition"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
