// Funcionalidad para el Aula Virtual
// HU-013: Acceso al material de estudio de tutor
// HU-014: Publicar bibliografía de la tutoría
// HU-015: Comunicación con los estudiantes de la tutoría

let tutoriaId = null;
let esTutor = false;

document.addEventListener('DOMContentLoaded', async function() {
    // Obtener ID de la tutoría desde la URL
    const urlParams = new URLSearchParams(window.location.search);
    tutoriaId = urlParams.get('id');

    if (!tutoriaId) {
        alert('ID de tutoría no válido');
        window.location.href = '/';
        return;
    }

    // Verificar sesión
    const sesion = await obtenerSesion();
    if (!sesion) {
        window.location.href = '/';
        return;
    }

    // Ocultar loading y mostrar contenido
    const loadingScreen = document.getElementById('loading-screen');
    const mainContent = document.getElementById('main-content');
    
    if (loadingScreen) loadingScreen.classList.add('hidden');
    if (mainContent) mainContent.classList.remove('hidden');

    // Inicializar tabs
    initializeTabs();

    // Inicializar Socket.IO
    initializeSocket();

    // Mostrar nombre de usuario
    const nombreUsuarioSpan = document.getElementById('usuario-nombre');
    if (nombreUsuarioSpan) {
        nombreUsuarioSpan.textContent = `${sesion.nombre} ${sesion.apellido}`;
    }

    // Botón de cerrar sesión
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', cerrarSesion);
    }

    // Botón volver
    const btnVolver = document.getElementById('btn-volver');
    if (btnVolver) {
        btnVolver.addEventListener('click', () => {
            if (sesion.rol === 'Tutor') {
                window.location.href = '/tutor';
            } else if (sesion.rol === 'Estudiante') {
                window.location.href = '/estudiante';
            }
        });
    }

    // Cargar información del aula
    await cargarAulaInfo();
    
    // Solo cargar publicaciones y bibliografías si el aula está configurada
    // (o si es estudiante, que solo puede ver)
    const response = await APIClient.getAulaInfo(tutoriaId);
    const tutoria = response.tutoria;
    
    if (tutoria.aulaConfigurada || !esTutor) {
        await cargarPublicaciones();
        await cargarBibliografias();
    }

    // Configurar formularios si es tutor
    if (esTutor) {
        inicializarFormularioPublicacion();
        inicializarFormularioBibliografia();
    }

    // Escuchar eventos de Socket.IO
    if (window.socket) {
        socket.on('nuevaPublicacion', async (data) => {
            await cargarPublicaciones();
        });

        socket.on('nuevaBibliografia', async (data) => {
            await cargarBibliografias();
        });
    }
    
    // Event listener para botón de configurar aula
    const btnConfigurarAula = document.getElementById('btn-configurar-aula');
    if (btnConfigurarAula) {
        btnConfigurarAula.addEventListener('click', function() {
            mostrarModalConfiguracion(false);
        });
    }

    // Event listener para botón de editar configuración aula
    const btnEditarConfiguracionAula = document.getElementById('btn-editar-configuracion-aula');
    if (btnEditarConfiguracionAula) {
        btnEditarConfiguracionAula.addEventListener('click', function() {
            mostrarModalConfiguracion(true);
        });
    }
});

function initializeTabs() {
    const tabs = document.querySelectorAll('[data-tab]');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetId = this.getAttribute('data-tab');
            
            // Remove active class from all tabs
            tabs.forEach(t => {
                t.classList.remove('border-blue-600', 'text-blue-600');
                t.classList.add('border-transparent', 'text-gray-700');
            });
            
            // Add active class to clicked tab
            this.classList.remove('border-transparent', 'text-gray-700');
            this.classList.add('border-blue-600', 'text-blue-600');
            
            // Hide all tab panes
            const panes = document.querySelectorAll('.tab-pane');
            panes.forEach(pane => {
                pane.classList.remove('show', 'active');
            });
            
            // Show target pane
            const targetPane = document.getElementById(targetId);
            if (targetPane) {
                targetPane.classList.add('show', 'active');
            }
        });
    });
}

