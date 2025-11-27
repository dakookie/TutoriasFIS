const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Usuario = require('../models/Usuario');
const Pregunta = require('../models/Pregunta');
const Materia = require('../models/Materia');

const materias = [
    { nombre: "Álgebra Lineal", codigo: "MAT101", semestre: 1 },
    { nombre: "Cálculo en una Variable", codigo: "MAT102", semestre: 1 },
    { nombre: "Programación I", codigo: "INF101", semestre: 1 },
    { nombre: "Ecuaciones Diferenciales Ordinarias", codigo: "MAT201", semestre: 2 },
    { nombre: "Programación II", codigo: "INF102", semestre: 2 },
    { nombre: "Estructura de Datos y Algoritmos I", codigo: "INF201", semestre: 2 },
    { nombre: "Fundamentos de Bases de Datos", codigo: "INF202", semestre: 3 },
    { nombre: "Ingeniería de Software y Requerimientos", codigo: "INF301", semestre: 3 },
    { nombre: "Diseño de Software", codigo: "INF302", semestre: 4 },
    { nombre: "Bases de Datos Distribuidas", codigo: "INF401", semestre: 4 },
    { nombre: "Aplicaciones Web", codigo: "INF402", semestre: 5 },
    { nombre: "Metodologías Ágiles", codigo: "INF403", semestre: 5 },
    { nombre: "Aplicaciones Web Avanzadas", codigo: "INF404", semestre: 6 },
    { nombre: "Gestión de Proyectos de Software", codigo: "INF405", semestre: 6 }
];

const seedData = async () => {
    try {
        // Conectar a MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado a MongoDB');

        // Limpiar colecciones
        await Usuario.deleteMany({});
        await Pregunta.deleteMany({});
        await Materia.deleteMany({});
        console.log('🗑️  Colecciones limpiadas');
    // Insertar materias
    await Materia.insertMany(materias);
    console.log('✅ Materias insertadas');

        // Crear administrador
        const admin = new Usuario({
            nombre: 'Admin',
            apellido: 'Sistema',
            email: 'admin@fis.epn.edu.ec',
            password: 'admin123',
            rol: 'Administrador',
            activo: true
        });
        await admin.save();
        console.log('✅ Administrador creado: admin@fis.epn.edu.ec / admin123');

        // Crear tutores de ejemplo
        const tutores = [
            {
                nombre: 'Juan',
                apellido: 'Pérez',
                email: 'juan.perez@epn.edu.ec',
                password: 'tutor123',
                rol: 'Tutor',
                materias: ['Programación I', 'Programación II', 'Estructura de Datos y Algoritmos I'],
                activo: true
            },
            {
                nombre: 'María',
                apellido: 'González',
                email: 'maria.gonzalez@epn.edu.ec',
                password: 'tutor123',
                rol: 'Tutor',
                materias: ['Aplicaciones Web', 'Aplicaciones Web Avanzadas', 'Metodologías Ágiles'],
                activo: true
            },
            {
                nombre: 'Carlos',
                apellido: 'Ramírez',
                email: 'carlos.ramirez@epn.edu.ec',
                password: 'tutor123',
                rol: 'Tutor',
                materias: ['Fundamentos de Bases de Datos', 'Bases de Datos Distribuidas'],
                activo: true
            }
        ];

        for (const tutorData of tutores) {
            const tutor = new Usuario(tutorData);
            await tutor.save();
        }
        console.log('✅ Tutores creados (password: tutor123)');

        // Crear estudiantes de ejemplo
        const estudiantes = [
            {
                nombre: 'Ana',
                apellido: 'López',
                email: 'ana.lopez@epn.edu.ec',
                password: 'estudiante123',
                rol: 'Estudiante',
                activo: true
            },
            {
                nombre: 'Pedro',
                apellido: 'Martínez',
                email: 'pedro.martinez@epn.edu.ec',
                password: 'estudiante123',
                rol: 'Estudiante',
                activo: true
            },
            {
                nombre: 'Lucía',
                apellido: 'Torres',
                email: 'lucia.torres@epn.edu.ec',
                password: 'estudiante123',
                rol: 'Estudiante',
                activo: true
            }
        ];

        for (const estudianteData of estudiantes) {
            const estudiante = new Usuario(estudianteData);
            await estudiante.save();
        }
        console.log('✅ Estudiantes creados (password: estudiante123)');

        // Crear preguntas de encuesta para algunas materias
        const preguntasGenericas = [
            '¿Qué tan claro fue el contenido presentado en la tutoría?',
            '¿El tutor respondió tus preguntas de manera satisfactoria?',
            '¿Recomendarías esta tutoría a otros estudiantes?',
            '¿El tutor demostró dominio del tema?',
            '¿La tutoría cumplió tus expectativas?'
        ];

        const materiasConEncuestas = [
            'Programación I', 'Aplicaciones Web', 'Fundamentos de Bases de Datos',
            'Metodologías Ágiles', 'Diseño de Software'
        ];

        // Buscar los ObjectId de las materias por nombre
        const materiasDocs = await Materia.find({ nombre: { $in: materiasConEncuestas } });
        for (const materiaDoc of materiasDocs) {
            for (const preguntaTexto of preguntasGenericas) {
                const pregunta = new Pregunta({
                    pregunta: preguntaTexto,
                    materia: materiaDoc._id,
                    materiaNombre: materiaDoc.nombre
                });
                await pregunta.save();
            }
        }
        console.log('✅ Preguntas de encuestas creadas para 5 materias');

        console.log('\n╔══════════════════════════════════════════════╗');
        console.log('║                                              ║');
        console.log('║   ✅ SEED COMPLETADO EXITOSAMENTE            ║');
        console.log('║                                              ║');
        console.log('║   👤 Usuarios creados:                       ║');
        console.log('║   - Admin: admin@fis.epn.edu.ec              ║');
        console.log('║   - 3 Tutores (password: tutor123)           ║');
        console.log('║   - 3 Estudiantes (password: estudiante123)  ║');
        console.log('║                                              ║');
        console.log('║   📋 Preguntas: 25 creadas (5 x 5 materias)  ║');
        console.log('║                                              ║');
        console.log('╚══════════════════════════════════════════════╝\n');

        process.exit(0);

    } catch (error) {
        console.error('❌ Error en seed:', error);
        process.exit(1);
    }
};

seedData();
