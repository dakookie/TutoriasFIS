'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api/client';
import { UserCheck, UserX, Users, FileText, ChevronLeft } from 'lucide-react';

interface Usuario {
  _id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
  activo?: boolean;
  materias?: Array<{
    _id?: string;
    nombre: string;
    codigo?: string;
    semestre?: number;
  }>;
  pdf?: string;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const [solicitudesTutores, setSolicitudesTutores] = useState<Usuario[]>([]);
  const [solicitudesEstudiantes, setSolicitudesEstudiantes] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'home' | 'tutores' | 'estudiantes'>('home');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      const [tutoresRes, estudiantesRes] = await Promise.all([
        api.getSolicitudesTutores(),
        api.getSolicitudesEstudiantes(),
      ]);

      if (tutoresRes.success && Array.isArray(tutoresRes.data)) {
        setSolicitudesTutores(tutoresRes.data);
      }
      if (estudiantesRes.success && Array.isArray(estudiantesRes.data)) {
        setSolicitudesEstudiantes(estudiantesRes.data);
      }
    } catch {
      setError('Error al cargar solicitudes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    
    if (user?.rol !== 'Administrador') {
      router.replace('/dashboard');
      return;
    }

    fetchData();
  }, [user, authLoading, router]);

  // Detectar cambio en query params y actualizar vista
  useEffect(() => {
    const view = searchParams.get('view');
    if (view === 'tutores' || view === 'estudiantes') {
      setActiveView(view);
    }
  }, [searchParams]);

  const handleAprobar = async (id: string) => {
    setActionLoading(id);
    const response = await api.aprobarUsuario(id);
    if (response.success) {
      setSuccessMessage('Usuario aprobado correctamente');
      setTimeout(() => setSuccessMessage(null), 3000);
      setModalOpen(false);
      setSelectedUsuario(null);
      await fetchData();
    } else {
      setError(response.message || 'Error al aprobar');
    }
    setActionLoading(null);
  };

  const handleRechazar = async (id: string) => {
    setActionLoading(id);
    const response = await api.rechazarUsuario(id);
    if (response.success) {
      setSuccessMessage('Usuario rechazado correctamente');
      setTimeout(() => setSuccessMessage(null), 3000);
      setModalOpen(false);
      setSelectedUsuario(null);
      await fetchData();
    } else {
      setError(response.message || 'Error al rechazar');
    }
    setActionLoading(null);
  };

  const openPdfModal = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedUsuario(null);
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  const totalPendientes = solicitudesTutores.length + solicitudesEstudiantes.length;

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-12 py-8">
        {activeView === 'home' && 'Solicitudes de usuarios'}
        {activeView === 'tutores' && 'Solicitudes de Tutores pendientes a revisión'}
        {activeView === 'estudiantes' && 'Solicitudes de Estudiantes pendientes a revisión'}
      </h1>

      {/* Mensajes */}
      {error && (
        <div className="max-w-6xl mx-auto mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="max-w-6xl mx-auto mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {successMessage}
        </div>
      )}

      {/* Home View - Cards */}
      {activeView === 'home' && (
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {/* Solicitudes de Tutores Card */}
            <div
              onClick={() => setActiveView('tutores')}
              className="bg-white rounded-xl shadow-md p-8 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer"
            >
              <div className="text-center">
                <div className="w-32 h-32 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-20 h-20 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-semibold text-blue-600 mb-3">Solicitudes de Tutores</h2>
                <p className="text-gray-600 text-sm mb-4">Aquí puedes gestionar las solicitudes pendientes de tutores</p>
                <span className="inline-block bg-blue-100 text-blue-700 px-4 py-2 rounded-full font-semibold">
                  {solicitudesTutores.length} pendientes
                </span>
              </div>
            </div>

            {/* Solicitudes de Alumnos Card */}
            <div
              onClick={() => setActiveView('estudiantes')}
              className="bg-white rounded-xl shadow-md p-8 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer"
            >
              <div className="text-center">
                <div className="w-32 h-32 mx-auto mb-6 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-20 h-20 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-blue-600 mb-3">Solicitudes de Estudiantes</h2>
                <p className="text-gray-600 text-sm mb-4">Aquí puedes gestionar las solicitudes pendientes de estudiantes</p>
                <span className="inline-block bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full font-semibold">
                  {solicitudesEstudiantes.length} pendientes
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tutores View - Table */}
      {activeView === 'tutores' && (
        <div className="max-w-6xl mx-auto px-4">
          <button
            onClick={() => setActiveView('home')}
            className="text-blue-600 hover:text-blue-800 flex items-center mb-6 text-sm font-medium"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            Volver
          </button>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-blue-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Nombre</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Apellido</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Materias</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Certificación</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {solicitudesTutores.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No se encontraron solicitudes de tutores pendientes
                    </td>
                  </tr>
                ) : (
                  solicitudesTutores.map((usuario) => (
                    <tr key={usuario._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-700 font-medium">{usuario.nombre}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{usuario.apellido}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{usuario.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {usuario.materias && usuario.materias.length > 0 ? (
                          <span className="inline-block bg-blue-50 px-3 py-1 rounded-full text-xs font-medium text-blue-700">
                            {usuario.materias.length} materias
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {usuario.pdf ? (
                          <button
                            onClick={() => openPdfModal(usuario)}
                            className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Ver PDF
                          </button>
                        ) : (
                          <span className="text-gray-400">Sin certificado</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        <button
                          onClick={() => handleAprobar(usuario._id)}
                          disabled={actionLoading === usuario._id}
                          className="inline-flex items-center px-3 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100 disabled:opacity-50 font-medium text-xs"
                        >
                          <UserCheck className="h-4 w-4 mr-1" />
                          Aprobar
                        </button>
                        <button
                          onClick={() => handleRechazar(usuario._id)}
                          disabled={actionLoading === usuario._id}
                          className="inline-flex items-center px-3 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100 disabled:opacity-50 font-medium text-xs"
                        >
                          <UserX className="h-4 w-4 mr-1" />
                          Rechazar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Estudiantes View - Table */}
      {activeView === 'estudiantes' && (
        <div className="max-w-6xl mx-auto px-4">
          <button
            onClick={() => setActiveView('home')}
            className="text-blue-600 hover:text-blue-800 flex items-center mb-6 text-sm font-medium"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            Volver
          </button>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-blue-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Nombre</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Apellido</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {solicitudesEstudiantes.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No se encontraron solicitudes de estudiantes pendientes
                    </td>
                  </tr>
                ) : (
                  solicitudesEstudiantes.map((usuario) => (
                    <tr key={usuario._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-700 font-medium">{usuario.nombre}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{usuario.apellido}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{usuario.email}</td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        <button
                          onClick={() => handleAprobar(usuario._id)}
                          disabled={actionLoading === usuario._id}
                          className="inline-flex items-center px-3 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100 disabled:opacity-50 font-medium text-xs"
                        >
                          <UserCheck className="h-4 w-4 mr-1" />
                          Aprobar
                        </button>
                        <button
                          onClick={() => handleRechazar(usuario._id)}
                          disabled={actionLoading === usuario._id}
                          className="inline-flex items-center px-3 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100 disabled:opacity-50 font-medium text-xs"
                        >
                          <UserX className="h-4 w-4 mr-1" />
                          Rechazar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal para ver PDF y gestionar solicitud */}
      {modalOpen && selectedUsuario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header del Modal */}
              <div className="flex justify-between items-center mb-6 pb-6 border-b">
                <h2 className="text-2xl font-bold text-gray-800">Revisar Solicitud</h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Información del usuario */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Nombre</p>
                    <p className="font-medium text-gray-900">{selectedUsuario.nombre}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Apellido</p>
                    <p className="font-medium text-gray-900">{selectedUsuario.apellido}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{selectedUsuario.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Rol</p>
                    <p className="font-medium text-gray-900">{selectedUsuario.rol}</p>
                  </div>
                </div>
              </div>

              {/* Documento adjunto (PDF) */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Documento Adjunto</h3>
                {selectedUsuario.pdf ? (
                  <div className="border border-gray-300 rounded-lg overflow-hidden">
                    <iframe
                      src={selectedUsuario.pdf}
                      className="w-full h-96"
                      title="Documento PDF"
                    />
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
                    No hay documento adjunto
                  </div>
                )}
              </div>

              {/* Materias (solo para tutores) */}
              {selectedUsuario.rol === 'Tutor' && selectedUsuario.materias && selectedUsuario.materias.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Materias a Enseñar</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {selectedUsuario.materias.map((materia, index) => (
                      <div
                        key={index}
                        className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700 font-medium border border-blue-200"
                      >
                        {typeof materia === 'string' ? materia : materia.nombre}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex justify-end space-x-3 pt-6 border-t">
                <button
                  onClick={closeModal}
                  className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => handleRechazar(selectedUsuario._id)}
                  disabled={actionLoading === selectedUsuario._id}
                  className="inline-flex items-center px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition disabled:opacity-50"
                >
                  <UserX className="h-4 w-4 mr-2" />
                  Rechazar
                </button>
                <button
                  onClick={() => handleAprobar(selectedUsuario._id)}
                  disabled={actionLoading === selectedUsuario._id}
                  className="inline-flex items-center px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition disabled:opacity-50"
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Aprobar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
