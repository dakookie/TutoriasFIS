// Chat - Gestión de mensajería en tiempo real

let conversacionActual = null;
let receptorActual = null;
let escribiendoTimeout = null;
let chatSocket = null;

// Variable global para almacenar el usuario actual
let usuarioActual = null;

// Función para ir al inicio según el rol
function irAlInicio() {
    if (usuarioActual) {
        if (usuarioActual.rol === 'Tutor') {
            window.location.href = '/tutor.html';
        } else if (usuarioActual.rol === 'Estudiante') {
            window.location.href = '/estudiante.html';
        } else if (usuarioActual.rol === 'Administrador') {
            window.location.href = '/admin.html';
        }
    } else {
        window.location.href = '/';
    }
}

// Función para generar los links de navegación según el rol
function generarLinksNavegacion(usuario) {
    const navLinks = document.getElementById('nav-links');
    if (!navLinks) return;

    let html = `
        <a href="#" onclick="irAlInicio(); return false;" class="text-gray-700 hover:text-gray-900 font-medium">← Regresar</a>
    `;

    if (usuario.rol === 'Estudiante') {
        html += `
            <a href="#" onclick="irAlEstudiante(); return false;" class="text-gray-700 hover:text-gray-900 font-medium">Consultar Tutorías</a>
            <a href="#" onclick="irAlSolicitudes(); return false;" class="text-gray-700 hover:text-gray-900 font-medium">Ver Solicitudes</a>
        `;
    } else if (usuario.rol === 'Tutor') {
        html += `
            <a href="#" onclick="irAlTutorHome(); return false;" class="text-gray-700 hover:text-gray-900 font-medium">Registrar Tutoría</a>
            <a href="#" onclick="irAlTutoriasCreadas(); return false;" class="text-gray-700 hover:text-gray-900 font-medium">Tutorías Creadas</a>
        `;
    }

    html += `<span class="text-gray-700 font-medium">Chat</span>`;
    html += `
        <span id="badge-mensajes" class="hidden ml-2 px-2 py-1 text-xs font-bold rounded-full bg-red-500 text-white">0</span>
    `;

    navLinks.innerHTML = html;
}

// Funciones auxiliares de navegación
function irAlEstudiante() {
    window.location.href = '/estudiante.html';
}

function irAlSolicitudes() {
    // Esta función necesita estar en estudiante.html, pero podemos ir a estudiante.html y manejar con hash
    window.location.href = '/estudiante.html#solicitudes';
}

function irAlTutorHome() {
    window.location.href = '/tutor.html';
}

function irAlTutoriasCreadas() {
    // Similar a estudiante, manejamos con hash
    window.location.href = '/tutor.html#tutorias';
}

document.addEventListener('DOMContentLoaded', async function() {
    // Obtener sesión del usuario
    const usuario = await obtenerSesion();
    
    if (!usuario) {
        window.location.href = '/login.html';
        return;
    }
    
    // Guardar usuario globalmente
    usuarioActual = usuario;

    // Generar links de navegación según el rol
    generarLinksNavegacion(usuario);

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
        document.getElementById('chat-activo').classList.add('hidden');
        document.getElementById('chat-activo').classList.remove('flex');
        document.getElementById('sin-seleccion').classList.remove('hidden');
        document.getElementById('sin-seleccion').classList.add('flex');
    });

    // Configurar botón cerrar sesión (ahora btn-logout)
    document.getElementById('btn-logout').addEventListener('click', async function() {
        try {
            await cerrarSesion();
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            window.location.href = '/';
        }
    });
});

// Cargar lista de conversaciones
async function cargarConversaciones() {
    try {
        const loading = document.getElementById('loading-conversaciones');
        const listaConversaciones = document.getElementById('lista-conversaciones');
        const sinConversaciones = document.getElementById('sin-conversaciones');

        // Mostrar loading
        loading.classList.remove('hidden');
        loading.classList.add('flex');
        listaConversaciones.classList.add('hidden');
        sinConversaciones.classList.add('hidden');

        const response = await APIClient.getConversaciones();

        console.log('Conversaciones recibidas:', response);

        // Ocultar loading
        loading.classList.add('hidden');
        loading.classList.remove('flex');

        console.log('Success:', response.success);
        console.log('Conversaciones array:', response.conversaciones);
        console.log('Cantidad de conversaciones:', response.conversaciones ? response.conversaciones.length : 0);

        if (response.success && response.conversaciones && response.conversaciones.length > 0) {
            console.log('✓ Mostrando conversaciones');
            listaConversaciones.innerHTML = '';
            listaConversaciones.classList.remove('hidden');
            sinConversaciones.classList.add('hidden');

            response.conversaciones.forEach((conv, index) => {
                console.log(`Creando conversación ${index + 1}:`, conv);
                const item = crearItemConversacion(conv);
                listaConversaciones.appendChild(item);
            });
        } else {
            console.log('✗ No hay conversaciones disponibles');
            listaConversaciones.innerHTML = '';
            listaConversaciones.classList.add('hidden');
            sinConversaciones.classList.remove('hidden');
            sinConversaciones.classList.add('flex');
        }

    } catch (error) {
        console.error('Error al cargar conversaciones:', error);
        const loading = document.getElementById('loading-conversaciones');
        loading.classList.add('hidden');
        loading.classList.remove('flex');
        mostrarError('Error al cargar conversaciones');
    }
}

