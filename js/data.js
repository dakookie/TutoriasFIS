// Simulación de base de datos en memoria
class Database {
    constructor() {
        this.tutorias = this.cargarDatos('tutorias') || [];
        this.solicitudes = this.cargarDatos('solicitudes') || [];
        this.nextTutoriaId = this.cargarDatos('nextTutoriaId') || 1;
        this.nextSolicitudId = this.cargarDatos('nextSolicitudId') || 1;
        
        // Nuevos datos para gestión de usuarios
        this.usuarios = this.cargarDatos('usuarios') || [];
        this.solicitudesRegistro = this.cargarDatos('solicitudesRegistro') || [];
        this.nextUsuarioId = this.cargarDatos('nextUsuarioId') || 1;
        this.nextSolicitudRegistroId = this.cargarDatos('nextSolicitudRegistroId') || 1;
        
        // Datos para encuestas de calificación
        this.preguntasEncuesta = this.cargarDatos('preguntasEncuesta') || [];
        this.respuestasEncuesta = this.cargarDatos('respuestasEncuesta') || [];
        this.nextPreguntaId = this.cargarDatos('nextPreguntaId') || 1;
        this.nextRespuestaId = this.cargarDatos('nextRespuestaId') || 1;
        
        // Todas las materias disponibles
        this.materiasDisponibles = [
            'Arquitectura de computadores',
            'Programación Orientada a Objetos',
            'Estructuras de Datos',
            'Bases de Datos',
            'Ingeniería de Software',
            'Redes de Computadores',
            'Sistemas Operativos',
            'Desarrollo de Aplicaciones Web',
            'Aplicaciones Web',
            'Cálculo Diferencial',
            'Álgebra Lineal',
            'Física I'
        ];
        
        // Crear usuario administrador si no existe
        this.inicializarAdministrador();
        
        // Datos del tutor actual (simulado)
        this.tutorActual = {
            nombre: 'Said',
            materias: [
                'Arquitectura de computadores',
                'Programación Orientada a Objetos',
                'Estructuras de Datos',
                'Bases de Datos',
                'Ingeniería de Software'
            ]
        };

        // Datos del estudiante actual (simulado)
        this.estudianteActual = {
            nombre: 'Said Luna'
        };
    }
    
    inicializarAdministrador() {
        const adminExiste = this.usuarios.some(u => u.rol === 'Administrador');
        if (!adminExiste) {
            this.usuarios.push({
                id: this.nextUsuarioId++,
                nombre: 'Admin',
                apellido: 'Sistema',
                correo: 'admin@epn.edu.ec',
                usuario: 'admin',
                password: 'admin123',
                rol: 'Administrador',
                estado: 'Aprobado',
                materias: []
            });
            this.guardarDatos('usuarios', this.usuarios);
            this.guardarDatos('nextUsuarioId', this.nextUsuarioId);
        }
    }

    cargarDatos(clave) {
        try {
            const datos = localStorage.getItem(clave);
            return datos ? JSON.parse(datos) : null;
        } catch (error) {
            console.error('Error al cargar datos:', error);
            return null;
        }
    }

    guardarDatos(clave, valor) {
        try {
            localStorage.setItem(clave, JSON.stringify(valor));
        } catch (error) {
            console.error('Error al guardar datos:', error);
        }
    }

    // CRUD Tutorías
    crearTutoria(tutoria) {
        const nuevaTutoria = {
            id: this.nextTutoriaId++,
            ...tutoria,
            tutor: tutoria.tutorNombre || this.tutorActual.nombre,
            tutorId: tutoria.tutorId || null,
            cuposDisponibles: parseInt(tutoria.cuposDisponibles),
            cuposOriginales: parseInt(tutoria.cuposDisponibles),
            solicitudes: []
        };
        
        this.tutorias.push(nuevaTutoria);
        this.guardarDatos('tutorias', this.tutorias);
        this.guardarDatos('nextTutoriaId', this.nextTutoriaId);
        
        return nuevaTutoria;
    }

    obtenerTutorias() {
        return this.tutorias;
    }

    obtenerTutoriasPorTutor(nombreTutor) {
        return this.tutorias.filter(t => t.tutor === nombreTutor);
    }

    obtenerTutoriasPorId(id) {
        return this.tutorias.find(t => t.id === id);
    }

    obtenerTutoriasDisponibles() {
        return this.tutorias.filter(t => t.cuposDisponibles > 0);
    }

    actualizarTutoria(id, datos) {
        const index = this.tutorias.findIndex(t => t.id === id);
        if (index !== -1) {
            this.tutorias[index] = { ...this.tutorias[index], ...datos };
            this.guardarDatos('tutorias', this.tutorias);
            return this.tutorias[index];
        }
        return null;
    }

