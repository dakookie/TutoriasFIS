// Archivo principal - Inicialización y navegación entre pestañas

document.addEventListener('DOMContentLoaded', function() {
    // Proteger página - solo tutores y estudiantes
    const sesion = protegerPagina(['Tutor', 'Estudiante']);
    if (!sesion) return;

    // Mostrar nombre de usuario en navbar
    const nombreUsuarioSpan = document.getElementById('usuario-nombre');
    if (nombreUsuarioSpan) {
        nombreUsuarioSpan.textContent = `Hola ${sesion.nombre} ${sesion.apellido}, Bienvenid@ (${sesion.rol})`;
    }

    // Botón de cerrar sesión
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', cerrarSesion);
    }

    // Mostrar/ocultar pestañas según el rol
    configurarVistaSegunRol(sesion);
    
    // Inicializar funcionalidad de pestañas
    inicializarPestanas();
    
    // Inicializar formulario de registro de tutoría (solo tutores)
    if (sesion.rol === 'Tutor') {
        inicializarFormularioTutoria(sesion);
    }
    
    // Cargar datos iniciales
    if (sesion.rol === 'Tutor') {
        cargarTutoriasCreadas(sesion);
    }
    
    if (sesion.rol === 'Estudiante') {
        cargarTutoriasDisponibles();
        cargarSolicitudesEstudiante(sesion);
    }
});

function configurarVistaSegunRol(sesion) {
    const tutorSection = document.querySelector('[data-tab="tutor"]');
    const estudianteSection = document.querySelector('[data-tab="estudiante"]');

    if (sesion.rol === 'Tutor') {
        // Mostrar solo vista de tutor
        tutorSection.classList.add('active');
        estudianteSection.style.display = 'none';
        document.getElementById('tutor-section').classList.add('active');
    } else if (sesion.rol === 'Estudiante') {
        // Mostrar solo vista de estudiante
        tutorSection.style.display = 'none';
        estudianteSection.classList.add('active');
        document.getElementById('estudiante-section').classList.add('active');
    }
}

function inicializarPestanas() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            const sesion = obtenerSesion();

            // Remover clase active de todos los botones y contenidos
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Agregar clase active al botón y contenido seleccionado
            this.classList.add('active');
            document.getElementById(`${tabName}-section`).classList.add('active');

            // Recargar datos según la pestaña
            if (tabName === 'tutor') {
                cargarTutoriasCreadas(sesion);
            } else if (tabName === 'estudiante') {
                cargarTutoriasDisponibles();
                cargarSolicitudesEstudiante(sesion);
            }
        });
    });
}
