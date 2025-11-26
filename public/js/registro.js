// HU-011 y HU-010: Registro de Tutores y Estudiantes

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('form-registro');
    const rolSelect = document.getElementById('rol');
    const grupoArchivo = document.getElementById('grupo-archivo');
    const grupoMaterias = document.getElementById('grupo-materias');
    const labelArchivo = document.getElementById('label-archivo');
    const inputArchivo = document.getElementById('archivo');
    const inputMaterias = document.getElementById('materias');
    const nombreArchivoSpan = document.getElementById('nombre-archivo');

    const mensajeDiv = document.getElementById('mensaje-registro');

    let archivoSeleccionado = null;

    // Cambio de rol - mostrar/ocultar campo de archivo y materias
    rolSelect.addEventListener('change', function() {
        const rol = this.value;
        
        if (rol === 'Tutor') {
            grupoArchivo.style.display = 'block';
            grupoMaterias.style.display = 'block';
            labelArchivo.textContent = 'Currículum Académico (PDF) *';
            inputArchivo.required = true;
            inputMaterias.required = true;
        } else if (rol === 'Estudiante') {
            grupoArchivo.style.display = 'block';
            grupoMaterias.style.display = 'none';
            labelArchivo.textContent = 'Carnet Estudiantil (PDF) *';
            inputArchivo.required = true;
            inputMaterias.required = false;
        } else {
            grupoArchivo.style.display = 'none';
            grupoMaterias.style.display = 'none';
            inputArchivo.required = false;
            inputMaterias.required = false;
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
        const materiasInput = document.getElementById('materias').value.trim();

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

        // Validar materias si es tutor
        if (rol === 'Tutor' && !materiasInput) {
            mostrarError('error-materias', 'Debes ingresar al menos una materia');
            esValido = false;
        }

        if (!esValido) {
            return;
        }

        try {
            // Convertir archivo a base64
            let archivoBase64 = null;
            if (archivoSeleccionado) {
                archivoBase64 = await archivoABase64(archivoSeleccionado);
            }

            // Procesar materias (convertir string separado por comas a array)
            const materiasArray = rol === 'Tutor' && materiasInput
                ? materiasInput.split(',').map(m => m.trim()).filter(m => m.length > 0)
                : [];

            // Crear objeto de datos para el registro
            const datosRegistro = {
                nombre,
                apellido,
                email: correo, // El backend espera 'email'
                password,
                rol,
                materias: materiasArray,
                pdf: archivoBase64 // El backend espera 'pdf'
            };

            // Llamar a la API de registro
            const response = await APIClient.request('/api/auth/registro', {
                method: 'POST',
                body: JSON.stringify(datosRegistro)
            });

            if (response.success) {
                mostrarMensajeAuth(
                    mensajeDiv, 
                    response.message || 'Solicitud enviada exitosamente. Tu solicitud está pendiente de aprobación por un administrador.',
                    'exito'
                );
                
                // Limpiar formulario después de 2 segundos y redirigir
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                // Mostrar error específico del servidor
                if (response.message.includes('nombre de usuario')) {
                    mostrarError('error-usuario', response.message);
                } else if (response.message.includes('correo')) {
                    mostrarError('error-correo', response.message);
                } else {
                    mostrarMensajeAuth(mensajeDiv, response.message, 'error');
                }
            }

        } catch (error) {
            console.error('Error al procesar el registro:', error);
            mostrarMensajeAuth(mensajeDiv, 'Error de conexión. Intenta nuevamente.', 'error');
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