// Crear elemento de conversación
function crearItemConversacion(conv) {
    const div = document.createElement('div');
    div.className = 'conversacion-item border-b border-gray-200 px-4 py-3 cursor-pointer hover:bg-gray-50 transition';
    div.dataset.tutoriaId = conv.tutoria._id;
    
    // Guardar datos de participantes en el elemento
    div.dataset.estudiantes = JSON.stringify(conv.estudiantes || []);
    div.dataset.tutor = JSON.stringify(conv.tutoria.tutor);

    const fecha = conv.tutoria.fecha ? new Date(conv.tutoria.fecha).toLocaleDateString() : '';
    const ultimoMensaje = conv.ultimoMensaje ? conv.ultimoMensaje.contenido : 'Aún no hay mensajes en este grupo';
    const noLeidos = conv.mensajesNoLeidos;
    const participantes = conv.participantes || 0;

    const htmlContent = `
        <div class="flex items-start">
            <div class="flex-1">
                <div class="flex justify-between items-start mb-1">
                    <h3 class="font-semibold text-gray-800">${conv.tutoria.materia}</h3>
                    ${noLeidos > 0 ? `<span class="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">${noLeidos}</span>` : ''}
                </div>
                <p class="text-xs text-gray-500 mb-1">${fecha} • ${participantes} participante${participantes !== 1 ? 's' : ''}</p>
                <p class="text-sm text-gray-600 truncate ultimo-mensaje">${ultimoMensaje}</p>
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
        const estudiantes = conv.estudiantes || [];
        
        if (usuarioActual.rol === 'Tutor') {
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
        
        if (usuarioActual.rol === 'Tutor') {
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
            item.classList.remove('active', 'bg-blue-50', 'border-l-4', 'border-blue-600');
        });
        const itemActivo = document.querySelector(`[data-tutoria-id="${conversacionActual}"]`);
        if (itemActivo) {
            itemActivo.classList.add('active', 'bg-blue-50', 'border-l-4', 'border-blue-600');
        }

        // En móviles, ocultar panel de conversaciones
        if (window.innerWidth < 768) {
            document.getElementById('conversaciones-panel').classList.add('d-none');
        }

        // Mostrar chat
        document.getElementById('sin-seleccion').classList.add('hidden');
        document.getElementById('chat-activo').classList.remove('hidden');
        document.getElementById('chat-activo').classList.add('flex');

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
                container.innerHTML = '<div class="flex items-center justify-center h-full"><p class="text-gray-500 text-center">No hay mensajes aún. ¡Envía el primero!</p></div>';
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
    const sinMensajes = container.querySelector('.text-center.text-gray-500');
    if (sinMensajes) {
        sinMensajes.remove();
    }

    if (esPropio === null) {
        // Convertir ambos valores a string para comparación correcta
        const emisorId = typeof mensaje.emisor === 'object' ? mensaje.emisor.toString() : String(mensaje.emisor);
        // El servidor devuelve _id, no userId
        const usuarioId = String(usuarioActual._id || usuarioActual.userId);
        
        esPropio = emisorId === usuarioId;
    }

    const div = document.createElement('div');
    div.className = `flex mb-4 ${esPropio ? 'justify-end mensaje-enviado' : 'justify-start mensaje-recibido'}`;
    div.dataset.mensajeId = mensaje._id;

    const fecha = new Date(mensaje.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (esPropio) {
        div.innerHTML = `
            <div class="max-w-sm lg:max-w-lg xl:max-w-xl">
                <div class="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-md">
                    <p class="text-sm break-words">${escapeHtml(mensaje.contenido)}</p>
                </div>
                <p class="text-xs text-gray-500 mt-1 text-right">${fecha}</p>
            </div>
        `;
    } else {
        div.innerHTML = `
            <div class="max-w-sm lg:max-w-lg xl:max-w-xl">
                <p class="text-xs font-medium text-gray-700 mb-1">${mensaje.emisorNombre}</p>
                <div class="bg-gray-100 border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-md">
                    <p class="text-sm text-gray-800 break-words">${escapeHtml(mensaje.contenido)}</p>
                </div>
                <p class="text-xs text-gray-500 mt-1">${fecha}</p>
            </div>
        `;
    }

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
    contador.textContent = `${input.value.length}/1000`;
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
            const indicador = document.getElementById('usuario-escribiendo');
            indicador.classList.remove('hidden');
            indicador.classList.add('flex');
        }
    });

    // Usuario dejó de escribir
    chatSocket.on('chat:usuario-dejo-escribir', (data) => {
        if (data.tutoriaId === conversacionActual) {
            const indicador = document.getElementById('usuario-escribiendo');
            indicador.classList.add('hidden');
            indicador.classList.remove('flex');
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

async function obtenerUsuarioActual() {
    return usuarioActual;
}

async function obtenerEstudianteTutoria(tutoriaId) {
    // TODO: Implementar endpoint para obtener estudiantes de una tutoría
    // Por ahora, retornar null y manejarlo en el backend
    return null;
}

function getRolHomePage() {
    if (!usuarioActual) return '/';
    
    switch(usuarioActual.rol) {
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