async function cargarAulaInfo() {
    try {
        const response = await APIClient.getAulaInfo(tutoriaId);
        const { tutoria, esTutor: esTutorResponse } = response;
        
        esTutor = esTutorResponse;

        // Actualizar títulos
        const nombreMateria = tutoria.materiaNombre || tutoria.materia;
        document.getElementById('nombre-tutoria').textContent = `Aula: ${nombreMateria}`;
        document.getElementById('titulo-aula').textContent = `Aula Virtual: Aula de ${nombreMateria.toUpperCase()}`;

        // Actualizar información de la tutoría
        document.getElementById('info-materia').textContent = nombreMateria;
        
        // Mostrar modalidad
        const modalidad = tutoria.modalidadAula || 'No configurada';
        document.getElementById('info-modalidad').textContent = modalidad;
        
        // Mostrar aula o enlace según modalidad
        if (tutoria.modalidadAula === 'Presencial') {
            document.getElementById('info-aula-container').classList.remove('hidden');
            document.getElementById('info-enlace-container').classList.add('hidden');
            document.getElementById('info-aula').textContent = tutoria.nombreAula || '-';
        } else if (tutoria.modalidadAula === 'Virtual') {
            document.getElementById('info-aula-container').classList.add('hidden');
            document.getElementById('info-enlace-container').classList.remove('hidden');
            const linkReunion = document.getElementById('link-reunion');
            if (tutoria.enlaceReunion) {
                linkReunion.href = tutoria.enlaceReunion;
                linkReunion.textContent = 'Ir a la reunión';
                linkReunion.className = 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition inline-block';
            } else {
                linkReunion.textContent = '-';
            }
        } else {
            // No configurada
            document.getElementById('info-aula-container').classList.remove('hidden');
            document.getElementById('info-enlace-container').classList.add('hidden');
            document.getElementById('info-aula').textContent = '-';
        }
        
        // Formatear fecha y horario
        const fecha = new Date(tutoria.fecha);
        const fechaFormateada = fecha.toLocaleDateString('es-EC', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        const horario = `${tutoria.horaInicio} - ${tutoria.horaFin} del ${fechaFormateada}`;
        document.getElementById('info-horario').textContent = horario;
        
        document.getElementById('info-tutor').textContent = tutoria.tutorNombre;

        // Mostrar formularios solo si es tutor
        if (esTutor) {
            document.getElementById('form-nueva-publicacion').classList.remove('hidden');
            document.getElementById('form-subir-bibliografia').classList.remove('hidden');
            
            // Mostrar botón de configurar si no está configurada, o botón de editar si ya está configurada
            if (!tutoria.aulaConfigurada) {
                document.getElementById('btn-configurar-aula').classList.remove('hidden');
                document.getElementById('btn-editar-configuracion-aula').classList.add('hidden');
            } else {
                document.getElementById('btn-configurar-aula').classList.add('hidden');
                document.getElementById('btn-editar-configuracion-aula').classList.remove('hidden');
            }
        }

    } catch (error) {
        console.error('Error al cargar información del aula:', error);
        alert('No tienes acceso a esta aula');
        window.location.href = '/';
    }
}

// Funciones para manejar modales
function mostrarModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function cerrarModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function cerrarModalConfiguracion() {
    cerrarModal('modalConfiguracionAula');
}

function cerrarModalEditarPublicacion() {
    cerrarModal('modalEditarPublicacion');
}

function cerrarModalEditarBibliografia() {
    cerrarModal('modalEditarBibliografia');
}

async function mostrarModalConfiguracion(esEdicion = false) {
    const modalElement = document.getElementById('modalConfiguracionAula');
    
    // Obtener elementos del formulario
    const selectModalidad = document.getElementById('modalidad-aula');
    const campoAulaPresencial = document.getElementById('campo-aula-presencial');
    const campoEnlaceVirtual = document.getElementById('campo-enlace-virtual');
    const inputNombreAula = document.getElementById('nombre-aula');
    const inputEnlaceReunion = document.getElementById('enlace-reunion');
    const btnGuardar = document.getElementById('btn-guardar-configuracion');
    const tituloModal = document.getElementById('titulo-modal-configuracion');

    // Cambiar título del modal
    tituloModal.textContent = esEdicion ? 'Editar Configuración del Aula' : 'Configurar Aula Virtual';

    // Si es edición, cargar datos actuales
    if (esEdicion) {
        try {
            const response = await APIClient.getAulaInfo(tutoriaId);
            const tutoria = response.tutoria;
            
            selectModalidad.value = tutoria.modalidadAula || '';
            
            if (tutoria.modalidadAula === 'Presencial') {
                inputNombreAula.value = tutoria.nombreAula || '';
                inputEnlaceReunion.value = '';
                campoAulaPresencial.classList.remove('hidden');
                campoEnlaceVirtual.classList.add('hidden');
                inputNombreAula.required = true;
                inputEnlaceReunion.required = false;
            } else if (tutoria.modalidadAula === 'Virtual') {
                inputNombreAula.value = '';
                inputEnlaceReunion.value = tutoria.enlaceReunion || '';
                campoAulaPresencial.classList.add('hidden');
                campoEnlaceVirtual.classList.remove('hidden');
                inputNombreAula.required = false;
                inputEnlaceReunion.required = true;
            }
        } catch (error) {
            console.error('Error al cargar configuración actual:', error);
        }
    } else {
        // Limpiar valores previos
        selectModalidad.value = '';
        inputNombreAula.value = '';
        inputEnlaceReunion.value = '';
        campoAulaPresencial.classList.add('hidden');
        campoEnlaceVirtual.classList.add('hidden');
    }

    // Remover event listeners previos clonando elementos
    const newSelectModalidad = selectModalidad.cloneNode(true);
    selectModalidad.parentNode.replaceChild(newSelectModalidad, selectModalidad);
    
    const newBtnGuardar = btnGuardar.cloneNode(true);
    btnGuardar.parentNode.replaceChild(newBtnGuardar, btnGuardar);

    // Agregar event listener para cambio de modalidad
    newSelectModalidad.addEventListener('change', function(e) {
        const modalidad = e.target.value;
        const newInputNombreAula = document.getElementById('nombre-aula');
        const newInputEnlaceReunion = document.getElementById('enlace-reunion');
        const newCampoAulaPresencial = document.getElementById('campo-aula-presencial');
        const newCampoEnlaceVirtual = document.getElementById('campo-enlace-virtual');
        
        if (modalidad === 'Presencial') {
            newCampoAulaPresencial.classList.remove('hidden');
            newCampoEnlaceVirtual.classList.add('hidden');
            newInputNombreAula.required = true;
            newInputEnlaceReunion.required = false;
            newInputEnlaceReunion.value = '';
        } else if (modalidad === 'Virtual') {
            newCampoAulaPresencial.classList.add('hidden');
            newCampoEnlaceVirtual.classList.remove('hidden');
            newInputNombreAula.required = false;
            newInputNombreAula.value = '';
            newInputEnlaceReunion.required = true;
        } else {
            newCampoAulaPresencial.classList.add('hidden');
            newCampoEnlaceVirtual.classList.add('hidden');
            newInputNombreAula.required = false;
            newInputEnlaceReunion.required = false;
        }
    });

    // Agregar event listener para guardar configuración
    newBtnGuardar.addEventListener('click', async function() {
        const modalidadFinal = document.getElementById('modalidad-aula').value;
        const nombreAulaFinal = document.getElementById('nombre-aula').value.trim();
        const enlaceReunionFinal = document.getElementById('enlace-reunion').value.trim();

        // Validaciones
        if (!modalidadFinal) {
            alert('Por favor, selecciona una modalidad');
            return;
        }

        if (modalidadFinal === 'Presencial' && !nombreAulaFinal) {
            alert('Por favor, ingresa el nombre del aula');
            return;
        }

        if (modalidadFinal === 'Virtual' && !enlaceReunionFinal) {
            alert('Por favor, ingresa el enlace de la reunión');
            return;
        }

        try {
            if (esEdicion) {
                await APIClient.editarConfiguracionAula(tutoriaId, modalidadFinal, nombreAulaFinal, enlaceReunionFinal);
            } else {
                await APIClient.configurarAula(tutoriaId, modalidadFinal, nombreAulaFinal, enlaceReunionFinal);
            }
            
            // Cerrar modal
            cerrarModal('modalConfiguracionAula');
            
            // Actualizar botones de configuración
            if (!esEdicion) {
                document.getElementById('btn-configurar-aula').classList.add('hidden');
                document.getElementById('btn-editar-configuracion-aula').classList.remove('hidden');
            }
            
            // Recargar información del aula
            await cargarAulaInfo();
            
            // Cargar publicaciones y bibliografías si no están cargadas
            if (!esEdicion) {
                await cargarPublicaciones();
                await cargarBibliografias();
            }
            
            alert(esEdicion ? 'Configuración actualizada exitosamente' : 'Aula configurada exitosamente');
        } catch (error) {
            console.error('Error al configurar el aula:', error);
            alert(error.message || 'Error al configurar el aula');
        }
    });

    mostrarModal('modalConfiguracionAula');
}

function inicializarFormularioPublicacion() {
    const form = document.getElementById('publicacion-form');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const titulo = document.getElementById('titulo-publicacion').value.trim();
        const contenido = document.getElementById('contenido-publicacion').value.trim();
        const imagenInput = document.getElementById('imagen-publicacion');

        if (!titulo) {
            alert('El título es requerido');
            return;
        }

        if (!contenido) {
            alert('El contenido es requerido');
            return;
        }

        let imagenBase64 = null;
        let extensionImagen = null;

        // Si hay imagen, validar y convertir a base64
        if (imagenInput.files && imagenInput.files.length > 0) {
            const file = imagenInput.files[0];
            extensionImagen = file.name.split('.').pop().toLowerCase();
            const tiposPermitidos = ['png', 'jpg', 'jpeg', 'gif'];

            if (!tiposPermitidos.includes(extensionImagen)) {
                alert('Solo se permiten imágenes (PNG, JPG, JPEG, GIF)');
                return;
            }

            // Convertir a base64
            imagenBase64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (event) => resolve(event.target.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        }

        try {
            await APIClient.crearPublicacion(tutoriaId, titulo, contenido, imagenBase64, extensionImagen);
            
            // Limpiar formulario
            form.reset();
            
            // Recargar publicaciones
            await cargarPublicaciones();
            
            alert('Publicación creada exitosamente');
        } catch (error) {
            console.error('Error al crear publicación:', error);
            alert(error.message || 'Error al crear publicación');
        }
    });
}

