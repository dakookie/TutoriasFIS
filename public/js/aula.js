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
    
    if (loadingScreen) loadingScreen.style.display = 'none';
    if (mainContent) mainContent.classList.add('show');

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

async function cargarAulaInfo() {
    try {
        const response = await APIClient.getAulaInfo(tutoriaId);
        const { tutoria, esTutor: esTutorResponse } = response;
        
        esTutor = esTutorResponse;

        // Actualizar títulos
        document.getElementById('nombre-tutoria').textContent = `Aula: ${tutoria.materia}`;
        document.getElementById('titulo-aula').textContent = `Aula Virtual: Aula de ${tutoria.materia.toUpperCase()}`;

        // Actualizar información de la tutoría
        document.getElementById('info-materia').textContent = tutoria.materia;
        
        // Mostrar modalidad
        const modalidad = tutoria.modalidadAula || 'No configurada';
        document.getElementById('info-modalidad').textContent = modalidad;
        
        // Mostrar aula o enlace según modalidad
        if (tutoria.modalidadAula === 'Presencial') {
            document.getElementById('info-aula-container').style.display = 'block';
            document.getElementById('info-enlace-container').style.display = 'none';
            document.getElementById('info-aula').textContent = tutoria.nombreAula || '-';
        } else if (tutoria.modalidadAula === 'Virtual') {
            document.getElementById('info-aula-container').style.display = 'none';
            document.getElementById('info-enlace-container').style.display = 'block';
            const linkReunion = document.getElementById('link-reunion');
            if (tutoria.enlaceReunion) {
                linkReunion.href = tutoria.enlaceReunion;
                linkReunion.textContent = 'Ir a la reunión';
                linkReunion.classList.add('btn', 'btn-sm', 'btn-primary');
            } else {
                linkReunion.textContent = '-';
            }
        } else {
            // No configurada
            document.getElementById('info-aula-container').style.display = 'block';
            document.getElementById('info-enlace-container').style.display = 'none';
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
            document.getElementById('form-nueva-publicacion').style.display = 'block';
            document.getElementById('form-subir-bibliografia').style.display = 'block';
            
            // Mostrar botón de configurar si no está configurada, o botón de editar si ya está configurada
            if (!tutoria.aulaConfigurada) {
                document.getElementById('btn-configurar-aula').style.display = 'inline-block';
                document.getElementById('btn-editar-configuracion-aula').style.display = 'none';
            } else {
                document.getElementById('btn-configurar-aula').style.display = 'none';
                document.getElementById('btn-editar-configuracion-aula').style.display = 'inline-block';
            }
        }

    } catch (error) {
        console.error('Error al cargar información del aula:', error);
        alert('No tienes acceso a esta aula');
        window.location.href = '/';
    }
}

async function mostrarModalConfiguracion(esEdicion = false) {
    const modalElement = document.getElementById('modalConfiguracionAula');
    
    // Crear modal con opciones que permiten cerrarlo
    const modal = new bootstrap.Modal(modalElement, {
        backdrop: true,  // Permite cerrar al hacer clic fuera
        keyboard: true   // Permite cerrar con ESC
    });
    
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
                campoAulaPresencial.style.display = 'block';
                campoEnlaceVirtual.style.display = 'none';
                inputNombreAula.required = true;
                inputEnlaceReunion.required = false;
            } else if (tutoria.modalidadAula === 'Virtual') {
                inputNombreAula.value = '';
                inputEnlaceReunion.value = tutoria.enlaceReunion || '';
                campoAulaPresencial.style.display = 'none';
                campoEnlaceVirtual.style.display = 'block';
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
        campoAulaPresencial.style.display = 'none';
        campoEnlaceVirtual.style.display = 'none';
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
            newCampoAulaPresencial.style.display = 'block';
            newCampoEnlaceVirtual.style.display = 'none';
            newInputNombreAula.required = true;
            newInputEnlaceReunion.required = false;
            newInputEnlaceReunion.value = '';
        } else if (modalidad === 'Virtual') {
            newCampoAulaPresencial.style.display = 'none';
            newCampoEnlaceVirtual.style.display = 'block';
            newInputNombreAula.required = false;
            newInputNombreAula.value = '';
            newInputEnlaceReunion.required = true;
        } else {
            newCampoAulaPresencial.style.display = 'none';
            newCampoEnlaceVirtual.style.display = 'none';
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
            modal.hide();
            
            // Actualizar botones de configuración
            if (!esEdicion) {
                document.getElementById('btn-configurar-aula').style.display = 'none';
                document.getElementById('btn-editar-configuracion-aula').style.display = 'inline-block';
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

    modal.show();
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
            container.innerHTML = '<p class="text-muted text-center">No hay publicaciones aún</p>';
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
                <div class="card mb-3" id="publicacion-${pub._id}">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h5 class="card-title mb-0">${pub.titulo}</h5>
                            ${esTutor ? `
                                <div class="btn-group btn-group-sm">
                                    <button class="btn btn-outline-primary btn-editar-publicacion" data-id="${pub._id}" data-titulo="${pub.titulo.replace(/"/g, '&quot;')}" data-contenido="${pub.contenido.replace(/"/g, '&quot;')}" data-imagen="${pub.imagen || ''}" data-tipoimagen="${pub.tipoImagen || ''}">
                                        <i class="bi bi-pencil"></i> Editar
                                    </button>
                                    <button class="btn btn-outline-danger btn-eliminar-publicacion" data-id="${pub._id}">
                                        <i class="bi bi-trash"></i> Eliminar
                                    </button>
                                </div>
                            ` : ''}
                        </div>
                        <p class="card-text">${pub.contenido}</p>
                        ${pub.imagen ? `<div class="mt-3 mb-3"><img src="${pub.imagen}" alt="Imagen de publicación" class="img-fluid rounded" style="max-width: 100%; max-height: 400px;"></div>` : ''}
                        <p class="text-muted small mb-0">
                            <i class="bi bi-person-circle me-1"></i>${pub.tutorNombre} • 
                            <i class="bi bi-calendar3 me-1"></i>${fecha}
                        </p>
                    </div>
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
        container.innerHTML = '<div class="alert alert-danger">Error al cargar publicaciones</div>';
    }
}

