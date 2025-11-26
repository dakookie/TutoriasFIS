// HU-011 y HU-010: Registro de Tutores y Estudiantes

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('form-registro');
    const rolSelect = document.getElementById('rol');
    const grupoArchivo = document.getElementById('grupo-archivo');
    const labelArchivo = document.getElementById('label-archivo');
    const inputArchivo = document.getElementById('archivo');
    const nombreArchivoSpan = document.getElementById('nombre-archivo');
    const btnCancelar = document.getElementById('btn-cancelar');
    const mensajeDiv = document.getElementById('mensaje-registro');

    let archivoSeleccionado = null;

    // Cambio de rol - mostrar/ocultar campo de archivo
    rolSelect.addEventListener('change', function() {
        const rol = this.value;
        
        if (rol === 'Tutor') {
            grupoArchivo.style.display = 'block';
            labelArchivo.textContent = 'Currículum Académico (PDF) *';
            inputArchivo.required = true;
        } else if (rol === 'Estudiante') {
            grupoArchivo.style.display = 'block';
            labelArchivo.textContent = 'Carnet Estudiantil (PDF) *';
            inputArchivo.required = true;
        } else {
            grupoArchivo.style.display = 'none';
            inputArchivo.required = false;
            archivoSeleccionado = null;
        }
    });

    // Manejo de archivo
    inputArchivo.addEventListener('change', function(e) {
        const archivo = e.target.files[0];
        
        if (archivo) {
            if (!validarArchivoPDF(archivo)) {
                mostrarError('error-archivo', 'Solo se permiten archivos PDF');
                this.value = '';
                archivoSeleccionado = null;
                return;
            }
            
            archivoSeleccionado = archivo;
            nombreArchivoSpan.textContent = archivo.name;
            nombreArchivoSpan.parentElement.classList.add('file-uploaded');
            mostrarError('error-archivo', '');
        }
    });

    // Botón Cancelar
    btnCancelar.addEventListener('click', function() {
        if (confirm('¿Estás seguro de que deseas cancelar el registro?')) {
            window.location.href = 'login.html';
        }
    });

    // Envío del formulario
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Limpiar mensajes previos
        limpiarErrores();
        mensajeDiv.style.display = 'none';
        
        // Obtener valores
        const nombre = document.getElementById('nombre').value.trim();
        const apellido = document.getElementById('apellido').value.trim();
        const correo = document.getElementById('correo').value.trim();
        const rol = document.getElementById('rol').value;
        const usuario = document.getElementById('usuario').value.trim();
        const password = document.getElementById('password').value;

        let esValido = true;

        // Validar nombre
        if (!validarNombre(nombre)) {
            mostrarError('error-nombre', 'El nombre solo debe contener letras del alfabeto español y espacios');
            esValido = false;
        }

        // Validar apellido
        if (!validarNombre(apellido)) {
            mostrarError('error-apellido', 'El apellido solo debe contener letras y espacios.');
            esValido = false;
        }

        // Validar correo
        if (!validarCorreoInstitucional(correo)) {
            mostrarError('error-correo', 'El correo debe terminar en @epn.edu.ec.');
            esValido = false;
        }

        // Validar nombre de usuario
        if (!validarNombreUsuario(usuario)) {
            mostrarError('error-usuario', 'El nombre de usuario solo puede contener letras mayúsculas, minúsculas y números, sin espacios ni caracteres especiales.');
            esValido = false;
        }

        // Validar contraseña
        if (!validarPassword(password)) {
            mostrarError('error-password', 'La contraseña debe tener al menos 8 caracteres, incluyendo una letra, un número y un caracter especial.');
            esValido = false;
        }

        // Validar archivo si el rol requiere
        if ((rol === 'Tutor' || rol === 'Estudiante') && !archivoSeleccionado) {
            mostrarError('error-archivo', 'Debes seleccionar un archivo PDF');
            esValido = false;
        }

        if (!esValido) {
            return;
        }

        // Verificar si el usuario ya existe
        if (db.verificarUsuarioExiste(usuario)) {
            mostrarError('error-usuario', 'Este nombre de usuario ya está registrado');
            return;
        }

        // Verificar si el correo ya existe
        if (db.verificarCorreoExiste(correo)) {
            mostrarError('error-correo', 'Este correo ya está registrado');
            return;
        }

        try {
            // Convertir archivo a base64
            let archivoBase64 = null;
            if (archivoSeleccionado) {
                archivoBase64 = await archivoABase64(archivoSeleccionado);
            }

            // Crear solicitud de registro
            const solicitud = {
                nombre,
                apellido,
                correo,
                rol,
                usuario,
                password,
                archivo: archivoBase64,
                nombreArchivo: archivoSeleccionado ? archivoSeleccionado.name : null
            };

            const solicitudCreada = db.crearSolicitudRegistro(solicitud);

            if (solicitudCreada) {
                mostrarMensajeAuth(
                    mensajeDiv, 
                    `Solicitud enviada exitosamente. Tu solicitud está pendiente de aprobación por un administrador.`,
                    'exito'
                );
                
                // Limpiar formulario después de 2 segundos y redirigir
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                mostrarMensajeAuth(mensajeDiv, 'Error al enviar la solicitud', 'error');
            }

        } catch (error) {
            console.error('Error al procesar el registro:', error);
            mostrarMensajeAuth(mensajeDiv, 'Error al procesar el registro', 'error');
        }
    });

    // Validación en tiempo real
    document.getElementById('nombre').addEventListener('blur', function() {
        if (this.value && !validarNombre(this.value)) {
            mostrarError('error-nombre', 'El nombre solo debe contener letras del alfabeto español y espacios');
        } else {
            mostrarError('error-nombre', '');
        }
    });

    document.getElementById('apellido').addEventListener('blur', function() {
        if (this.value && !validarNombre(this.value)) {
            mostrarError('error-apellido', 'El apellido solo debe contener letras y espacios.');
        } else {
            mostrarError('error-apellido', '');
        }
    });

    document.getElementById('correo').addEventListener('blur', function() {
        if (this.value && !validarCorreoInstitucional(this.value)) {
            mostrarError('error-correo', 'El correo debe terminar en @epn.edu.ec.');
        } else {
            mostrarError('error-correo', '');
        }
    });

    document.getElementById('usuario').addEventListener('blur', function() {
        if (this.value && !validarNombreUsuario(this.value)) {
            mostrarError('error-usuario', 'El nombre de usuario solo puede contener letras mayúsculas, minúsculas y números, sin espacios ni caracteres especiales.');
        } else {
            mostrarError('error-usuario', '');
        }
    });

    document.getElementById('password').addEventListener('blur', function() {
        if (this.value && !validarPassword(this.value)) {
            mostrarError('error-password', 'La contraseña debe tener al menos 8 caracteres, incluyendo una letra, un número y un caracter especial.');
        } else {
            mostrarError('error-password', '');
        }
    });
});
