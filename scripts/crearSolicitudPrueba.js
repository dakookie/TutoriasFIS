const mongoose = require('mongoose');
require('dotenv').config();

// Modelos
const Solicitud = require('../models/Solicitud');
const Tutoria = require('../models/Tutoria');
const Usuario = require('../models/Usuario');

async function crearSolicitudPrueba() {
    try {
        // Conectar a MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado a MongoDB\n');

        // Buscar un estudiante válido
        const estudiante = await Usuario.findOne({ 
            rol: 'Estudiante',
            email: 'carlos@epn.edu.ec'
        });

        if (!estudiante) {
            console.log('❌ No se encontró el estudiante Carlos Suárez');
            return;
        }

        console.log(`✓ Estudiante encontrado: ${estudiante.nombre} ${estudiante.apellido} (${estudiante.email})`);

        // Buscar una tutoría válida
        const tutoria = await Tutoria.findOne().sort({ createdAt: -1 });

        if (!tutoria) {
            console.log('❌ No se encontró ninguna tutoría');
            return;
        }

        console.log(`✓ Tutoría encontrada: ${tutoria.materiaNombre} - ${new Date(tutoria.fecha).toLocaleDateString()}`);

        // Verificar si ya existe una solicitud
        const solicitudExistente = await Solicitud.findOne({
            estudiante: estudiante._id,
            tutoria: tutoria._id
        });

        if (solicitudExistente) {
            console.log(`\n⚠️  Ya existe una solicitud con estado: ${solicitudExistente.estado}`);
            
            // Si está pendiente, la aceptamos
            if (solicitudExistente.estado === 'Pendiente') {
                solicitudExistente.estado = 'Aceptada';
                await solicitudExistente.save();
                
                // Reducir cupos
                if (tutoria.cuposDisponibles > 0) {
                    tutoria.cuposDisponibles -= 1;
                    await tutoria.save();
                }
                
                console.log('✓ Solicitud aceptada');
            }
        } else {
            // Crear nueva solicitud y aceptarla
            const solicitud = new Solicitud({
                tutoria: tutoria._id,
                estudiante: estudiante._id,
                estudianteNombre: `${estudiante.nombre} ${estudiante.apellido}`,
                materia: tutoria.materia,
                fecha: tutoria.fecha,
                horaInicio: tutoria.horaInicio,
                horaFin: tutoria.horaFin,
                tutor: tutoria.tutorNombre,
                estado: 'Aceptada' // Directamente aceptada
            });

            await solicitud.save();
            
            // Reducir cupos
            if (tutoria.cuposDisponibles > 0) {
                tutoria.cuposDisponibles -= 1;
                await tutoria.save();
            }

            console.log('\n✓ Solicitud creada y aceptada');
        }

        console.log('\n📋 RESUMEN:');
        console.log(`   Estudiante: ${estudiante.nombre} ${estudiante.apellido}`);
        console.log(`   Estudiante ID: ${estudiante._id}`);
        console.log(`   Tutoría: ${tutoria.materiaNombre}`);
        console.log(`   Tutoría ID: ${tutoria._id}`);
        console.log(`   Cupos disponibles: ${tutoria.cuposDisponibles}/${tutoria.cuposOriginales}`);

        console.log('\n✅ Proceso completado');
        console.log('\nAhora puedes:');
        console.log(`1. Iniciar sesión como estudiante: ${estudiante.email}`);
        console.log(`2. Iniciar sesión como tutor y ver la tutoría`);
        console.log('3. Ambos deberían ver el chat disponible');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Desconectado de MongoDB');
    }
}

crearSolicitudPrueba();
