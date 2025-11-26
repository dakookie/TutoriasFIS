// Script para verificar el estado de tutorías y solicitudes
require('dotenv').config();
const mongoose = require('mongoose');
const Tutoria = require('../models/Tutoria');
const Solicitud = require('../models/Solicitud');

async function verificarEstados() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado a MongoDB');

        // Verificar tutorías
        const tutorias = await Tutoria.find().populate('tutor', 'nombre apellido');
        console.log('\n📚 TUTORÍAS:');
        console.log('=' .repeat(80));
        
        for (const tutoria of tutorias) {
            console.log(`\nTutoría: ${tutoria.materia}`);
            console.log(`  ID: ${tutoria._id}`);
            console.log(`  Fecha: ${tutoria.fecha.toLocaleDateString('es-EC')}`);
            console.log(`  Tutor: ${tutoria.tutorNombre}`);
            console.log(`  Cupos: ${tutoria.cuposDisponibles}/${tutoria.cuposOriginales}`);
            console.log(`  Activa: ${tutoria.activa}`);

            // Contar solicitudes por estado
            const pendientes = await Solicitud.countDocuments({ tutoria: tutoria._id, estado: 'Pendiente' });
            const aceptadas = await Solicitud.countDocuments({ tutoria: tutoria._id, estado: 'Aceptada' });
            const rechazadas = await Solicitud.countDocuments({ tutoria: tutoria._id, estado: 'Rechazada' });
            
            console.log(`  Solicitudes: ${pendientes} pendientes, ${aceptadas} aceptadas, ${rechazadas} rechazadas`);
            
            // Verificar consistencia de cupos
            const cuposUsados = tutoria.cuposOriginales - tutoria.cuposDisponibles;
            if (cuposUsados !== aceptadas) {
                console.log(`  ⚠️  INCONSISTENCIA: Cupos usados (${cuposUsados}) ≠ Solicitudes aceptadas (${aceptadas})`);
            } else {
                console.log(`  ✅ Cupos consistentes`);
            }
        }

        // Verificar solicitudes
        console.log('\n\n👥 SOLICITUDES:');
        console.log('='.repeat(80));
        
        const solicitudes = await Solicitud.find()
            .populate('tutoria', 'materia')
            .populate('estudiante', 'nombre apellido');
        
        for (const sol of solicitudes) {
            console.log(`\nEstudiante: ${sol.estudianteNombre}`);
            console.log(`  Tutoría: ${sol.tutoria?.materia || 'N/A'}`);
            console.log(`  Estado: ${sol.estado}`);
            console.log(`  Fecha solicitud: ${sol.createdAt.toLocaleString('es-EC')}`);
        }

        console.log('\n\n✅ Verificación completada');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

verificarEstados();
