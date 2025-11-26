// HU-012 y HU-002: Panel de Administrador

let solicitudActual = null;

document.addEventListener('DOMContentLoaded', function() {
    // Proteger página - solo administradores
    const sesion = protegerPagina(['Administrador']);
    if (!sesion) return;

    // Mostrar mensaje de bienvenida en navbar
    const welcomeMessage = document.getElementById('welcome-message');
    if (welcomeMessage) {
        welcomeMessage.textContent = `Hola Administrador ${sesion.nombre} ${sesion.apellido}, Bienvenid@`;
    }

    // Inicializar funcionalidad de pestañas
    inicializarPestanasAdmin();
    
    // Cargar datos iniciales
    cargarSolicitudesTutores();
    cargarSolicitudesEstudiantes();
    cargarMateriasEncuesta();
    inicializarGestionEncuestas();

    // Botón de cerrar sesión
    document.getElementById('btn-logout').addEventListener('click', cerrarSesion);

    // Modal
    inicializarModal();
});

function inicializarPestanasAdmin() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.dataset.tab;

            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            this.classList.add('active');
            document.getElementById(`${tabName}-section`).classList.add('active');

            if (tabName === 'tutores') {
                cargarSolicitudesTutores();
            } else if (tabName === 'estudiantes') {
                cargarSolicitudesEstudiantes();
            } else if (tabName === 'encuestas') {
                cargarMateriasEncuesta();
                cargarPreguntasGuardadas();
            }
        });
    });
}

// HU-012: Cargar y mostrar solicitudes de tutores
function cargarSolicitudesTutores() {
    const container = document.getElementById('lista-solicitudes-tutores');
    const solicitudes = db.obtenerSolicitudesRegistroPorRol('Tutor');

    if (solicitudes.length === 0) {
        container.innerHTML = '<div class="alert alert-warning text-center" role="alert">No se encontraron solicitudes de tutores enviadas.</div>';
        return;
    }

    let html = `
        <table class="table table-striped table-bordered table-hover">
            <thead class="table-primary">
                <tr>
                    <th>ID Tutor</th>
                    <th>Nombre</th>
                    <th>Apellido</th>
                    <th>Correo</th>
                    <th>Usuario</th>
                    <th>Estado</th>
                    <th>Certificación</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    solicitudes.forEach(solicitud => {
        html += `
            <tr>
                <td>${solicitud.id}</td>
                <td>${solicitud.nombre}</td>
                <td>${solicitud.apellido}</td>
                <td>${solicitud.correo}</td>
                <td>${solicitud.usuario}</td>
                <td><span class="badge bg-warning">${solicitud.estado}</span></td>
                <td>
                    <button class="btn btn-success btn-sm btn-ver-pdf" data-solicitud-id="${solicitud.id}" data-tipo="tutor">
                        Ver PDF
                    </button>
                </td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    container.innerHTML = html;

    // Agregar event listeners
    document.querySelectorAll('.btn-ver-pdf').forEach(btn => {
        btn.addEventListener('click', function() {
            const solicitudId = parseInt(this.dataset.solicitudId);
            const tipo = this.dataset.tipo;
            abrirModalSolicitud(solicitudId, tipo);
        });
    });
}

// HU-002: Cargar y mostrar solicitudes de estudiantes
function cargarSolicitudesEstudiantes() {
    const container = document.getElementById('lista-solicitudes-estudiantes');
    const solicitudes = db.obtenerSolicitudesRegistroPorRol('Estudiante');

    if (solicitudes.length === 0) {
        container.innerHTML = '<div class="alert alert-warning text-center" role="alert">No se encontraron solicitudes de estudiantes enviadas.</div>';
        return;
    }

    let html = `
        <table class="table table-striped table-bordered table-hover">
            <thead class="table-primary">
                <tr>
                    <th>ID Estudiante</th>
                    <th>Nombre</th>
                    <th>Apellido</th>
                    <th>Correo</th>
                    <th>Usuario</th>
                    <th>Estado</th>
                    <th>Carnet</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    solicitudes.forEach(solicitud => {
        html += `
            <tr>
                <td>${solicitud.id}</td>
                <td>${solicitud.nombre}</td>
                <td>${solicitud.apellido}</td>
                <td>${solicitud.correo}</td>
                <td>${solicitud.usuario}</td>
                <td><span class="badge bg-warning">${solicitud.estado}</span></td>
                <td>
                    <button class="btn btn-success btn-sm btn-ver-pdf" data-solicitud-id="${solicitud.id}" data-tipo="estudiante">
                        Ver PDF
                    </button>
                </td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    container.innerHTML = html;

    // Agregar event listeners
    document.querySelectorAll('.btn-ver-pdf').forEach(btn => {
        btn.addEventListener('click', function() {
            const solicitudId = parseInt(this.dataset.solicitudId);
            const tipo = this.dataset.tipo;
            abrirModalSolicitud(solicitudId, tipo);
        });
    });
}

