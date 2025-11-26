const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Usuario = require('../models/Usuario');
const Pregunta = require('../models/Pregunta');

const materias = [
    "Álgebra Lineal", "Cálculo en una Variable", "Programación I",
    "Ecuaciones Diferenciales Ordinarias", "Programación II",
    "Estructura de Datos y Algoritmos I", "Fundamentos de Bases de Datos",
    "Ingeniería de Software y Requerimientos", "Diseño de Software",
    "Bases de Datos Distribuidas", "Aplicaciones Web",
    "Metodologías Ágiles", "Aplicaciones Web Avanzadas",
    "Gestión de Proyectos de Software"
];

const seedData = async () => {
    try {
        // Conectar a MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado a MongoDB');

        // Limpiar colecciones
        await Usuario.deleteMany({});
        await Pregunta.deleteMany({});
        console.log('🗑️  Colecciones limpiadas');

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

        for (const materia of materiasConEncuestas) {
            for (const preguntaTexto of preguntasGenericas) {
                const pregunta = new Pregunta({
                    pregunta: preguntaTexto,
                    materia: materia
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
