// Funcionalidad para la vista del Tutor

// HU-006: Registrar Tutoría
// HU-005: Filtro de solicitudes por estado

let filtroEstadoSolicitudes = 'Todas';
let filtroInicializadoTutor = false;

// Inicializar filtro de estado de solicitudes
function inicializarFiltroEstadoSolicitudes() {
    const filtroSelect = document.getElementById('filtro-estado-solicitudes');
    if (!filtroSelect) return;
    
    // Solo inicializar una vez
    if (filtroInicializadoTutor) {
        // Solo restaurar el valor
        filtroSelect.value = filtroEstadoSolicitudes;
        return;
    }

    // Restaurar el valor seleccionado
    filtroSelect.value = filtroEstadoSolicitudes;

    filtroSelect.addEventListener('change', async function() {
        filtroEstadoSolicitudes = this.value;
        const sesion = await obtenerSesion();
        await cargarTutoriasCreadas(sesion);
    });
    
    filtroInicializadoTutor = true;
}

function inicializarFormularioTutoria(sesion) {
    const form = document.getElementById('form-registrar-tutoria');
    const mensajeDiv = document.getElementById('mensaje-registro');
    const materiaSelect = document.getElementById('materia');

    // Cargar materias del tutor desde la API y poblar el select con nombre pero value=ID
    async function cargarMaterias() {
        materiaSelect.innerHTML = '<option value="">Selecciona una materia</option>';
        try {
            // Obtener todas las materias activas desde la colección
            const materiasDB = await APIClient.obtenerMaterias();
            
            // Obtener la sesión del usuario para filtrar sus materias
            const sesionResponse = await APIClient.getSession();
            const materiasTutor = sesionResponse.usuario.materias || [];
            
            // Filtrar materias que el tutor seleccionó durante el registro
            const materiasSeleccionadas = materiasDB.filter(materia => 
                materiasTutor.some(m => 
                    (m._id && m._id === materia._id) || (typeof m === 'string' && m === materia._id)
                )
            );
            
            if (materiasSeleccionadas.length === 0) {
                materiaSelect.innerHTML += '<option value="" disabled>No tienes materias asignadas</option>';
                return;
            }
            
            materiasSeleccionadas.forEach(materia => {
                const option = document.createElement('option');
                option.value = materia._id;
                option.textContent = materia.nombre;
                materiaSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error al cargar materias:', error);
            materiaSelect.innerHTML += '<option value="" disabled>Error al cargar materias</option>';
        }
    }
    cargarMaterias();

    // Validación en tiempo real de horas
    const horaInicioInput = document.getElementById('hora-inicio');
    const horaFinInput = document.getElementById('hora-fin');
    const mensajeHoras = document.createElement('div');
    mensajeHoras.className = 'mt-2 text-sm font-medium hidden';
    horaFinInput.parentElement.appendChild(mensajeHoras);

    function validarHoras() {
        const horaInicio = horaInicioInput.value;
        const horaFin = horaFinInput.value;

        if (!horaInicio || !horaFin) {
            mensajeHoras.classList.add('hidden');
            return true;
        }

        if (horaInicio >= horaFin) {
            mensajeHoras.textContent = '⚠️ La hora de fin debe ser mayor a la hora de inicio';
            mensajeHoras.className = 'mt-2 text-sm font-medium text-red-600';
            mensajeHoras.classList.remove('hidden');
            return false;
        } else {
            mensajeHoras.classList.add('hidden');
            return true;
        }
    }

    horaInicioInput.addEventListener('change', validarHoras);
    horaFinInput.addEventListener('change', validarHoras);

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Limpiar mensajes previos
        mensajeDiv.className = 'mensaje';
        mensajeDiv.textContent = '';
        mensajeDiv.style.display = 'none';

        // Obtener valores del formulario
        const materiaId = document.getElementById('materia').value;
        const fecha = document.getElementById('fecha').value;
        const horaInicio = document.getElementById('hora-inicio').value;
        const horaFin = document.getElementById('hora-fin').value;
        const cupos = parseInt(document.getElementById('cupos').value);

        // Validaciones personalizadas
        if (!materiaId) {
            mostrarMensaje(mensajeDiv, 'Selecciona un elemento de la lista', 'error');
            return;
        }

        if (!fecha) {
            mostrarMensaje(mensajeDiv, 'Completa este campo', 'error');
            return;
        }

        if (!horaInicio || !horaFin) {
            mostrarMensaje(mensajeDiv, 'Completa los campos de hora', 'error');
            return;
        }

        if (!cupos) {
            mostrarMensaje(mensajeDiv, 'Completa este campo', 'error');
            return;
        }

        // Validar que hora inicio sea menor que hora fin
        if (horaInicio >= horaFin) {
            mostrarMensaje(mensajeDiv, 'La hora de inicio debe ser menor que la hora de fin', 'error');
            return;
        }

        try {
            const tutoriaData = {
                materia: materiaId,
                fecha,
                horaInicio,
                horaFin,
                cupos
            };
            await APIClient.crearTutoria(tutoriaData);
            mostrarMensaje(mensajeDiv, 'Tutoría registrada exitosamente', 'exito');
            form.reset();
            await cargarTutoriasCreadas(sesion);
        } catch (error) {
            console.error('Error al crear tutoría:', error);
            mostrarMensaje(mensajeDiv, 'Error al registrar la tutoría: ' + error.message, 'error');
        }
    });
}