    // CRUD Solicitudes
    crearSolicitud(tutoriaId, estudianteId, estudianteNombre) {
        const tutoria = this.obtenerTutoriasPorId(tutoriaId);
        if (!tutoria) return null;

        // Verificar si ya existe una solicitud para esta tutoría del estudiante
        const solicitudExistente = this.solicitudes.find(
            s => s.tutoriaId === tutoriaId && 
                 s.estudianteId === estudianteId &&
                 s.estado !== 'Eliminada'
        );

        if (solicitudExistente) {
            return null; // Ya existe una solicitud
        }

        const nuevaSolicitud = {
            id: this.nextSolicitudId++,
            tutoriaId: tutoriaId,
            materia: tutoria.materia,
            fecha: tutoria.fecha,
            horaInicio: tutoria.horaInicio,
            horaFin: tutoria.horaFin,
            tutor: tutoria.tutorNombre || tutoria.tutor,
            estudianteId: estudianteId,
            estudiante: estudianteNombre,
            estado: 'Pendiente'
        };

        this.solicitudes.push(nuevaSolicitud);
        
        // Agregar solicitud a la tutoría
        tutoria.solicitudes.push(nuevaSolicitud.id);
        this.actualizarTutoria(tutoriaId, { solicitudes: tutoria.solicitudes });

        this.guardarDatos('solicitudes', this.solicitudes);
        this.guardarDatos('nextSolicitudId', this.nextSolicitudId);

        return nuevaSolicitud;
    }

    obtenerSolicitudes() {
        return this.solicitudes.filter(s => s.estado !== 'Eliminada');
    }

    obtenerSolicitudesPorEstudiante(estudianteId) {
        return this.solicitudes.filter(
            s => s.estudianteId === estudianteId && s.estado !== 'Eliminada'
        );
    }

    obtenerSolicitudesPorTutoria(tutoriaId) {
        return this.solicitudes.filter(
            s => s.tutoriaId === tutoriaId && s.estado !== 'Eliminada'
        );
    }

    obtenerSolicitudPorId(id) {
        return this.solicitudes.find(s => s.id === id);
    }

    actualizarEstadoSolicitud(id, nuevoEstado) {
        const index = this.solicitudes.findIndex(s => s.id === id);
        if (index !== -1) {
            const estadoAnterior = this.solicitudes[index].estado;
            this.solicitudes[index].estado = nuevoEstado;

            const tutoria = this.obtenerTutoriasPorId(this.solicitudes[index].tutoriaId);

            // Actualizar cupos disponibles
            if (nuevoEstado === 'Aceptada' && estadoAnterior !== 'Aceptada') {
                tutoria.cuposDisponibles--;
            } else if (estadoAnterior === 'Aceptada' && nuevoEstado !== 'Aceptada') {
                tutoria.cuposDisponibles++;
            }

            this.actualizarTutoria(tutoria.id, { cuposDisponibles: tutoria.cuposDisponibles });
            this.guardarDatos('solicitudes', this.solicitudes);

            return this.solicitudes[index];
        }
        return null;
    }

    eliminarSolicitud(id) {
        const solicitud = this.obtenerSolicitudPorId(id);
        if (!solicitud) return false;

        // Si la solicitud estaba aceptada, devolver el cupo
        if (solicitud.estado === 'Aceptada') {
            const tutoria = this.obtenerTutoriasPorId(solicitud.tutoriaId);
            tutoria.cuposDisponibles++;
            this.actualizarTutoria(tutoria.id, { cuposDisponibles: tutoria.cuposDisponibles });
        }

        // Marcar como eliminada en lugar de eliminar
        return this.actualizarEstadoSolicitud(id, 'Eliminada');
    }

    // CRUD Usuarios
    crearUsuario(usuario) {
        const nuevoUsuario = {
            id: this.nextUsuarioId++,
            ...usuario,
            estado: 'Aprobado'
        };
        
        this.usuarios.push(nuevoUsuario);
        this.guardarDatos('usuarios', this.usuarios);
        this.guardarDatos('nextUsuarioId', this.nextUsuarioId);
        
        return nuevoUsuario;
    }

    obtenerUsuarioPorCredenciales(nombreUsuario, password) {
        return this.usuarios.find(u => u.usuario === nombreUsuario && u.password === password);
    }

    obtenerUsuarioPorNombre(nombreUsuario) {
        return this.usuarios.find(u => u.usuario === nombreUsuario);
    }

    obtenerUsuarios() {
        return this.usuarios;
    }

    actualizarUsuario(id, datos) {
        const index = this.usuarios.findIndex(u => u.id === id);
        if (index !== -1) {
            this.usuarios[index] = { ...this.usuarios[index], ...datos };
            this.guardarDatos('usuarios', this.usuarios);
            return this.usuarios[index];
        }
        return null;
    }

    // CRUD Solicitudes de Registro
    crearSolicitudRegistro(solicitud) {
        const nuevaSolicitud = {
            id: this.nextSolicitudRegistroId++,
            ...solicitud,
            estado: 'Pendiente',
            fechaSolicitud: new Date().toISOString()
        };
        
        this.solicitudesRegistro.push(nuevaSolicitud);
        this.guardarDatos('solicitudesRegistro', this.solicitudesRegistro);
        this.guardarDatos('nextSolicitudRegistroId', this.nextSolicitudRegistroId);
        
        return nuevaSolicitud;
    }

