// Funciones de autenticación

// Verificar si hay una sesión activa
function verificarSesion() {
    const sesion = obtenerSesion();
    return sesion !== null;
}

// Obtener sesión actual
function obtenerSesion() {
    try {
        const sesionJSON = sessionStorage.getItem('sesionActual');
        return sesionJSON ? JSON.parse(sesionJSON) : null;
    } catch (error) {
        console.error('Error al obtener sesión:', error);
        return null;
    }
}

// Guardar sesión
function guardarSesion(usuario) {
    try {
        sessionStorage.setItem('sesionActual', JSON.stringify(usuario));
    } catch (error) {
        console.error('Error al guardar sesión:', error);
    }
}

// Cerrar sesión
function cerrarSesion() {
    sessionStorage.removeItem('sesionActual');
    window.location.href = 'login.html';
}

// Validaciones de formulario de registro

// Validar nombre y apellido (solo letras y espacios)
function validarNombre(nombre) {
    const regex = /^[a-záéíóúñA-ZÁÉÍÓÚÑ\s]+$/;
    return regex.test(nombre);
}

// Validar correo institucional (@epn.edu.ec)
function validarCorreoInstitucional(correo) {
    return correo.endsWith('@epn.edu.ec');
}

// Validar nombre de usuario (solo letras y números, sin espacios ni caracteres especiales)
function validarNombreUsuario(usuario) {
    const regex = /^[a-zA-Z0-9]+$/;
    return regex.test(usuario);
}

// Validar contraseña (mínimo 8 caracteres, con letra, número y carácter especial)
function validarPassword(password) {
    if (password.length < 8) return false;
    
    const tieneLetra = /[a-zA-Z]/.test(password);
    const tieneNumero = /[0-9]/.test(password);
    const tieneEspecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return tieneLetra && tieneNumero && tieneEspecial;
}

// Validar archivo PDF
function validarArchivoPDF(archivo) {
    if (!archivo) return false;
    return archivo.type === 'application/pdf';
}

// Convertir archivo a Base64 para almacenamiento
function archivoABase64(archivo) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(archivo);
    });
}

// Función auxiliar para mostrar mensajes
function mostrarMensajeAuth(elemento, mensaje, tipo) {
    elemento.className = `mensaje ${tipo}`;
    elemento.textContent = mensaje;
    elemento.style.display = 'block';
    
    // Ocultar mensaje después de 5 segundos
    setTimeout(() => {
        elemento.style.display = 'none';
    }, 5000);
}

// Función auxiliar para mostrar errores de validación
function mostrarError(elementoId, mensaje) {
    const elemento = document.getElementById(elementoId);
    if (elemento) {
        elemento.textContent = mensaje;
    }
}

// Función auxiliar para limpiar errores
function limpiarErrores() {
    document.querySelectorAll('.error-message').forEach(elemento => {
        elemento.textContent = '';
    });
}

// Redireccionar según el rol del usuario
function redireccionarSegunRol(usuario) {
    switch(usuario.rol) {
        case 'Administrador':
            window.location.href = 'admin.html';
            break;
        case 'Tutor':
            window.location.href = 'index.html';
            break;
        case 'Estudiante':
            window.location.href = 'index.html';
            break;
        default:
            window.location.href = 'login.html';
    }
}

// Proteger páginas según el rol
function protegerPagina(rolesPermitidos) {
    const sesion = obtenerSesion();
    
    if (!sesion) {
        window.location.href = 'login.html';
        return null;
    }
    
    if (rolesPermitidos && !rolesPermitidos.includes(sesion.rol)) {
        alert('No tienes permisos para acceder a esta página');
        redireccionarSegunRol(sesion);
        return null;
    }
    
    return sesion;
}
