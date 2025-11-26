// Archivo principal para Tutor

document.addEventListener('DOMContentLoaded', async function() {
    // Proteger página - solo tutores
    const sesion = await protegerPagina(['Tutor']);
    if (!sesion) {
        return;
    }

    // Ocultar loading y mostrar contenido
    const loadingScreen = document.getElementById('loading-screen');
    const mainContent = document.getElementById('main-content');
    
    if (loadingScreen) loadingScreen.style.display = 'none';
    if (mainContent) mainContent.classList.add('show');

    // Inicializar Socket.IO
    initializeSocket();

    // Mostrar nombre de usuario en navbar
    const nombreUsuarioSpan = document.getElementById('usuario-nombre');
    if (nombreUsuarioSpan) {
        nombreUsuarioSpan.textContent = `${sesion.nombre} ${sesion.apellido}`;
    }

    // Botón de cerrar sesión
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', cerrarSesion);
    }

    // Inicializar formulario de registro de tutoría
    inicializarFormularioTutoria(sesion);
    
    // Cargar tutorías creadas
    await cargarTutoriasCreadas(sesion);
});
