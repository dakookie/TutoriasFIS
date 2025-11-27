const mongoose = require('mongoose');
require('dotenv').config();

// Modelos
const Solicitud = require('../models/Solicitud');
const Usuario = require('../models/Usuario');
const Tutoria = require('../models/Tutoria');

async function limpiarSolicitudesHuerfanas() {
    try {
        // Conectar a MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado a MongoDB');

        // Obtener todas las solicitudes
        const todasLasSolicitudes = await Solicitud.find();
        console.log(`\n📋 Solicitudes encontradas: ${todasLasSolicitudes.length}`);

        let eliminadas = 0;
        let validas = 0;

        for (const solicitud of todasLasSolicitudes) {
            let debeEliminar = false;
            let razon = '';

            // Verificar si el estudiante existe
            if (solicitud.estudiante) {
                const estudiante = await Usuario.findById(solicitud.estudiante);
                if (!estudiante) {
                    debeEliminar = true;
                    razon = 'Estudiante no existe';
                }
            } else {
                debeEliminar = true;
                razon = 'Estudiante es null/undefined';
            }

            // Verificar si la tutoría existe
            if (!debeEliminar && solicitud.tutoria) {
                const tutoria = await Tutoria.findById(solicitud.tutoria);
                if (!tutoria) {
                    debeEliminar = true;
                    razon = 'Tutoría no existe';
                }
            } else if (!debeEliminar) {
                debeEliminar = true;
                razon = 'Tutoría es null/undefined';
            }

            if (debeEliminar) {
                console.log(`✗ Eliminando solicitud ${solicitud._id}: ${razon}`);
                await solicitud.deleteOne();
                eliminadas++;
            } else {
                validas++;
            }
        }

        console.log('\n📊 RESUMEN:');
        console.log(`   ✓ Solicitudes válidas: ${validas}`);
        console.log(`   ✗ Solicitudes eliminadas: ${eliminadas}`);
        console.log(`   📋 Total: ${todasLasSolicitudes.length}`);

        console.log('\n✅ Proceso completado');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Desconectado de MongoDB');
    }
}

limpiarSolicitudesHuerfanas();
