// Panel de Administrador - Adaptado para API REST

let solicitudActual = null;

document.addEventListener('DOMContentLoaded', async function() {
    // Proteger página - solo administradores
    const sesion = await protegerPagina(['Administrador']);
    if (!sesion) return;

    // Inicializar Socket.IO
    initializeSocket();

    // Mostrar mensaje de bienvenida en navbar
    const welcomeMessage = document.getElementById('welcome-message');
    if (welcomeMessage) {
        welcomeMessage.textContent = `Hola Administrador ${sesion.nombre} ${sesion.apellido}, Bienvenid@`;
    }

    // Inicializar funcionalidad de pestañas
    inicializarPestanasAdmin();
    
    // Cargar datos iniciales
    await cargarSolicitudesTutores();
    await cargarSolicitudesEstudiantes();
    cargarMateriasEncuesta();
    await cargarPreguntasGuardadas();

    // Botón de cerrar sesión
    document.getElementById('btn-logout').addEventListener('click', cerrarSesion);
});

function inicializarPestanasAdmin() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', async function() {
            const tabName = this.dataset.tab;

            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            this.classList.add('active');
            document.getElementById(`${tabName}-section`).classList.add('active');

            if (tabName === 'tutores') {
                await cargarSolicitudesTutores();
            } else if (tabName === 'estudiantes') {
                await cargarSolicitudesEstudiantes();
            } else if (tabName === 'encuestas') {
                cargarMateriasEncuesta();
                await cargarPreguntasGuardadas();
            }
        });
    });
}

// Cargar y mostrar solicitudes de tutores
async function cargarSolicitudesTutores() {
    const container = document.getElementById('lista-solicitudes-tutores');
    
    try {
        const response = await APIClient.getSolicitudesTutores();
        const solicitudes = response.solicitudes;

        if (solicitudes.length === 0) {
            container.innerHTML = '<div class="alert alert-warning text-center" role="alert">No se encontraron solicitudes de tutores enviadas.</div>';
            return;
        }

        let html = `
            <table class="table table-striped table-bordered table-hover">
                <thead class="table-primary">
                    <tr>
                        <th>Nombre</th>
                        <th>Apellido</th>
                        <th>Correo</th>
                        <th>Materias</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        solicitudes.forEach(solicitud => {
            html += `
                <tr>
                    <td>${solicitud.nombre}</td>
                    <td>${solicitud.apellido}</td>
                    <td>${solicitud.email}</td>
                    <td>${solicitud.materias ? solicitud.materias.join(', ') : 'N/A'}</td>
                    <td>
                        ${solicitud.pdf ? `
                            <button class="btn btn-info btn-sm btn-ver-pdf me-2" data-pdf="${solicitud.pdf}" data-id="${solicitud._id}">
                                <i class="bi bi-eye"></i> Ver PDF
                            </button>
                        ` : ''}
                        <button class="btn btn-success btn-sm btn-aprobar" data-id="${solicitud._id}">
                            Aprobar
                        </button>
                        <button class="btn btn-danger btn-sm btn-rechazar ms-2" data-id="${solicitud._id}">
                            Rechazar
                        </button>
                    </td>
                </tr>
                <tr id="pdf-row-${solicitud._id}" class="pdf-preview-row" style="display: none;">
                    <td colspan="5">
                        <div class="pdf-container p-3">
                            <button class="btn btn-sm btn-secondary mb-2 btn-cerrar-pdf" data-id="${solicitud._id}">
                                <i class="bi bi-x"></i> Cerrar
                            </button>
                            <iframe id="pdf-frame-${solicitud._id}" style="width: 100%; height: 600px; border: 1px solid #ddd; border-radius: 4px;"></iframe>
                        </div>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        container.innerHTML = html;

        // Agregar event listeners
        agregarEventListenersAprobacion('tutor');

    } catch (error) {
        console.error('Error al cargar solicitudes de tutores:', error);
        container.innerHTML = '<div class="alert alert-danger">Error al cargar solicitudes</div>';
    }
}

