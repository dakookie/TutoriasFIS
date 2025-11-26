// Funcionalidad para la vista del Estudiante

// HU-003: Envío de solicitud de tutoría
// HU-001: Filtro de visualización de tutorías por materia

let filtroMateriaActual = 'Todas';

// Inicializar filtro de materias
async function inicializarFiltroMaterias() {
    const filtroSelect = document.getElementById('filtro-materia');
    if (!filtroSelect) return;

    try {
        // Obtener todas las materias únicas de las tutorías
        const response = await APIClient.getTutoriasDisponibles();
        const tutorias = response.tutorias;
        const materiasUnicas = new Set();
        
        tutorias.forEach(t => materiasUnicas.add(t.materia));
        
        // Limpiar y agregar opción "Todas"
        filtroSelect.innerHTML = '<option value="Todas">Todas</option>';
        
        // Agregar materias únicas
        Array.from(materiasUnicas).sort().forEach(materia => {
            const option = document.createElement('option');
            option.value = materia;
            option.textContent = materia;
            filtroSelect.appendChild(option);
        });

        // Event listener para el cambio de filtro
        filtroSelect.addEventListener('change', async function() {
            filtroMateriaActual = this.value;
            await cargarTutoriasDisponibles();
        });
    } catch (error) {
        console.error('Error al cargar materias:', error);
    }
}

// Cargar y mostrar tutorías disponibles
async function cargarTutoriasDisponibles() {
    const container = document.getElementById('tutorias-disponibles-lista');
    const sesion = await obtenerSesion();
    
    // Inicializar filtro si existe
    await inicializarFiltroMaterias();
    
    try {
        console.log('Llamando a getTutoriasDisponibles...');
        const response = await APIClient.getTutoriasDisponibles();
        console.log('Respuesta completa de la API:', response);
        
        let tutorias = response.tutorias;
        console.log('Array de tutorías:', tutorias);
        console.log('Número de tutorías:', tutorias ? tutorias.length : 0);
        
        // Aplicar filtro por materia
        if (filtroMateriaActual && filtroMateriaActual !== 'Todas') {
            tutorias = tutorias.filter(t => t.materia === filtroMateriaActual);
        }

        if (tutorias.length === 0) {
            container.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-gray-500">No hay tutorías disponibles en este momento.</td></tr>';
            return;
        }

        // Obtener solicitudes del estudiante
        let solicitudes = [];
        if (sesion) {
            const solicitudesResponse = await APIClient.getSolicitudesEstudiante();
            solicitudes = solicitudesResponse.solicitudes;
        }

        let html = '';
        
        tutorias.forEach(tutoria => {
            // Verificar si el estudiante ya tiene una solicitud para esta tutoría
            const solicitudExistente = sesion ? solicitudes.find(s => {
                const tutoriaIdSolicitud = s.tutoria?._id || s.tutoria;
                return tutoriaIdSolicitud.toString() === tutoria._id.toString();
            }) : null;

            html += `
                <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 text-sm text-gray-700">${tutoria.materiaNombre || tutoria.materia}</td>
                    <td class="px-6 py-4 text-sm text-gray-700">${formatearFecha(tutoria.fecha)}</td>
                    <td class="px-6 py-4 text-sm text-gray-700">${tutoria.horaInicio}</td>
                    <td class="px-6 py-4 text-sm text-gray-700">${tutoria.horaFin}</td>
                    <td class="px-6 py-4 text-sm text-gray-700">${tutoria.tutorNombre}</td>
                    <td class="px-6 py-4">
                        ${!solicitudExistente && sesion ? `
                            <button class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium transition btn-solicitar" data-tutoria-id="${tutoria._id}">
                                Solicitar unirse
                            </button>
                        ` : solicitudExistente && solicitudExistente.estado === 'Pendiente' ? `
                            <span class="px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Ya solicitaste</span>
                        ` : solicitudExistente && solicitudExistente.estado === 'Aceptada' ? `
                            <span class="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Aceptada</span>
                        ` : solicitudExistente && solicitudExistente.estado === 'Rechazada' ? `
                            <span class="px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Rechazada</span>
                        ` : ''}
                    </td>
                </tr>
            `;
        });

        container.innerHTML = html;

        // Agregar event listeners para los botones de solicitar
        agregarEventListenersSolicitar();
        
    } catch (error) {
        console.error('Error al cargar tutorías disponibles:', error);
        container.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-red-500">Error al cargar tutorías</td></tr>';
    }
}

