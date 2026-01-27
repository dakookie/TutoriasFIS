// API Client para conectar con el backend NestJS

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface ApiResponse<T = unknown> {
  ok?: boolean;
  success?: boolean;
  message?: string;
  mensaje?: string;
  data?: T;
  usuario?: T;
  token?: string;
  error?: string;
  // Para compatibilidad con respuestas del backend
  tutorias?: T;
  solicitudes?: T;
  materias?: T;
  usuarios?: T;
  tutores?: T;
  estudiantes?: T;
  mensajes?: T;
  chats?: T;
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { params, ...fetchOptions } = options;
    
    let url = `${this.baseUrl}${endpoint}`;
    
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        },
        credentials: 'include', // Incluir cookies
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          ok: false,
          success: false,
          message: data.message || data.mensaje || 'Error en la petición',
          error: data.error,
        };
      }

      // Normalizar respuesta: el backend NestJS usa 'ok' en lugar de 'success'
      // También normalizar campos de datos a 'data' para consistencia
      const normalizedData = { ...data };
      normalizedData.success = data.ok ?? data.success ?? true;
      
      // Extraer datos de campos específicos a 'data' para consistencia
      if (!normalizedData.data) {
        if (data.tutorias) normalizedData.data = data.tutorias;
        else if (data.tutoria) normalizedData.data = data.tutoria;
        else if (data.solicitudes) normalizedData.data = data.solicitudes;
        else if (data.solicitud) normalizedData.data = data.solicitud;
        else if (data.materias) normalizedData.data = data.materias;
        else if (data.materia) normalizedData.data = data.materia;
        else if (data.usuarios) normalizedData.data = data.usuarios;
        else if (data.usuario) normalizedData.data = data.usuario;
        else if (data.tutores) normalizedData.data = data.tutores;
        else if (data.estudiantes) normalizedData.data = data.estudiantes;
        else if (data.mensajes) normalizedData.data = data.mensajes;
        else if (data.mensaje) normalizedData.data = data.mensaje;
        else if (data.chats) normalizedData.data = data.chats;
      }
      
      return normalizedData;
    } catch (error) {
      console.error('API Error:', error);
      return {
        ok: false,
        success: false,
        message: 'Error de conexión con el servidor',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ==================== AUTH ====================
  
  async login(usuario: string, password: string) {
    return this.request<{
      id: string;
      nombre: string;
      apellido: string;
      email: string;
      rol: string;
      materias: string[];
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ usuario, password }),
    });
  }

  async registro(userData: {
    nombre: string;
    apellido: string;
    email: string;
    password: string;
    rol: string;
    username?: string;
    materias?: string[];
    pdf?: string;
  }) {
    return this.request('/api/auth/registro', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async logout() {
    return this.request('/api/auth/logout', {
      method: 'POST',
    });
  }

  async getSession() {
    return this.request<{
      userId: string;
      nombre: string;
      apellido: string;
      email: string;
      rol: string;
      materias: string[];
    }>('/api/auth/verificar');
  }

  async forgotPassword(email: string) {
    return this.request('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, password: string) {
    return this.request('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  }

  async verifyResetToken(token: string) {
    return this.request(`/api/auth/verify-reset-token/${token}`);
  }

  // ==================== USUARIOS ====================

  async getPerfil() {
    return this.request('/api/usuarios/perfil');
  }

  async actualizarPerfil(data: {
    nombre?: string;
    apellido?: string;
    materias?: string[];
  }) {
    return this.request('/api/usuarios/perfil', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getTutores() {
    return this.request('/api/usuarios/tutores');
  }

  async getEstudiantes() {
    return this.request('/api/usuarios/estudiantes');
  }

  // ==================== MATERIAS ====================

  async getMaterias() {
    return this.request<Array<{
      _id: string;
      nombre: string;
      descripcion?: string;
      activo: boolean;
    }>>('/api/materias');
  }

  async getMateriasPorSemestre(semestre: number) {
    return this.request<Array<{
      _id: string;
      nombre: string;
      codigo: string;
      semestre: number;
    }>>(`/api/materias/semestre/${semestre}`);
  }

  // ==================== TUTORÍAS ====================

  async getTutorias(filtros?: Record<string, string>) {
    return this.request<Array<{
      _id: string;
      materia: { _id: string; nombre: string };
      fecha: string;
      horaInicio: string;
      horaFin: string;
      cuposDisponibles: number;
      cuposOriginales: number;
      tutor: { _id: string; nombre: string; email: string };
      activa: boolean;
      publicada: boolean;
    }>>('/api/tutorias', { params: filtros });
  }

  async getTutoriasDisponibles(materiaId?: string) {
    const params = materiaId ? { materia: materiaId } : undefined;
    return this.request('/api/tutorias/disponibles', { params });
  }

  async getMisTutorias() {
    return this.request('/api/tutorias/mis-tutorias');
  }

  // Alias: obtener tutorías de un tutor específico (usa mis-tutorias para el tutor logueado)
  async getTutoriasTutor(tutorId?: string) {
    // Si no se pasa tutorId, se usa el endpoint de mis-tutorias (requiere auth)
    if (!tutorId) {
      return this.getMisTutorias();
    }
    return this.request('/api/tutorias', { params: { tutor: tutorId } });
  }

  async getTutoriaById(id: string) {
    return this.request(`/api/tutorias/${id}`);
  }

  async crearTutoria(tutoriaData: {
    materia: string;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    cupos?: number;
    cuposOriginales?: number;
    modalidadAula?: string;
    nombreAula?: string;
    enlaceAula?: string;
  }) {
    // Normalizar: aceptar cupos o cuposOriginales
    const payload = {
      ...tutoriaData,
      cuposOriginales: tutoriaData.cuposOriginales ?? tutoriaData.cupos,
    };
    delete (payload as any).cupos;
    
    return this.request('/api/tutorias', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async actualizarTutoria(tutoriaId: string, tutoriaData: Partial<{
    fecha: string;
    horaInicio: string;
    horaFin: string;
    cuposOriginales: number;
    activa: boolean;
    publicada: boolean;
  }>) {
    return this.request(`/api/tutorias/${tutoriaId}`, {
      method: 'PUT',
      body: JSON.stringify(tutoriaData),
    });
  }

  async eliminarTutoria(tutoriaId: string) {
    return this.request(`/api/tutorias/${tutoriaId}`, {
      method: 'DELETE',
    });
  }

  async cambiarEstadoTutoria(tutoriaId: string, estado: string) {
    return this.request(`/api/tutorias/${tutoriaId}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ estado }),
    });
  }

  // Publicar/Despublicar una tutoría (alterna el estado)
  async publicarTutoria(tutoriaId: string) {
    return this.request(`/api/tutorias/${tutoriaId}/publicar`, {
      method: 'PATCH',
    });
  }

  // Despublicar una tutoría
  async despublicarTutoria(tutoriaId: string) {
    return this.publicarTutoria(tutoriaId); // Usa el mismo endpoint que alterna el estado
  }

  // ==================== SOLICITUDES ====================

  async crearSolicitud(tutoriaId: string) {
    return this.request('/api/solicitudes', {
      method: 'POST',
      body: JSON.stringify({ tutoria: tutoriaId }),
    });
  }

  async getMisSolicitudes() {
    return this.request('/api/solicitudes/mis-solicitudes');
  }

  // Alias para compatibilidad con páginas existentes
  async getSolicitudesEstudiante() {
    return this.getMisSolicitudes();
  }

  async getSolicitudesPendientes() {
    return this.request('/api/solicitudes/pendientes');
  }

  async getSolicitudesPorTutoria(tutoriaId: string) {
    return this.request(`/api/solicitudes/tutoria/${tutoriaId}`);
  }

  // Alias para compatibilidad
  async getSolicitudesTutoria(tutoriaId: string) {
    return this.getSolicitudesPorTutoria(tutoriaId);
  }

  async aceptarSolicitud(solicitudId: string) {
    return this.request(`/api/solicitudes/${solicitudId}/aceptar`, {
      method: 'PUT',
    });
  }

  async rechazarSolicitud(solicitudId: string, motivo?: string) {
    return this.request(`/api/solicitudes/${solicitudId}/rechazar`, {
      method: 'PUT',
      body: JSON.stringify({ motivo }),
    });
  }

  async aprobarSolicitud(solicitudId: string) {
    return this.request(`/api/solicitudes/${solicitudId}/aprobar`, {
      method: 'PATCH',
    });
  }

  async cancelarSolicitud(solicitudId: string) {
    return this.request(`/api/solicitudes/${solicitudId}/cancelar`, {
      method: 'PATCH',
    });
  }

  // ==================== ADMIN ====================

  async getUsuarios(filtros?: { rol?: string; activo?: string }) {
    return this.request('/api/usuarios', { params: filtros });
  }

  async getUsuarioById(id: string) {
    return this.request(`/api/usuarios/${id}`);
  }

  async actualizarUsuario(id: string, data: Record<string, unknown>) {
    return this.request(`/api/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async cambiarEstadoUsuario(id: string, activo: boolean) {
    return this.request(`/api/usuarios/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ activo }),
    });
  }

  async eliminarUsuario(id: string) {
    return this.request(`/api/usuarios/${id}`, {
      method: 'DELETE',
    });
  }

  async getEstadisticasUsuarios() {
    return this.request('/api/usuarios/estadisticas');
  }

  // Métodos para solicitudes de registro (usuarios inactivos)
  async getSolicitudesTutores() {
    return this.request('/api/usuarios', {
      params: { rol: 'Tutor', activo: 'false' },
    });
  }

  async getSolicitudesEstudiantes() {
    return this.request('/api/usuarios', {
      params: { rol: 'Estudiante', activo: 'false' },
    });
  }

  async aprobarUsuario(id: string) {
    return this.request(`/api/usuarios/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ activo: true }),
    });
  }

  async rechazarUsuario(id: string) {
    return this.eliminarUsuario(id);
  }

  // ==================== MENSAJES ====================

  async getChats() {
    return this.request('/api/mensajes/chats');
  }

  async getConversacion(usuarioId: string) {
    return this.request(`/api/mensajes/conversacion/${usuarioId}`);
  }

  async getMensajesNoLeidos() {
    return this.request('/api/mensajes/no-leidos');
  }

  async enviarMensaje(receptorId: string, contenido: string, tutoriaId?: string) {
    return this.request('/api/mensajes', {
      method: 'POST',
      body: JSON.stringify({ receptor: receptorId, contenido, tutoria: tutoriaId }),
    });
  }

  async marcarMensajeLeido(mensajeId: string) {
    return this.request(`/api/mensajes/${mensajeId}/leido`, {
      method: 'PATCH',
    });
  }

  async marcarConversacionLeida(usuarioId: string) {
    return this.request(`/api/mensajes/conversacion/${usuarioId}/leidos`, {
      method: 'PATCH',
    });
  }

  // ==================== MATERIAS ADMIN ====================

  async crearMateria(data: { nombre: string; descripcion?: string }) {
    return this.request('/api/materias', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async actualizarMateria(id: string, data: { nombre?: string; descripcion?: string; activo?: boolean }) {
    return this.request(`/api/materias/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async eliminarMateria(id: string) {
    return this.request(`/api/materias/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== AULA VIRTUAL ====================

  async getAulaInfo(tutoriaId: string) {
    return this.request(`/api/aula/${tutoriaId}`);
  }

  async configurarAula(tutoriaId: string, data: { modalidadAula: string; nombreAula?: string; enlaceReunion?: string }) {
    return this.request(`/api/aula/${tutoriaId}/configurar`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async editarConfiguracionAula(tutoriaId: string, data: { modalidadAula: string; nombreAula?: string; enlaceReunion?: string }) {
    return this.request(`/api/aula/${tutoriaId}/configurar`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Publicaciones
  async getPublicaciones(tutoriaId: string) {
    return this.request(`/api/aula/${tutoriaId}/publicaciones`);
  }

  async crearPublicacion(tutoriaId: string, data: { titulo: string; contenido: string; imagen?: string; tipoImagen?: string }) {
    return this.request(`/api/aula/${tutoriaId}/publicaciones`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async editarPublicacion(tutoriaId: string, publicacionId: string, data: { titulo: string; contenido: string; imagen?: string; tipoImagen?: string }) {
    return this.request(`/api/aula/${tutoriaId}/publicaciones/${publicacionId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async eliminarPublicacion(tutoriaId: string, publicacionId: string) {
    return this.request(`/api/aula/${tutoriaId}/publicaciones/${publicacionId}`, {
      method: 'DELETE',
    });
  }

  // Bibliografías
  async getBibliografias(tutoriaId: string) {
    return this.request(`/api/aula/${tutoriaId}/bibliografias`);
  }

  async crearBibliografia(tutoriaId: string, data: { titulo: string; archivo: string; tipoArchivo: string; descripcion?: string }) {
    return this.request(`/api/aula/${tutoriaId}/bibliografias`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async editarBibliografia(tutoriaId: string, bibliografiaId: string, data: { titulo: string }) {
    return this.request(`/api/aula/${tutoriaId}/bibliografias/${bibliografiaId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async eliminarBibliografia(tutoriaId: string, bibliografiaId: string) {
    return this.request(`/api/aula/${tutoriaId}/bibliografias/${bibliografiaId}`, {
      method: 'DELETE',
    });
  }
}

// Exportar instancia singleton
export const api = new ApiClient(API_BASE_URL);

export default api;