// Cargar y mostrar tutorías creadas por el tutor
async function cargarTutoriasCreadas(sesion) {
    const container = document.getElementById('tutoria-creadas-lista');
    const solicitudesContainer = document.getElementById('solicitudes-lista');
    
    if (!sesion) {
        sesion = await obtenerSesion();
    }
    
    console.log('Sesión en cargarTutoriasCreadas:', sesion);
    
    // Inicializar filtro
    inicializarFiltroEstadoSolicitudes();
    
    try {
        const tutorId = sesion?.userId || sesion?._id;
        
        if (!tutorId) {
            console.error('No se pudo obtener el ID del tutor de la sesión:', sesion);
            container.innerHTML = '<div class="text-center text-red-600 py-4">Error: No se pudo identificar al tutor</div>';
            return;
        }
        
        const response = await APIClient.getTutoriasTutor(tutorId);
        const tutorias = response.tutorias;

        if (tutorias.length === 0) {
            container.innerHTML = '<div class="text-center text-gray-600 py-8">No tiene tutorías creadas</div>';
            return;
        }

        // Generar tabla de tutorías
        let html = `
            <div class="overflow-x-auto">
                <table class="w-full bg-white border border-gray-200 text-xs table-fixed">
                    <thead class="bg-blue-100">
                        <tr>
                            <th class="px-2 py-2 text-left text-xs font-semibold text-gray-700 border-b" style="width: 6%;">ID</th>
                            <th class="px-2 py-2 text-left text-xs font-semibold text-gray-700 border-b" style="width: 12%;">Materia</th>
                            <th class="px-2 py-2 text-left text-xs font-semibold text-gray-700 border-b" style="width: 8%;">Fecha</th>
                            <th class="px-2 py-2 text-left text-xs font-semibold text-gray-700 border-b" style="width: 10%;">Estado de publicación</th>
                            <th class="px-2 py-2 text-center text-xs font-semibold text-gray-700 border-b" style="width: 7%;">Cupos Totales</th>
                            <th class="px-2 py-2 text-center text-xs font-semibold text-gray-700 border-b" style="width: 7%;">Cupos Aceptados</th>
                            <th class="px-2 py-2 text-center text-xs font-semibold text-gray-700 border-b" style="width: 9%;">Aula</th>
                            <th class="px-2 py-2 text-center text-xs font-semibold text-gray-700 border-b" style="width: 10%;">Publicar Tutoría</th>
                            <th class="px-2 py-2 text-center text-xs font-semibold text-gray-700 border-b" style="width: 10%;">Editar Tutoría</th>
                            <th class="px-2 py-2 text-center text-xs font-semibold text-gray-700 border-b" style="width: 9%;">Promedio Calificación</th>
                            <th class="px-2 py-2 text-center text-xs font-semibold text-gray-700 border-b" style="width: 12%;">Calificaciones</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        for (const tutoria of tutorias) {
            const solicitudesResponse = await APIClient.getSolicitudesTutoria(tutoria._id);
            const todasSolicitudes = solicitudesResponse.solicitudes;
            const cuposAceptados = todasSolicitudes.filter(s => s.estado === 'Aceptada').length;

            // Calcular promedio de calificación
            const promedioResponse = await APIClient.getPromedioTutoria(tutoria._id);
            const promedioCalificacion = promedioResponse.promedio || 0;

            // Determinar estado de publicación
            const estadoPublicacion = tutoria.publicada ? 'Publicada' : 'No Publicada';
            const estadoClass = tutoria.publicada ? 'text-green-700' : 'text-gray-500';

            // Mostrar el nombre legible de la materia
            const materiaNombre = tutoria.materiaNombre || tutoria.materia?.nombre || '[Sin materia]';

            html += `
                <tr class="border-b hover:bg-gray-50">
                    <td class="px-2 py-2 text-xs text-gray-700 truncate">${tutoria._id.substring(0, 7)}</td>
                    <td class="px-2 py-2 text-xs text-gray-700 truncate">${materiaNombre}</td>
                    <td class="px-2 py-2 text-xs text-gray-700 whitespace-nowrap">${formatearFecha(tutoria.fecha)}</td>
                    <td class="px-2 py-2 text-xs ${estadoClass} font-medium whitespace-nowrap">${estadoPublicacion}</td>
                    <td class="px-2 py-2 text-xs text-gray-700 text-center">${tutoria.cuposOriginales}</td>
                    <td class="px-2 py-2 text-xs text-gray-700 text-center">${cuposAceptados}</td>
                    <td class="px-2 py-2 text-center">
                        <a href="/aula.html?id=${tutoria._id}" 
                           class="inline-block bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs font-medium transition whitespace-nowrap">
                            Ir al Aula
                        </a>
                    </td>
                    <td class="px-2 py-2 text-center">
                        <button class="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs font-medium transition btn-publicar-tutoria whitespace-nowrap w-full" 
                                data-tutoria-id="${tutoria._id}"
                                data-publicada="${tutoria.publicada}">
                            ${tutoria.publicada ? 'Despublicar' : 'Publicar'}
                        </button>
                    </td>
                    <td class="px-2 py-2 text-center">
                        <button class="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs font-medium transition btn-editar-tutoria whitespace-nowrap w-full" 
                                data-tutoria-id="${tutoria._id}" 
                                data-materia="${tutoria.materia._id || tutoria.materia}" 
                                data-materia-nombre="${tutoria.materia.nombre || tutoria.materiaNombre || tutoria.materia}" 
                                data-fecha="${tutoria.fecha}" 
                                data-hora-inicio="${tutoria.horaInicio}" 
                                data-hora-fin="${tutoria.horaFin}" 
                                data-cupos="${tutoria.cuposOriginales}">
                            Editar
                        </button>
                    </td>
                    <td class="px-2 py-2 text-xs text-gray-700 text-center">${promedioCalificacion > 0 ? promedioCalificacion.toFixed(1) : '0'}</td>
                    <td class="px-2 py-2 text-center">
                        <button class="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs font-medium transition btn-ver-respuestas whitespace-nowrap w-full" 
                                data-tutoria-id="${tutoria._id}" 
                                data-materia="${tutoria.materia}">
                            Ver Respuestas
                        </button>
                    </td>
                </tr>
            `;
        }

        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        container.innerHTML = html;
        
        // Cargar todas las solicitudes
        await cargarTodasSolicitudes(tutorias);
        
        // Agregar event listeners
        agregarEventListenersVerRespuestas();
        agregarEventListenersEditarEliminar();
        
    } catch (error) {
        console.error('Error al cargar tutorías:', error);
        container.innerHTML = '<div class="text-center text-red-600 py-4">Error al cargar tutorías</div>';
    }
}

// Cargar todas las solicitudes de todas las tutorías
async function cargarTodasSolicitudes(tutorias) {
    const solicitudesContainer = document.getElementById('solicitudes-lista');
    
    try {
        let todasLasSolicitudes = [];
        
        for (const tutoria of tutorias) {
            const solicitudesResponse = await APIClient.getSolicitudesTutoria(tutoria._id);
            const solicitudes = solicitudesResponse.solicitudes.map(s => ({
                ...s,
                tutoriaMateria: tutoria.materia,
                tutoriaId: tutoria._id,
                cuposDisponibles: tutoria.cuposDisponibles
            }));
            todasLasSolicitudes = todasLasSolicitudes.concat(solicitudes);
        }
        
        // Aplicar filtro
        let solicitudesFiltradas = todasLasSolicitudes;
        if (filtroEstadoSolicitudes && filtroEstadoSolicitudes !== 'Todas') {
            solicitudesFiltradas = todasLasSolicitudes.filter(s => s.estado === filtroEstadoSolicitudes);
        }
        
        if (solicitudesFiltradas.length === 0) {
            solicitudesContainer.innerHTML = '<div class="text-center text-gray-600 py-8">No hay solicitudes con el filtro seleccionado</div>';
            return;
        }
        
        // Generar tabla de solicitudes
        let html = `
            <div class="overflow-x-auto">
                <table class="min-w-full bg-white border border-gray-200 text-xs">
                    <thead class="bg-gray-100">
                        <tr>
                            <th class="px-2 py-2 text-left text-xs font-semibold text-gray-700 border-b">ID Solicitud</th>
                            <th class="px-2 py-2 text-left text-xs font-semibold text-gray-700 border-b">Materia</th>
                            <th class="px-2 py-2 text-left text-xs font-semibold text-gray-700 border-b">Alumno</th>
                            <th class="px-2 py-2 text-center text-xs font-semibold text-gray-700 border-b">Estado</th>
                            <th class="px-2 py-2 text-center text-xs font-semibold text-gray-700 border-b">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        solicitudesFiltradas.forEach(solicitud => {
            // Si tutoriaMateria es un objeto, mostrar su nombre, si no, mostrar el valor directo
            let materiaNombre = '';
            if (solicitud.tutoriaMateria && typeof solicitud.tutoriaMateria === 'object') {
                materiaNombre = solicitud.tutoriaMateria.nombre || '[Sin materia]';
            } else {
                materiaNombre = solicitud.tutoriaMateria || '[Sin materia]';
            }
            html += `
                <tr class="border-b hover:bg-gray-50">
                    <td class="px-2 py-2 text-xs text-gray-700">${solicitud._id.substring(0, 6)}...</td>
                    <td class="px-2 py-2 text-xs text-gray-700">${materiaNombre}</td>
                    <td class="px-2 py-2 text-xs text-gray-700">${solicitud.estudianteNombre}</td>
                    <td class="px-2 py-2 text-center">
                        <span class="text-xs text-gray-700">${solicitud.estado}</span>
                    </td>
                    <td class="px-2 py-2 text-center">
                        <button class="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs font-medium transition mr-1 btn-aceptar" 
                                data-solicitud-id="${solicitud._id}"
                                ${solicitud.cuposDisponibles === 0 && solicitud.estado !== 'Aceptada' ? 'disabled' : ''}>
                            Aceptar
                        </button>
                        <button class="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs font-medium transition btn-rechazar" 
                                data-solicitud-id="${solicitud._id}">
                            Rechazar
                        </button>
                    </td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        solicitudesContainer.innerHTML = html;
        
        // Agregar event listeners para gestión de solicitudes
        agregarEventListenersGestionSolicitudes();
        
    } catch (error) {
        console.error('Error al cargar solicitudes:', error);
        solicitudesContainer.innerHTML = '<div class="text-center text-red-600 py-4">Error al cargar solicitudes</div>';
    }
}

// HU-004: Gestión de solicitudes de tutoría
function generarHTMLSolicitudesTutoria(solicitudes, tutoria) {
    if (solicitudes.length === 0) {
        return '<div class="alert alert-info">No hay solicitudes para esta tutoría</div>';
    }

    let html = `
        <table class="table table-sm table-bordered mb-0">
            <thead class="table-light">
                <tr>
                    <th>Estudiante</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    solicitudes.forEach(solicitud => {
        const puedeAceptar = tutoria.cuposDisponibles > 0 || solicitud.estado === 'Aceptada';
        const estadoBadge = solicitud.estado === 'Aceptada' ? 'bg-success' : solicitud.estado === 'Rechazada' ? 'bg-danger' : 'bg-warning';
        
        html += `
            <tr>
                <td>${solicitud.estudianteNombre}</td>
                <td><span class="badge ${estadoBadge}">${solicitud.estado}</span></td>
                <td>
                    ${puedeAceptar ? `
                        <button class="btn btn-sm btn-success btn-aceptar" data-solicitud-id="${solicitud._id}" ${tutoria.cuposDisponibles === 0 && solicitud.estado !== 'Aceptada' ? 'disabled' : ''}>
                            Aceptar
                        </button>
                    ` : `
                        <button class="btn btn-sm btn-success" disabled title="Sin cupos disponibles">
                            Aceptar
                        </button>
                    `}
                    <button class="btn btn-sm btn-danger btn-rechazar" data-solicitud-id="${solicitud._id}">
                        Rechazar
                    </button>
                </td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    return html;
}

function agregarEventListenersGestionSolicitudes() {
    // Botones de aceptar
    document.querySelectorAll('.btn-aceptar').forEach(btn => {
        btn.addEventListener('click', async function() {
            const solicitudId = this.dataset.solicitudId;

            try {
                await APIClient.aceptarSolicitud(solicitudId);
                const sesion = await obtenerSesion();
                await cargarTutoriasCreadas(sesion);
                if (typeof cargarSolicitudesEstudiante !== 'undefined') {
                    await cargarSolicitudesEstudiante();
                }
                if (typeof cargarTutoriasDisponibles !== 'undefined') {
                    await cargarTutoriasDisponibles();
                }
            } catch (error) {
                console.error('Error al aceptar solicitud:', error);
                mostrarNotificacion('Error', 'Error al aceptar solicitud: ' + error.message, 'error');
            }
        });
    });

    // Botones de rechazar
    document.querySelectorAll('.btn-rechazar').forEach(btn => {
        btn.addEventListener('click', async function() {
            const solicitudId = this.dataset.solicitudId;

            try {
                await APIClient.rechazarSolicitudTutoria(solicitudId);
                const sesion = await obtenerSesion();
                await cargarTutoriasCreadas(sesion);
                if (typeof cargarSolicitudesEstudiante !== 'undefined') {
                    await cargarSolicitudesEstudiante();
                }
                if (typeof cargarTutoriasDisponibles !== 'undefined') {
                    await cargarTutoriasDisponibles();
                }
            } catch (error) {
                console.error('Error al rechazar solicitud:', error);
                mostrarNotificacion('Error', 'Error al rechazar solicitud: ' + error.message, 'error');
            }
        });
    });
}

// HU-008: Ver respuestas de encuestas
function agregarEventListenersVerRespuestas() {
    document.querySelectorAll('.btn-ver-respuestas').forEach(btn => {
        btn.addEventListener('click', function() {
            const tutoriaId = parseInt(this.dataset.tutoriaId);
            const materia = this.dataset.materia;
            mostrarModalRespuestas(tutoriaId, materia);
        });
    });
}

async function mostrarModalRespuestas(tutoriaId, materia) {
    try {
        const preguntasResponse = await APIClient.getPreguntasPorMateria(materia);
        const preguntas = preguntasResponse.preguntas;
        
        if (preguntas.length === 0) {
            mostrarNotificacion('Información', 'No hay preguntas configuradas para esta materia', 'info');
            return;
        }
        
        // Intentar obtener promedios, si falla mostrar mensaje sin respuestas
        let promediosPorPregunta = {};
        try {
            const promediosResponse = await APIClient.getPromediosPorPregunta(tutoriaId);
            promediosPorPregunta = promediosResponse.promedios || {};
        } catch (error) {
            console.warn('No se pudieron cargar los promedios:', error);
            // Continuar sin promedios
        }
        
        // Verificar si hay respuestas
        const hayRespuestas = Object.keys(promediosPorPregunta).length > 0;
        
        let html = `
            <div class="modal" id="modal-respuestas" style="display: block;">
                <div class="modal-content">
                    <span class="close" onclick="cerrarModalRespuestas()">&times;</span>
                    <h2>Respuestas de la Encuesta - ${materia}</h2>
                    <div class="modal-body">
        `;
        
        if (!hayRespuestas) {
            html += `
                <div class="alert alert-info">
                    <p><strong>Aún no se ha evaluado la tutoría</strong></p>
                    <p>Los estudiantes podrán calificar esta tutoría una vez que finalice.</p>
                </div>
            `;
        } else {
            html += `
                <h3>Promedio de Calificaciones por Pregunta</h3>
                <div class="tutoria-lista">
            `;
            
            preguntas.forEach(pregunta => {
                const promedio = promediosPorPregunta[pregunta._id] || 0;
                const badgeClass = obtenerClasePromedio(parseFloat(promedio));
                
                html += `
                    <div class="pregunta-item">
                        <p><strong>Pregunta:</strong> ${pregunta.pregunta}</p>
                        <p><strong>Promedio:</strong> <span class="promedio-badge ${badgeClass}">${typeof promedio === 'number' ? promedio.toFixed(1) : promedio}/5</span></p>
                    </div>
                `;
            });
            
            html += `</div>`;
        }
        
        html += `
                    </div>
                </div>
            </div>
        `;
        
        // Insertar modal en el body
        const modalDiv = document.createElement('div');
        modalDiv.innerHTML = html;
        document.body.appendChild(modalDiv);
        
    } catch (error) {
        console.error('Error al cargar respuestas:', error);
        mostrarNotificacion('Error', 'Error al cargar las preguntas de la encuesta', 'error');
    }
}

function cerrarModalRespuestas() {
    const modal = document.getElementById('modal-respuestas');
    if (modal && modal.parentElement) {
        modal.parentElement.remove();
    }
}

function obtenerClasePromedio(promedio) {
    if (promedio >= 4.5) return 'promedio-excelente';
    if (promedio >= 3.5) return 'promedio-bueno';
    if (promedio >= 2.5) return 'promedio-neutral';
    return 'promedio-bajo';
}

function obtenerClasePromedioBadge(promedio) {
    if (promedio >= 4.5) return 'bg-success';
    if (promedio >= 3.5) return 'bg-primary';
    if (promedio >= 2.5) return 'bg-warning';
    return 'bg-danger';
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

function mostrarMensaje(elemento, mensaje, tipo) {
    if (tipo === 'exito') {
        elemento.className = 'alert alert-success';
    } else if (tipo === 'error') {
        elemento.className = 'alert alert-danger';
    } else {
        elemento.className = 'alert alert-info';
    }
    elemento.textContent = mensaje;
    elemento.style.display = 'block';
    
    // Ocultar mensaje después de 5 segundos
    setTimeout(() => {
        elemento.style.display = 'none';
    }, 5000);
}

// Funciones para editar y eliminar tutorías
let tutoriaIdAEliminar = null;

function agregarEventListenersEditarEliminar() {
    // Botones de publicar
    document.querySelectorAll('.btn-publicar-tutoria').forEach(btn => {
        btn.addEventListener('click', async function() {
            const tutoriaId = this.dataset.tutoriaId;
            try {
                const response = await APIClient.publicarTutoria(tutoriaId);
                if (response.success) {
                    // Recargar la lista de tutorías
                    await cargarTutoriasCreadas();
                    mostrarMensaje(document.getElementById('mensaje-registro') || document.createElement('div'), 
                        response.message, 'exito');
                } else {
                    mostrarMensaje(document.getElementById('mensaje-registro') || document.createElement('div'), 
                        response.message, 'error');
                }
            } catch (error) {
                console.error('Error al publicar tutoría:', error);
                mostrarMensaje(document.getElementById('mensaje-registro') || document.createElement('div'), 
                    'Error al cambiar estado de publicación', 'error');
            }
        });
    });

    // Botones de editar
    document.querySelectorAll('.btn-editar-tutoria').forEach(btn => {
        btn.addEventListener('click', function() {
            const tutoriaId = this.dataset.tutoriaId;
            const materia = this.dataset.materia;
            const materiaNombre = this.dataset.materiaNombre;
            const fecha = this.dataset.fecha;
            const horaInicio = this.dataset.horaInicio;
            const horaFin = this.dataset.horaFin;
            const cupos = this.dataset.cupos;
            
            mostrarModalEditarTutoria(tutoriaId, materia, fecha, horaInicio, horaFin, cupos, materiaNombre);
        });
    });

    // Botones de eliminar
    document.querySelectorAll('.btn-eliminar-tutoria').forEach(btn => {
        btn.addEventListener('click', function() {
            const tutoriaId = this.dataset.tutoriaId;
            const materia = this.dataset.materia;
            
            mostrarModalConfirmarEliminar(tutoriaId, materia);
        });
    });
}

function mostrarModalEditarTutoria(tutoriaId, materia, fecha, horaInicio, horaFin, cupos) {
    document.getElementById('editar-tutoria-id').value = tutoriaId;
    // materia es el ID, materiaNombre es el nombre
    const materiaInput = document.getElementById('editar-materia');
    const materiaNombre = arguments.length > 6 ? arguments[6] : (arguments.length > 5 ? arguments[5] : '');
    if (materiaInput) {
        materiaInput.value = materiaNombre || materia; // Mostrar el nombre si está disponible
    }
    // Si existe un campo oculto para el ID, lo llenamos también
    const materiaIdInput = document.getElementById('editar-materia-id');
    if (materiaIdInput) {
        materiaIdInput.value = materia;
    }
    // Formatear fecha para input type="date" (YYYY-MM-DD)
    const fechaObj = new Date(fecha);
    const fechaFormateada = fechaObj.toISOString().split('T')[0];
    document.getElementById('editar-fecha').value = fechaFormateada;
    document.getElementById('editar-hora-inicio').value = horaInicio;
    document.getElementById('editar-hora-fin').value = horaFin;
    document.getElementById('editar-cupos').value = cupos;
    const modal = document.getElementById('modal-editar-tutoria');
    modal.classList.remove('hidden');
}

function cerrarModalEditarTutoria() {
    const modal = document.getElementById('modal-editar-tutoria');
    modal.classList.add('hidden');
}

function mostrarModalConfirmarEliminar(tutoriaId, materia) {
    tutoriaIdAEliminar = tutoriaId;
    document.getElementById('eliminar-materia-nombre').textContent = materia;
    const modal = document.getElementById('modal-confirmar-eliminar');
    modal.classList.remove('hidden');
}

function cerrarModalConfirmarEliminar() {
    tutoriaIdAEliminar = null;
    const modal = document.getElementById('modal-confirmar-eliminar');
    modal.classList.add('hidden');
}

// Event listener para el formulario de editar
document.addEventListener('DOMContentLoaded', function() {
    const formEditar = document.getElementById('form-editar-tutoria');
    if (formEditar) {
        formEditar.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const tutoriaId = document.getElementById('editar-tutoria-id').value;
            const fecha = document.getElementById('editar-fecha').value;
            const horaInicio = document.getElementById('editar-hora-inicio').value;
            const horaFin = document.getElementById('editar-hora-fin').value;
            const cupos = parseInt(document.getElementById('editar-cupos').value);
            
            // Validar que hora inicio < hora fin
            if (horaInicio >= horaFin) {
                mostrarNotificacion('Advertencia', 'La hora de inicio debe ser menor que la hora de fin', 'warning');
                return;
            }
            
            try {
                await APIClient.actualizarTutoria(tutoriaId, {
                    fecha,
                    horaInicio,
                    horaFin,
                    cupos
                });
                
            
            cerrarModalEditarTutoria();
            const sesion = await obtenerSesion();
            await cargarTutoriasCreadas(sesion);
            mostrarNotificacion('Éxito', 'Tutoría actualizada exitosamente', 'success');
        } catch (error) {
            console.error('Error al actualizar tutoría:', error);
            mostrarNotificacion('Error', 'Error al actualizar tutoría: ' + error.message, 'error');
        }
    });
}    const btnConfirmarEliminar = document.getElementById('btn-confirmar-eliminar');
    if (btnConfirmarEliminar) {
        btnConfirmarEliminar.addEventListener('click', async function() {
            if (!tutoriaIdAEliminar) return;
            
            try {
                await APIClient.eliminarTutoria(tutoriaIdAEliminar);
                
                cerrarModalConfirmarEliminar();
                const sesion = await obtenerSesion();
                await cargarTutoriasCreadas(sesion);
                mostrarNotificacion('Éxito', 'Tutoría eliminada exitosamente', 'success');
            } catch (error) {
                console.error('Error al eliminar tutoría:', error);
                mostrarNotificacion('Error', 'Error al eliminar tutoría: ' + error.message, 'error');
            }
        });
    }
});

// Funciones para navegación entre vistas
function mostrarVistaHome() {
    document.getElementById('vista-home').classList.remove('hidden');
    document.getElementById('vista-registrar').classList.add('hidden');
    document.getElementById('vista-tutorias').classList.add('hidden');
}

function mostrarVistaRegistro() {
    document.getElementById('vista-home').classList.add('hidden');
    document.getElementById('vista-registrar').classList.remove('hidden');
    document.getElementById('vista-tutorias').classList.add('hidden');
    generarOpcionesHora();
}

async function mostrarVistaTutorias() {
    document.getElementById('vista-home').classList.add('hidden');
    document.getElementById('vista-registrar').classList.add('hidden');
    document.getElementById('vista-tutorias').classList.remove('hidden');
    const sesion = await obtenerSesion();
    await cargarTutoriasCreadas(sesion);
}

// Generar opciones de hora para los selectores
function generarOpcionesHora() {
    const horaInicio = document.getElementById('hora-inicio');
    const horaFin = document.getElementById('hora-fin');
    
    if (horaInicio.options.length <= 1) {
        for (let h = 0; h < 24; h++) {
            for (let m = 0; m < 60; m += 30) {
                const hora = String(h).padStart(2, '0');
                const minuto = String(m).padStart(2, '0');
                const tiempo = `${hora}:${minuto}`;
                
                horaInicio.innerHTML += `<option value="${tiempo}">${tiempo}</option>`;
                horaFin.innerHTML += `<option value="${tiempo}">${tiempo}</option>`;
            }
        }
    }
}

// Event listener para cerrar modales con la tecla ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' || e.key === 'Esc') {
        // Cerrar modal de editar tutoría si está abierto
        const modalEditar = document.getElementById('modal-editar-tutoria');
        if (modalEditar && !modalEditar.classList.contains('hidden')) {
            cerrarModalEditarTutoria();
        }
        
        // Cerrar modal de confirmar eliminar si está abierto
        const modalEliminar = document.getElementById('modal-confirmar-eliminar');
        if (modalEliminar && !modalEliminar.classList.contains('hidden')) {
            cerrarModalConfirmarEliminar();
        }
        
        // Cerrar modal de notificación si está abierto
        const modalNotificacion = document.getElementById('modal-notificacion');
        if (modalNotificacion && !modalNotificacion.classList.contains('hidden')) {
            cerrarModalNotificacion();
        }
    }
});

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
