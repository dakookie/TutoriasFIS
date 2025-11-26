// Funcionalidad para la vista del Tutor

// HU-006: Registrar Tutoría
// HU-005: Filtro de solicitudes por estado

let filtroEstadoSolicitudes = 'Todas';

// Inicializar filtro de estado de solicitudes
function inicializarFiltroEstadoSolicitudes() {
    const filtroSelect = document.getElementById('filtro-estado-solicitudes');
    if (!filtroSelect) return;

    filtroSelect.addEventListener('change', function() {
        filtroEstadoSolicitudes = this.value;
        const sesion = obtenerSesion();
        cargarTutoriasCreadas(sesion);
    });
}

function inicializarFormularioTutoria(sesion) {
    const form = document.getElementById('form-registrar-tutoria');
    const mensajeDiv = document.getElementById('mensaje-registro');
    const materiaSelect = document.getElementById('materia');

    // Cargar solo las materias que el tutor puede impartir
    if (sesion && sesion.materias && sesion.materias.length > 0) {
        materiaSelect.innerHTML = '<option value="">Selecciona una materia</option>';
        sesion.materias.forEach(materia => {
            const option = document.createElement('option');
            option.value = materia;
            option.textContent = materia;
            materiaSelect.appendChild(option);
        });
    }

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Limpiar mensajes previos
        mensajeDiv.className = 'mensaje';
        mensajeDiv.textContent = '';
        mensajeDiv.style.display = 'none';

        // Obtener valores del formulario
        const materia = document.getElementById('materia').value;
        const fecha = document.getElementById('fecha').value;
        const horaInicio = document.getElementById('hora-inicio').value;
        const horaFin = document.getElementById('hora-fin').value;
        const cupos = document.getElementById('cupos').value;

        // Validaciones personalizadas
        if (!materia) {
            mostrarMensaje(mensajeDiv, 'Selecciona un elemento de la lista', 'error');
            return;
        }

        if (!fecha) {
            mostrarMensaje(mensajeDiv, 'Completa este campo', 'error');
            return;
        }

        if (!cupos) {
            mostrarMensaje(mensajeDiv, 'Completa este campo', 'error');
            return;
        }

        // Validar que hora inicio y fin no sean iguales
        if (horaInicio === horaFin) {
            mostrarMensaje(mensajeDiv, 'La hora de inicio no puede ser igual a la hora de fin', 'error');
            return;
        }

        // Validar que hora inicio sea menor que hora fin
        if (horaInicio >= horaFin) {
            mostrarMensaje(mensajeDiv, 'La hora de inicio debe ser menor que la hora de fin', 'error');
            return;
        }

        // Crear tutoría con el nombre del tutor de la sesión
        const tutoria = {
            materia,
            fecha,
            horaInicio,
            horaFin,
            cuposDisponibles: cupos,
            tutorNombre: `${sesion.nombre} ${sesion.apellido}`,
            tutorId: sesion.id
        };

        const tutoriaCreada = db.crearTutoria(tutoria);

        if (tutoriaCreada) {
            mostrarMensaje(mensajeDiv, 'Tutoría registrada exitosamente', 'exito');
            form.reset();
            cargarTutoriasCreadas(sesion);
            // Si estamos en vista estudiante, actualizar también
            cargarTutoriasDisponibles();
        } else {
            mostrarMensaje(mensajeDiv, 'Error al registrar la tutoría', 'error');
        }
    });
}

// Cargar y mostrar tutorías creadas por el tutor
function cargarTutoriasCreadas(sesion) {
    const container = document.getElementById('tutoria-creadas-lista');
    
    if (!sesion) {
        sesion = obtenerSesion();
    }
    
    // Inicializar filtro
    inicializarFiltroEstadoSolicitudes();
    
    const tutorias = db.obtenerTutorias().filter(t => t.tutorId === sesion.id);

    if (tutorias.length === 0) {
        container.innerHTML = '<div class="alert alert-warning text-center">No tiene tutorías creadas</div>';
        return;
    }

    let html = '<table class="table table-striped table-bordered table-hover"><thead><tr><th>ID</th><th>Materia</th><th>Fecha</th><th>Hora Inicio</th><th>Hora Fin</th><th>Cupos</th><th>Promedio</th><th>Acciones</th></tr></thead><tbody>';
    
    tutorias.forEach(tutoria => {
        let solicitudes = db.obtenerSolicitudesPorTutoria(tutoria.id);
        
        // Aplicar filtro de estado (HU-005)
        if (filtroEstadoSolicitudes && filtroEstadoSolicitudes !== 'Todas') {
            solicitudes = solicitudes.filter(s => s.estado === filtroEstadoSolicitudes);
        }
        
        // Calcular promedio de calificación (HU-008)
        const promedioCalificacion = db.calcularPromedioCalificacion(tutoria.id);
        const badgeClass = obtenerClasePromedioBadge(parseFloat(promedioCalificacion));
        
        html += `
            <tr>
                <td>${tutoria.id}</td>
                <td>${tutoria.materia}</td>
                <td>${formatearFecha(tutoria.fecha)}</td>
                <td>${tutoria.horaInicio}</td>
                <td>${tutoria.horaFin}</td>
                <td>${tutoria.cuposDisponibles}/${tutoria.cuposOriginales}</td>
                <td><span class="badge ${badgeClass}">${promedioCalificacion > 0 ? promedioCalificacion + '/5' : 'Sin calif.'}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary btn-ver-respuestas" data-tutoria-id="${tutoria.id}" data-materia="${tutoria.materia}">
                        Ver Respuestas
                    </button>
                </td>
            </tr>
        `;
        
        // Agregar solicitudes como filas adicionales si existen
        if (solicitudes.length > 0) {
            html += `<tr><td colspan="8" class="p-0"><div class="p-3 bg-light"><h6 class="mb-3">Solicitudes Recibidas ${filtroEstadoSolicitudes !== 'Todas' ? '(' + filtroEstadoSolicitudes + ')' : ''}</h6>${generarHTMLSolicitudesTutoria(solicitudes, tutoria)}</div></td></tr>`;
        } else {
            html += `<tr><td colspan="8" class="text-center text-muted"><small>No tienes solicitudes ${filtroEstadoSolicitudes !== 'Todas' ? filtroEstadoSolicitudes.toLowerCase() + 's' : ''} por revisar</small></td></tr>`;
        }
    });

    html += '</tbody></table>';
    container.innerHTML = html;

    // Agregar event listeners para los botones
    agregarEventListenersGestionSolicitudes();
    agregarEventListenersVerRespuestas();
}

