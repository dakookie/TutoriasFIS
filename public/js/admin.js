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
            // Usar username del modelo o generar uno basado en el email
            const nombreUsuario = solicitud.username || solicitud.email.split('@')[0];
            
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
            // Usar username del modelo o generar uno basado en el email
            const nombreUsuario = solicitud.username || solicitud.email.split('@')[0];
            
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
        const filtroSelect = document.getElementById('filtro-materia-preguntas');
        
        select.innerHTML = '<option value="">Selecciona una materia</option>';

        materias.forEach(materia => {
            const option = document.createElement('option');
            option.value = materia._id;
            option.textContent = materia.nombre;
            option.dataset.nombre = materia.nombre;
            select.appendChild(option);
        });

        // Llenar también el filtro de materias
        if (filtroSelect) {
            filtroSelect.innerHTML = '<option value="">Todas las materias</option>';
            materias.forEach(materia => {
                const option = document.createElement('option');
                option.value = materia._id;
                option.textContent = materia.nombre;
                filtroSelect.appendChild(option);
            });
            
            // Event listener para filtrar preguntas
            filtroSelect.addEventListener('change', async function () {
                if (this.value) {
                    await cargarPreguntasGuardadas(this.value);
                } else {
                    await cargarPreguntasGuardadas();
                }
            });
        }

        // Event listener para limpiar filtro
        const btnLimpiarFiltro = document.getElementById('btn-limpiar-filtro');
        if (btnLimpiarFiltro) {
            btnLimpiarFiltro.addEventListener('click', async function () {
                filtroSelect.value = '';
                await cargarPreguntasGuardadas();
            });
        }

        // Event listener para cargar preguntas al cambiar materia en el selector de crear pregunta
        select.addEventListener('change', async function () {
            if (this.value) {
                await cargarPreguntasGuardadas(this.value);
            }
        });
    } catch (error) {
        console.error('Error al cargar materias:', error);
        const mensaje = document.getElementById('mensaje-encuesta');
        if (mensaje) {
            mensaje.className = 'mt-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded';
            mensaje.textContent = 'Error al cargar las materias';
            mensaje.classList.remove('hidden');
        }
    }

    // Event listener para guardar pregunta
    const btnGuardar = document.getElementById('btn-guardar-pregunta');
    if (btnGuardar) {
        btnGuardar.addEventListener('click', async function (e) {
            e.preventDefault();
            await guardarPregunta();
        });
    }

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
            mensaje.className = 'mt-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded';
            mensaje.textContent = 'Por favor, completa todos los campos';
            mensaje.classList.remove('hidden');
        }
        return;
    }

    try {
        await APIClient.crearPregunta(pregunta, materia);

        if (mensaje) {
            mensaje.className = 'mt-3 p-3 bg-green-100 border border-green-400 text-green-700 rounded';
            mensaje.textContent = 'Pregunta guardada exitosamente';
            mensaje.classList.remove('hidden');
        }

        document.getElementById('pregunta-encuesta').value = '';
        await cargarPreguntasGuardadas(materia);

        setTimeout(() => {
            if (mensaje) mensaje.classList.add('hidden');
        }, 3000);
    } catch (error) {
        console.error('Error al crear pregunta:', error);
        if (mensaje) {
            mensaje.className = 'mt-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded';
            mensaje.textContent = 'Error al guardar pregunta: ' + error.message;
            mensaje.classList.remove('hidden');
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
                ? `<div class="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded text-center">
                     No hay preguntas guardadas para esta materia
                   </div>`
                : `<div class="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded text-center">
                     No hay preguntas guardadas aún
                   </div>`;
            return;
        }

        // Agrupar preguntas por materia
        const preguntasPorMateria = {};
        preguntas.forEach(pregunta => {
            const materiaNombre = pregunta.materiaNombre || pregunta.materia;
            if (!preguntasPorMateria[materiaNombre]) {
                preguntasPorMateria[materiaNombre] = [];
            }
            preguntasPorMateria[materiaNombre].push(pregunta);
        });

        let html = '';
        
        Object.keys(preguntasPorMateria).sort().forEach(materiaNombre => {
            const preguntasMateria = preguntasPorMateria[materiaNombre];
            
            html += `
                <div class="mb-6 border border-gray-200 rounded-lg overflow-hidden">
                    <div class="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3">
                        <h4 class="text-white font-semibold flex items-center">
                            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            ${materiaNombre}
                            <span class="ml-2 bg-white text-blue-600 px-2 py-1 rounded-full text-xs font-bold">
                                ${preguntasMateria.length} ${preguntasMateria.length === 1 ? 'pregunta' : 'preguntas'}
                            </span>
                        </h4>
                    </div>
                    <div class="bg-white">
            `;
            
            preguntasMateria.forEach((pregunta, index) => {
                html += `
                    <div class="px-4 py-3 ${index > 0 ? 'border-t border-gray-200' : ''} hover:bg-gray-50 transition-colors">
                        <div class="flex items-start">
                            <span class="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm mr-3">
                                ${index + 1}
                            </span>
                            <p class="text-gray-800 flex-1 pt-1">${pregunta.pregunta}</p>
                        </div>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;

    } catch (error) {
        console.error('Error al cargar preguntas:', error);
        container.innerHTML = `
            <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                <strong>Error:</strong> No se pudieron cargar las preguntas
            </div>
        `;
    }
}
