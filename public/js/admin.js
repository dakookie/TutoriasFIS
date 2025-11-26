// Panel de Administrador - Adaptado para API REST

let solicitudActual = null;

document.addEventListener('DOMContentLoaded', async function () {
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
        button.addEventListener('click', async function () {
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
            container.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-gray-500">No se encontraron solicitudes de tutores enviadas.</td></tr>';
            return;
        }

        let html = '';

        solicitudes.forEach((solicitud, index) => {
            // Generar un nombre de usuario basado en el email (parte antes del @)
            const nombreUsuario = solicitud.email.split('@')[0];
            
            html += `
                <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 text-sm text-gray-700">${index + 401}</td>
                    <td class="px-6 py-4 text-sm text-gray-700">${index + 501}</td>
                    <td class="px-6 py-4 text-sm text-gray-700">${solicitud.nombre}</td>
                    <td class="px-6 py-4 text-sm text-gray-700">${solicitud.apellido}</td>
                    <td class="px-6 py-4 text-sm text-gray-700">${solicitud.email}</td>
                    <td class="px-6 py-4 text-sm text-gray-700">${nombreUsuario}</td>
                    <td class="px-6 py-4">
                        <span class="px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                            Pendiente revisión
                        </span>
                    </td>
                    <td class="px-6 py-4">
                        ${solicitud.pdf ? `
                            <button class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm font-medium transition btn-ver-pdf-modal" 
                                    data-pdf="${solicitud.pdf}" 
                                    data-id="${solicitud._id}"
                                    data-nombre="${solicitud.nombre}"
                                    data-apellido="${solicitud.apellido}"
                                    data-email="${solicitud.email}"
                                    data-materias="${solicitud.materias ? solicitud.materias.join(', ') : 'N/A'}">
                                Ver PDF
                            </button>
                        ` : '<span class="text-gray-400">Sin documento</span>'}
                    </td>
                </tr>
            `;
        });

        container.innerHTML = html;

        // Agregar event listeners
        agregarEventListenersAprobacion('tutor');

    } catch (error) {
        console.error('Error al cargar solicitudes de tutores:', error);
        container.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-red-500">Error al cargar solicitudes</td></tr>';
    }
}

// Cargar y mostrar solicitudes de estudiantes
async function cargarSolicitudesEstudiantes() {
    const container = document.getElementById('lista-solicitudes-estudiantes');

    try {
        const response = await APIClient.getSolicitudesEstudiantes();
        const solicitudes = response.solicitudes;

        if (solicitudes.length === 0) {
            container.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-gray-500">No se encontraron solicitudes de estudiantes enviadas.</td></tr>';
            return;
        }

        let html = '';

        solicitudes.forEach((solicitud, index) => {
            // Generar un nombre de usuario basado en el email (parte antes del @)
            const nombreUsuario = solicitud.email.split('@')[0];
            
            html += `
                <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 text-sm text-gray-700">${index + 301}</td>
                    <td class="px-6 py-4 text-sm text-gray-700">${index + 601}</td>
                    <td class="px-6 py-4 text-sm text-gray-700">${solicitud.nombre}</td>
                    <td class="px-6 py-4 text-sm text-gray-700">${solicitud.apellido}</td>
                    <td class="px-6 py-4 text-sm text-gray-700">${solicitud.email}</td>
                    <td class="px-6 py-4 text-sm text-gray-700">${nombreUsuario}</td>
                    <td class="px-6 py-4">
                        <span class="px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                            Pendiente revisión
                        </span>
                    </td>
                    <td class="px-6 py-4">
                        ${solicitud.pdf ? `
                            <button class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm font-medium transition btn-ver-pdf-modal" 
                                    data-pdf="${solicitud.pdf}" 
                                    data-id="${solicitud._id}"
                                    data-nombre="${solicitud.nombre}"
                                    data-apellido="${solicitud.apellido}"
                                    data-email="${solicitud.email}">
                                Ver PDF
                            </button>
                        ` : '<span class="text-gray-400">Sin documento</span>'}
                    </td>
                </tr>
            `;
        });

        container.innerHTML = html;

        // Agregar event listeners
        agregarEventListenersAprobacion('estudiante');

    } catch (error) {
        console.error('Error al cargar solicitudes de estudiantes:', error);
        container.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-red-500">Error al cargar solicitudes</td></tr>';
    }
}

// Agregar event listeners para aprobar/rechazar
function agregarEventListenersAprobacion(tipo) {
    document.querySelectorAll('.btn-aprobar').forEach(btn => {
        btn.addEventListener('click', async function () {
            const id = this.dataset.id;
            await aprobarSolicitud(id, tipo);
        });
    });

    document.querySelectorAll('.btn-rechazar').forEach(btn => {
        btn.addEventListener('click', async function () {
            const id = this.dataset.id;
            await rechazarSolicitud(id, tipo);
        });
    });

    document.querySelectorAll('.btn-ver-pdf-modal').forEach(btn => {
        btn.addEventListener('click', function () {
            const pdf = this.dataset.pdf;
            const id = this.dataset.id;
            const nombre = this.dataset.nombre;
            const apellido = this.dataset.apellido;
            const email = this.dataset.email;
            const materias = this.dataset.materias;
            mostrarModalSolicitud(id, pdf, nombre, apellido, email, materias, tipo);
        });
    });

    document.querySelectorAll('.btn-ver-pdf').forEach(btn => {
        btn.addEventListener('click', function () {
            const pdf = this.dataset.pdf;
            const id = this.dataset.id;
            togglePDF(id, pdf);
        });
    });

    document.querySelectorAll('.btn-cerrar-pdf').forEach(btn => {
        btn.addEventListener('click', function () {
            const id = this.dataset.id;
            ocultarPDF(id);
        });
    });
}

// Inicializar event listeners de modales al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    // Botón de cancelar rechazo
    const btnCancelarRechazo = document.getElementById('btn-cancelar-rechazo');
    if (btnCancelarRechazo) {
        btnCancelarRechazo.addEventListener('click', cancelarRechazo);
    }
    
    // Botón de confirmar rechazo
    const btnConfirmarRechazo = document.getElementById('btn-confirmar-rechazo');
    if (btnConfirmarRechazo) {
        btnConfirmarRechazo.addEventListener('click', confirmarRechazo);
    }
    
    // Botón de cerrar modal de éxito
    const btnCerrarExito = document.getElementById('btn-cerrar-exito');
    if (btnCerrarExito) {
        btnCerrarExito.addEventListener('click', cerrarModalExito);
    }
});

