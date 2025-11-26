// Funcionalidad para la vista del Tutor

// HU-006: Registrar Tutoría
// HU-005: Filtro de solicitudes por estado

let filtroEstadoSolicitudes = 'Todas';

// Inicializar filtro de estado de solicitudes
function inicializarFiltroEstadoSolicitudes() {
    const filtroSelect = document.getElementById('filtro-estado-solicitudes');
    if (!filtroSelect) return;

    filtroSelect.addEventListener('change', async function() {
        filtroEstadoSolicitudes = this.value;
        const sesion = await obtenerSesion();
        await cargarTutoriasCreadas(sesion);
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

    form.addEventListener('submit', async function(e) {
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
        const cupos = parseInt(document.getElementById('cupos').value);

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

        try {
            const tutoriaData = {
                materia,
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
    
    if (!sesion) {
        sesion = await obtenerSesion();
    }
    
    console.log('Sesión en cargarTutoriasCreadas:', sesion);
    
    // Inicializar filtro
    inicializarFiltroEstadoSolicitudes();
    
    try {
        // Usar userId en lugar de _id
        const tutorId = sesion?.userId || sesion?._id;
        
        if (!tutorId) {
            console.error('No se pudo obtener el ID del tutor de la sesión:', sesion);
            container.innerHTML = '<div class="alert alert-danger">Error: No se pudo identificar al tutor</div>';
            return;
        }
        
        const response = await APIClient.getTutoriasTutor(tutorId);
        const tutorias = response.tutorias;

        if (tutorias.length === 0) {
            container.innerHTML = '<div class="alert alert-warning text-center">No tiene tutorías creadas</div>';
            return;
        }

        let html = '<table class="table table-striped table-bordered table-hover"><thead><tr><th>Materia</th><th>Fecha</th><th>Hora Inicio</th><th>Hora Fin</th><th>Cupos</th><th>Promedio</th><th>Aula</th><th>Encuesta</th><th>Acciones</th></tr></thead><tbody>';
        
        let hayTutoriasConSolicitudes = false;
        
        for (const tutoria of tutorias) {
            const solicitudesResponse = await APIClient.getSolicitudesTutoria(tutoria._id);
            let solicitudesSinFiltro = solicitudesResponse.solicitudes;
            let solicitudes = solicitudesSinFiltro;
            
            // Aplicar filtro de estado (HU-005)
            if (filtroEstadoSolicitudes && filtroEstadoSolicitudes !== 'Todas') {
                solicitudes = solicitudesSinFiltro.filter(s => s.estado === filtroEstadoSolicitudes);
            }
            
            // Si hay al menos una solicitud que cumple el filtro
            if (solicitudes.length > 0 || filtroEstadoSolicitudes === 'Todas') {
                hayTutoriasConSolicitudes = true;
                
                // Calcular promedio de calificación (HU-008)
                const promedioResponse = await APIClient.getPromedioTutoria(tutoria._id);
                const promedioCalificacion = promedioResponse.promedio || 0;
                const badgeClass = obtenerClasePromedioBadge(parseFloat(promedioCalificacion));
                
                html += `
                    <tr>
                        <td>${tutoria.materia}</td>
                        <td>${formatearFecha(tutoria.fecha)}</td>
                        <td>${tutoria.horaInicio}</td>
                        <td>${tutoria.horaFin}</td>
                        <td>${tutoria.cuposDisponibles}/${tutoria.cuposOriginales}</td>
                        <td><span class="badge ${badgeClass}">${promedioCalificacion > 0 ? promedioCalificacion.toFixed(1) + '/5' : 'Sin calif.'}</span></td>
                        <td>
                            <a href="/aula.html?id=${tutoria._id}" class="btn btn-sm btn-success">
                                <i class="bi bi-door-open"></i> Ir al Aula
                            </a>
                        </td>
                        <td>
                            <button class="btn btn-sm btn-primary btn-ver-respuestas" data-tutoria-id="${tutoria._id}" data-materia="${tutoria.materia}">
                                <i class="bi bi-eye"></i> Ver Respuestas
                            </button>
                        </td>
                        <td>
                            <button class="btn btn-sm btn-warning btn-editar-tutoria" data-tutoria-id="${tutoria._id}" data-materia="${tutoria.materia}" data-fecha="${tutoria.fecha}" data-hora-inicio="${tutoria.horaInicio}" data-hora-fin="${tutoria.horaFin}" data-cupos="${tutoria.cuposOriginales}">
                                <i class="bi bi-pencil"></i> Editar
                            </button>
                            <button class="btn btn-sm btn-danger btn-eliminar-tutoria" data-tutoria-id="${tutoria._id}" data-materia="${tutoria.materia}">
                                <i class="bi bi-trash"></i> Eliminar
                            </button>
                        </td>
                    </tr>
                `;
            
                // Agregar solicitudes como filas adicionales si existen
                if (solicitudes.length > 0) {
                    html += `<tr><td colspan="9" class="p-0"><div class="p-3 bg-light"><h6 class="mb-3">Solicitudes Recibidas ${filtroEstadoSolicitudes !== 'Todas' ? '(' + filtroEstadoSolicitudes + ')' : ''}</h6>${generarHTMLSolicitudesTutoria(solicitudes, tutoria)}</div></td></tr>`;
                } else if (filtroEstadoSolicitudes === 'Todas') {
                    html += `<tr><td colspan="9" class="text-center text-muted"><small>No tienes solicitudes por revisar</small></td></tr>`;
                }
            }
        }

        html += '</tbody></table>';
        
        // Si no hay tutorías que cumplan el filtro, mostrar mensaje
        if (!hayTutoriasConSolicitudes && filtroEstadoSolicitudes !== 'Todas') {
            container.innerHTML = `<div class="alert alert-info text-center">No existen solicitudes en el estado: ${filtroEstadoSolicitudes}</div>`;
        } else {
            container.innerHTML = html;
            
            // Agregar event listeners para los botones
            agregarEventListenersGestionSolicitudes();
            agregarEventListenersVerRespuestas();
            agregarEventListenersEditarEliminar();
        }
        
    } catch (error) {
        console.error('Error al cargar tutorías:', error);
        container.innerHTML = '<div class="alert alert-danger">Error al cargar tutorías</div>';
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
                alert('Error al aceptar solicitud: ' + error.message);
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
                alert('Error al rechazar solicitud: ' + error.message);
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
            alert('No hay preguntas configuradas para esta materia');
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
        alert('Error al cargar las preguntas de la encuesta');
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
    // Botones de editar
    document.querySelectorAll('.btn-editar-tutoria').forEach(btn => {
        btn.addEventListener('click', function() {
            const tutoriaId = this.dataset.tutoriaId;
            const materia = this.dataset.materia;
            const fecha = this.dataset.fecha;
            const horaInicio = this.dataset.horaInicio;
            const horaFin = this.dataset.horaFin;
            const cupos = this.dataset.cupos;
            
            mostrarModalEditarTutoria(tutoriaId, materia, fecha, horaInicio, horaFin, cupos);
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
    document.getElementById('editar-materia').value = materia;
    
    // Formatear fecha para input type="date" (YYYY-MM-DD)
    const fechaObj = new Date(fecha);
    const fechaFormateada = fechaObj.toISOString().split('T')[0];
    document.getElementById('editar-fecha').value = fechaFormateada;
    
    document.getElementById('editar-hora-inicio').value = horaInicio;
    document.getElementById('editar-hora-fin').value = horaFin;
    document.getElementById('editar-cupos').value = cupos;
    
    document.getElementById('modal-editar-tutoria').style.display = 'block';
}

function cerrarModalEditarTutoria() {
    document.getElementById('modal-editar-tutoria').style.display = 'none';
}

function mostrarModalConfirmarEliminar(tutoriaId, materia) {
    tutoriaIdAEliminar = tutoriaId;
    document.getElementById('eliminar-materia-nombre').textContent = materia;
    document.getElementById('modal-confirmar-eliminar').style.display = 'block';
}

function cerrarModalConfirmarEliminar() {
    tutoriaIdAEliminar = null;
    document.getElementById('modal-confirmar-eliminar').style.display = 'none';
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
                alert('La hora de inicio debe ser menor que la hora de fin');
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
                alert('Tutoría actualizada exitosamente');
            } catch (error) {
                console.error('Error al actualizar tutoría:', error);
                alert('Error al actualizar tutoría: ' + error.message);
            }
        });
    }
    
    const btnConfirmarEliminar = document.getElementById('btn-confirmar-eliminar');
    if (btnConfirmarEliminar) {
        btnConfirmarEliminar.addEventListener('click', async function() {
            if (!tutoriaIdAEliminar) return;
            
            try {
                await APIClient.eliminarTutoria(tutoriaIdAEliminar);
                
                cerrarModalConfirmarEliminar();
                const sesion = await obtenerSesion();
                await cargarTutoriasCreadas(sesion);
                alert('Tutoría eliminada exitosamente');
            } catch (error) {
                console.error('Error al eliminar tutoría:', error);
                alert('Error al eliminar tutoría: ' + error.message);
            }
        });
    }
});