// Cargar y mostrar solicitudes de estudiantes
async function cargarSolicitudesEstudiantes() {
    const container = document.getElementById('lista-solicitudes-estudiantes');
    
    try {
        const response = await APIClient.getSolicitudesEstudiantes();
        const solicitudes = response.solicitudes;

        if (solicitudes.length === 0) {
            container.innerHTML = '<div class="alert alert-warning text-center" role="alert">No se encontraron solicitudes de estudiantes enviadas.</div>';
            return;
        }

        let html = `
            <table class="table table-striped table-bordered table-hover">
                <thead class="table-primary">
                    <tr>
                        <th>Nombre</th>
                        <th>Apellido</th>
                        <th>Correo</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        solicitudes.forEach(solicitud => {
            html += `
                <tr>
                    <td>${solicitud.nombre}</td>
                    <td>${solicitud.apellido}</td>
                    <td>${solicitud.email}</td>
                    <td>
                        ${solicitud.pdf ? `
                            <button class="btn btn-info btn-sm btn-ver-pdf me-2" data-pdf="${solicitud.pdf}" data-id="${solicitud._id}">
                                <i class="bi bi-eye"></i> Ver Carnet
                            </button>
                        ` : ''}
                        <button class="btn btn-success btn-sm btn-aprobar" data-id="${solicitud._id}">
                            Aprobar
                        </button>
                        <button class="btn btn-danger btn-sm btn-rechazar ms-2" data-id="${solicitud._id}">
                            Rechazar
                        </button>
                    </td>
                </tr>
                <tr id="pdf-row-${solicitud._id}" class="pdf-preview-row" style="display: none;">
                    <td colspan="4">
                        <div class="pdf-container p-3">
                            <button class="btn btn-sm btn-secondary mb-2 btn-cerrar-pdf" data-id="${solicitud._id}">
                                <i class="bi bi-x"></i> Cerrar
                            </button>
                            <iframe id="pdf-frame-${solicitud._id}" style="width: 100%; height: 600px; border: 1px solid #ddd; border-radius: 4px;"></iframe>
                        </div>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        container.innerHTML = html;

        // Agregar event listeners
        agregarEventListenersAprobacion('estudiante');

    } catch (error) {
        console.error('Error al cargar solicitudes de estudiantes:', error);
        container.innerHTML = '<div class="alert alert-danger">Error al cargar solicitudes</div>';
    }
}

// Agregar event listeners para aprobar/rechazar
function agregarEventListenersAprobacion(tipo) {
    document.querySelectorAll('.btn-aprobar').forEach(btn => {
        btn.addEventListener('click', async function() {
            const id = this.dataset.id;
            await aprobarSolicitud(id, tipo);
        });
    });

    document.querySelectorAll('.btn-rechazar').forEach(btn => {
        btn.addEventListener('click', async function() {
            const id = this.dataset.id;
            if (confirm('¿Estás seguro de rechazar esta solicitud?')) {
                await rechazarSolicitud(id, tipo);
            }
        });
    });

    document.querySelectorAll('.btn-ver-pdf').forEach(btn => {
        btn.addEventListener('click', function() {
            const pdf = this.dataset.pdf;
            const id = this.dataset.id;
            togglePDF(id, pdf);
        });
    });

    document.querySelectorAll('.btn-cerrar-pdf').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            ocultarPDF(id);
        });
    });
}

// Aprobar solicitud
async function aprobarSolicitud(id, tipo) {
    try {
        await APIClient.aprobarSolicitud(id);
        alert('Solicitud aprobada exitosamente');
        
        if (tipo === 'tutor') {
            await cargarSolicitudesTutores();
        } else {
            await cargarSolicitudesEstudiantes();
        }
    } catch (error) {
        console.error('Error al aprobar solicitud:', error);
        alert('Error al aprobar solicitud: ' + error.message);
    }
}

// Rechazar solicitud
async function rechazarSolicitud(id, tipo) {
    try {
        await APIClient.rechazarSolicitud(id);
        alert('Solicitud rechazada exitosamente');
        
        if (tipo === 'tutor') {
            await cargarSolicitudesTutores();
        } else {
            await cargarSolicitudesEstudiantes();
        }
    } catch (error) {
        console.error('Error al rechazar solicitud:', error);
        alert('Error al rechazar solicitud: ' + error.message);
    }
}

// Mostrar/Ocultar PDF debajo de la fila
function togglePDF(id, pdfBase64) {
    const pdfRow = document.getElementById(`pdf-row-${id}`);
    const iframe = document.getElementById(`pdf-frame-${id}`);
    
    if (pdfRow.style.display === 'none') {
        // Ocultar todos los demás PDFs abiertos
        document.querySelectorAll('.pdf-preview-row').forEach(row => {
            row.style.display = 'none';
        });
        
        // Mostrar este PDF
        pdfRow.style.display = 'table-row';
        iframe.src = pdfBase64;
    } else {
        // Ocultar si ya está visible
        pdfRow.style.display = 'none';
        iframe.src = '';
    }
}

