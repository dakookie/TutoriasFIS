'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, LoadingScreen, Alert, Button } from '@/components/ui';
import api from '@/lib/api/client';
import { Info, MessageSquare, BookOpen, Settings, X, Edit, Trash2, Download, ExternalLink, LogOut, Menu, Upload } from 'lucide-react';

interface TutoriaInfo {
  _id: string;
  materiaNombre: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  tutorNombre: string;
  tutor: { _id: string; nombre: string; apellido: string; email: string };
  modalidadAula?: string;
  nombreAula?: string;
  enlaceAula?: string;
  aulaConfigurada?: boolean;
}

interface Publicacion {
  _id: string;
  titulo: string;
  contenido: string;
  imagen?: string;
  tipoImagen?: string;
  tutorNombre: string;
  createdAt: string;
}

interface Bibliografia {
  _id: string;
  titulo: string;
  archivo: string;
  tipoArchivo: string;
  tutorNombre: string;
  createdAt: string;
}

type TabType = 'informacion' | 'publicaciones' | 'bibliografia';

export default function AulaVirtualPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const tutoriaId = params.tutoriaId as string;

  const [tutoria, setTutoria] = useState<TutoriaInfo | null>(null);
  const [esTutor, setEsTutor] = useState(false);
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [bibliografias, setBibliografias] = useState<Bibliografia[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('informacion');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal de configuración
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configForm, setConfigForm] = useState({
    modalidadAula: '',
    nombreAula: '',
    enlaceReunion: '',
  });
  const [isEditingConfig, setIsEditingConfig] = useState(false);

  // Modal de publicación
  const [showPublicacionModal, setShowPublicacionModal] = useState(false);
  const [publicacionForm, setPublicacionForm] = useState({
    id: '',
    titulo: '',
    contenido: '',
    imagen: '',
    tipoImagen: '',
  });
  const [isEditingPublicacion, setIsEditingPublicacion] = useState(false);

  // Modal de bibliografía
  const [showBibliografiaModal, setShowBibliografiaModal] = useState(false);
  const [bibliografiaForm, setBibliografiaForm] = useState({
    id: '',
    titulo: '',
    archivo: '',
    tipoArchivo: '',
  });
  const [isEditingBibliografia, setIsEditingBibliografia] = useState(false);
  
  // Estados para nombres de archivos seleccionados
  const [selectedImageName, setSelectedImageName] = useState<string>('');
  const [selectedFileName, setSelectedFileName] = useState<string>('');

  // Modales de confirmación para eliminación
  const [showDeletePublicacionModal, setShowDeletePublicacionModal] = useState(false);
  const [showDeleteBibliografiaModal, setShowDeleteBibliografiaModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; titulo: string } | null>(null);

  const fetchAulaData = useCallback(async () => {
    try {
      const aulaResponse = await api.getAulaInfo(tutoriaId);
      if (aulaResponse.success) {
        setTutoria((aulaResponse as any).tutoria);
        setEsTutor((aulaResponse as any).esTutor);
      } else {
        setError(aulaResponse.message || 'No tienes acceso a esta aula');
        return;
      }

      const [pubResponse, bibResponse] = await Promise.all([
        api.getPublicaciones(tutoriaId),
        api.getBibliografias(tutoriaId),
      ]);

      if (pubResponse.success) {
        setPublicaciones((pubResponse as any).publicaciones || []);
      }
      if (bibResponse.success) {
        setBibliografias((bibResponse as any).bibliografias || []);
      }
    } catch (err) {
      setError('Error al cargar datos del aula');
    }
    setIsLoading(false);
  }, [tutoriaId]);

  useEffect(() => {
    if (!authLoading && user && tutoriaId) {
      fetchAulaData();
    }
  }, [authLoading, user, tutoriaId, fetchAulaData]);

  // Handlers de configuración
  const handleOpenConfigModal = (editing = false) => {
    setError(null);
    setIsEditingConfig(editing);
    if (editing && tutoria) {
      setConfigForm({
        modalidadAula: tutoria.modalidadAula || '',
        nombreAula: tutoria.nombreAula || '',
        enlaceReunion: tutoria.enlaceAula || '',
      });
    } else {
      setConfigForm({ modalidadAula: '', nombreAula: '', enlaceReunion: '' });
    }
    setShowConfigModal(true);
  };

  const handleSaveConfig = async () => {
    // Clear previous error messages
    setError(null);
    
    if (!configForm.modalidadAula) {
      setError('Selecciona una modalidad');
      return;
    }
    if (configForm.modalidadAula === 'Presencial' && !configForm.nombreAula.trim()) {
      setError('El nombre del aula es requerido');
      return;
    }
    if (configForm.modalidadAula === 'Virtual' && !configForm.enlaceReunion.trim()) {
      setError('El enlace de reunión es requerido');
      return;
    }

    setActionLoading(true);
    try {
      console.log('Sending config data:', configForm); // Debug log
      
      const response = isEditingConfig 
        ? await api.editarConfiguracionAula(tutoriaId, configForm)
        : await api.configurarAula(tutoriaId, configForm);
      console.log('API Response:', response); // Debug log
      
      if (response.success) {
        setSuccessMessage(isEditingConfig ? 'Configuración actualizada' : 'Aula configurada exitosamente');
        setShowConfigModal(false);
        await fetchAulaData();
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(response.message || 'Error al guardar configuración');
      }
    } catch (err) {
      console.error('Error saving config:', err); // Debug log
      setError('Error al guardar configuración. Verifica tu conexión.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handlers de publicaciones
  const handleOpenPublicacionModal = (pub?: Publicacion) => {
    setError(null);
    setSelectedImageName('');
    if (pub) {
      setIsEditingPublicacion(true);
      setPublicacionForm({
        id: pub._id,
        titulo: pub.titulo,
        contenido: pub.contenido,
        imagen: pub.imagen || '',
        tipoImagen: pub.tipoImagen || '',
      });
    } else {
      setIsEditingPublicacion(false);
      setPublicacionForm({ id: '', titulo: '', contenido: '', imagen: '', tipoImagen: '' });
    }
    setShowPublicacionModal(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImageName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const extension = file.name.split('.').pop()?.toLowerCase() || '';
        setPublicacionForm(prev => ({
          ...prev,
          imagen: base64,
          tipoImagen: extension,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSavePublicacion = async () => {
    if (!publicacionForm.titulo || !publicacionForm.contenido) {
      setError('Título y contenido son requeridos');
      return;
    }

    setActionLoading(true);
    try {
      let response;
      if (isEditingPublicacion) {
        response = await api.editarPublicacion(tutoriaId, publicacionForm.id, {
          titulo: publicacionForm.titulo,
          contenido: publicacionForm.contenido,
          imagen: publicacionForm.imagen || undefined,
          tipoImagen: publicacionForm.tipoImagen || undefined,
        });
      } else {
        response = await api.crearPublicacion(tutoriaId, {
          titulo: publicacionForm.titulo,
          contenido: publicacionForm.contenido,
          imagen: publicacionForm.imagen || undefined,
          tipoImagen: publicacionForm.tipoImagen || undefined,
        });
      }

      if (response.success) {
        setSuccessMessage(isEditingPublicacion ? 'Publicación actualizada' : 'Publicación creada');
        setShowPublicacionModal(false);
        await fetchAulaData();
      } else {
        setError(response.message || 'Error al guardar publicación');
      }
    } catch (err) {
      setError('Error al guardar publicación');
    }
    setActionLoading(false);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleDeletePublicacion = (publicacion: Publicacion) => {
    setItemToDelete({ id: publicacion._id, titulo: publicacion.titulo });
    setShowDeletePublicacionModal(true);
  };

  const confirmDeletePublicacion = async () => {
    if (!itemToDelete) return;
    
    setActionLoading(true);
    try {
      const response = await api.eliminarPublicacion(tutoriaId, itemToDelete.id);
      if (response.success) {
        setSuccessMessage('Publicación eliminada exitosamente');
        await fetchAulaData();
        setShowDeletePublicacionModal(false);
        setItemToDelete(null);
      } else {
        setError(response.message || 'Error al eliminar la publicación');
      }
    } catch (err) {
      setError('Error al eliminar la publicación');
    } finally {
      setActionLoading(false);
    }
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Handlers de bibliografía
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const extension = file.name.split('.').pop()?.toLowerCase() || '';
        setBibliografiaForm(prev => ({
          ...prev,
          archivo: base64,
          tipoArchivo: extension,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenBibliografiaModal = (bib?: Bibliografia) => {
    setError(null);
    setSelectedFileName('');
    if (bib) {
      setIsEditingBibliografia(true);
      setBibliografiaForm({
        id: bib._id,
        titulo: bib.titulo,
        archivo: '',
        tipoArchivo: '',
      });
    } else {
      setIsEditingBibliografia(false);
      setBibliografiaForm({ id: '', titulo: '', archivo: '', tipoArchivo: '' });
    }
    setShowBibliografiaModal(true);
  };

  const handleSaveBibliografia = async () => {
    if (!bibliografiaForm.titulo) {
      setError('El título es requerido');
      return;
    }
    if (!isEditingBibliografia && !bibliografiaForm.archivo) {
      setError('El archivo es requerido');
      return;
    }

    setActionLoading(true);
    try {
      let response;
      if (isEditingBibliografia) {
        response = await api.editarBibliografia(tutoriaId, bibliografiaForm.id, {
          titulo: bibliografiaForm.titulo,
        });
      } else {
        response = await api.crearBibliografia(tutoriaId, {
          titulo: bibliografiaForm.titulo,
          archivo: bibliografiaForm.archivo,
          tipoArchivo: bibliografiaForm.tipoArchivo,
        });
      }

      if (response.success) {
        setSuccessMessage(isEditingBibliografia ? 'Bibliografía actualizada' : 'Bibliografía subida');
        setShowBibliografiaModal(false);
        await fetchAulaData();
      } else {
        setError(response.message || 'Error al guardar bibliografía');
      }
    } catch (err) {
      setError('Error al guardar bibliografía');
    }
    setActionLoading(false);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleDeleteBibliografia = (bibliografia: Bibliografia) => {
    setItemToDelete({ id: bibliografia._id, titulo: bibliografia.titulo });
    setShowDeleteBibliografiaModal(true);
  };

  const confirmDeleteBibliografia = async () => {
    if (!itemToDelete) return;
    
    setActionLoading(true);
    try {
      const response = await api.eliminarBibliografia(tutoriaId, itemToDelete.id);
      if (response.success) {
        setSuccessMessage('Bibliografía eliminada exitosamente');
        await fetchAulaData();
        setShowDeleteBibliografiaModal(false);
        setItemToDelete(null);
      } else {
        setError(response.message || 'Error al eliminar la bibliografía');
      }
    } catch (err) {
      setError('Error al eliminar la bibliografía');
    } finally {
      setActionLoading(false);
    }
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleDownloadBibliografia = (bib: Bibliografia) => {
    const link = document.createElement('a');
    link.href = bib.archivo;
    link.download = `${bib.titulo}.${bib.tipoArchivo}`;
    link.click();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-EC', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (authLoading || isLoading) {
    return <LoadingScreen message="Cargando aula virtual..." />;
  }

  if (error && !tutoria) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="error">{error}</Alert>
        <Button onClick={() => router.back()} className="mt-4">Volver</Button>
      </div>
    );
  }

  // Determinar link de inicio según rol
  const getHomeHref = () => {
    switch (user?.rol) {
      case 'Estudiante':
        return '/dashboard/estudiante/tutorias';
      case 'Tutor':
        return '/dashboard';
      case 'Administrador':
        return '/dashboard/admin/tutores';
      default:
        return '/dashboard';
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
      router.replace('/login');
    } catch {
      router.replace('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-gray-100 shadow-sm border-b border-gray-200">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link href={getHomeHref()} className="text-xl font-semibold text-gray-800">
                Tutorías FIS
              </Link>
              <div className="hidden md:flex space-x-6">
                {user?.rol === 'Estudiante' && (
                  <>
                    <Link href="/dashboard/estudiante/tutorias" className="text-gray-700 hover:text-gray-900 font-medium">
                      Consultar Tutorías
                    </Link>
                    <Link href="/dashboard/estudiante/solicitudes" className="text-gray-700 hover:text-gray-900 font-medium">
                      Ver Solicitudes
                    </Link>
                  </>
                )}
                {user?.rol === 'Tutor' && (
                  <>
                    <Link href="/dashboard" className="text-gray-700 hover:text-gray-900 font-medium">
                      Home
                    </Link>
                    <Link href="/dashboard/tutor/tutorias/nueva" className="text-gray-700 hover:text-gray-900 font-medium">
                      Registrar Tutoría
                    </Link>
                    <Link href="/dashboard/tutor/tutorias" className="text-gray-700 hover:text-gray-900 font-medium">
                      Tutorías Creadas
                    </Link>
                  </>
                )}
                <Link href="/dashboard/mensajes" className="text-gray-700 hover:text-gray-900 font-medium flex items-center">
                  <MessageSquare className="w-5 h-5 mr-1" />
                  Chat
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 text-sm font-medium hidden sm:inline">
                {user?.nombre} {user?.apellido}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-md text-sm font-medium transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8" style={{ maxWidth: '95%' }}>
        {error && <Alert variant="error" className="mb-4">{error}</Alert>}
        {successMessage && <Alert variant="success" className="mb-4">{successMessage}</Alert>}

      <h2 className="text-4xl font-bold text-center text-gray-800 mb-8">Aula Virtual</h2>

      {/* Tabs de navegación */}
      <div className="mb-6">
        <ul className="flex border-b border-gray-300">
          <li className="mr-1">
            <button
              onClick={() => setActiveTab('informacion')}
              className={`inline-block py-3 px-6 font-medium transition border-b-2 ${
                activeTab === 'informacion'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-700 border-transparent hover:text-gray-900 hover:border-gray-400'
              }`}
            >
              <Info className="inline-block w-5 h-5 mr-2 -mt-1" />
              Información
            </button>
          </li>
          <li className="mr-1">
            <button
              onClick={() => setActiveTab('publicaciones')}
              className={`inline-block py-3 px-6 font-medium transition border-b-2 ${
                activeTab === 'publicaciones'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-700 border-transparent hover:text-gray-900 hover:border-gray-400'
              }`}
            >
              <MessageSquare className="inline-block w-5 h-5 mr-2 -mt-1" />
              Publicaciones
            </button>
          </li>
          <li className="mr-1">
            <button
              onClick={() => setActiveTab('bibliografia')}
              className={`inline-block py-3 px-6 font-medium transition border-b-2 ${
                activeTab === 'bibliografia'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-700 border-transparent hover:text-gray-900 hover:border-gray-400'
              }`}
            >
              <BookOpen className="inline-block w-5 h-5 mr-2 -mt-1" />
              Bibliografía
            </button>
          </li>
        </ul>
      </div>

      {/* Contenido de las tabs */}
      <div className="tab-content">
        {/* Tab Información */}
        {activeTab === 'informacion' && tutoria && (
          <Card>
            <CardContent className="p-8">
              <div className="flex justify-between items-start mb-6">
                <h4 className="text-2xl font-semibold text-gray-800">
                  Aula virtual para la tutoría de <span className="text-blue-600">{tutoria.materiaNombre}</span>
                </h4>
                {esTutor && (
                  <>
                    {!tutoria.aulaConfigurada ? (
                      <button
                        onClick={() => handleOpenConfigModal(false)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Configurar Aula
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenConfigModal(true)}
                        className="border border-blue-600 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg text-sm font-medium transition flex items-center"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Editar Configuración
                      </button>
                    )}
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Modalidad de la Tutoría:</p>
                  <p className="text-gray-600">{tutoria.modalidadAula || 'No configurada'}</p>
                </div>
                {tutoria.modalidadAula === 'Presencial' && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">Aula:</p>
                    <p className="text-gray-600">{tutoria.nombreAula || '-'}</p>
                  </div>
                )}
                {tutoria.modalidadAula === 'Virtual' && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">Enlace de Reunión:</p>
                    {tutoria.enlaceAula ? (
                      <a
                        href={tutoria.enlaceAula}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Unirse a la reunión
                      </a>
                    ) : (
                      <p className="text-gray-600">-</p>
                    )}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Horario:</p>
                  <p className="text-gray-600">{tutoria.horaInicio} - {tutoria.horaFin}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Tutor:</p>
                  <p className="text-gray-600">{tutoria.tutorNombre || `${tutoria.tutor?.nombre} ${tutoria.tutor?.apellido}`}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab Publicaciones */}
        {activeTab === 'publicaciones' && (
          <Card>
            <CardContent className="p-8">
              <div className="mb-6 flex justify-between items-center">
                <h3 className="text-2xl font-semibold text-gray-800 flex items-center">
                  <MessageSquare className="w-7 h-7 mr-2" />
                  Publicaciones
                </h3>
                {esTutor && (
                  <button
                    onClick={() => handleOpenPublicacionModal()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                  >
                    + Nueva Publicación
                  </button>
                )}
              </div>

              {publicaciones.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No hay publicaciones en esta aula
                </div>
              ) : (
                <div className="space-y-6">
                  {publicaciones.map((pub) => (
                    <div key={pub._id} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h5 className="text-lg font-semibold text-gray-800">{pub.titulo}</h5>
                          <p className="text-sm text-gray-500">
                            Por {pub.tutorNombre} • {formatDate(pub.createdAt)}
                          </p>
                        </div>
                        {esTutor && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleOpenPublicacionModal(pub)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeletePublicacion(pub)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{pub.contenido}</p>
                      {pub.imagen && (
                        <div className="mt-4">
                          <img
                            src={pub.imagen}
                            alt={pub.titulo}
                            className="max-w-full h-auto rounded-lg max-h-96 object-contain"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tab Bibliografía */}
        {activeTab === 'bibliografia' && (
          <Card>
            <CardContent className="p-8">
              <div className="mb-6 flex justify-between items-center">
                <h3 className="text-2xl font-semibold text-gray-800 flex items-center">
                  <BookOpen className="w-7 h-7 mr-2" />
                  Bibliografía
                </h3>
                {esTutor && (
                  <button
                    onClick={() => handleOpenBibliografiaModal()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                  >
                    + Subir Bibliografía
                  </button>
                )}
              </div>

              {bibliografias.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No hay bibliografía en esta aula
                </div>
              ) : (
                <div className="space-y-4">
                  {bibliografias.map((bib) => (
                    <div key={bib._id} className="flex items-center justify-between border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center space-x-4">
                        <div className="bg-blue-100 text-blue-600 px-3 py-2 rounded-lg font-semibold uppercase text-sm">
                          {bib.tipoArchivo}
                        </div>
                        <div>
                          <h5 className="font-semibold text-gray-800">{bib.titulo}</h5>
                          <p className="text-sm text-gray-500">
                            Subido por {bib.tutorNombre} • {formatDate(bib.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleDownloadBibliografia(bib)}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition flex items-center"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Descargar
                        </button>
                        {esTutor && (
                          <>
                            <button
                              onClick={() => handleOpenBibliografiaModal(bib)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteBibliografia(bib)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      </div>

      {/* Modal de Configuración */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h5 className="text-2xl font-bold text-gray-800">
                {isEditingConfig ? 'Editar Configuración' : 'Configurar Aula Virtual'}
              </h5>
              <button onClick={() => { setShowConfigModal(false); setError(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 text-sm">
                Configura el aula virtual antes de comenzar. Esta información será visible para todos los estudiantes.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Modalidad de la Tutoría <span className="text-red-500">*</span>
                </label>
                <select
                  value={configForm.modalidadAula}
                  onChange={(e) => setConfigForm({ ...configForm, modalidadAula: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Seleccione la modalidad</option>
                  <option value="Presencial">Presencial</option>
                  <option value="Virtual">Virtual</option>
                </select>
              </div>

              {configForm.modalidadAula === 'Presencial' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Aula <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={configForm.nombreAula}
                    onChange={(e) => setConfigForm({ ...configForm, nombreAula: e.target.value })}
                    placeholder="Ej: E012, Lab 3, Aula 201"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {configForm.modalidadAula === 'Virtual' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enlace de la Reunión Virtual <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={configForm.enlaceReunion}
                    onChange={(e) => setConfigForm({ ...configForm, enlaceReunion: e.target.value })}
                    placeholder="https://meet.google.com/xxx-xxxx-xxx"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <small className="text-gray-500 text-sm">Ingresa el enlace completo de Zoom, Google Meet, Teams, etc.</small>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => { setShowConfigModal(false); setError(null); }}
                disabled={actionLoading}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg font-medium transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveConfig}
                disabled={actionLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-50"
              >
                {actionLoading ? 'Guardando...' : 'Guardar Configuración'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Publicación */}
      {showPublicacionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h5 className="text-2xl font-bold text-gray-800">
                {isEditingPublicacion ? 'Editar Publicación' : 'Nueva Publicación'}
              </h5>
              <button onClick={() => { setShowPublicacionModal(false); setError(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={publicacionForm.titulo}
                  onChange={(e) => setPublicacionForm({ ...publicacionForm, titulo: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contenido <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={publicacionForm.contenido}
                  onChange={(e) => setPublicacionForm({ ...publicacionForm, contenido: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imagen (Opcional)
                </label>
                <div className="flex items-center space-x-3">
                  <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition flex items-center">
                    <Upload className="w-4 h-4 mr-2" />
                    Seleccionar Imagen
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.gif"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                  {selectedImageName && (
                    <span className="text-sm text-green-600 font-medium">✓ {selectedImageName}</span>
                  )}
                </div>
                <small className="text-gray-500 text-sm mt-1 block">Solo se permiten imágenes (PNG, JPG, JPEG, GIF)</small>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => { setShowPublicacionModal(false); setError(null); }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg font-medium transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePublicacion}
                disabled={actionLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-50"
              >
                {actionLoading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Bibliografía */}
      {showBibliografiaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h5 className="text-2xl font-bold text-gray-800">
                {isEditingBibliografia ? 'Editar Bibliografía' : 'Subir Bibliografía'}
              </h5>
              <button onClick={() => { setShowBibliografiaModal(false); setError(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={bibliografiaForm.titulo}
                  onChange={(e) => setBibliografiaForm({ ...bibliografiaForm, titulo: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {!isEditingBibliografia && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Archivo <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center space-x-3">
                    <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition flex items-center">
                      <Upload className="w-4 h-4 mr-2" />
                      Seleccionar Archivo
                      <input
                        type="file"
                        accept=".pdf,.docx,.xlsx,.ppt,.pptx"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                    {selectedFileName && (
                      <span className="text-sm text-green-600 font-medium">✓ {selectedFileName}</span>
                    )}
                  </div>
                  <small className="text-gray-500 text-sm mt-1 block">Solo se permiten documentos: PDF, DOCX, XLSX, PPT, PPTX</small>
                </div>
              )}

              {isEditingBibliografia && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <Info className="inline-block w-5 h-5 text-blue-600 mr-2" />
                  <small className="text-blue-700">
                    Solo se puede editar el título. Para cambiar el archivo, debes eliminar y subir uno nuevo.
                  </small>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => { setShowBibliografiaModal(false); setError(null); }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg font-medium transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveBibliografia}
                disabled={actionLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-50"
              >
                {actionLoading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar publicación */}
      {showDeletePublicacionModal && itemToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h5 className="text-xl font-bold text-gray-800">Confirmar eliminación</h5>
              <button 
                onClick={() => { 
                  setShowDeletePublicacionModal(false); 
                  setItemToDelete(null); 
                }} 
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-600">
                ¿Estás seguro de que deseas eliminar la publicación <strong>"{itemToDelete.titulo}"</strong>?
              </p>
              <p className="text-sm text-red-600 mt-2">
                Esta acción no se puede deshacer.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => { 
                  setShowDeletePublicacionModal(false); 
                  setItemToDelete(null); 
                }}
                disabled={actionLoading}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg font-medium transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeletePublicacion}
                disabled={actionLoading}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-50 flex items-center"
              >
                {actionLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar bibliografía */}
      {showDeleteBibliografiaModal && itemToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h5 className="text-xl font-bold text-gray-800">Confirmar eliminación</h5>
              <button 
                onClick={() => { 
                  setShowDeleteBibliografiaModal(false); 
                  setItemToDelete(null); 
                }} 
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-600">
                ¿Estás seguro de que deseas eliminar la bibliografía <strong>"{itemToDelete.titulo}"</strong>?
              </p>
              <p className="text-sm text-red-600 mt-2">
                Esta acción no se puede deshacer.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => { 
                  setShowDeleteBibliografiaModal(false); 
                  setItemToDelete(null); 
                }}
                disabled={actionLoading}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg font-medium transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteBibliografia}
                disabled={actionLoading}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-50 flex items-center"
              >
                {actionLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