function agregarEventListenersSolicitar() {
    document.querySelectorAll('.btn-solicitar').forEach(btn => {
        btn.addEventListener('click', async function() {
            const tutoriaId = this.dataset.tutoriaId;
            const sesion = await obtenerSesion();
            
            if (!sesion) {
                mostrarNotificacion('Advertencia', 'Debes iniciar sesión para solicitar una tutoría', 'warning');
                return;
            }
            
            try {
                const response = await APIClient.crearSolicitud(tutoriaId);
                mostrarNotificacion('Éxito', 'Solicitud enviada exitosamente', 'success');
                await cargarTutoriasDisponibles();
                await cargarSolicitudesEstudiante(sesion);
            } catch (error) {
                console.error('Error al crear solicitud:', error);
                mostrarNotificacion('Error', error.message || 'Error al enviar la solicitud', 'error');
            }
        });
    });
}

// Cargar y mostrar solicitudes del estudiante
async function cargarSolicitudesEstudiante(sesion) {
    const container = document.getElementById('solicitudes-estudiante-lista');
    
    if (!sesion) {
        sesion = await obtenerSesion();
    }
    
    try {
        const response = await APIClient.getSolicitudesEstudiante();
        const solicitudes = response.solicitudes;

        if (solicitudes.length === 0) {
            container.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-gray-500">No se encontraron solicitudes de tutorías enviadas</td></tr>';
            return;
        }

        let html = '';
        
        for (const solicitud of solicitudes) {
            const puedeEliminar = solicitud.estado === 'Pendiente';
            const puedeCalificar = solicitud.estado === 'Aceptada';
            
            // Verificar si ya calificó esta tutoría (solo si puede calificar)
            let yaCalificado = false;
            const tutoriaId = solicitud.tutoria?._id || solicitud.tutoria;
            
            if (puedeCalificar) {
                try {
                    const verificarResponse = await APIClient.verificarRespuesta(tutoriaId);
                    yaCalificado = verificarResponse.respondido;
                } catch (error) {
                    console.error('Error al verificar calificación:', error);
                }
            }
            
            const estadoClass = solicitud.estado === 'Aceptada' ? 'bg-green-100 text-green-800' : 
                               solicitud.estado === 'Rechazada' ? 'bg-red-100 text-red-800' : 
                               'bg-yellow-100 text-yellow-800';
            
            html += `
                <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 text-sm text-gray-700">${solicitud.materia}</td>
                    <td class="px-6 py-4 text-sm text-gray-700">${formatearFecha(solicitud.fecha)}</td>
                    <td class="px-6 py-4 text-sm text-gray-700">${solicitud.horaInicio}</td>
                    <td class="px-6 py-4 text-sm text-gray-700">${solicitud.horaFin}</td>
                    <td class="px-6 py-4 text-sm text-gray-700">${solicitud.tutor}</td>
                    <td class="px-6 py-4">
                        <span class="px-3 py-1 text-xs font-medium rounded-full ${estadoClass}">${solicitud.estado}</span>
                    </td>
                    <td class="px-6 py-4">
                        ${puedeEliminar ? `
                            <button class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm font-medium transition btn-eliminar-solicitud" data-solicitud-id="${solicitud._id}">
                                Cancelar
                            </button>
                        ` : ''}
                        ${puedeCalificar && !yaCalificado ? `
                            <button class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium transition btn-calificar-tutoria" 
                                    data-tutoria-id="${tutoriaId}" 
                                    data-materia="${solicitud.materia}">
                                Calificar
                            </button>
                        ` : puedeCalificar && yaCalificado ? `
                            <button class="bg-gray-300 text-gray-600 px-4 py-2 rounded text-sm font-medium cursor-not-allowed" disabled>
                                Calificada
                            </button>
                        ` : solicitud.estado === 'Rechazada' ? `
                            <span class="text-gray-400">-</span>
                        ` : ''}
                        ${solicitud.estado === 'Aceptada' ? `
                            <a href="/aula.html?id=${tutoriaId}" class="ml-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm font-medium transition inline-block">
                                Ir al Aula
                            </a>
                        ` : ''}
                    </td>
                </tr>
            `;
        }

        container.innerHTML = html;

        // Agregar event listeners
        agregarEventListenersEliminar();
        agregarEventListenersCalificar();
        
    } catch (error) {
        console.error('Error al cargar solicitudes:', error);
        container.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-red-500">Error al cargar solicitudes</td></tr>';
    }
}