// HU-004: Gestión de solicitudes de tutoría
function generarHTMLSolicitudesTutoria(solicitudes, tutoria) {
    if (solicitudes.length === 0) {
        return '<div class="alert alert-info">No hay solicitudes para esta tutoría</div>';
    }

    let html = '<table class="table table-sm table-bordered mb-0"><thead class="table-light"><tr><th>ID</th><th>Estudiante</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>';
    
    solicitudes.forEach(solicitud => {
        const puedeAceptar = tutoria.cuposDisponibles > 0 || solicitud.estado === 'Aceptada';
        const estadoBadge = solicitud.estado === 'Aceptada' ? 'bg-success' : solicitud.estado === 'Rechazada' ? 'bg-danger' : 'bg-warning';
        
        html += `
            <tr>
                <td>${solicitud.id}</td>
                <td>${solicitud.estudiante}</td>
                <td><span class="badge ${estadoBadge}">${solicitud.estado}</span></td>
                <td>
                    ${puedeAceptar ? `
                        <button class="btn btn-sm btn-success btn-aceptar" data-solicitud-id="${solicitud.id}">
                            Aceptar
                        </button>
                    ` : ''}
                    <button class="btn btn-sm btn-danger btn-rechazar" data-solicitud-id="${solicitud.id}">
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
        btn.addEventListener('click', function() {
            const solicitudId = parseInt(this.dataset.solicitudId);
            const solicitud = db.obtenerSolicitudPorId(solicitudId);
            const tutoria = db.obtenerTutoriasPorId(solicitud.tutoriaId);

            // Verificar cupos disponibles
            if (tutoria.cuposDisponibles > 0 || solicitud.estado === 'Aceptada') {
                db.actualizarEstadoSolicitud(solicitudId, 'Aceptada');
                const sesion = obtenerSesion();
                cargarTutoriasCreadas(sesion);
                cargarSolicitudesEstudiante();
                cargarTutoriasDisponibles();
            }
        });
    });

    // Botones de rechazar
    document.querySelectorAll('.btn-rechazar').forEach(btn => {
        btn.addEventListener('click', function() {
            const solicitudId = parseInt(this.dataset.solicitudId);
            db.actualizarEstadoSolicitud(solicitudId, 'Rechazada');
            const sesion = obtenerSesion();
            cargarTutoriasCreadas(sesion);
            cargarSolicitudesEstudiante();
            cargarTutoriasDisponibles();
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

function mostrarModalRespuestas(tutoriaId, materia) {
    const preguntas = db.obtenerPreguntasPorMateria(materia);
    const promediosPorPregunta = db.calcularPromediosPorPregunta(tutoriaId);
    
    if (preguntas.length === 0) {
        alert('No hay preguntas configuradas para esta materia');
        return;
    }
    
    if (Object.keys(promediosPorPregunta).length === 0) {
        alert('No se encontraron calificaciones para las preguntas de esta tutoría.');
        return;
    }
    
    let html = `
        <div class="modal" id="modal-respuestas" style="display: block;">
            <div class="modal-content">
                <span class="close" onclick="cerrarModalRespuestas()">&times;</span>
                <h2>Respuestas de la Encuesta - ${materia}</h2>
                <div class="modal-body">
                    <h3>Promedio de Calificaciones por Pregunta</h3>
                    <div class="tutoria-lista">
    `;
    
    preguntas.forEach(pregunta => {
        const promedio = promediosPorPregunta[pregunta.id] || 0;
        const badgeClass = obtenerClasePromedio(parseFloat(promedio));
        
        html += `
            <div class="pregunta-item">
                <p><strong>Pregunta:</strong> ${pregunta.pregunta}</p>
                <p><strong>Promedio:</strong> <span class="promedio-badge ${badgeClass}">${promedio}/5</span></p>
            </div>
        `;
    });
    
    html += `
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Insertar modal en el body
    const modalDiv = document.createElement('div');
    modalDiv.innerHTML = html;
    document.body.appendChild(modalDiv);
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
    const [year, month, day] = fecha.split('-');
    return `${day}/${month}/${year}`;
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