function inicializarFormularioBibliografia() {
    const form = document.getElementById('bibliografia-form');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const titulo = document.getElementById('titulo-bibliografia').value.trim();
        const archivoInput = document.getElementById('archivo-bibliografia');

        if (!titulo) {
            alert('El título es requerido');
            return;
        }

        if (!archivoInput.files || archivoInput.files.length === 0) {
            alert('Debes seleccionar un archivo');
            return;
        }

        const file = archivoInput.files[0];
        const extension = file.name.split('.').pop().toLowerCase();
        const tiposPermitidos = ['pdf', 'docx', 'xlsx', 'ppt', 'pptx'];

        if (!tiposPermitidos.includes(extension)) {
            alert('Solo se permiten documentos: PDF, DOCX, XLSX, PPT, PPTX');
            return;
        }

        // Convertir archivo a base64
        const reader = new FileReader();
        reader.onload = async function(event) {
            const archivoBase64 = event.target.result;

            try {
                await APIClient.subirBibliografia(tutoriaId, titulo, archivoBase64, extension);
                
                // Limpiar formulario
                form.reset();
                
                // Recargar bibliografías
                await cargarBibliografias();
                
                alert('Bibliografía subida exitosamente');
            } catch (error) {
                console.error('Error al subir bibliografía:', error);
                alert(error.message || 'Error al subir bibliografía');
            }
        };

        reader.readAsDataURL(file);
    });
}

