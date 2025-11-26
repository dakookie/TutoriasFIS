// API Client - Manejo de llamadas HTTP al backend
const API_BASE_URL = '';

class APIClient {
    static async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                credentials: 'include' // Incluir cookies de sesión
            });

            const data = await response.json();

            if (!response.ok) {
                // No lanzar error para 401 en /session, solo devolver el resultado
                if (response.status === 401 && endpoint === '/api/auth/session') {
                    return data;
                }
                throw new Error(data.message || 'Error en la petición');
            }

            return data;
        } catch (error) {
            console.error('Error en petición API:', error);
            throw error;
        }
    }

    // Auth endpoints
    static async login(email, password) {
        return this.request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    }

    static async registro(userData) {
        return this.request('/api/auth/registro', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    static async logout() {
        return this.request('/api/auth/logout', {
            method: 'POST'
        });
    }

    static async getSession() {
        return this.request('/api/auth/session');
    }

    static async forgotPassword(email) {
        return this.request('/api/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email })
        });
    }

    static async resetPassword(token, newPassword) {
        return this.request('/api/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ token, newPassword })
        });
    }

    static async verifyResetToken(token) {
        return this.request(`/api/auth/verify-reset-token/${token}`);
    }

    // Admin endpoints
    static async getSolicitudesTutores() {
        return this.request('/api/admin/solicitudes/tutores');
    }

    static async getSolicitudesEstudiantes() {
        return this.request('/api/admin/solicitudes/estudiantes');
    }

    static async aprobarSolicitud(id) {
        return this.request(`/api/admin/solicitudes/${id}/aprobar`, {
            method: 'PUT'
        });
    }

    static async rechazarSolicitud(id) {
        return this.request(`/api/admin/solicitudes/${id}`, {
            method: 'DELETE'
        });
    }

    // Tutorías endpoints
    static async crearTutoria(tutoriaData) {
        return this.request('/api/tutorias', {
            method: 'POST',
            body: JSON.stringify(tutoriaData)
        });
    }

    static async getTutorias(filtros = {}) {
        const params = new URLSearchParams(filtros);
        return this.request(`/api/tutorias?${params}`);
    }

    static async getTutoriasDisponibles(materia = null) {
        const params = materia ? `?materia=${materia}` : '';
        return this.request(`/api/tutorias/disponibles${params}`);
    }

    static async getTutoriasTutor(tutorId) {
        return this.request(`/api/tutorias/tutor/${tutorId}`);
    }

    static async actualizarTutoria(tutoriaId, tutoriaData) {
        return this.request(`/api/tutorias/${tutoriaId}`, {
            method: 'PUT',
            body: JSON.stringify(tutoriaData)
        });
    }

    static async eliminarTutoria(tutoriaId) {
        return this.request(`/api/tutorias/${tutoriaId}`, {
            method: 'DELETE'
        });
    }

    // Solicitudes endpoints
    static async crearSolicitud(tutoriaId) {
        return this.request('/api/solicitudes', {
            method: 'POST',
            body: JSON.stringify({ tutoriaId })
        });
    }

    static async getSolicitudesEstudiante() {
        return this.request('/api/solicitudes/estudiante');
    }

    static async getSolicitudesTutoria(tutoriaId, estado = null) {
        const params = estado ? `?estado=${estado}` : '';
        return this.request(`/api/solicitudes/tutoria/${tutoriaId}${params}`);
    }

    static async aceptarSolicitud(solicitudId) {
        return this.request(`/api/solicitudes/${solicitudId}/aceptar`, {
            method: 'PUT'
        });
    }

    static async rechazarSolicitudTutoria(solicitudId) {
        return this.request(`/api/solicitudes/${solicitudId}/rechazar`, {
            method: 'PUT'
        });
    }

    static async eliminarSolicitud(solicitudId) {
        return this.request(`/api/solicitudes/${solicitudId}`, {
            method: 'DELETE'
        });
    }

    // Encuestas endpoints
    static async crearPregunta(pregunta, materia) {
        return this.request('/api/encuestas/preguntas', {
            method: 'POST',
            body: JSON.stringify({ pregunta, materia })
        });
    }

    static async getPreguntas() {
        return this.request('/api/encuestas/preguntas');
    }

    static async getPreguntasPorMateria(materia) {
        return this.request(`/api/encuestas/preguntas/materia/${materia}`);
    }

    static async enviarRespuestas(tutoriaId, respuestas) {
        return this.request('/api/encuestas/respuestas', {
            method: 'POST',
            body: JSON.stringify({ tutoriaId, respuestas })
        });
    }

    static async getPromedioTutoria(tutoriaId) {
        return this.request(`/api/encuestas/tutoria/${tutoriaId}/promedio`);
    }

    static async getPromediosPorPregunta(tutoriaId) {
        return this.request(`/api/encuestas/tutoria/${tutoriaId}/promedios-preguntas`);
    }

    static async verificarRespuesta(tutoriaId) {
        return this.request(`/api/encuestas/verificar/${tutoriaId}`);
    }

    // Aula endpoints
    static async getAulaInfo(tutoriaId) {
        return this.request(`/api/aula/${tutoriaId}`);
    }

    static async configurarAula(tutoriaId, modalidadAula, nombreAula, enlaceReunion) {
        return this.request(`/api/aula/${tutoriaId}/configurar`, {
            method: 'POST',
            body: JSON.stringify({ modalidadAula, nombreAula, enlaceReunion })
        });
    }

    static async editarConfiguracionAula(tutoriaId, modalidadAula, nombreAula, enlaceReunion) {
        return this.request(`/api/aula/${tutoriaId}/configurar`, {
            method: 'PUT',
            body: JSON.stringify({ modalidadAula, nombreAula, enlaceReunion })
        });
    }

    static async crearPublicacion(tutoriaId, titulo, contenido, imagen = null, tipoImagen = null) {
        return this.request(`/api/aula/${tutoriaId}/publicaciones`, {
            method: 'POST',
            body: JSON.stringify({ titulo, contenido, imagen, tipoImagen })
        });
    }

    static async getPublicaciones(tutoriaId) {
        return this.request(`/api/aula/${tutoriaId}/publicaciones`);
    }

    static async editarPublicacion(tutoriaId, publicacionId, titulo, contenido, imagen = null, tipoImagen = null) {
        return this.request(`/api/aula/${tutoriaId}/publicaciones/${publicacionId}`, {
            method: 'PUT',
            body: JSON.stringify({ titulo, contenido, imagen, tipoImagen })
        });
    }

    static async eliminarPublicacion(tutoriaId, publicacionId) {
        return this.request(`/api/aula/${tutoriaId}/publicaciones/${publicacionId}`, {
            method: 'DELETE'
        });
    }

    static async subirBibliografia(tutoriaId, titulo, archivo, tipoArchivo) {
        return this.request(`/api/aula/${tutoriaId}/bibliografias`, {
            method: 'POST',
            body: JSON.stringify({ titulo, archivo, tipoArchivo })
        });
    }

    static async getBibliografias(tutoriaId) {
        return this.request(`/api/aula/${tutoriaId}/bibliografias`);
    }

    static async editarBibliografia(tutoriaId, bibliografiaId, titulo) {
        return this.request(`/api/aula/${tutoriaId}/bibliografias/${bibliografiaId}`, {
            method: 'PUT',
            body: JSON.stringify({ titulo })
        });
    }

    static async eliminarBibliografia(tutoriaId, bibliografiaId) {
        return this.request(`/api/aula/${tutoriaId}/bibliografias/${bibliografiaId}`, {
            method: 'DELETE'
        });
    }

    // Mensajes endpoints
    static async getMensajesTutoria(tutoriaId) {
        return this.request(`/api/mensajes/tutoria/${tutoriaId}`);
    }

    static async getConversaciones() {
        return this.request('/api/mensajes/conversaciones');
    }

    static async getMensajesNoLeidos() {
        return this.request('/api/mensajes/no-leidos');
    }

    static async marcarMensajeLeido(mensajeId) {
        return this.request(`/api/mensajes/${mensajeId}/marcar-leido`, {
            method: 'PUT'
        });
    }
}