function inicializarModal() {
    const modal = document.getElementById('modal-solicitud');
    const closeBtn = document.querySelector('.close');
    const btnCerrarModal = document.getElementById('btn-cerrar-modal');
    const btnAprobar = document.getElementById('btn-aprobar');
    const btnRechazar = document.getElementById('btn-rechazar');

    closeBtn.addEventListener('click', cerrarModal);
    btnCerrarModal.addEventListener('click', cerrarModal);

    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            cerrarModal();
        }
    });

    btnAprobar.addEventListener('click', aprobarSolicitud);
    btnRechazar.addEventListener('click', rechazarSolicitud);
}

function abrirModalSolicitud(solicitudId, tipo) {
    solicitudActual = db.obtenerSolicitudRegistroPorId(solicitudId);
    
    if (!solicitudActual) {
        alert('Solicitud no encontrada');
        return;
    }

    const modal = document.getElementById('modal-solicitud');
    const modalTitulo = document.getElementById('modal-titulo');
    const detalleSolicitud = document.getElementById('detalle-solicitud');
    const pdfEmbed = document.getElementById('pdf-embed');
    const seccionMaterias = document.getElementById('seccion-materias');
    const btnAprobar = document.getElementById('btn-aprobar');

    // Configurar título
    modalTitulo.textContent = tipo === 'tutor' ? 'Revisar Solicitud de Tutor' : 'Revisar Solicitud de Estudiante';

    // Mostrar detalles
    detalleSolicitud.innerHTML = `
        <p><strong>ID:</strong> ${solicitudActual.id}</p>
        <p><strong>Nombre:</strong> ${solicitudActual.nombre}</p>
        <p><strong>Apellido:</strong> ${solicitudActual.apellido}</p>
        <p><strong>Correo:</strong> ${solicitudActual.correo}</p>
        <p><strong>Usuario:</strong> ${solicitudActual.usuario}</p>
        <p><strong>Rol:</strong> ${solicitudActual.rol}</p>
        <p><strong>Estado:</strong> <span class="estado ${solicitudActual.estado.toLowerCase()}">${solicitudActual.estado}</span></p>
    `;

    // Mostrar PDF
    if (solicitudActual.archivo) {
        pdfEmbed.src = solicitudActual.archivo;
    }

    // Mostrar sección de materias solo para tutores
    if (tipo === 'tutor') {
        seccionMaterias.style.display = 'block';
        cargarMateriasDisponibles();
        btnAprobar.textContent = 'Aprobar Tutor y Asignar Materias';
    } else {
        seccionMaterias.style.display = 'none';
        btnAprobar.textContent = 'Aprobar Estudiante';
    }

    modal.style.display = 'block';
}

function cargarMateriasDisponibles() {
    const gridMaterias = document.getElementById('grid-materias');
    const materias = db.materiasDisponibles;

    let html = '';
    
    materias.forEach((materia, index) => {
        html += `
            <div class="materia-checkbox" data-materia="${materia}">
                <input type="checkbox" id="materia-${index}" value="${materia}">
                <label for="materia-${index}">${materia}</label>
            </div>
        `;
    });

    gridMaterias.innerHTML = html;

    // Event listeners para checkboxes
    document.querySelectorAll('.materia-checkbox').forEach(div => {
        const checkbox = div.querySelector('input[type="checkbox"]');
        
        div.addEventListener('click', function(e) {
            if (e.target.tagName !== 'INPUT') {
                checkbox.checked = !checkbox.checked;
            }
            
            if (checkbox.checked) {
                this.classList.add('selected');
            } else {
                this.classList.remove('selected');
            }
        });
        
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                div.classList.add('selected');
            } else {
                div.classList.remove('selected');
            }
        });
    });
}