async function cargarBibliografias() {
    const container = document.getElementById('lista-bibliografias');
    
    try {
        const response = await APIClient.getBibliografias(tutoriaId);
        const bibliografias = response.bibliografias;

        if (bibliografias.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">No hay bibliografías disponibles</p>';
            return;
        }

        let html = '<div class="list-group">';
        bibliografias.forEach(bib => {
            let icono = 'bi-file-earmark-fill text-secondary';
            let colorBadge = 'secondary';
            
            // Iconos según tipo de archivo
            if (bib.tipoArchivo === 'pdf') {
                icono = 'bi-file-pdf-fill text-danger';
                colorBadge = 'danger';
            } else if (bib.tipoArchivo === 'docx') {
                icono = 'bi-file-word-fill text-primary';
                colorBadge = 'primary';
            } else if (bib.tipoArchivo === 'xlsx') {
                icono = 'bi-file-excel-fill text-success';
                colorBadge = 'success';
            } else if (bib.tipoArchivo === 'ppt' || bib.tipoArchivo === 'pptx') {
                icono = 'bi-file-ppt-fill text-warning';
                colorBadge = 'warning';
            }
            
            html += `
                <div class="list-group-item" id="bibliografia-${bib._id}">
                    <div class="d-flex w-100 justify-content-between align-items-start">
                        <div class="flex-grow-1">
                            <h5 class="mb-1">
                                <i class="bi ${icono} me-2"></i>${bib.titulo}
                                <span class="badge bg-${colorBadge} ms-2">${bib.tipoArchivo.toUpperCase()}</span>
                            </h5>
                            <small class="text-muted">Subido por ${bib.tutorNombre}</small>
                        </div>
                        <div class="btn-group btn-group-sm ms-3">
                            <button class="btn btn-outline-primary btn-descargar-bibliografia" 
                                    data-archivo="${bib.archivo}" 
                                    data-tipo="${bib.tipoArchivo}"
                                    data-titulo="${bib.titulo}">
                                <i class="bi bi-download"></i> Descargar
                            </button>
                            ${esTutor ? `
                                <button class="btn btn-outline-secondary btn-editar-bibliografia" 
                                        data-id="${bib._id}"
                                        data-titulo="${bib.titulo.replace(/"/g, '&quot;')}">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="btn btn-outline-danger btn-eliminar-bibliografia" 
                                        data-id="${bib._id}">
                                    <i class="bi bi-trash"></i>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';

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
        container.innerHTML = '<div class="alert alert-danger">Error al cargar bibliografías</div>';
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
    const modal = new bootstrap.Modal(document.getElementById('modalEditarPublicacion'), {
        backdrop: true,
        keyboard: true
    });

    document.getElementById('edit-publicacion-id').value = id;
    document.getElementById('edit-titulo-publicacion').value = titulo;
    document.getElementById('edit-contenido-publicacion').value = contenido;
    document.getElementById('edit-imagen-publicacion').value = '';

    // Mostrar imagen actual si existe
    const imagenContainer = document.getElementById('imagen-actual-container');
    if (imagen && imagen !== 'null' && imagen !== '') {
        imagenContainer.innerHTML = `<img src="${imagen}" alt="Imagen actual" class="img-fluid rounded" style="max-width: 200px;">`;
    } else {
        imagenContainer.innerHTML = '<p class="text-muted">No hay imagen</p>';
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
            modal.hide();
            await cargarPublicaciones();
            alert('Publicación actualizada exitosamente');
        } catch (error) {
            console.error('Error al actualizar publicación:', error);
            alert(error.message || 'Error al actualizar publicación');
        }
    });

    modal.show();
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
    const modal = new bootstrap.Modal(document.getElementById('modalEditarBibliografia'), {
        backdrop: true,
        keyboard: true
    });

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
            modal.hide();
            await cargarBibliografias();
            alert('Bibliografía actualizada exitosamente');
        } catch (error) {
            console.error('Error al actualizar bibliografía:', error);
            alert(error.message || 'Error al actualizar bibliografía');
        }
    });

    modal.show();
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