function agregarEventListenersEliminar() {
    document.querySelectorAll('.btn-eliminar-solicitud').forEach(btn => {
        btn.addEventListener('click', async function() {
            const solicitudId = this.dataset.solicitudId;
            
            if (confirm('¿Estás seguro de que deseas eliminar esta solicitud?')) {
                try {
                    await APIClient.eliminarSolicitud(solicitudId);
                    const sesion = await obtenerSesion();
                    
                    // Primero recargar solicitudes, luego tutorías
                    await cargarSolicitudesEstudiante(sesion);
                    await cargarTutoriasDisponibles();
                    mostrarNotificacion('Éxito', 'Solicitud cancelada exitosamente', 'success');
                } catch (error) {
                    console.error('Error al eliminar solicitud:', error);
                    mostrarNotificacion('Error', 'Error al eliminar la solicitud: ' + error.message, 'error');
                }
            }
        });
    });
}

// HU-009: Calificar Tutoría
function agregarEventListenersCalificar() {
    document.querySelectorAll('.btn-calificar-tutoria').forEach(btn => {
        btn.addEventListener('click', function() {
            const tutoriaId = parseInt(this.dataset.tutoriaId);
            const materia = this.dataset.materia;
            abrirModalEncuesta(tutoriaId, materia);
        });
    });
}

async function abrirModalEncuesta(tutoriaId, materia) {
    try {
        const sesion = await obtenerSesion();
        const response = await APIClient.getPreguntasPorMateria(materia);
        const preguntas = response.preguntas;
        
        if (preguntas.length === 0) {
            mostrarNotificacion('Información', 'No hay preguntas configuradas para esta materia. Por favor, contacta al administrador.', 'info');
            return;
        }
    
    const modal = document.getElementById('modal-encuesta');
    const titulo = document.getElementById('modal-encuesta-titulo');
    const body = document.getElementById('modal-encuesta-body');
    const btnEnviar = document.getElementById('btn-enviar-encuesta');
    
    titulo.textContent = `Formulario de calificación - ${materia}`;
    
    let html = `
        <p class="text-center mb-6 text-gray-600">
            Por favor responde las siguientes preguntas
        </p>
    `;
    
        preguntas.forEach(pregunta => {
            html += `
                <div class="mb-6 pb-4 border-b border-gray-200">
                    <p class="font-semibold text-gray-800 mb-3">${pregunta.pregunta}</p>
                    <div class="space-y-2">
                        <label class="flex items-center space-x-2 cursor-pointer">
                            <input class="form-radio text-blue-500" type="radio" name="pregunta-${pregunta._id}" 
                                   id="pregunta-${pregunta._id}-1" value="1">
                            <span class="text-gray-700">1 - Muy insatisfecho</span>
                        </label>
                        <label class="flex items-center space-x-2 cursor-pointer">
                            <input class="form-radio text-blue-500" type="radio" name="pregunta-${pregunta._id}" 
                                   id="pregunta-${pregunta._id}-2" value="2">
                            <span class="text-gray-700">2 - Insatisfecho</span>
                        </label>
                        <label class="flex items-center space-x-2 cursor-pointer">
                            <input class="form-radio text-blue-500" type="radio" name="pregunta-${pregunta._id}" 
                                   id="pregunta-${pregunta._id}-3" value="3">
                            <span class="text-gray-700">3 - Neutral</span>
                        </label>
                        <label class="flex items-center space-x-2 cursor-pointer">
                            <input class="form-radio text-blue-500" type="radio" name="pregunta-${pregunta._id}" 
                                   id="pregunta-${pregunta._id}-4" value="4">
                            <span class="text-gray-700">4 - Satisfecho</span>
                        </label>
                        <label class="flex items-center space-x-2 cursor-pointer">
                            <input class="form-radio text-blue-500" type="radio" name="pregunta-${pregunta._id}" 
                                   id="pregunta-${pregunta._id}-5" value="5">
                            <span class="text-gray-700">5 - Muy satisfecho</span>
                        </label>
                    </div>
                </div>
            `;
        });
    
        body.innerHTML = html;
        
        // Remover listeners anteriores
        const nuevoBoton = btnEnviar.cloneNode(true);
        btnEnviar.parentNode.replaceChild(nuevoBoton, btnEnviar);
        
        // Agregar nuevo listener
        document.getElementById('btn-enviar-encuesta').addEventListener('click', function() {
            enviarEncuesta(tutoriaId, preguntas, sesion._id);
        });
        
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        
    } catch (error) {
        console.error('Error al abrir modal de encuesta:', error);
        mostrarNotificacion('Error', 'Error al cargar el formulario: ' + error.message, 'error');
    }
}