    obtenerSolicitudesRegistro() {
        return this.solicitudesRegistro;
    }

    obtenerSolicitudesRegistroPorRol(rol) {
        return this.solicitudesRegistro.filter(s => s.rol === rol && s.estado === 'Pendiente');
    }

    obtenerSolicitudRegistroPorId(id) {
        return this.solicitudesRegistro.find(s => s.id === id);
    }

    actualizarEstadoSolicitudRegistro(id, nuevoEstado, materias = null) {
        const index = this.solicitudesRegistro.findIndex(s => s.id === id);
        if (index !== -1) {
            this.solicitudesRegistro[index].estado = nuevoEstado;
            
            // Si se aprueba, crear el usuario
            if (nuevoEstado === 'Aprobado') {
                const solicitud = this.solicitudesRegistro[index];
                this.crearUsuario({
                    nombre: solicitud.nombre,
                    apellido: solicitud.apellido,
                    correo: solicitud.correo,
                    usuario: solicitud.usuario,
                    password: solicitud.password,
                    rol: solicitud.rol,
                    materias: materias || []
                });
            }
            
            this.guardarDatos('solicitudesRegistro', this.solicitudesRegistro);
            return this.solicitudesRegistro[index];
        }
        return null;
    }

    verificarUsuarioExiste(nombreUsuario) {
        return this.usuarios.some(u => u.usuario === nombreUsuario);
    }

    verificarCorreoExiste(correo) {
        return this.usuarios.some(u => u.correo === correo);
    }

    // CRUD Preguntas de Encuesta
    crearPregunta(materia, pregunta) {
        const nuevaPregunta = {
            id: this.nextPreguntaId++,
            materia,
            pregunta,
            fechaCreacion: new Date().toISOString()
        };
        
        this.preguntasEncuesta.push(nuevaPregunta);
        this.guardarDatos('preguntasEncuesta', this.preguntasEncuesta);
        this.guardarDatos('nextPreguntaId', this.nextPreguntaId);
        
        return nuevaPregunta;
    }

    obtenerPreguntasPorMateria(materia) {
        return this.preguntasEncuesta.filter(p => p.materia === materia);
    }

    obtenerTodasLasPreguntas() {
        return this.preguntasEncuesta;
    }

    // CRUD Respuestas de Encuesta
    crearRespuesta(tutoriaId, estudianteId, respuestas) {
        const nuevaRespuesta = {
            id: this.nextRespuestaId++,
            tutoriaId,
            estudianteId,
            respuestas, // Array de {preguntaId, calificacion}
            fechaRespuesta: new Date().toISOString()
        };
        
        this.respuestasEncuesta.push(nuevaRespuesta);
        this.guardarDatos('respuestasEncuesta', this.respuestasEncuesta);
        this.guardarDatos('nextRespuestaId', this.nextRespuestaId);
        
        return nuevaRespuesta;
    }

    obtenerRespuestasPorTutoria(tutoriaId) {
        return this.respuestasEncuesta.filter(r => r.tutoriaId === tutoriaId);
    }

    verificarRespuestaExistente(tutoriaId, estudianteId) {
        return this.respuestasEncuesta.some(
            r => r.tutoriaId === tutoriaId && r.estudianteId === estudianteId
        );
    }

    calcularPromedioCalificacion(tutoriaId) {
        const respuestas = this.obtenerRespuestasPorTutoria(tutoriaId);
        
        if (respuestas.length === 0) return 0;

        let sumaTotalCalificaciones = 0;
        let totalRespuestas = 0;

        respuestas.forEach(respuesta => {
            respuesta.respuestas.forEach(r => {
                sumaTotalCalificaciones += r.calificacion;
                totalRespuestas++;
            });
        });

        return totalRespuestas > 0 ? (sumaTotalCalificaciones / totalRespuestas).toFixed(2) : 0;
    }

    calcularPromediosPorPregunta(tutoriaId) {
        const respuestas = this.obtenerRespuestasPorTutoria(tutoriaId);
        
        if (respuestas.length === 0) return {};

        const promedios = {};

        respuestas.forEach(respuesta => {
            respuesta.respuestas.forEach(r => {
                if (!promedios[r.preguntaId]) {
                    promedios[r.preguntaId] = {
                        suma: 0,
                        count: 0
                    };
                }
                promedios[r.preguntaId].suma += r.calificacion;
                promedios[r.preguntaId].count++;
            });
        });

        // Calcular promedios finales
        Object.keys(promedios).forEach(preguntaId => {
            const { suma, count } = promedios[preguntaId];
            promedios[preguntaId] = (suma / count).toFixed(2);
        });

        return promedios;
    }
}

// Instancia global de la base de datos
const db = new Database();