// Aprobar solicitud
async function aprobarSolicitud(id, tipo) {
    try {
        await APIClient.aprobarSolicitud(id);
        mostrarModalExito('Solicitud aprobada exitosamente');

        if (tipo === 'tutor') {
            await cargarSolicitudesTutores();
        } else {
            await cargarSolicitudesEstudiantes();
        }
    } catch (error) {
        console.error('Error al aprobar solicitud:', error);
        mostrarModalExito('Error al aprobar solicitud: ' + error.message);
    }
}

// Rechazar solicitud
async function rechazarSolicitud(id, tipo) {
    // Guardar la información en variables globales temporales
    window.solicitudARechazar = { id, tipo };
    
    // Mostrar modal de confirmación
    const modalConfirmar = document.getElementById('modal-confirmar-rechazo');
    modalConfirmar.classList.remove('hidden');
    modalConfirmar.classList.add('flex');
}

// Función para confirmar el rechazo
async function confirmarRechazo() {
    const { id, tipo } = window.solicitudARechazar;
    
    // Ocultar modal de confirmación
    const modalConfirmar = document.getElementById('modal-confirmar-rechazo');
    modalConfirmar.classList.add('hidden');
    modalConfirmar.classList.remove('flex');
    
    try {
        await APIClient.rechazarSolicitud(id);
        mostrarModalExito('Solicitud rechazada exitosamente');

        if (tipo === 'tutor') {
            await cargarSolicitudesTutores();
        } else {
            await cargarSolicitudesEstudiantes();
        }
    } catch (error) {
        console.error('Error al rechazar solicitud:', error);
        mostrarModalExito('Error al rechazar solicitud: ' + error.message);
    }
}