async function enviarEncuesta(tutoriaId, preguntas, estudianteId) {
    const errorDiv = document.getElementById('error-encuesta');
    const respuestas = {};
    let todasRespondidas = true;
    
    // Recopilar respuestas
    preguntas.forEach(pregunta => {
        const seleccionado = document.querySelector(`input[name="pregunta-${pregunta._id}"]:checked`);
        
        if (!seleccionado) {
            todasRespondidas = false;
        } else {
            respuestas[pregunta._id] = parseInt(seleccionado.value);
        }
    });
    
    // Validar que todas las preguntas estén respondidas
    if (!todasRespondidas) {
        errorDiv.textContent = 'Por favor, responde a todas las preguntas antes de enviar.';
        errorDiv.classList.remove('hidden');
        return;
    }
    
    try {
        // Guardar respuestas
        await APIClient.enviarRespuestas(tutoriaId, respuestas);
        
        mostrarNotificacion('Éxito', '¡Gracias por tu calificación! Tu opinión es muy importante.', 'success');
        cerrarModalEncuesta();
        await cargarSolicitudesEstudiante();
    } catch (error) {
        console.error('Error al enviar encuesta:', error);
        errorDiv.textContent = error.message || 'Error al enviar la encuesta';
        errorDiv.classList.remove('hidden');
    }
}

function cerrarModalEncuesta() {
    const modal = document.getElementById('modal-encuesta');
    const errorDiv = document.getElementById('error-encuesta');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    errorDiv.classList.add('hidden');
}

// Función auxiliar para formatear fechas
function formatearFecha(fecha) {
    if (!fecha) return '';
    
    // Si es un string ISO (de MongoDB)
    if (typeof fecha === 'string' && fecha.includes('T')) {
        const date = new Date(fecha);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }
    
    // Si es formato YYYY-MM-DD
    if (typeof fecha === 'string' && fecha.includes('-')) {
        const [year, month, day] = fecha.split('-');
        return `${day}/${month}/${year}`;
    }
    
    return fecha;
}

// Funciones para el modal de notificación
function mostrarNotificacion(titulo, mensaje, tipo = 'info') {
    const modal = document.getElementById('modal-notificacion');
    const tituloElement = document.getElementById('titulo-notificacion');
    const mensajeElement = document.getElementById('mensaje-notificacion');
    const iconoElement = document.getElementById('icono-notificacion');
    
    tituloElement.textContent = titulo;
    mensajeElement.textContent = mensaje;
    
    // Configurar icono según el tipo
    let iconoHTML = '';
    if (tipo === 'success') {
        iconoHTML = `
            <svg class="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
        `;
    } else if (tipo === 'error') {
        iconoHTML = `
            <svg class="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
        `;
    } else if (tipo === 'warning') {
        iconoHTML = `
            <svg class="w-12 h-12 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
        `;
    } else {
        iconoHTML = `
            <svg class="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
        `;
    }
    
    iconoElement.innerHTML = iconoHTML;
    modal.classList.remove('hidden');
}

function cerrarModalNotificacion() {
    const modal = document.getElementById('modal-notificacion');
    modal.classList.add('hidden');
}

// Event listener para cerrar modal con ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' || e.key === 'Esc') {
        const modalNotificacion = document.getElementById('modal-notificacion');
        if (modalNotificacion && !modalNotificacion.classList.contains('hidden')) {
            cerrarModalNotificacion();
        }
        
        const modalEncuesta = document.getElementById('modal-encuesta');
        if (modalEncuesta && modalEncuesta.classList.contains('flex')) {
            cerrarModalEncuesta();
        }
    }
});

