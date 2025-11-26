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
            container.innerHTML = '<div class="alert alert-warning text-center">No hay tutorías disponibles en este momento.</div>';
            return;
        }

        // Obtener solicitudes del estudiante
        let solicitudes = [];
        if (sesion) {
            const solicitudesResponse = await APIClient.getSolicitudesEstudiante();
            solicitudes = solicitudesResponse.solicitudes;
        }

        let html = '<table class="table table-striped table-bordered table-hover"><thead><tr><th>Materia</th><th>Fecha</th><th>Hora Inicio</th><th>Hora Fin</th><th>Tutor</th><th>Cupos</th><th>Acciones</th></tr></thead><tbody>';
        
        tutorias.forEach(tutoria => {
            // Verificar si el estudiante ya tiene una solicitud para esta tutoría
            const solicitudExistente = sesion ? solicitudes.find(s => {
                const tutoriaIdSolicitud = s.tutoria?._id || s.tutoria;
                return tutoriaIdSolicitud.toString() === tutoria._id.toString();
            }) : null;

            html += `
                <tr>
                    <td>${tutoria.materia}</td>
                    <td>${formatearFecha(tutoria.fecha)}</td>
                    <td>${tutoria.horaInicio}</td>
                    <td>${tutoria.horaFin}</td>
                    <td>${tutoria.tutorNombre}</td>
                    <td><span class="badge bg-info">${tutoria.cuposDisponibles}</span></td>
                    <td>
                        ${!solicitudExistente && sesion ? `
                            <button class="btn btn-sm btn-primary btn-solicitar" data-tutoria-id="${tutoria._id}">
                                Solicitar unirse
                            </button>
                        ` : solicitudExistente && solicitudExistente.estado === 'Pendiente' ? `
                            <span class="badge bg-warning text-dark">Ya solicitaste</span>
                        ` : solicitudExistente && solicitudExistente.estado === 'Aceptada' ? `
                            <span class="badge bg-success">Aceptada</span>
                        ` : solicitudExistente && solicitudExistente.estado === 'Rechazada' ? `
                            <span class="badge bg-danger">Rechazada</span>
                        ` : ''}
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        container.innerHTML = html;

        // Agregar event listeners para los botones de solicitar
        agregarEventListenersSolicitar();
        
    } catch (error) {
        console.error('Error al cargar tutorías disponibles:', error);
        container.innerHTML = '<div class="alert alert-danger">Error al cargar tutorías</div>';
    }
}

function agregarEventListenersSolicitar() {
    document.querySelectorAll('.btn-solicitar').forEach(btn => {
        btn.addEventListener('click', async function() {
            const tutoriaId = this.dataset.tutoriaId;
            const sesion = await obtenerSesion();
            
            if (!sesion) {
                alert('Debes iniciar sesión para solicitar una tutoría');
                return;
            }
            
            try {
                const response = await APIClient.crearSolicitud(tutoriaId);
                alert('Solicitud enviada exitosamente');
                await cargarTutoriasDisponibles();
                await cargarSolicitudesEstudiante(sesion);
            } catch (error) {
                console.error('Error al crear solicitud:', error);
                alert(error.message || 'Error al enviar la solicitud');
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
            container.innerHTML = '<div class="alert alert-warning text-center">No se encontraron solicitudes de tutorías enviadas</div>';
            return;
        }

        let html = '<table class="table table-striped table-bordered table-hover"><thead><tr><th>Materia</th><th>Fecha</th><th>Hora</th><th>Tutor</th><th>Estado</th><th>Aula</th><th>Acciones</th></tr></thead><tbody>';
        
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
            
            const estadoBadge = solicitud.estado === 'Aceptada' ? 'bg-success' : solicitud.estado === 'Rechazada' ? 'bg-danger' : 'bg-warning';
            
            html += `
                <tr>
                    <td>${solicitud.materia}</td>
                    <td>${formatearFecha(solicitud.fecha)}</td>
                    <td>${solicitud.horaInicio} - ${solicitud.horaFin}</td>
                    <td>${solicitud.tutor}</td>
                    <td><span class="badge ${estadoBadge}">${solicitud.estado}</span></td>
                    <td>
                        ${solicitud.estado === 'Aceptada' ? `
                            <a href="/aula.html?id=${tutoriaId}" class="btn btn-sm btn-success">
                                <i class="bi bi-door-open"></i> Ir al Aula
                            </a>
                        ` : `<span class="text-muted">-</span>`}
                    </td>
                    <td>
                        ${puedeEliminar ? `
                            <button class="btn btn-sm btn-danger btn-eliminar-solicitud" data-solicitud-id="${solicitud._id}">
                                Cancelar
                            </button>
                        ` : ''}
                        ${puedeCalificar && !yaCalificado ? `
                            <button class="btn btn-sm btn-primary btn-calificar-tutoria" 
                                    data-tutoria-id="${tutoriaId}" 
                                    data-materia="${solicitud.materia}">
                                Calificar
                            </button>
                        ` : puedeCalificar && yaCalificado ? `
                            <button class="btn btn-sm btn-secondary" disabled>
                                Calificada
                            </button>
                        ` : solicitud.estado === 'Rechazada' ? `
                            <span class="text-muted">-</span>
                        ` : ''}
                    </td>
                </tr>
            `;
        }

        html += '</tbody></table>';
        container.innerHTML = html;

        // Agregar event listeners
        agregarEventListenersEliminar();
        agregarEventListenersCalificar();
        
    } catch (error) {
        console.error('Error al cargar solicitudes:', error);
        container.innerHTML = '<div class="alert alert-danger">Error al cargar solicitudes</div>';
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
                    alert('Solicitud cancelada exitosamente');
                } catch (error) {
                    console.error('Error al eliminar solicitud:', error);
                    alert('Error al eliminar la solicitud: ' + error.message);
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
            alert('No hay preguntas configuradas para esta materia. Por favor, contacta al administrador.');
            return;
        }
    
    const modal = document.getElementById('modal-encuesta');
    const titulo = document.getElementById('modal-encuesta-titulo');
    const body = document.getElementById('modal-encuesta-body');
    const btnEnviar = document.getElementById('btn-enviar-encuesta');
    
    titulo.textContent = `Formulario de calificación - ${materia}`;
    
    let html = `
        <p class="text-center mb-4 text-muted">
            Por favor responde las siguientes preguntas
        </p>
    `;
    
        preguntas.forEach(pregunta => {
            html += `
                <div class="mb-4 pb-3 border-bottom">
                    <p class="fw-bold mb-3">${pregunta.pregunta}</p>
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="radio" name="pregunta-${pregunta._id}" 
                               id="pregunta-${pregunta._id}-1" value="1">
                        <label class="form-check-label" for="pregunta-${pregunta._id}-1">1 - Muy insatisfecho</label>
                    </div>
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="radio" name="pregunta-${pregunta._id}" 
                               id="pregunta-${pregunta._id}-2" value="2">
                        <label class="form-check-label" for="pregunta-${pregunta._id}-2">2 - Insatisfecho</label>
                    </div>
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="radio" name="pregunta-${pregunta._id}" 
                               id="pregunta-${pregunta._id}-3" value="3">
                        <label class="form-check-label" for="pregunta-${pregunta._id}-3">3 - Neutral</label>
                    </div>
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="radio" name="pregunta-${pregunta._id}" 
                               id="pregunta-${pregunta._id}-4" value="4">
                        <label class="form-check-label" for="pregunta-${pregunta._id}-4">4 - Satisfecho</label>
                    </div>
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="radio" name="pregunta-${pregunta._id}" 
                               id="pregunta-${pregunta._id}-5" value="5">
                        <label class="form-check-label" for="pregunta-${pregunta._id}-5">5 - Muy satisfecho</label>
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
        
        modal.style.display = 'block';
        
    } catch (error) {
        console.error('Error al abrir modal de encuesta:', error);
        alert('Error al cargar el formulario: ' + error.message);
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
        errorDiv.style.display = 'block';
        return;
    }
    
    try {
        // Guardar respuestas
        await APIClient.enviarRespuestas(tutoriaId, respuestas);
        
        alert('¡Gracias por tu calificación! Tu opinión es muy importante.');
        cerrarModalEncuesta();
        await cargarSolicitudesEstudiante();
    } catch (error) {
        console.error('Error al enviar encuesta:', error);
        errorDiv.textContent = error.message || 'Error al enviar la encuesta';
        errorDiv.style.display = 'block';
    }
}

function cerrarModalEncuesta() {
    const modal = document.getElementById('modal-encuesta');
    const errorDiv = document.getElementById('error-encuesta');
    modal.style.display = 'none';
    errorDiv.style.display = 'none';
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