// Mostrar modal de éxito
function mostrarModalExito(mensaje) {
    const modalExito = document.getElementById('modal-exito');
    const mensajeExito = document.getElementById('mensaje-exito');
    
    mensajeExito.textContent = mensaje;
    modalExito.classList.remove('hidden');
    modalExito.classList.add('flex');
}

// Cerrar modal de éxito
function cerrarModalExito() {
    const modalExito = document.getElementById('modal-exito');
    modalExito.classList.add('hidden');
    modalExito.classList.remove('flex');
}

// Cancelar rechazo
function cancelarRechazo() {
    const modalConfirmar = document.getElementById('modal-confirmar-rechazo');
    modalConfirmar.classList.add('hidden');
    modalConfirmar.classList.remove('flex');
    window.solicitudARechazar = null;
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

// Mostrar modal con solicitud y PDF
function mostrarModalSolicitud(id, pdfBase64, nombre, apellido, email, materias, tipo) {
    const modal = document.getElementById('modal-solicitud');
    const detalleSolicitud = document.getElementById('detalle-solicitud');
    const pdfEmbed = document.getElementById('pdf-embed');
    
    // Llenar detalles de la solicitud
    detalleSolicitud.innerHTML = `
        <div class="bg-gray-50 p-4 rounded-lg">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <p class="text-sm text-gray-600">Nombre:</p>
                    <p class="font-semibold text-gray-800">${nombre} ${apellido}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-600">Email:</p>
                    <p class="font-semibold text-gray-800">${email}</p>
                </div>
                ${tipo === 'tutor' ? `
                <div class="col-span-2">
                    <p class="text-sm text-gray-600">Materias:</p>
                    <p class="font-semibold text-gray-800">${materias}</p>
                </div>
                ` : ''}
            </div>
        </div>
    `;
    
    // Cargar PDF
    pdfEmbed.src = pdfBase64;
    
    // Mostrar/ocultar sección de materias
    const seccionMaterias = document.getElementById('seccion-materias');
    if (tipo === 'tutor') {
        seccionMaterias.classList.remove('hidden');
    } else {
        seccionMaterias.classList.add('hidden');
    }
    
    // Guardar ID actual de la solicitud
    solicitudActual = { id, tipo };
    
    // Configurar botones
    const btnAprobar = document.getElementById('btn-aprobar');
    const btnRechazar = document.getElementById('btn-rechazar');
    
    btnAprobar.onclick = async () => {
        await aprobarSolicitud(id, tipo);
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    };
    
    btnRechazar.onclick = async () => {
        await rechazarSolicitud(id, tipo);
    };
    
    // Mostrar modal
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}


// Cargar materias para encuesta
async function cargarMateriasEncuesta() {
    try {
        const materias = await APIClient.obtenerMaterias();
        const select = document.getElementById('materia-encuesta');
        select.innerHTML = '<option value="">Selecciona una materia</option>';

        materias.forEach(materia => {
            const option = document.createElement('option');
            option.value = materia._id;
            option.textContent = materia.nombre;
            option.dataset.nombre = materia.nombre;
            select.appendChild(option);
        });

        // Event listener para cargar preguntas al cambiar materia
        select.addEventListener('change', async function () {
            if (this.value) {
                await cargarPreguntasGuardadas(this.value);
            }
        });
    } catch (error) {
        console.error('Error al cargar materias:', error);
        const mensaje = document.getElementById('mensaje-encuesta');
        if (mensaje) {
            mensaje.className = 'alert alert-danger mt-3';
            mensaje.textContent = 'Error al cargar las materias';
            mensaje.style.display = 'block';
        }
    }

    // Event listener para guardar pregunta
    const form = document.getElementById('form-crear-pregunta');
    if (form) {
        form.addEventListener('submit', async function (e) {
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
                    <td><span class="badge bg-primary">${pregunta.materiaNombre || pregunta.materia}</span></td>
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
