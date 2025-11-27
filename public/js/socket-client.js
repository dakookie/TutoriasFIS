// Socket.IO Client - Conexión en tiempo real
let socket;

function initializeSocket() {
    socket = io({
        transports: ['websocket'],
        upgrade: false
    });

    socket.on('connect', () => {
        console.log('✅ Conectado al servidor Socket.IO');
    });

    socket.on('connected', (data) => {
        console.log('Usuario conectado:', data);
    });

    socket.on('disconnect', () => {
        console.log('❌ Desconectado del servidor');
    });

    // Eventos para tutores
    socket.on('nuevaSolicitud', (data) => {
        const mensaje = `Nueva solicitud para ${data.tutoria}`;
        
        // Verificar si existe la función mostrarNotificacion del tutor.js
        if (typeof window.mostrarNotificacion === 'function') {
            window.mostrarNotificacion('Nueva Solicitud', mensaje);
        } else {
            // Usar notificación simple si no está disponible
            mostrarNotificacion(mensaje);
        }
        
        // Recargar solicitudes si estamos en vista tutor
        if (typeof cargarTutoriasCreadas === 'function') {
            cargarTutoriasCreadas();
        }
    });

    // Eventos para estudiantes
    socket.on('solicitudAceptada', (data) => {
        mostrarNotificacion(`Tu solicitud fue aceptada para ${data.tutoria}`, 'success');
        // Recargar solicitudes si estamos en vista estudiante
        if (typeof cargarSolicitudesEstudiante === 'function') {
            cargarSolicitudesEstudiante();
        }
    });

    socket.on('solicitudRechazada', (data) => {
        mostrarNotificacion(`Tu solicitud fue rechazada para ${data.tutoria}`, 'warning');
        // Recargar solicitudes
        if (typeof cargarSolicitudesEstudiante === 'function') {
            cargarSolicitudesEstudiante();
        }
    });

    // Eventos para administradores
    socket.on('solicitudAprobada', (data) => {
        mostrarNotificacion(`Solicitud de ${data.nombre} ${data.apellido} aprobada`, 'success');
    });

    // Evento general para nuevas tutorías
    socket.on('nuevaTutoria', (tutoria) => {
        console.log('Nueva tutoría disponible:', tutoria);
        // Recargar tutorías disponibles si estamos en vista estudiante
        if (typeof cargarTutoriasDisponibles === 'function') {
            cargarTutoriasDisponibles();
        }
    });

    return socket;
}

function mostrarNotificacion(mensaje, tipo = 'info') {
    // Crear elemento de notificación
    const notificacion = document.createElement('div');
    notificacion.className = `alert alert-${tipo === 'success' ? 'success' : tipo === 'warning' ? 'warning' : 'info'} position-fixed top-0 end-0 m-3`;
    notificacion.style.zIndex = '9999';
    notificacion.textContent = mensaje;

    document.body.appendChild(notificacion);

    // Eliminar después de 5 segundos
    setTimeout(() => {
        notificacion.remove();
    }, 5000);
}
