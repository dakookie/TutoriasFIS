'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingScreen, Alert } from '@/components/ui';
import api from '@/lib/api/client';
import { formatDate, formatTime } from '@/lib/utils';

interface Solicitud {
  _id: string;
  tutoria: string | {
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

interface Pregunta {
  _id: string;
  pregunta: string;
  materiaNombre: string;
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
  
  // Estados de calificación
  const [calificaciones, setCalificaciones] = useState<Record<string, boolean>>({});
  const [showEncuestaModal, setShowEncuestaModal] = useState(false);
  const [encuestaLoading, setEncuestaLoading] = useState(false);
  const [encuestaError, setEncuestaError] = useState<string | null>(null);
  const [preguntasEncuesta, setPreguntasEncuesta] = useState<Pregunta[]>([]);
  const [respuestasEncuesta, setRespuestasEncuesta] = useState<Record<string, number>>({});
  const [tutoriaCalificar, setTutoriaCalificar] = useState<{id: string; materia: string} | null>(null);

  const fetchSolicitudes = async () => {
    const response = await api.getMisSolicitudes();
    if (response.success && Array.isArray(response.data)) {
      setSolicitudes(response.data);
      // Verificar calificaciones para cada solicitud aceptada
      const aceptadas = response.data.filter((s: Solicitud) => s.estado === 'Aceptada');
      const calificacionesMap: Record<string, boolean> = {};
      
      for (const sol of aceptadas) {
        const tutoriaId = getTutoriaIdFromSolicitud(sol);
        if (tutoriaId) {
          try {
            const verificar = await api.verificarRespuesta(tutoriaId);
            // El backend devuelve { respondido: boolean } directamente, no en .data
            const respondido = (verificar as any).respondido ?? (verificar.data as any)?.respondido ?? false;
            calificacionesMap[tutoriaId] = respondido;
          } catch (err) {
            calificacionesMap[tutoriaId] = false;
          }
        }
      }
      setCalificaciones(calificacionesMap);
    } else {
      setError('Error al cargar solicitudes');
    }
    setIsLoading(false);
  };
  
  // Helper para obtener tutoriaId de solicitud (usado antes de definir getTutoriaId)
  const getTutoriaIdFromSolicitud = (sol: Solicitud): string => {
    if (typeof sol.tutoria === 'string') {
      return sol.tutoria;
    }
    return sol.tutoria?._id || '';
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

  // Funciones de calificación
  const abrirModalEncuesta = async (tutoriaId: string, materia: string) => {
    setTutoriaCalificar({ id: tutoriaId, materia });
    setEncuestaError(null);
    setRespuestasEncuesta({});
    
    try {
      const response = await api.getPreguntasPorMateria(materia);
      if (response.success && Array.isArray(response.data)) {
        if (response.data.length === 0) {
          setError('No hay preguntas configuradas para esta materia. Por favor, contacta al administrador.');
          return;
        }
        setPreguntasEncuesta(response.data);
        setShowEncuestaModal(true);
      } else {
        setError('Error al cargar preguntas de la encuesta');
      }
    } catch (err) {
      setError('Error al cargar el formulario de calificación');
    }
  };

  const cerrarModalEncuesta = () => {
    setShowEncuestaModal(false);
    setTutoriaCalificar(null);
    setPreguntasEncuesta([]);
    setRespuestasEncuesta({});
    setEncuestaError(null);
  };

  const handleRespuestaChange = (preguntaId: string, valor: number) => {
    setRespuestasEncuesta(prev => ({ ...prev, [preguntaId]: valor }));
  };

  const enviarEncuesta = async () => {
    if (!tutoriaCalificar) return;
    
    // Validar tutoriaId
    if (!tutoriaCalificar.id) {
      setEncuestaError('Error: No se pudo identificar la tutoría');
      return;
    }
    
    // Validar que todas las preguntas estén respondidas
    const todasRespondidas = preguntasEncuesta.every(p => respuestasEncuesta[p._id] !== undefined);
    if (!todasRespondidas) {
      setEncuestaError('Por favor, responde a todas las preguntas antes de enviar.');
      return;
    }

    setEncuestaLoading(true);
    setEncuestaError(null);

    try {
      console.log('Enviando encuesta:', { tutoriaId: tutoriaCalificar.id, respuestas: respuestasEncuesta });
      const response = await api.enviarRespuestas(tutoriaCalificar.id, respuestasEncuesta);
      if (response.success) {
        cerrarModalEncuesta();
        setSuccessMessage('¡Gracias por tu calificación! Tu opinión es muy importante para mejorar nuestras tutorías.');
        setCalificaciones(prev => ({ ...prev, [tutoriaCalificar.id]: true }));
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        setEncuestaError(response.message || 'Error al enviar la encuesta');
      }
    } catch (err) {
      setEncuestaError('Error al enviar la encuesta');
    }

    setEncuestaLoading(false);
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
  const getTutoriaObj = (sol: Solicitud) => typeof sol.tutoria === 'object' ? sol.tutoria : null;
  const getMateria = (sol: Solicitud) => sol.materia || getTutoriaObj(sol)?.materiaNombre || 'N/A';
  const getFecha = (sol: Solicitud) => sol.fecha || getTutoriaObj(sol)?.fecha || '';
  const getHoraInicio = (sol: Solicitud) => sol.horaInicio || getTutoriaObj(sol)?.horaInicio || '';
  const getHoraFin = (sol: Solicitud) => sol.horaFin || getTutoriaObj(sol)?.horaFin || '';
  const getTutor = (sol: Solicitud) => sol.tutor || getTutoriaObj(sol)?.tutorNombre || 'N/A';
  // tutoria puede venir como objeto poblado o como string (ID)
  const getTutoriaId = (sol: Solicitud): string => {
    if (typeof sol.tutoria === 'string') {
      return sol.tutoria;
    }
    return sol.tutoria?._id || '';
  };

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
                    <td className="px-6 py-4 flex gap-2">
                      <a
                        href={`/aula/${getTutoriaId(solicitud)}`}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm font-medium transition inline-flex items-center"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Ir al Aula
                      </a>
                      {calificaciones[getTutoriaId(solicitud)] ? (
                        <button
                          disabled
                          className="bg-gray-400 text-white px-4 py-2 rounded text-sm font-medium cursor-not-allowed inline-flex items-center"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Calificada
                        </button>
                      ) : (
                        <button
                          onClick={() => abrirModalEncuesta(getTutoriaId(solicitud), getMateria(solicitud))}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded text-sm font-medium transition inline-flex items-center"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                          Calificar
                        </button>
                      )}
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

      {/* Modal de Encuesta de Calificación */}
      {showEncuestaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  <span className="mr-2">⭐</span>
                  Calificar Tutoría
                </h3>
                <button
                  onClick={cerrarModalEncuesta}
                  className="text-gray-500 hover:text-gray-700 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {encuestaError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {encuestaError}
                </div>
              )}

              <p className="text-gray-600 mb-6">
                Por favor, califica cada aspecto de la tutoría del 1 al 5, donde 1 es muy malo y 5 es excelente.
              </p>

              <div className="space-y-6">
                {preguntasEncuesta.map((pregunta) => (
                  <div key={pregunta._id} className="border border-gray-200 rounded-lg p-4">
                    <label className="block text-gray-800 font-medium mb-3">
                      {pregunta.pregunta}
                    </label>
                    <div className="flex justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((valor) => {
                        const emojis = ['😞', '😕', '😐', '🙂', '😊'];
                        const colores = [
                          'bg-red-500 hover:bg-red-600',
                          'bg-orange-500 hover:bg-orange-600',
                          'bg-yellow-500 hover:bg-yellow-600',
                          'bg-lime-500 hover:bg-lime-600',
                          'bg-green-500 hover:bg-green-600'
                        ];
                        const isSelected = respuestasEncuesta[pregunta._id] === valor;
                        return (
                          <button
                            key={valor}
                            type="button"
                            onClick={() => handleRespuestaChange(pregunta._id, valor)}
                            className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition transform hover:scale-110 ${
                              isSelected 
                                ? `${colores[valor - 1]} ring-4 ring-offset-2 ring-blue-400 scale-110`
                                : 'bg-gray-200 hover:bg-gray-300'
                            }`}
                            title={`${valor} - ${emojis[valor - 1]}`}
                          >
                            {isSelected ? emojis[valor - 1] : valor}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {preguntasEncuesta.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  No hay preguntas disponibles para esta materia.
                </div>
              )}

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={cerrarModalEncuesta}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded font-medium transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={enviarEncuesta}
                  disabled={preguntasEncuesta.length === 0 || Object.keys(respuestasEncuesta).length < preguntasEncuesta.length}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded font-medium transition disabled:bg-gray-400 disabled:cursor-not-allowed inline-flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Enviar Calificación
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
