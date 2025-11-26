// Chat - Gestión de mensajería en tiempo real

let conversacionActual = null;
let receptorActual = null;
let escribiendoTimeout = null;
let chatSocket = null;

document.addEventListener('DOMContentLoaded', async function() {
    // Obtener sesión del usuario
    const usuario = await obtenerSesion();
    
    if (!usuario) {
        window.location.href = '/login.html';
        return;
    }
    
    // Guardar en localStorage para acceso sincrónico
    localStorage.setItem('usuario', JSON.stringify({
        id: usuario.userId,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        rol: usuario.rol,
        email: usuario.email
    }));

    // Inicializar Socket.IO para chat
    chatSocket = io({
        transports: ['websocket'],
        upgrade: false
    });

    // Esperar a que se conecte
    chatSocket.on('connect', () => {
        // Configurar eventos de Socket.IO para chat
        configurarEventosSocket();
    });

    // Mostrar nombre de usuario
    document.getElementById('usuario-nombre').textContent = `${usuario.nombre} ${usuario.apellido}`;

    // Cargar conversaciones
    await cargarConversaciones();

    // Configurar formulario de envío
    configurarEnvioMensajes();

    // Configurar input para detectar escritura
    configurarIndicadorEscritura();

    // Configurar botón volver en móviles
    document.getElementById('btn-volver-conversaciones').addEventListener('click', function() {
        document.getElementById('conversaciones-panel').classList.remove('d-none');
        document.getElementById('chat-activo').style.display = 'none';
        document.getElementById('sin-seleccion').style.display = 'flex';
    });
});

// Cargar lista de conversaciones
async function cargarConversaciones() {
    try {
        const loading = document.getElementById('loading-conversaciones');
        const listaConversaciones = document.getElementById('lista-conversaciones');
        const sinConversaciones = document.getElementById('sin-conversaciones');

        loading.style.display = 'block';

        const response = await APIClient.getConversaciones();

        loading.style.display = 'none';

        if (response.success && response.conversaciones && response.conversaciones.length > 0) {
            listaConversaciones.innerHTML = '';
            sinConversaciones.style.display = 'none';

            response.conversaciones.forEach(conv => {
                const item = crearItemConversacion(conv);
                listaConversaciones.appendChild(item);
            });
        } else {
            listaConversaciones.innerHTML = '';
            sinConversaciones.style.display = 'block';
        }

    } catch (error) {
        console.error('Error al cargar conversaciones:', error);
        mostrarError('Error al cargar conversaciones');
    }
}

// Crear elemento de conversación
function crearItemConversacion(conv) {
    const div = document.createElement('div');
    div.className = 'conversacion-item';
    div.dataset.tutoriaId = conv.tutoria._id;
    
    // Guardar datos de participantes en el elemento
    div.dataset.estudiantes = JSON.stringify(conv.estudiantes || []);
    div.dataset.tutor = JSON.stringify(conv.tutoria.tutor);

    const fecha = conv.tutoria.fecha ? new Date(conv.tutoria.fecha).toLocaleDateString() : '';
    const ultimoMensaje = conv.ultimoMensaje ? conv.ultimoMensaje.contenido : 'Aún no hay mensajes en este grupo';
    const noLeidos = conv.mensajesNoLeidos;
    const participantes = conv.participantes || 0;

    const htmlContent = `
        <div class="d-flex align-items-start">
            <div class="flex-grow-1">
                <div class="d-flex justify-content-between align-items-start">
                    <h6 class="mb-1">${conv.tutoria.materia}</h6>
                    ${noLeidos > 0 ? `<span class="badge bg-danger rounded-pill">${noLeidos}</span>` : ''}
                </div>
                <small class="text-muted d-block">${fecha} • ${participantes} participante${participantes !== 1 ? 's' : ''}</small>
                <p class="mb-0 text-truncate ultimo-mensaje">${ultimoMensaje}</p>
            </div>
        </div>
    `;
    
    div.innerHTML = htmlContent;

    div.addEventListener('click', () => {
        seleccionarConversacion(conv);
    });

    return div;
}

