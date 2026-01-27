'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, Badge, LoadingScreen, Alert, Button } from '@/components/ui';
import api from '@/lib/api/client';
import { Calendar, Clock, Plus, Eye, Edit, Trash2, Send, User, CheckCircle, XCircle, X } from 'lucide-react';
import { formatDate, formatTime } from '@/lib/utils';

interface Tutoria {
  _id: string;
  materiaNombre: string;
  materia?: { _id: string; nombre: string } | string;
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

interface Solicitud {
  _id: string;
  estudiante: string;
  estudianteNombre: string;
  tutoria: string;
  materiaNombre: string;
  estado: 'Pendiente' | 'Aceptada' | 'Rechazada';
  fechaCreacion: string;
}

interface TutoriaEditForm {
  tutoriaId: string;
  materiaNombre: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  cupos: number;
}

export default function TutoriasTutorPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [tutorias, setTutorias] = useState<Tutoria[]>([]);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [filtroSolicitudes, setFiltroSolicitudes] = useState<string>('Todas');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Modal de edición
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<TutoriaEditForm>({
    tutoriaId: '',
    materiaNombre: '',
    fecha: '',
    horaInicio: '',
    horaFin: '',
    cupos: 1,
  });

  // Modal de confirmación de eliminación
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInfo, setDeleteInfo] = useState<{ id: string; materia: string }>({ id: '', materia: '' });

  const fetchTutorias = async () => {
    if (!user) return;
    
    try {
      const tutoriasResponse = await api.getMisTutorias();
      if (tutoriasResponse.success && Array.isArray(tutoriasResponse.data)) {
        setTutorias(tutoriasResponse.data);
        await fetchSolicitudes(tutoriasResponse.data);
      } else {
        setError('Error al cargar tutorías');
      }
    } catch (error) {
      setError('Error al cargar datos');
      console.error('Error:', error);
    }
    setIsLoading(false);
  };

  const fetchSolicitudes = async (tutoriasData: Tutoria[]) => {
    try {
      const todasSolicitudes: Solicitud[] = [];
      
      if (!tutoriasData || tutoriasData.length === 0) {
        setSolicitudes([]);
        return;
      }
      
      for (const tutoria of tutoriasData) {
        const response = await api.getSolicitudesTutoria(tutoria._id);
        if (response.success && Array.isArray(response.data)) {
          const solicitudesTutoria = response.data.map((s: any) => ({
            ...s,
            materiaNombre: tutoria.materiaNombre,
          }));
          todasSolicitudes.push(...solicitudesTutoria);
        }
      }
      
      setSolicitudes(todasSolicitudes);
    } catch (error) {
      console.error('Error al cargar solicitudes:', error);
      setSolicitudes([]);
    }
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
    setError(null);
    const response = await api.publicarTutoria(id);
    if (response.success) {
      setSuccessMessage(response.message || 'Estado de publicación cambiado');
      await fetchTutorias();
    } else {
      setError(response.message || 'Error al cambiar estado de publicación');
    }
    setActionLoading(null);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleOpenEditModal = (tutoria: Tutoria) => {
    // Formatear fecha para input date (YYYY-MM-DD)
    const fechaObj = new Date(tutoria.fecha);
    const fechaFormateada = fechaObj.toISOString().split('T')[0];
    
    setEditForm({
      tutoriaId: tutoria._id,
      materiaNombre: tutoria.materiaNombre,
      fecha: fechaFormateada,
      horaInicio: tutoria.horaInicio,
      horaFin: tutoria.horaFin,
      cupos: tutoria.cuposOriginales,
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editForm.horaInicio >= editForm.horaFin) {
      setError('La hora de inicio debe ser menor que la hora de fin');
      return;
    }

    setActionLoading(editForm.tutoriaId);
    setError(null);
    
    try {
      const response = await api.actualizarTutoria(editForm.tutoriaId, {
        fecha: editForm.fecha,
        horaInicio: editForm.horaInicio,
        horaFin: editForm.horaFin,
        cuposOriginales: editForm.cupos,
      });
      
      if (response.success) {
        setShowEditModal(false);
        setSuccessMessage('Tutoría actualizada exitosamente');
        await fetchTutorias();
      } else {
        setError(response.message || 'Error al actualizar tutoría');
      }
    } catch (error) {
      setError('Error al actualizar tutoría');
    }
    setActionLoading(null);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleOpenDeleteModal = (tutoria: Tutoria) => {
    setDeleteInfo({ id: tutoria._id, materia: tutoria.materiaNombre });
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    setActionLoading(deleteInfo.id);
    setError(null);
    
    try {
      const response = await api.eliminarTutoria(deleteInfo.id);
      if (response.success) {
        setShowDeleteModal(false);
        setSuccessMessage('Tutoría eliminada exitosamente');
        await fetchTutorias();
      } else {
        setError(response.message || 'Error al eliminar tutoría');
      }
    } catch (error) {
      setError('Error al eliminar tutoría');
    }
    setActionLoading(null);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleAceptarSolicitud = async (solicitudId: string) => {
    setActionLoading(solicitudId);
    setError(null);
    
    try {
      const response = await api.aceptarSolicitud(solicitudId);
      if (response.success || response.ok) {
        setSuccessMessage('Solicitud aceptada');
        await fetchTutorias();
      } else {
        setError(response.message || response.mensaje || 'Error al aceptar solicitud');
      }
    } catch (error) {
      setError('Error al aceptar solicitud');
    }
    setActionLoading(null);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleRechazarSolicitud = async (solicitudId: string) => {
    setActionLoading(solicitudId);
    setError(null);
    
    try {
      const response = await api.rechazarSolicitud(solicitudId);
      if (response.success || response.ok) {
        setSuccessMessage('Solicitud rechazada');
        await fetchTutorias();
      } else {
        setError(response.message || response.mensaje || 'Error al rechazar solicitud');
      }
    } catch (error) {
      setError('Error al rechazar solicitud');
    }
    setActionLoading(null);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  if (authLoading || isLoading) {
    return <LoadingScreen />;
  }

  // Calcular cupos aceptados por tutoría
  const getCuposAceptados = (tutoriaId: string) => {
    return solicitudes.filter(s => s.tutoria === tutoriaId && s.estado === 'Aceptada').length;
  };

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

      {error && <Alert variant="error">{error}</Alert>}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}

      {/* Tabla de Tutorías - Diseño similar al monolítico */}
      <Card>
        <CardHeader>
          <CardTitle>Tutorías Creadas</CardTitle>
        </CardHeader>
        <CardContent>
          {!tutorias || tutorias.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No has creado ninguna tutoría aún</p>
              <Button onClick={() => router.push('/dashboard/tutor/tutorias/nueva')}>
                <Plus className="h-5 w-5 mr-2" />
                Crear mi primera tutoría
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full bg-white border border-gray-200 text-sm">
                <thead className="bg-blue-100">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-b">ID</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-b">Materia</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-b">Fecha</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-b">Estado</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 border-b">Cupos Totales</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 border-b">Cupos Aceptados</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 border-b">Aula</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 border-b">Publicar</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 border-b">Editar</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 border-b">Eliminar</th>
                  </tr>
                </thead>
                <tbody>
                  {(tutorias || []).map((tutoria) => (
                    <tr key={tutoria._id} className="border-b hover:bg-gray-50">
                      <td className="px-3 py-2 text-xs text-gray-700">{tutoria._id.substring(0, 7)}</td>
                      <td className="px-3 py-2 text-xs text-gray-700">{tutoria.materiaNombre}</td>
                      <td className="px-3 py-2 text-xs text-gray-700 whitespace-nowrap">{formatDate(tutoria.fecha)}</td>
                      <td className="px-3 py-2">
                        <span className={`text-xs font-medium ${tutoria.publicada ? 'text-green-700' : 'text-gray-500'}`}>
                          {tutoria.publicada ? 'Publicada' : 'No Publicada'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-700 text-center">{tutoria.cuposOriginales}</td>
                      <td className="px-3 py-2 text-xs text-gray-700 text-center">{getCuposAceptados(tutoria._id)}</td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => router.push(`/aula/${tutoria._id}`)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs font-medium transition"
                        >
                          Ir al Aula
                        </button>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => handlePublicar(tutoria._id)}
                          disabled={actionLoading === tutoria._id}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs font-medium transition disabled:opacity-50 w-full"
                        >
                          {actionLoading === tutoria._id ? '...' : (tutoria.publicada ? 'Despublicar' : 'Publicar')}
                        </button>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => handleOpenEditModal(tutoria)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs font-medium transition"
                        >
                          <Edit className="h-3 w-3 inline mr-1" />
                          Editar
                        </button>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => handleOpenDeleteModal(tutoria)}
                          className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs font-medium transition"
                        >
                          <Trash2 className="h-3 w-3 inline mr-1" />
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sección de Solicitudes Recibidas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Solicitudes Recibidas
            </CardTitle>
            <select
              value={filtroSolicitudes}
              onChange={(e) => setFiltroSolicitudes(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="Todas">Todas</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Aceptada">Aceptada</option>
              <option value="Rechazada">Rechazada</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {(() => {
            const solicitudesFiltradas = filtroSolicitudes === 'Todas' 
              ? (solicitudes || [])
              : (solicitudes || []).filter(s => s.estado === filtroSolicitudes);

            if (solicitudesFiltradas.length === 0) {
              return (
                <div className="text-center text-gray-500 py-8">
                  No hay solicitudes {filtroSolicitudes === 'Todas' ? '' : `con estado "${filtroSolicitudes}"`}
                </div>
              );
            }

            return (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 border-b">ID Solicitud</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 border-b">Materia</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 border-b">Estudiante</th>
                      <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700 border-b">Estado</th>
                      <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700 border-b">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(solicitudesFiltradas || []).map((solicitud) => {
                      const tutoriaCorrespondiente = (tutorias || []).find(t => t._id === solicitud.tutoria);
                      const puedeAceptar = (tutoriaCorrespondiente?.cuposDisponibles || 0) > 0 || solicitud.estado === 'Aceptada';
                      
                      return (
                        <tr key={solicitud._id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-2 text-xs text-gray-700">{solicitud._id.substring(0, 8)}...</td>
                          <td className="px-4 py-2 text-xs text-gray-700">{solicitud.materiaNombre}</td>
                          <td className="px-4 py-2 text-xs text-gray-700">{solicitud.estudianteNombre}</td>
                          <td className="px-4 py-2 text-center">
                            <Badge 
                              variant={
                                solicitud.estado === 'Aceptada' ? 'success' :
                                solicitud.estado === 'Rechazada' ? 'error' : 'warning'
                              }
                            >
                              {solicitud.estado}
                            </Badge>
                          </td>
                          <td className="px-4 py-2 text-center">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => handleAceptarSolicitud(solicitud._id)}
                                disabled={!puedeAceptar || actionLoading === solicitud._id || solicitud.estado === 'Aceptada'}
                                className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs font-medium transition disabled:opacity-50"
                              >
                                {actionLoading === solicitud._id ? '...' : 'Aceptar'}
                              </button>
                              <button
                                onClick={() => handleRechazarSolicitud(solicitud._id)}
                                disabled={actionLoading === solicitud._id || solicitud.estado === 'Rechazada'}
                                className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs font-medium transition disabled:opacity-50"
                              >
                                {actionLoading === solicitud._id ? '...' : 'Rechazar'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* Modal de Editar Tutoría */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Editar Tutoría</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Materia</label>
                <input
                  type="text"
                  value={editForm.materiaNombre}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={editForm.fecha}
                  onChange={(e) => setEditForm({ ...editForm, fecha: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora Inicio <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={editForm.horaInicio}
                    onChange={(e) => setEditForm({ ...editForm, horaInicio: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora Fin <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={editForm.horaFin}
                    onChange={(e) => setEditForm({ ...editForm, horaFin: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cupos <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={editForm.cupos}
                  onChange={(e) => setEditForm({ ...editForm, cupos: parseInt(e.target.value) || 1 })}
                  min="1"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded font-medium transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === editForm.tutoriaId}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded font-medium transition disabled:opacity-50"
                >
                  {actionLoading === editForm.tutoriaId ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Confirmar Eliminación</h2>
            <p className="text-red-600 font-semibold mb-3">¿Estás seguro de que deseas eliminar esta tutoría?</p>
            <p className="text-gray-700 mb-2">Esta acción eliminará:</p>
            <ul className="list-disc list-inside text-gray-700 mb-3 space-y-1">
              <li>La tutoría de <strong>{deleteInfo.materia}</strong></li>
              <li>Todas las solicitudes asociadas</li>
              <li>Todo el contenido del aula virtual</li>
              <li>Todas las calificaciones de encuestas</li>
            </ul>
            <p className="text-red-600 font-semibold mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded font-medium transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={actionLoading === deleteInfo.id}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded font-medium transition disabled:opacity-50"
              >
                {actionLoading === deleteInfo.id ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