function ocultarPDF(id) {
    const pdfRow = document.getElementById(`pdf-row-${id}`);
    const iframe = document.getElementById(`pdf-frame-${id}`);
    
    pdfRow.style.display = 'none';
    iframe.src = '';
}

// Cargar materias para encuesta
function cargarMateriasEncuesta() {
    const materias = [
        "Álgebra Lineal", "Cálculo en una Variable", "Programación I",
        "Ecuaciones Diferenciales Ordinarias", "Programación II",
        "Estructura de Datos y Algoritmos I", "Fundamentos de Bases de Datos",
        "Ingeniería de Software y Requerimientos", "Diseño de Software",
        "Bases de Datos Distribuidas", "Aplicaciones Web",
        "Metodologías Ágiles", "Aplicaciones Web Avanzadas",
        "Gestión de Proyectos de Software"
    ];

    const select = document.getElementById('materia-encuesta');
    select.innerHTML = '<option value="">Selecciona una materia</option>';
    
    materias.forEach(materia => {
        const option = document.createElement('option');
        option.value = materia;
        option.textContent = materia;
        select.appendChild(option);
    });

    // Event listener para cargar preguntas al cambiar materia
    select.addEventListener('change', async function() {
        if (this.value) {
            await cargarPreguntasGuardadas(this.value);
        }
    });

    // Event listener para guardar pregunta
    const form = document.getElementById('form-crear-pregunta');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            await guardarPregunta();
        });
    }
}

async function guardarPregunta() {
    const pregunta = document.getElementById('pregunta-encuesta').value.trim();
    const materia = document.getElementById('materia-encuesta').value;
    const mensaje = document.getElementById('mensaje-encuesta');

    if (!pregunta || !materia) {
        if (mensaje) {
            mensaje.className = 'alert alert-danger mt-3';
            mensaje.textContent = 'Por favor, completa todos los campos';
            mensaje.style.display = 'block';
        }
        return;
    }

    try {
        await APIClient.crearPregunta(pregunta, materia);
        
        if (mensaje) {
            mensaje.className = 'alert alert-success mt-3';
            mensaje.textContent = 'Pregunta guardada exitosamente';
            mensaje.style.display = 'block';
        }
        
        document.getElementById('pregunta-encuesta').value = '';
        await cargarPreguntasGuardadas(materia);
        
        setTimeout(() => {
            if (mensaje) mensaje.style.display = 'none';
        }, 3000);
    } catch (error) {
        console.error('Error al crear pregunta:', error);
        if (mensaje) {
            mensaje.className = 'alert alert-danger mt-3';
            mensaje.textContent = 'Error al guardar pregunta: ' + error.message;
            mensaje.style.display = 'block';
        }
    }
}

async function cargarPreguntasGuardadas(materia = null) {
    const container = document.getElementById('lista-preguntas');
    if (!container) return;
    
    try {
        let preguntas;
        
        if (materia) {
            const response = await APIClient.getPreguntasPorMateria(materia);
            preguntas = response.preguntas;
        } else {
            const response = await APIClient.getPreguntas();
            preguntas = response.preguntas;
        }

        if (preguntas.length === 0) {
            container.innerHTML = materia 
                ? `<div class="alert alert-info text-center">No hay preguntas guardadas para ${materia}</div>`
                : '<div class="alert alert-info text-center">No hay preguntas guardadas aún.</div>';
            return;
        }

        let html = materia ? `<h5 class="mb-3">Preguntas Guardadas para ${materia}</h5>` : '';
        html += `
            <table class="table table-striped table-bordered">
                <thead class="table-light">
                    <tr>
                        <th>#</th>
                        <th>Pregunta</th>
                        <th>Materia</th>
                    </tr>
                </thead>
                <tbody>
        `;

        preguntas.forEach((pregunta, index) => {
            html += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${pregunta.pregunta}</td>
                    <td><span class="badge bg-primary">${pregunta.materia}</span></td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        container.innerHTML = html;

    } catch (error) {
        console.error('Error al cargar preguntas:', error);
        container.innerHTML = '<div class="alert alert-danger">Error al cargar preguntas</div>';
    }
}