// Seleccionar una conversación
async function seleccionarConversacion(conv) {
    try {
        conversacionActual = conv.tutoria._id;

        // Determinar receptor (tutor o estudiante)
        const usuario = obtenerUsuarioActualSync();
        const estudiantes = conv.estudiantes || [];
        
        if (usuario.rol === 'Tutor') {
            // El tutor puede enviar a todos los estudiantes
            // Por simplicidad, tomamos el primer estudiante como receptor principal
            // En un chat grupal real, los mensajes se enviarían a todos
            if (estudiantes.length > 0) {
                receptorActual = estudiantes[0]._id;
            } else {
                receptorActual = null;
                mostrarError('Esta tutoría no tiene estudiantes inscritos aún');
            }
        } else {
            // El estudiante habla con el tutor
            receptorActual = conv.tutoria.tutor ? conv.tutoria.tutor._id : conv.tutoria.tutor;
        }

        // Actualizar UI con información de participantes
        const totalParticipantes = estudiantes.length + 1;
        let infoParticipantes = '';
        
        if (usuario.rol === 'Tutor') {
            const nombresEstudiantes = estudiantes.map(e => `${e.nombre} ${e.apellido}`).join(', ');
            infoParticipantes = nombresEstudiantes || 'Sin estudiantes aún';
        } else {
            const tutor = conv.tutoria.tutor;
            infoParticipantes = `Tutor: ${tutor.nombre} ${tutor.apellido}`;
        }
        
        document.getElementById('chat-titulo').textContent = conv.tutoria.materia;
        document.getElementById('chat-subtitulo').innerHTML = `
            ${new Date(conv.tutoria.fecha).toLocaleDateString()} • 
            ${totalParticipantes} participante${totalParticipantes !== 1 ? 's' : ''}<br>
            <small>${infoParticipantes}</small>
        `;

        // Marcar conversación como activa
        document.querySelectorAll('.conversacion-item').forEach(item => {
            item.classList.remove('activa');
        });
        document.querySelector(`[data-tutoria-id="${conversacionActual}"]`)?.classList.add('activa');

        // En móviles, ocultar panel de conversaciones
        if (window.innerWidth < 768) {
            document.getElementById('conversaciones-panel').classList.add('d-none');
        }

        // Mostrar chat
        document.getElementById('sin-seleccion').style.display = 'none';
        document.getElementById('chat-activo').style.display = 'flex';

        // Cargar mensajes
        await cargarMensajes();

        // Focus en input
        document.getElementById('input-mensaje').focus();

    } catch (error) {
        console.error('Error al seleccionar conversación:', error);
        mostrarError('Error al cargar la conversación');
    }
}

// Cargar mensajes de la conversación
async function cargarMensajes() {
    try {
        const response = await APIClient.getMensajesTutoria(conversacionActual);

        if (response.success) {
            const container = document.getElementById('mensajes-container');
            container.innerHTML = '';

            if (response.mensajes.length === 0) {
                container.innerHTML = '<div class="text-center text-muted py-5">No hay mensajes aún. ¡Envía el primero!</div>';
            } else {
                response.mensajes.forEach(mensaje => {
                    agregarMensajeUI(mensaje);
                });
                scrollToBottom();
            }
        }

    } catch (error) {
        console.error('Error al cargar mensajes:', error);
        mostrarError('Error al cargar mensajes');
    }
}

// Agregar mensaje a la UI
function agregarMensajeUI(mensaje, esPropio = null) {
    const container = document.getElementById('mensajes-container');
    
    // Verificar si el mensaje ya existe (evitar duplicados)
    const mensajeExistente = container.querySelector(`[data-mensaje-id="${mensaje._id}"]`);
    if (mensajeExistente) {
        return;
    }
    
    // Remover mensaje de "sin mensajes"
    const sinMensajes = container.querySelector('.text-center.text-muted');
    if (sinMensajes) {
        sinMensajes.remove();
    }

    const usuario = obtenerUsuarioActualSync();
    if (esPropio === null) {
        esPropio = mensaje.emisor === usuario.id;
    }

    const div = document.createElement('div');
    div.className = `mensaje ${esPropio ? 'mensaje-propio' : 'mensaje-otro'}`;
    div.dataset.mensajeId = mensaje._id;

    const fecha = new Date(mensaje.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    div.innerHTML = `
        <div class="mensaje-content">
            ${!esPropio ? `<div class="mensaje-autor">${mensaje.emisorNombre}</div>` : ''}
            <div class="mensaje-texto">${escapeHtml(mensaje.contenido)}</div>
            <div class="mensaje-hora">${fecha}</div>
        </div>
    `;

    container.appendChild(div);
}

// Configurar envío de mensajes
function configurarEnvioMensajes() {
    const form = document.getElementById('form-enviar-mensaje');
    const input = document.getElementById('input-mensaje');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const contenido = input.value.trim();
        if (!contenido || !conversacionActual || !receptorActual) return;

        try {
            // Enviar mensaje por Socket.IO
            chatSocket.emit('chat:enviar-mensaje', {
                tutoriaId: conversacionActual,
                receptorId: receptorActual,
                contenido: contenido
            });

            // Limpiar input
            input.value = '';
            actualizarContadorCaracteres();

        } catch (error) {
            console.error('Error al enviar mensaje:', error);
            mostrarError('Error al enviar mensaje');
        }
    });
}

