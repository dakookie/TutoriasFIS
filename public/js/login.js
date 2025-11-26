// Página de Login - Adaptada para API REST con JWT

document.addEventListener('DOMContentLoaded', async function() {
    const form = document.getElementById('form-login');
    const mensajeDiv = document.getElementById('mensaje-login');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const usuario = document.getElementById('usuario').value.trim();
        const password = document.getElementById('password').value;

        if (!usuario || !password) {
            mostrarMensajeAuth(mensajeDiv, 'Por favor completa todos los campos', 'error');
            return;
        }

        try {
            // Llamar a la API de login
            const response = await APIClient.login(usuario, password);

            if (response.success) {
                // El token ya se guardó en APIClient.login()
                guardarSesion(response.usuario);
                mostrarMensajeAuth(mensajeDiv, '¡Inicio de sesión exitoso!', 'success');
                
                // Redirigir según el rol después de un breve delay
                setTimeout(() => {
                    redireccionarSegunRol(response.usuario);
                }, 500);
            } else {
                mostrarMensajeAuth(mensajeDiv, response.message || 'Error al iniciar sesión', 'error');
            }
        } catch (error) {
            console.error('Error en login:', error);
            mostrarMensajeAuth(mensajeDiv, 'Error de conexión. Intenta nuevamente.', 'error');
        }
    });
});
