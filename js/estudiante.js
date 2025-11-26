// Funcionalidad para la vista del Estudiante

// HU-003: Envío de solicitud de tutoría
// HU-001: Filtro de visualización de tutorías por materia

let filtroMateriaActual = 'Todas';

// Inicializar filtro de materias
function inicializarFiltroMaterias() {
    const filtroSelect = document.getElementById('filtro-materia');
    if (!filtroSelect) return;

    // Obtener todas las materias únicas de las tutorías
    const tutorias = db.obtenerTutoriasDisponibles();
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
    filtroSelect.addEventListener('change', function() {
        filtroMateriaActual = this.value;
        cargarTutoriasDisponibles();
    });
}

// Cargar y mostrar tutorías disponibles
function cargarTutoriasDisponibles() {
    const container = document.getElementById('tutorias-disponibles-lista');
    const sesion = obtenerSesion();
    
    // Inicializar filtro si existe
    inicializarFiltroMaterias();
    
    let tutorias = db.obtenerTutoriasDisponibles();
    
    // Aplicar filtro por materia
    if (filtroMateriaActual && filtroMateriaActual !== 'Todas') {
        tutorias = tutorias.filter(t => t.materia === filtroMateriaActual);
    }

    if (tutorias.length === 0) {
        container.innerHTML = '<div class="alert alert-warning text-center">No hay tutorías disponibles en este momento.</div>';
        return;
    }

    let html = '<table class="table table-striped table-bordered table-hover"><thead><tr><th>Materia</th><th>Fecha</th><th>Hora Inicio</th><th>Hora Fin</th><th>Tutor</th><th>Cupos</th><th>Acciones</th></tr></thead><tbody>';
    
    tutorias.forEach(tutoria => {
        // Verificar si el estudiante ya tiene una solicitud para esta tutoría
        const solicitudExistente = sesion ? db.obtenerSolicitudesPorEstudiante(sesion.id)
            .find(s => s.tutoriaId === tutoria.id) : null;

        html += `
            <tr>
                <td>${tutoria.materia}</td>
                <td>${formatearFecha(tutoria.fecha)}</td>
                <td>${tutoria.horaInicio}</td>
                <td>${tutoria.horaFin}</td>
                <td>${tutoria.tutorNombre || tutoria.tutor}</td>
                <td><span class="badge bg-info">${tutoria.cuposDisponibles}</span></td>
                <td>
                    ${!solicitudExistente && sesion ? `
                        <button class="btn btn-sm btn-primary btn-solicitar" data-tutoria-id="${tutoria.id}">
                            Solicitar unirse
                        </button>
                    ` : solicitudExistente ? `
                        <button class="btn btn-sm btn-secondary" disabled>
                            Ya solicitaste
                        </button>
                    ` : ''}
                </td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;

    // Agregar event listeners para los botones de solicitar
    agregarEventListenersSolicitar();
}

function agregarEventListenersSolicitar() {
    document.querySelectorAll('.btn-solicitar').forEach(btn => {
        btn.addEventListener('click', function() {
            const tutoriaId = parseInt(this.dataset.tutoriaId);
            const sesion = obtenerSesion();
            
            if (!sesion) {
                alert('Debes iniciar sesión para solicitar una tutoría');
                return;
            }
            
            const solicitud = db.crearSolicitud(tutoriaId, sesion.id, `${sesion.nombre} ${sesion.apellido}`);

            if (solicitud) {
                alert('Solicitud enviada exitosamente');
                cargarTutoriasDisponibles();
                cargarSolicitudesEstudiante(sesion);
            } else {
                alert('Error al enviar la solicitud. Es posible que ya hayas solicitado esta tutoría.');
            }
        });
    });
}

// Cargar y mostrar solicitudes del estudiante
function cargarSolicitudesEstudiante(sesion) {
    const container = document.getElementById('solicitudes-estudiante-lista');
    
    if (!sesion) {
        sesion = obtenerSesion();
    }
    
    const solicitudes = db.obtenerSolicitudesPorEstudiante(sesion.id);

    if (solicitudes.length === 0) {
        container.innerHTML = '<div class="alert alert-warning text-center">No se encontraron solicitudes de tutorías enviadas</div>';
        return;
    }

    let html = '<table class="table table-striped table-bordered table-hover"><thead><tr><th>ID</th><th>Materia</th><th>Fecha</th><th>Hora</th><th>Tutor</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>';
    
    solicitudes.forEach(solicitud => {
        const puedeEliminar = solicitud.estado === 'Pendiente' || solicitud.estado === 'Rechazada';
        const puedeCalificar = solicitud.estado === 'Aceptada';
        
        // Verificar si ya calificó esta tutoría
        const yaCalificado = db.verificarRespuestaExistente(solicitud.tutoriaId, sesion.id);
        const estadoBadge = solicitud.estado === 'Aceptada' ? 'bg-success' : solicitud.estado === 'Rechazada' ? 'bg-danger' : 'bg-warning';
        
        html += `
            <tr>
                <td>${solicitud.id}</td>
                <td>${solicitud.materia}</td>
                <td>${formatearFecha(solicitud.fecha)}</td>
                <td>${solicitud.horaInicio} - ${solicitud.horaFin}</td>
                <td>${solicitud.tutor}</td>
                <td><span class="badge ${estadoBadge}">${solicitud.estado}</span></td>
                <td>
                    ${puedeEliminar ? `
                        <button class="btn btn-sm btn-danger btn-eliminar-solicitud" data-solicitud-id="${solicitud.id}">
                            Eliminar
                        </button>
                    ` : ''}
                    ${puedeCalificar && !yaCalificado ? `
                        <button class="btn btn-sm btn-primary btn-calificar-tutoria" 
                                data-tutoria-id="${solicitud.tutoriaId}" 
                                data-materia="${solicitud.materia}">
                            Calificar
                        </button>
                    ` : puedeCalificar && yaCalificado ? `
                        <button class="btn btn-sm btn-secondary" disabled>
                            Calificada
                        </button>
                    ` : ''}
                </td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;

    // Agregar event listeners
    agregarEventListenersEliminar();
    agregarEventListenersCalificar();
}


function agregarEventListenersEliminar() {
    document.querySelectorAll('.btn-eliminar-solicitud').forEach(btn => {
        btn.addEventListener('click', function() {
            const solicitudId = parseInt(this.dataset.solicitudId);
            
            if (confirm('¿Estás seguro de que deseas eliminar esta solicitud?')) {
                const resultado = db.eliminarSolicitud(solicitudId);
                const sesion = obtenerSesion();
                
                if (resultado) {
                    cargarSolicitudesEstudiante(sesion);
                    cargarTutoriasDisponibles();
                    cargarTutoriasCreadas(sesion);
                } else {
                    alert('Error al eliminar la solicitud');
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

function abrirModalEncuesta(tutoriaId, materia) {
    const sesion = obtenerSesion();
    const preguntas = db.obtenerPreguntasPorMateria(materia);
    
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
                    <input class="form-check-input" type="radio" name="pregunta-${pregunta.id}" 
                           id="pregunta-${pregunta.id}-1" value="1">
                    <label class="form-check-label" for="pregunta-${pregunta.id}-1">1 - Muy insatisfecho</label>
                </div>
                <div class="form-check form-check-inline">
                    <input class="form-check-input" type="radio" name="pregunta-${pregunta.id}" 
                           id="pregunta-${pregunta.id}-2" value="2">
                    <label class="form-check-label" for="pregunta-${pregunta.id}-2">2 - Insatisfecho</label>
                </div>
                <div class="form-check form-check-inline">
                    <input class="form-check-input" type="radio" name="pregunta-${pregunta.id}" 
                           id="pregunta-${pregunta.id}-3" value="3">
                    <label class="form-check-label" for="pregunta-${pregunta.id}-3">3 - Neutral</label>
                </div>
                <div class="form-check form-check-inline">
                    <input class="form-check-input" type="radio" name="pregunta-${pregunta.id}" 
                           id="pregunta-${pregunta.id}-4" value="4">
                    <label class="form-check-label" for="pregunta-${pregunta.id}-4">4 - Satisfecho</label>
                </div>
                <div class="form-check form-check-inline">
                    <input class="form-check-input" type="radio" name="pregunta-${pregunta.id}" 
                           id="pregunta-${pregunta.id}-5" value="5">
                    <label class="form-check-label" for="pregunta-${pregunta.id}-5">5 - Muy satisfecho</label>
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
        enviarEncuesta(tutoriaId, preguntas, sesion.id);
    });
    
    modal.style.display = 'block';
}

function enviarEncuesta(tutoriaId, preguntas, estudianteId) {
    const errorDiv = document.getElementById('error-encuesta');
    const respuestas = {};
    let todasRespondidas = true;
    
    // Recopilar respuestas
    preguntas.forEach(pregunta => {
        const seleccionado = document.querySelector(`input[name="pregunta-${pregunta.id}"]:checked`);
        
        if (!seleccionado) {
            todasRespondidas = false;
        } else {
            respuestas[pregunta.id] = parseInt(seleccionado.value);
        }
    });
    
    // Validar que todas las preguntas estén respondidas
    if (!todasRespondidas) {
        errorDiv.textContent = 'Por favor, responde a todas las preguntas antes de enviar.';
        errorDiv.style.display = 'block';
        return;
    }
    
    // Guardar respuestas
    const resultado = db.crearRespuesta(tutoriaId, estudianteId, respuestas);
    
    if (resultado) {
        alert('¡Gracias por tu calificación! Tu opinión es muy importante.');
        cerrarModalEncuesta();
        cargarSolicitudesEstudiante();
    } else {
        errorDiv.textContent = 'Ya has respondido a esta encuesta.';
        errorDiv.style.display = 'block';
    }
}

function cerrarModalEncuesta() {
    const modal = document.getElementById('modal-encuesta');
    const errorDiv = document.getElementById('error-encuesta');
    modal.style.display = 'none';
    errorDiv.style.display = 'none';
}

