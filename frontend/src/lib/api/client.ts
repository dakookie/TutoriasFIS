// API Client para conectar con el backend Express existente

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  usuario?: T;
  error?: string;
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
          success: false,
          message: data.message || 'Error en la petición',
          error: data.error,
        };
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      return {
        success: false,
        message: 'Error de conexión con el servidor',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ==================== AUTH ====================
  
  async login(email: string, password: string) {
    return this.request<{
      id: string;
      nombre: string;
      apellido: string;
      email: string;
      rol: string;
      materias: string[];
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
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
    }>('/api/auth/session');
  }

  async forgotPassword(email: string) {
    return this.request('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, newPassword: string) {
    return this.request('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  }

  async verifyResetToken(token: string) {
    return this.request(`/api/auth/verify-reset-token/${token}`);
  }

  // ==================== MATERIAS ====================

  async getMaterias() {
    return this.request<Array<{
      _id: string;
      nombre: string;
      codigo: string;
      semestre: number;
    }>>('/api/materias/publicas');
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
      materia: string;
      materiaNombre: string;
      fecha: string;
      horaInicio: string;
      horaFin: string;
      cuposDisponibles: number;
      cuposOriginales: number;
      tutor: string;
      tutorNombre: string;
      activa: boolean;
      publicada: boolean;
    }>>('/api/tutorias', { params: filtros });
  }

  async getTutoriasDisponibles(materia?: string) {
    const params = materia ? { materia } : undefined;
    return this.request('/api/tutorias/disponibles', { params });
  }

  async getTutoriasTutor(tutorId: string) {
    return this.request(`/api/tutorias/tutor/${tutorId}`);
  }

  async crearTutoria(tutoriaData: {
    materia: string;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    cuposOriginales: number;
  }) {
    return this.request('/api/tutorias', {
      method: 'POST',
      body: JSON.stringify(tutoriaData),
    });
  }

  async actualizarTutoria(tutoriaId: string, tutoriaData: Partial<{
    fecha: string;
    horaInicio: string;
    horaFin: string;
    cuposOriginales: number;
    modalidadAula: string;
    nombreAula: string;
    enlaceAula: string;
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

  async publicarTutoria(tutoriaId: string) {
    return this.request(`/api/tutorias/${tutoriaId}/publicar`, {
      method: 'PATCH',
    });
  }

  // ==================== SOLICITUDES ====================

  async crearSolicitud(tutoriaId: string) {
    return this.request('/api/solicitudes', {
      method: 'POST',
      body: JSON.stringify({ tutoriaId }),
    });
  }

  async getSolicitudesEstudiante() {
    return this.request('/api/solicitudes/estudiante');
  }

  async getSolicitudesTutor() {
    return this.request('/api/solicitudes/tutor');
  }

  async aceptarSolicitud(solicitudId: string) {
    return this.request(`/api/solicitudes/${solicitudId}/aceptar`, {
      method: 'PATCH',
    });
  }

  async rechazarSolicitud(solicitudId: string) {
    return this.request(`/api/solicitudes/${solicitudId}/rechazar`, {
      method: 'PATCH',
    });
  }

  async cancelarSolicitud(solicitudId: string) {
    return this.request(`/api/solicitudes/${solicitudId}/cancelar`, {
      method: 'PATCH',
    });
  }

  // ==================== ADMIN ====================

  async getSolicitudesTutores() {
    return this.request('/api/admin/solicitudes/tutores');
  }

  async getSolicitudesEstudiantes() {
    return this.request('/api/admin/solicitudes/estudiantes');
  }

  async aprobarUsuario(id: string) {
    return this.request(`/api/admin/solicitudes/${id}/aprobar`, {
      method: 'PUT',
    });
  }

  async rechazarUsuario(id: string) {
    return this.request(`/api/admin/solicitudes/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== MENSAJES ====================

  async getConversaciones() {
    return this.request('/api/mensajes/conversaciones');
  }

  async getMensajes(receptorId: string) {
    return this.request(`/api/mensajes/${receptorId}`);
  }

  async enviarMensaje(receptorId: string, contenido: string) {
    return this.request('/api/mensajes', {
      method: 'POST',
      body: JSON.stringify({ receptorId, contenido }),
    });
  }
}

// Exportar instancia singleton
export const api = new ApiClient(API_BASE_URL);

export default api;