// Configurar indicador de escritura
function configurarIndicadorEscritura() {
    const input = document.getElementById('input-mensaje');
    const contador = document.getElementById('contador-caracteres');

    input.addEventListener('input', function() {
        actualizarContadorCaracteres();

        // Emitir evento de "escribiendo"
        if (input.value.trim() && conversacionActual && receptorActual) {
            chatSocket.emit('chat:escribiendo', {
                tutoriaId: conversacionActual,
                receptorId: receptorActual
            });

            // Cancelar timeout anterior
            if (escribiendoTimeout) {
                clearTimeout(escribiendoTimeout);
            }

            // Después de 2 segundos sin escribir, emitir "dejó de escribir"
            escribiendoTimeout = setTimeout(() => {
                chatSocket.emit('chat:dejo-escribir', {
                    tutoriaId: conversacionActual,
                    receptorId: receptorActual
                });
            }, 2000);
        }
    });
}

function actualizarContadorCaracteres() {
    const input = document.getElementById('input-mensaje');
    const contador = document.getElementById('contador-caracteres');
    contador.textContent = input.value.length;
}

// Configurar eventos de Socket.IO
function configurarEventosSocket() {
    // Mensaje enviado con éxito
    chatSocket.on('chat:mensaje-enviado', (mensaje) => {
        agregarMensajeUI(mensaje, true);
        scrollToBottom();
        actualizarUltimoMensajeConversacion(mensaje);
    });

    // Nuevo mensaje recibido
    chatSocket.on('chat:nuevo-mensaje', (mensaje) => {
        // Si es de la conversación actual, agregarlo
        if (mensaje.tutoria === conversacionActual) {
            agregarMensajeUI(mensaje, false);
            scrollToBottom();
        }
        
        // Actualizar lista de conversaciones
        actualizarUltimoMensajeConversacion(mensaje);
        cargarConversaciones();
    });

    // Usuario escribiendo
    chatSocket.on('chat:usuario-escribiendo', (data) => {
        if (data.tutoriaId === conversacionActual) {
            document.getElementById('usuario-escribiendo').style.display = 'inline-block';
        }
    });

    // Usuario dejó de escribir
    chatSocket.on('chat:usuario-dejo-escribir', (data) => {
        if (data.tutoriaId === conversacionActual) {
            document.getElementById('usuario-escribiendo').style.display = 'none';
        }
    });

    // Error en chat
    chatSocket.on('chat:error', (data) => {
        mostrarError(data.message || 'Error en el chat');
    });
}

// Funciones auxiliares
function scrollToBottom() {
    const container = document.getElementById('mensajes-container');
    container.scrollTop = container.scrollHeight;
}

function actualizarUltimoMensajeConversacion(mensaje) {
    const conversacionItem = document.querySelector(`[data-tutoria-id="${mensaje.tutoria}"]`);
    if (conversacionItem) {
        const ultimoMensajeEl = conversacionItem.querySelector('.ultimo-mensaje');
        if (ultimoMensajeEl) {
            ultimoMensajeEl.textContent = mensaje.contenido;
        }
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function obtenerUsuarioActualSync() {
    const usuarioStr = localStorage.getItem('usuario');
    return usuarioStr ? JSON.parse(usuarioStr) : null;
}

async function obtenerUsuarioActual() {
    return obtenerUsuarioActualSync();
}

async function obtenerEstudianteTutoria(tutoriaId) {
    // TODO: Implementar endpoint para obtener estudiantes de una tutoría
    // Por ahora, retornar null y manejarlo en el backend
    return null;
}

function getRolHomePage() {
    const usuario = obtenerUsuarioActualSync();
    if (!usuario) return '/';
    
    switch(usuario.rol) {
        case 'Tutor': return '/tutor';
        case 'Estudiante': return '/estudiante';
        case 'Administrador': return '/admin';
        default: return '/';
    }
}

function mostrarError(mensaje) {
    // Implementar notificación de error (puede usar Bootstrap toast o alert)
    console.error(mensaje);
    alert(mensaje);
}
