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
  materias?: Array<string | {
    _id?: string;
    nombre: string;
    codigo?: string;
    semestre?: number;
  }>;
  pdf?: string;
  carnetEstudiantil?: string;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const [solicitudesTutores, setSolicitudesTutores] = useState<Usuario[]>([]);
  const [solicitudesEstudiantes, setSolicitudesEstudiantes] = useState<Usuario[]>([]);
  const [tutoresActivos, setTutoresActivos] = useState<Usuario[]>([]);
  const [estudiantesActivos, setEstudiantesActivos] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'home' | 'tutores' | 'estudiantes'>('home');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  
  // Estados de paginación
  const [currentPageTutores, setCurrentPageTutores] = useState(1);
  const [currentPageEstudiantes, setCurrentPageEstudiantes] = useState(1);
  const itemsPerPage = 10;

  const fetchData = async () => {
    try {
      setError(null);
      const [tutoresRes, estudiantesRes, tutoresActivosRes, estudiantesActivosRes] = await Promise.all([
        api.getSolicitudesTutores(),
        api.getSolicitudesEstudiantes(),
        api.getTutores(),
        api.getEstudiantes(),
      ]);

      if (tutoresRes.success && Array.isArray(tutoresRes.data)) {
        setSolicitudesTutores(tutoresRes.data);
      }
      if (estudiantesRes.success && Array.isArray(estudiantesRes.data)) {
        setSolicitudesEstudiantes(estudiantesRes.data);
      }
      if (tutoresActivosRes.success && Array.isArray(tutoresActivosRes.data)) {
        setTutoresActivos(tutoresActivosRes.data);
      }
      if (estudiantesActivosRes.success && Array.isArray(estudiantesActivosRes.data)) {
        setEstudiantesActivos(estudiantesActivosRes.data);
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

  // Funciones de paginación
  const getPaginatedData = (data: Usuario[], currentPage: number) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (dataLength: number) => {
    return Math.ceil(dataLength / itemsPerPage);
  };

  // Componente de Paginación
  const Pagination = ({ 
    currentPage, 
    totalPages, 
    onPageChange 
  }: { 
    currentPage: number; 
    totalPages: number; 
    onPageChange: (page: number) => void; 
  }) => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex justify-center items-center space-x-2 py-4">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-3 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          ← Anterior
        </button>
        
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-2 border rounded-md ${ 
              page === currentPage
                ? 'bg-blue-500 text-white border-blue-500' 
                : 'hover:bg-gray-50'
            }`}
          >
            {page}
          </button>
        ))}
        
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Siguiente →
        </button>
      </div>
    );
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
      {/* Toast Container */}
      {(error || successMessage) && (
        <div className="fixed top-20 right-4 z-50 space-y-2">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg">
              <strong className="font-bold">Error: </strong>
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-4 text-red-700 hover:text-red-900"
              >
                ✕
              </button>
            </div>
          )}
          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-lg">
              <strong className="font-bold">¡Éxito! </strong>
              <span>{successMessage}</span>
              <button
                onClick={() => setSuccessMessage(null)}
                className="ml-4 text-green-700 hover:text-green-900"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-12 py-8">
        {activeView === 'home' && 'Solicitudes de usuarios'}
        {activeView === 'tutores' && 'Solicitudes de Tutores pendientes a revisión'}
        {activeView === 'estudiantes' && 'Solicitudes de Estudiantes pendientes a revisión'}
      </h1>

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

      {/* Tutores View - Tables */}
      {activeView === 'tutores' && (
        <div className="max-w-6xl mx-auto px-4">
          <button
            onClick={() => setActiveView('home')}
            className="text-blue-600 hover:text-blue-800 flex items-center mb-6 text-sm font-medium"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            Volver
          </button>
          
          {/* Solicitudes Pendientes */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Solicitudes de Tutores Pendientes</h2>
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

          {/* Lista de Tutores Activos */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Lista de Tutores Activos ({tutoresActivos.length})</h2>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-green-100 sticky top-0">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Nombre</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Apellido</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Materias</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Estado</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Fecha Registro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {getPaginatedData(tutoresActivos, currentPageTutores).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                          No hay tutores activos
                        </td>
                      </tr>
                    ) : (
                      getPaginatedData(tutoresActivos, currentPageTutores).map((tutor) => (
                        <tr key={tutor._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-700 font-medium">{tutor.nombre}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">{tutor.apellido}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">{tutor.email}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {tutor.materias && tutor.materias.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {tutor.materias.slice(0, 2).map((materia, index) => {
                                  let nombreMateria = 'Materia sin nombre';
                                  if (typeof materia === 'string') {
                                    nombreMateria = materia;
                                  } else if (materia && typeof materia === 'object' && materia.nombre) {
                                    nombreMateria = materia.nombre;
                                  } else if (materia && typeof materia === 'object') {
                                    // Si es un ObjectId sin populate, mostrar mensaje
                                    nombreMateria = 'Cargando...';
                                  }
                                  return (
                                    <span key={index} className="inline-block bg-blue-50 px-2 py-1 rounded text-xs font-medium text-blue-700">
                                      {nombreMateria}
                                    </span>
                                  );
                                })}
                                {tutor.materias.length > 2 && (
                                  <span className="text-xs text-gray-500">+{tutor.materias.length - 2} más</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">Sin materias</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className="inline-block bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                              Activo
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {new Date(tutor.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={currentPageTutores}
                totalPages={getTotalPages(tutoresActivos.length)}
                onPageChange={setCurrentPageTutores}
              />
            </div>
          </div>
        </div>
      )}

      {/* Estudiantes View - Tables */}
      {activeView === 'estudiantes' && (
        <div className="max-w-6xl mx-auto px-4">
          <button
            onClick={() => setActiveView('home')}
            className="text-blue-600 hover:text-blue-800 flex items-center mb-6 text-sm font-medium"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            Volver
          </button>
          
          {/* Solicitudes Pendientes */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Solicitudes de Estudiantes Pendientes</h2>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="w-full">
                <thead className="bg-blue-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Nombre</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Apellido</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Carnet</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {solicitudesEstudiantes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        No se encontraron solicitudes de estudiantes pendientes
                      </td>
                    </tr>
                  ) : (
                    solicitudesEstudiantes.map((usuario) => (
                      <tr key={usuario._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-700 font-medium">{usuario.nombre}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{usuario.apellido}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{usuario.email}</td>
                        <td className="px-6 py-4 text-sm">
                          {usuario.carnetEstudiantil ? (
                            <button
                              onClick={() => openPdfModal(usuario)}
                              className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs hover:bg-blue-100"
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              Ver Carnet
                            </button>
                          ) : (
                            <span className="text-gray-400 text-xs">Sin carnet</span>
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

          {/* Lista de Estudiantes Activos */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Lista de Estudiantes Activos ({estudiantesActivos.length})</h2>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-green-100 sticky top-0">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Nombre</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Apellido</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Carnet</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Estado</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Fecha Registro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {getPaginatedData(estudiantesActivos, currentPageEstudiantes).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                          No hay estudiantes activos
                        </td>
                      </tr>
                    ) : (
                      getPaginatedData(estudiantesActivos, currentPageEstudiantes).map((estudiante) => (
                        <tr key={estudiante._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-700 font-medium">{estudiante.nombre}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">{estudiante.apellido}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">{estudiante.email}</td>
                          <td className="px-6 py-4 text-sm">
                            {estudiante.carnetEstudiantil ? (
                              <button
                                onClick={() => openPdfModal(estudiante)}
                                className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs hover:bg-blue-100"
                              >
                                <FileText className="h-3 w-3 mr-1" />
                                Ver Carnet
                              </button>
                            ) : (
                              <span className="text-gray-400 text-xs">Sin carnet</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className="inline-block bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                              Activo
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {new Date(estudiante.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={currentPageEstudiantes}
                totalPages={getTotalPages(estudiantesActivos.length)}
                onPageChange={setCurrentPageEstudiantes}
              />
            </div>
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

              {/* Documento adjunto (PDF o Carnet Estudiantil) */}
              <div className="mb-6">
                {selectedUsuario.rol === 'Tutor' && selectedUsuario.pdf && (
                  <>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Documento PDF (Certificado/Comprobante)</h3>
                    <div className="border border-gray-300 rounded-lg overflow-hidden">
                      <iframe
                        src={selectedUsuario.pdf}
                        className="w-full h-96"
                        title="Documento PDF del tutor"
                      />
                    </div>
                  </>
                )}
                
                {selectedUsuario.rol === 'Estudiante' && selectedUsuario.carnetEstudiantil && (
                  <>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Carnet Estudiantil</h3>
                    <div className="border border-gray-300 rounded-lg overflow-hidden">
                      <iframe
                        src={selectedUsuario.carnetEstudiantil}
                        className="w-full h-96"
                        title="Carnet Estudiantil"
                      />
                    </div>
                  </>
                )}
                
                {!selectedUsuario.pdf && !selectedUsuario.carnetEstudiantil && (
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
                    {selectedUsuario.materias.map((materia, index) => {
                      let nombreMateria = 'Materia sin nombre';
                      if (typeof materia === 'string') {
                        nombreMateria = materia;
                      } else if (materia && typeof materia === 'object' && materia.nombre) {
                        nombreMateria = materia.nombre;
                      }
                      return (
                        <div
                          key={index}
                          className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700 font-medium border border-blue-200"
                        >
                          {nombreMateria}
                        </div>
                      );
                    })}
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
