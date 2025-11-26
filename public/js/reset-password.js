// Página de Reset Password - Cambiar contraseña con token

document.addEventListener('DOMContentLoaded', async function() {
    const loadingState = document.getElementById('loading-state');
    const formState = document.getElementById('form-state');
    const errorState = document.getElementById('error-state');
    const form = document.getElementById('form-reset-password');
    const mensajeDiv = document.getElementById('mensaje-reset');
    const btnSubmit = document.getElementById('btn-submit');
    const emailInfo = document.getElementById('email-info');
    const userEmail = document.getElementById('user-email');

    // Obtener token de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
        showErrorState();
        return;
    }

    // Verificar token
    await verifyToken(token);

    // Manejar submit del formulario
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validar que las contraseñas coincidan
        if (newPassword !== confirmPassword) {
            mostrarMensaje('Las contraseñas no coinciden', 'error');
            return;
        }

        // Validar contraseña (mismo criterio que registro)
        if (!validarPassword(newPassword)) {
            mostrarMensaje('La contraseña debe tener al menos 8 caracteres, incluyendo una letra, un número y un carácter especial', 'error');
            return;
        }

        // Deshabilitar botón durante la petición
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Actualizando...';

        try {
            const response = await APIClient.resetPassword(token, newPassword);

            if (response.success) {
                mostrarMensaje(response.message, 'success');
                
                // Redirigir al login después de 2 segundos
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                mostrarMensaje(response.message || 'Error al resetear la contraseña', 'error');
                btnSubmit.disabled = false;
                btnSubmit.textContent = 'Actualizar Contraseña';
            }
        } catch (error) {
            console.error('Error en reset-password:', error);
            mostrarMensaje('Error de conexión. Por favor intenta nuevamente.', 'error');
            btnSubmit.disabled = false;
            btnSubmit.textContent = 'Actualizar Contraseña';
        }
    });

    async function verifyToken(token) {
        try {
            const response = await APIClient.verifyResetToken(token);

            if (response.success) {
                // Token válido, mostrar formulario
                loadingState.style.display = 'none';
                formState.style.display = 'block';
                
                // Mostrar email si está disponible
                if (response.email) {
                    userEmail.textContent = response.email;
                    emailInfo.style.display = 'block';
                }
            } else {
                // Token inválido
                showErrorState();
            }
        } catch (error) {
            console.error('Error al verificar token:', error);
            showErrorState();
        }
    }

    function showErrorState() {
        loadingState.style.display = 'none';
        formState.style.display = 'none';
        errorState.style.display = 'block';
    }

    function mostrarMensaje(mensaje, tipo) {
        mensajeDiv.textContent = mensaje;
        mensajeDiv.className = `mensaje ${tipo} show`;
        
        // Auto-ocultar mensaje de error después de 5 segundos
        if (tipo === 'error') {
            setTimeout(() => {
                mensajeDiv.classList.remove('show');
            }, 5000);
        }
    }

    // Validar contraseña (mínimo 8 caracteres, con letra, número y carácter especial)
    function validarPassword(password) {
        if (password.length < 8) return false;
        
        const tieneLetra = /[a-zA-Z]/.test(password);
        const tieneNumero = /[0-9]/.test(password);
        const tieneEspecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        
        return tieneLetra && tieneNumero && tieneEspecial;
    }
});
