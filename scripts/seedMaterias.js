const mongoose = require('mongoose');
const Materia = require('../models/Materia');
require('dotenv').config();

const materias = [
    // Primer Semestre
    { nombre: 'Álgebra Lineal', codigo: 'MAT101', semestre: 1 },
    { nombre: 'Cálculo en una Variable', codigo: 'MAT102', semestre: 1 },
    { nombre: 'Mecánica Newtoniana', codigo: 'FIS101', semestre: 1 },
    { nombre: 'Programación I', codigo: 'INF101', semestre: 1 },
    { nombre: 'Comunicación Oral y Escrita', codigo: 'COM101', semestre: 1 },
    
    // Segundo Semestre
    { nombre: 'Ecuaciones Diferenciales Ordinarias', codigo: 'MAT201', semestre: 2 },
    { nombre: 'Matemáticas Computacionales y Teoría de la Computación', codigo: 'MAT202', semestre: 2 },
    { nombre: 'Fundamentos de Electrónica para Computación', codigo: 'ELE201', semestre: 2 },
    { nombre: 'Programación II', codigo: 'INF201', semestre: 2 },
    { nombre: 'Análisis Socioeconómico y Político del Ecuador', codigo: 'SOC201', semestre: 2 },
    
    // Tercer Semestre
    { nombre: 'Probabilidad y Estadísticas Básicas', codigo: 'MAT301', semestre: 3 },
    { nombre: 'Sistemas Operativos', codigo: 'INF301', semestre: 3 },
    { nombre: 'Arquitectura de Computadores', codigo: 'INF302', semestre: 3 },
    { nombre: 'Estructura de Datos y Algoritmos I', codigo: 'INF303', semestre: 3 },
    { nombre: 'Fundamentos de Redes y Conectividad', codigo: 'INF304', semestre: 3 },
    { nombre: 'Asignatura de Artes y Humanidades', codigo: 'ART301', semestre: 3 },
    
    // Cuarto Semestre
    { nombre: 'Ingeniería de Software y de Requerimientos', codigo: 'INF401', semestre: 4 },
    { nombre: 'Compiladores y Lenguajes', codigo: 'INF402', semestre: 4 },
    { nombre: 'Fundamentos de Sistemas de Información', codigo: 'INF403', semestre: 4 },
    { nombre: 'Estructura de Datos y Algoritmos II', codigo: 'INF404', semestre: 4 },
    { nombre: 'Fundamentos de Bases de Datos', codigo: 'INF405', semestre: 4 },
    { nombre: 'Asignatura de Economía y Sociedad', codigo: 'ECO401', semestre: 4 },
    
    // Quinto Semestre
    { nombre: 'Gestión Organizacional', codigo: 'ADM501', semestre: 5 },
    { nombre: 'Diseño de Software', codigo: 'INF501', semestre: 5 },
    { nombre: 'Computación Gráfica', codigo: 'INF502', semestre: 5 },
    { nombre: 'Inteligencia Artificial y Aprendizaje Automático', codigo: 'INF503', semestre: 5 },
    { nombre: 'Bases de Datos Distribuidas', codigo: 'INF504', semestre: 5 },
    
    // Sexto Semestre
    { nombre: 'Prácticas de Servicio Comunitario', codigo: 'SER601', semestre: 6 },
    { nombre: 'Metodologías Ágiles', codigo: 'INF601', semestre: 6 },
    { nombre: 'Aplicaciones Web', codigo: 'INF602', semestre: 6 },
    { nombre: 'Construcción y Evolución de Software', codigo: 'INF603', semestre: 6 },
    { nombre: 'Tecnologías de Seguridad', codigo: 'INF604', semestre: 6 },
    
    // Séptimo Semestre
    { nombre: 'Calidad de Software', codigo: 'INF701', semestre: 7 },
    { nombre: 'Gestión de Procesos y Calidad', codigo: 'INF702', semestre: 7 },
    { nombre: 'Ingeniería Financiera', codigo: 'FIN701', semestre: 7 },
    { nombre: 'Aplicaciones Móviles', codigo: 'INF703', semestre: 7 },
    { nombre: 'Usabilidad y Accesibilidad', codigo: 'INF704', semestre: 7 },
    
    // Octavo Semestre
    { nombre: 'Interacción Humano Computador', codigo: 'INF801', semestre: 8 },
    { nombre: 'Desarrollo de Aplicaciones Web Avanzadas', codigo: 'INF802', semestre: 8 },
    { nombre: 'Juegos Interactivos', codigo: 'INF803', semestre: 8 },
    { nombre: 'Auditoría Informática', codigo: 'INF804', semestre: 8 },
    { nombre: 'Business Intelligence', codigo: 'INF805', semestre: 8 },
    { nombre: 'Verificación y Validación de Software', codigo: 'INF806', semestre: 8 },
    { nombre: 'Automatización de Procesos', codigo: 'INF807', semestre: 8 },
    
    // Noveno Semestre
    { nombre: 'Profesionalismo en Informática', codigo: 'INF901', semestre: 9 },
    { nombre: 'Sistemas Embebidos', codigo: 'INF902', semestre: 9 },
    { nombre: 'Gestión de Proyectos de Software', codigo: 'INF903', semestre: 9 },
    { nombre: 'Prácticas Laborales', codigo: 'PRA901', semestre: 9 },
    { nombre: 'Diseño de Trabajo de Integración Curricular / Preparación Examen Complexivo', codigo: 'TIC901', semestre: 9 },
    
    // Décimo Semestre
    { nombre: 'Trabajo de Integración Curricular / Examen Complexivo', codigo: 'TIC1001', semestre: 10 },
    { nombre: 'Desarrollo de Software Seguro', codigo: 'INF1001', semestre: 10 }
];

async function seedMaterias() {
    try {
        // Conectar a la base de datos
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tutoriasFIS');
        console.log('✓ Conectado a MongoDB');
        
        // Limpiar colección existente
        await Materia.deleteMany({});
        console.log('✓ Colección de materias limpiada');
        
        // Insertar materias
        const result = await Materia.insertMany(materias);
        console.log(`✓ ${result.length} materias insertadas correctamente`);
        
        // Mostrar algunas materias insertadas
        console.log('\nEjemplos de materias insertadas:');
        result.slice(0, 5).forEach(materia => {
            console.log(`  - ${materia.nombre} (${materia.codigo}) - Semestre ${materia.semestre}`);
        });
        
        console.log('\n✓ Proceso completado exitosamente');
        process.exit(0);
    } catch (error) {
        console.error('✗ Error al poblar materias:', error);
        process.exit(1);
    }
}

seedMaterias();