async function cargarPublicaciones() {
    const container = document.getElementById('lista-publicaciones');
    
    try {
        const response = await APIClient.getPublicaciones(tutoriaId);
        const publicaciones = response.publicaciones;

        if (publicaciones.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">No hay publicaciones aún</p>';
            return;
        }

        let html = '';
        publicaciones.forEach(pub => {
            const fecha = new Date(pub.createdAt).toLocaleDateString('es-EC', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            html += `
                <div class="bg-white border border-gray-200 rounded-lg p-6 mb-4 shadow-sm" id="publicacion-${pub._id}">
                    <div class="flex justify-between items-start mb-3">
                        <h5 class="text-xl font-semibold text-gray-800">${pub.titulo}</h5>
                        ${esTutor ? `
                            <div class="flex space-x-2">
                                <button class="border border-blue-600 text-blue-600 hover:bg-blue-50 px-3 py-1 rounded text-sm font-medium transition btn-editar-publicacion" data-id="${pub._id}" data-titulo="${pub.titulo.replace(/"/g, '&quot;')}" data-contenido="${pub.contenido.replace(/"/g, '&quot;')}" data-imagen="${pub.imagen || ''}" data-tipoimagen="${pub.tipoImagen || ''}">
                                    Editar
                                </button>
                                <button class="border border-red-600 text-red-600 hover:bg-red-50 px-3 py-1 rounded text-sm font-medium transition btn-eliminar-publicacion" data-id="${pub._id}">
                                    Eliminar
                                </button>
                            </div>
                        ` : ''}
                    </div>
                    <p class="text-gray-700 mb-3">${pub.contenido}</p>
                    ${pub.imagen ? `<div class="mt-3 mb-3"><img src="${pub.imagen}" alt="Imagen de publicación" class="rounded-lg" style="max-width: 100%; max-height: 400px;"></div>` : ''}
                    <p class="text-gray-500 text-sm">
                        ${pub.tutorNombre} • ${fecha}
                    </p>
                </div>
            `;
        });

        container.innerHTML = html;

        // Agregar event listeners a los botones de editar
        if (esTutor) {
            document.querySelectorAll('.btn-editar-publicacion').forEach(btn => {
                btn.addEventListener('click', function() {
                    const id = this.dataset.id;
                    const titulo = this.dataset.titulo.replace(/&quot;/g, '"');
                    const contenido = this.dataset.contenido.replace(/&quot;/g, '"');
                    const imagen = this.dataset.imagen;
                    const tipoImagen = this.dataset.tipoimagen;
                    mostrarModalEditarPublicacion(id, titulo, contenido, imagen, tipoImagen);
                });
            });

            document.querySelectorAll('.btn-eliminar-publicacion').forEach(btn => {
                btn.addEventListener('click', async function() {
                    const id = this.dataset.id;
                    if (confirm('¿Estás seguro de que deseas eliminar esta publicación?')) {
                        await eliminarPublicacion(id);
                    }
                });
            });
        }

    } catch (error) {
        console.error('Error al cargar publicaciones:', error);
        container.innerHTML = '<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">Error al cargar publicaciones</div>';
    }
}

async function cargarBibliografias() {
    const container = document.getElementById('lista-bibliografias');
    
    try {
        const response = await APIClient.getBibliografias(tutoriaId);
        const bibliografias = response.bibliografias;

        if (bibliografias.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">No hay bibliografías disponibles</p>';
            return;
        }

        let html = '';
        bibliografias.forEach(bib => {
            let iconColor = 'text-gray-600';
            let badgeColor = 'bg-gray-500';
            let fileIcon = 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z';
            
            // Iconos según tipo de archivo
            if (bib.tipoArchivo === 'pdf') {
                iconColor = 'text-red-600';
                badgeColor = 'bg-red-500';
            } else if (bib.tipoArchivo === 'docx') {
                iconColor = 'text-blue-600';
                badgeColor = 'bg-blue-500';
            } else if (bib.tipoArchivo === 'xlsx') {
                iconColor = 'text-green-600';
                badgeColor = 'bg-green-500';
            } else if (bib.tipoArchivo === 'ppt' || bib.tipoArchivo === 'pptx') {
                iconColor = 'text-orange-600';
                badgeColor = 'bg-orange-500';
            }
            
            html += `
                <div class="bg-white border border-gray-200 rounded-lg p-4 mb-3 shadow-sm" id="bibliografia-${bib._id}">
                    <div class="flex justify-between items-start">
                        <div class="flex-grow">
                            <h5 class="text-lg font-semibold text-gray-800 mb-1">
                                <svg class="inline-block w-5 h-5 mr-2 -mt-1 ${iconColor}" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="${fileIcon}"></path>
                                </svg>
                                ${bib.titulo}
                                <span class="inline-block ${badgeColor} text-white text-xs font-semibold px-2 py-1 rounded ml-2">${bib.tipoArchivo.toUpperCase()}</span>
                            </h5>
                            <small class="text-gray-500">Subido por ${bib.tutorNombre}</small>
                        </div>
                        <div class="flex space-x-2 ml-3">
                            <button class="border border-blue-600 text-blue-600 hover:bg-blue-50 px-3 py-1 rounded text-sm font-medium transition btn-descargar-bibliografia" 
                                    data-archivo="${bib.archivo}" 
                                    data-tipo="${bib.tipoArchivo}"
                                    data-titulo="${bib.titulo}">
                                Descargar
                            </button>
                            ${esTutor ? `
                                <button class="border border-gray-400 text-gray-700 hover:bg-gray-50 px-3 py-1 rounded text-sm font-medium transition btn-editar-bibliografia" 
                                        data-id="${bib._id}"
                                        data-titulo="${bib.titulo.replace(/"/g, '&quot;')}">
                                    Editar
                                </button>
                                <button class="border border-red-600 text-red-600 hover:bg-red-50 px-3 py-1 rounded text-sm font-medium transition btn-eliminar-bibliografia" 
                                        data-id="${bib._id}">
                                    Eliminar
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;

        // Agregar event listeners a los botones de descargar
        document.querySelectorAll('.btn-descargar-bibliografia').forEach(btn => {
            btn.addEventListener('click', function() {
                const archivo = this.dataset.archivo;
                const tipo = this.dataset.tipo;
                const titulo = this.dataset.titulo;
                descargarArchivo(archivo, tipo, titulo);
            });
        });

        // Agregar event listeners a los botones de editar y eliminar (solo tutor)
        if (esTutor) {
            document.querySelectorAll('.btn-editar-bibliografia').forEach(btn => {
                btn.addEventListener('click', function() {
                    const id = this.dataset.id;
                    const titulo = this.dataset.titulo.replace(/&quot;/g, '"');
                    mostrarModalEditarBibliografia(id, titulo);
                });
            });

            document.querySelectorAll('.btn-eliminar-bibliografia').forEach(btn => {
                btn.addEventListener('click', async function() {
                    const id = this.dataset.id;
                    if (confirm('¿Estás seguro de que deseas eliminar esta bibliografía?')) {
                        await eliminarBibliografia(id);
                    }
                });
            });
        }

    } catch (error) {
        console.error('Error al cargar bibliografías:', error);
        container.innerHTML = '<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">Error al cargar bibliografías</div>';
    }
}

function descargarArchivo(archivoBase64, tipo, titulo) {
    // Crear un enlace temporal para descargar
    const link = document.createElement('a');
    link.href = archivoBase64;
    link.download = `${titulo}.${tipo}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Funciones para editar y eliminar publicaciones
function mostrarModalEditarPublicacion(id, titulo, contenido, imagen, tipoImagen) {
    document.getElementById('edit-publicacion-id').value = id;
    document.getElementById('edit-titulo-publicacion').value = titulo;
    document.getElementById('edit-contenido-publicacion').value = contenido;
    document.getElementById('edit-imagen-publicacion').value = '';

    // Mostrar imagen actual si existe
    const imagenContainer = document.getElementById('imagen-actual-container');
    if (imagen && imagen !== 'null' && imagen !== '') {
        imagenContainer.innerHTML = `<img src="${imagen}" alt="Imagen actual" class="rounded-lg" style="max-width: 200px;">`;
    } else {
        imagenContainer.innerHTML = '<p class="text-gray-500">No hay imagen</p>';
    }

    // Event listener para guardar
    const btnGuardar = document.getElementById('btn-guardar-editar-publicacion');
    const newBtnGuardar = btnGuardar.cloneNode(true);
    btnGuardar.parentNode.replaceChild(newBtnGuardar, btnGuardar);

    newBtnGuardar.addEventListener('click', async function() {
        const nuevoTitulo = document.getElementById('edit-titulo-publicacion').value.trim();
        const nuevoContenido = document.getElementById('edit-contenido-publicacion').value.trim();
        const imagenInput = document.getElementById('edit-imagen-publicacion');

        if (!nuevoTitulo || !nuevoContenido) {
            alert('El título y el contenido son requeridos');
            return;
        }

        let nuevaImagen = null;
        let nuevoTipoImagen = null;

        // Si hay nueva imagen, validar y convertir
        if (imagenInput.files && imagenInput.files.length > 0) {
            const file = imagenInput.files[0];
            nuevoTipoImagen = file.name.split('.').pop().toLowerCase();
            const tiposPermitidos = ['png', 'jpg', 'jpeg', 'gif'];

            if (!tiposPermitidos.includes(nuevoTipoImagen)) {
                alert('Solo se permiten imágenes (PNG, JPG, JPEG, GIF)');
                return;
            }

            nuevaImagen = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (event) => resolve(event.target.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        }

        try {
            await APIClient.editarPublicacion(tutoriaId, id, nuevoTitulo, nuevoContenido, nuevaImagen, nuevoTipoImagen);
            cerrarModal('modalEditarPublicacion');
            await cargarPublicaciones();
            alert('Publicación actualizada exitosamente');
        } catch (error) {
            console.error('Error al actualizar publicación:', error);
            alert(error.message || 'Error al actualizar publicación');
        }
    });

    mostrarModal('modalEditarPublicacion');
}

async function eliminarPublicacion(id) {
    try {
        await APIClient.eliminarPublicacion(tutoriaId, id);
        await cargarPublicaciones();
        alert('Publicación eliminada exitosamente');
    } catch (error) {
        console.error('Error al eliminar publicación:', error);
        alert(error.message || 'Error al eliminar publicación');
    }
}

// Funciones para editar y eliminar bibliografías
function mostrarModalEditarBibliografia(id, titulo) {
    document.getElementById('edit-bibliografia-id').value = id;
    document.getElementById('edit-titulo-bibliografia').value = titulo;

    // Event listener para guardar
    const btnGuardar = document.getElementById('btn-guardar-editar-bibliografia');
    const newBtnGuardar = btnGuardar.cloneNode(true);
    btnGuardar.parentNode.replaceChild(newBtnGuardar, btnGuardar);

    newBtnGuardar.addEventListener('click', async function() {
        const nuevoTitulo = document.getElementById('edit-titulo-bibliografia').value.trim();

        if (!nuevoTitulo) {
            alert('El título es requerido');
            return;
        }

        try {
            await APIClient.editarBibliografia(tutoriaId, id, nuevoTitulo);
            cerrarModal('modalEditarBibliografia');
            await cargarBibliografias();
            alert('Bibliografía actualizada exitosamente');
        } catch (error) {
            console.error('Error al actualizar bibliografía:', error);
            alert(error.message || 'Error al actualizar bibliografía');
        }
    });

    mostrarModal('modalEditarBibliografia');
}

async function eliminarBibliografia(id) {
    try {
        await APIClient.eliminarBibliografia(tutoriaId, id);
        await cargarBibliografias();
        alert('Bibliografía eliminada exitosamente');
    } catch (error) {
        console.error('Error al eliminar bibliografía:', error);
        alert(error.message || 'Error al eliminar bibliografía');
    }
}

