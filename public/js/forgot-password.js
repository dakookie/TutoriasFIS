// Página de Forgot Password - Solicitar reseteo de contraseña

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('form-forgot-password');
    const mensajeDiv = document.getElementById('mensaje-forgot');
    const tokenDisplay = document.getElementById('token-display');
    const btnSubmit = document.getElementById('btn-submit');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();

        if (!email) {
            mostrarMensaje('Por favor ingresa tu correo electrónico', 'error');
            return;
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            mostrarMensaje('Por favor ingresa un correo electrónico válido', 'error');
            return;
        }

        // Deshabilitar botón durante la petición
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Enviando...';

        try {
            const response = await APIClient.forgotPassword(email);

            if (response.success) {
                mostrarMensaje(response.message, 'success');
                
                // Mostrar el token en desarrollo (solo para testing)
                if (response.devToken) {
                    tokenDisplay.innerHTML = `
                        <strong>MODO DESARROLLO:</strong><br>
                        Token de reseteo: <code>${response.devToken}</code><br>
                        <a href="reset-password.html?token=${response.devToken}" style="color: #667eea; text-decoration: underline; margin-top: 10px; display: inline-block;">
                            Hacer clic aquí para resetear contraseña
                        </a>
                    `;
                    tokenDisplay.style.display = 'block';
                }

                // Limpiar formulario
                form.reset();
            } else {
                mostrarMensaje(response.message || 'Error al enviar la solicitud', 'error');
            }
        } catch (error) {
            console.error('Error en forgot-password:', error);
            mostrarMensaje('Error de conexión. Por favor intenta nuevamente.', 'error');
        } finally {
            // Rehabilitar botón
            btnSubmit.disabled = false;
            btnSubmit.textContent = 'Enviar Instrucciones';
        }
    });

    function mostrarMensaje(mensaje, tipo) {
        mensajeDiv.textContent = mensaje;
        mensajeDiv.className = `mensaje ${tipo} show`;
        
        // Auto-ocultar mensaje después de 5 segundos (excepto success con token)
        if (tipo !== 'success') {
            setTimeout(() => {
                mensajeDiv.classList.remove('show');
            }, 5000);
        }
    }
});
