// Funcionalidad de la página de respuestas de encuestas

let tutoriaId = null;
let materiaNombre = null;

document.addEventListener('DOMContentLoaded', async function() {
    // Obtener parámetros de la URL
    const urlParams = new URLSearchParams(window.location.search);
    tutoriaId = urlParams.get('tutoriaId');
    materiaNombre = urlParams.get('materia');

    if (!tutoriaId || !materiaNombre) {
        alert('Parámetros inválidos');
        window.location.href = '/tutor';
        return;
    }

    // Verificar sesión
    const sesion = await obtenerSesion();
    if (!sesion) {
        window.location.href = '/';
        return;
    }

    // Verificar que sea tutor
    if (sesion.rol !== 'Tutor') {
        alert('Solo los tutores pueden ver las respuestas');
        window.location.href = '/';
        return;
    }

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

    // Cargar respuestas
    await cargarRespuestas();

    // Ocultar loading y mostrar contenido
    document.getElementById('loading-screen').classList.add('hidden');
    document.getElementById('main-content').classList.remove('hidden');
});

async function obtenerSesion() {
    try {
        const response = await APIClient.getSession();
        if (response.success) {
            return response.usuario;
        }
        return null;
    } catch (error) {
        console.error('Error al obtener sesión:', error);
        return null;
    }
}

async function cerrarSesion() {
    try {
        await APIClient.logout();
        window.location.href = '/';
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        window.location.href = '/';
    }
}

async function cargarRespuestas() {
    try {
        // Actualizar nombre de materia
        document.getElementById('nombre-materia').textContent = materiaNombre;

        // Obtener preguntas de la materia
        const preguntasResponse = await APIClient.getPreguntasPorMateria(materiaNombre);
        const preguntas = preguntasResponse.preguntas;

        if (preguntas.length === 0) {
            mostrarMensajeError('No hay preguntas configuradas para esta materia.');
            return;
        }

        // Obtener promedios por pregunta
        let promediosPorPregunta = {};
        let totalRespuestas = 0;

        try {
            const promediosResponse = await APIClient.getPromediosPorPregunta(tutoriaId);
            promediosPorPregunta = promediosResponse.promedios || {};
            totalRespuestas = promediosResponse.totalRespuestas || 0;
        } catch (error) {
            console.warn('No se pudieron cargar los promedios:', error);
        }

        // Actualizar total de respuestas
        document.getElementById('total-respuestas').textContent = totalRespuestas;

        // Verificar si hay respuestas
        const hayRespuestas = Object.keys(promediosPorPregunta).length > 0;

        if (!hayRespuestas) {
            document.getElementById('sin-respuestas').classList.remove('hidden');
            document.getElementById('preguntas-container').classList.add('hidden');
            return;
        }

        // Mostrar preguntas con sus promedios
        mostrarPreguntasConPromedios(preguntas, promediosPorPregunta);

    } catch (error) {
        console.error('Error al cargar respuestas:', error);
        mostrarMensajeError('Error al cargar las respuestas. Por favor, intenta de nuevo.');
    }
}

function mostrarPreguntasConPromedios(preguntas, promedios) {
    const container = document.getElementById('preguntas-container');
    container.innerHTML = '';

    preguntas.forEach((pregunta, index) => {
        const promedio = promedios[pregunta._id] || 0;
        const porcentaje = (promedio / 5) * 100;

        // Determinar color según el promedio
        let colorClasses = '';
        if (promedio >= 4) {
            colorClasses = 'bg-green-500';
        } else if (promedio >= 3) {
            colorClasses = 'bg-yellow-500';
        } else if (promedio >= 2) {
            colorClasses = 'bg-orange-500';
        } else {
            colorClasses = 'bg-red-500';
        }

        const html = `
            <div class="bg-white rounded-lg shadow-md p-6">
                <div class="flex items-start justify-between mb-4">
                    <div class="flex-1">
                        <h3 class="text-lg font-semibold text-gray-800 mb-2">
                            ${index + 1}. ${pregunta.pregunta}
                        </h3>
                    </div>
                    <div class="ml-4 text-right">
                        <div class="text-3xl font-bold text-gray-800">${promedio.toFixed(1)}</div>
                        <div class="text-sm text-gray-500">de 5.0</div>
                    </div>
                </div>

                <!-- Barra de progreso -->
                <div class="w-full bg-gray-200 rounded-full h-4 mb-4">
                    <div class="${colorClasses} h-4 rounded-full transition-all duration-500" style="width: ${porcentaje}%"></div>
                </div>

                <!-- Escala visual -->
                <div class="flex items-center justify-between text-sm text-gray-600">
                    <div class="flex flex-col items-center">
                        <span class="text-2xl mb-1">😞</span>
                        <span>1</span>
                    </div>
                    <div class="flex flex-col items-center">
                        <span class="text-2xl mb-1">🙁</span>
                        <span>2</span>
                    </div>
                    <div class="flex flex-col items-center">
                        <span class="text-2xl mb-1">😐</span>
                        <span>3</span>
                    </div>
                    <div class="flex flex-col items-center">
                        <span class="text-2xl mb-1">🙂</span>
                        <span>4</span>
                    </div>
                    <div class="flex flex-col items-center">
                        <span class="text-2xl mb-1">😊</span>
                        <span>5</span>
                    </div>
                </div>

                <!-- Interpretación -->
                <div class="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p class="text-sm text-gray-700">
                        <strong>Interpretación:</strong> 
                        ${getInterpretacion(promedio)}
                    </p>
                </div>
            </div>
        `;

        container.innerHTML += html;
    });
}

function getInterpretacion(promedio) {
    if (promedio >= 4.5) {
        return 'Excelente desempeño. Los estudiantes están muy satisfechos con este aspecto.';
    } else if (promedio >= 4) {
        return 'Buen desempeño. Los estudiantes están satisfechos con este aspecto.';
    } else if (promedio >= 3) {
        return 'Desempeño aceptable. Hay espacio para mejoras en este aspecto.';
    } else if (promedio >= 2) {
        return 'Desempeño por debajo del promedio. Se recomienda revisar este aspecto.';
    } else if (promedio > 0) {
        return 'Área de oportunidad significativa. Se requiere atención especial en este aspecto.';
    } else {
        return 'Sin respuestas para esta pregunta.';
    }
}

function mostrarMensajeError(mensaje) {
    const container = document.getElementById('preguntas-container');
    container.innerHTML = `
        <div class="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
            <div class="flex items-start">
                <svg class="w-6 h-6 text-red-500 mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <div>
                    <h3 class="text-lg font-semibold text-red-800 mb-2">Error</h3>
                    <p class="text-red-700">${mensaje}</p>
                </div>
            </div>
        </div>
    `;
}
