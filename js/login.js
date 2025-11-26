// Página de Login

document.addEventListener('DOMContentLoaded', function() {
    // Si ya hay sesión, redirigir
    const sesion = obtenerSesion();
    if (sesion) {
        redireccionarSegunRol(sesion);
        return;
    }

    const form = document.getElementById('form-login');
    const mensajeDiv = document.getElementById('mensaje-login');

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const usuario = document.getElementById('usuario').value.trim();
        const password = document.getElementById('password').value;

        // Buscar usuario en la base de datos
        const usuarioEncontrado = db.obtenerUsuarioPorCredenciales(usuario, password);

        if (!usuarioEncontrado) {
            mostrarMensajeAuth(mensajeDiv, 'Usuario o contraseña incorrectos', 'error');
            return;
        }

        // Verificar si el usuario está aprobado
        if (usuarioEncontrado.estado !== 'Aprobado') {
            mostrarMensajeAuth(mensajeDiv, 'Tu cuenta está pendiente de aprobación', 'error');
            return;
        }

        // Guardar sesión
        guardarSesion(usuarioEncontrado);

        // Redirigir según el rol
        redireccionarSegunRol(usuarioEncontrado);
    });
});