function aprobarSolicitud() {
    if (!solicitudActual) return;

    let materias = [];

    // Si es tutor, verificar que haya materias seleccionadas
    if (solicitudActual.rol === 'Tutor') {
        const checkboxes = document.querySelectorAll('#grid-materias input[type="checkbox"]:checked');
        
        if (checkboxes.length === 0) {
            mostrarError('error-materias', 'Debe seleccionar al menos una materia para aprobar al tutor.');
            return;
        }

        materias = Array.from(checkboxes).map(cb => cb.value);
        mostrarError('error-materias', '');
    }

    // Aprobar solicitud
    db.actualizarEstadoSolicitudRegistro(solicitudActual.id, 'Aprobado', materias);

    alert(`${solicitudActual.rol} aprobado exitosamente`);
    cerrarModal();

    // Recargar listas
    if (solicitudActual.rol === 'Tutor') {
        cargarSolicitudesTutores();
    } else {
        cargarSolicitudesEstudiantes();
    }
}

function rechazarSolicitud() {
    if (!solicitudActual) return;

    if (confirm(`¿Estás seguro de que deseas rechazar esta solicitud de ${solicitudActual.rol.toLowerCase()}?`)) {
        db.actualizarEstadoSolicitudRegistro(solicitudActual.id, 'Rechazado');
        
        alert(`Solicitud rechazada`);
        cerrarModal();

        // Recargar listas
        if (solicitudActual.rol === 'Tutor') {
            cargarSolicitudesTutores();
        } else {
            cargarSolicitudesEstudiantes();
        }
    }
}

function cerrarModal() {
    const modal = document.getElementById('modal-solicitud');
    modal.style.display = 'none';
    solicitudActual = null;
    mostrarError('error-materias', '');
}

// HU-007: Gestión de Formularios de Calificación
function inicializarGestionEncuestas() {
    const btnGuardarPregunta = document.getElementById('btn-guardar-pregunta');
    const selectMateria = document.getElementById('materia-encuesta');
    
    btnGuardarPregunta.addEventListener('click', guardarPregunta);
    
    selectMateria.addEventListener('change', function() {
        cargarPreguntasGuardadas(this.value);
    });
}

function cargarMateriasEncuesta() {
    const select = document.getElementById('materia-encuesta');
    const materias = db.materiasDisponibles;
    
    let html = '<option value="">Seleccionar materia</option>';
    
    materias.forEach(materia => {
        html += `<option value="${materia}">${materia}</option>`;
    });
    
    select.innerHTML = html;
}

function guardarPregunta() {
    const materiaSelect = document.getElementById('materia-encuesta');
    const preguntaTextarea = document.getElementById('pregunta-encuesta');
    const errorMensaje = document.getElementById('error-pregunta');
    
    const materia = materiaSelect.value;
    const pregunta = preguntaTextarea.value.trim();
    
    // Validación
    if (!materia) {
        mostrarError('error-pregunta', 'Debe seleccionar una materia.');
        return;
    }
    
    if (!pregunta) {
        mostrarError('error-pregunta', 'La pregunta no puede estar vacía.');
        return;
    }
    
    // Guardar pregunta
    const resultado = db.crearPregunta(materia, pregunta);
    
    if (resultado) {
        alert('Pregunta guardada exitosamente');
        preguntaTextarea.value = '';
        mostrarError('error-pregunta', '');
        cargarPreguntasGuardadas(materia);
    } else {
        mostrarError('error-pregunta', 'Error al guardar la pregunta.');
    }
}

function cargarPreguntasGuardadas(materia = null) {
    const container = document.getElementById('lista-preguntas');
    const materiaSelect = document.getElementById('materia-encuesta');
    
    if (!materia) {
        materia = materiaSelect.value;
    }
    
    if (!materia) {
        container.innerHTML = '<div class="alert alert-info text-center" role="alert">Seleccione una materia para ver las preguntas guardadas</div>';
        return;
    }
    
    const preguntas = db.obtenerPreguntasPorMateria(materia);
    
    if (preguntas.length === 0) {
        container.innerHTML = '<div class="alert alert-info text-center" role="alert">Aún no hay preguntas guardadas para la materia seleccionada.</div>';
        return;
    }
    
    let html = '<h5 class="mb-3">Preguntas Guardadas para ' + materia + '</h5>';
    html += `
        <table class="table table-bordered table-hover">
            <thead class="table-light">
                <tr>
                    <th style="width: 50px;">#</th>
                    <th>Pregunta</th>
                    <th>Materia</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    preguntas.forEach((pregunta, index) => {
        html += `
            <tr>
                <td class="text-center">${index + 1}</td>
                <td>${pregunta.pregunta}</td>
                <td>${pregunta.materia}</td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}
