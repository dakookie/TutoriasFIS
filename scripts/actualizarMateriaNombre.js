const mongoose = require('mongoose');
require('dotenv').config();

// Modelos
const Tutoria = require('../models/Tutoria');
const Materia = require('../models/Materia');

async function actualizarMateriaNombre() {
    try {
        // Conectar a MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado a MongoDB');

        // Obtener todas las tutorías
        const tutorias = await Tutoria.find();
        console.log(`\n📚 Tutorías encontradas: ${tutorias.length}`);

        let actualizadas = 0;
        let yaCompletas = 0;
        let errores = 0;

        for (const tutoria of tutorias) {
            try {
                // Verificar si ya tiene materiaNombre
                if (tutoria.materiaNombre) {
                    console.log(`✓ Tutoría ${tutoria._id} ya tiene materiaNombre: ${tutoria.materiaNombre}`);
                    yaCompletas++;
                    continue;
                }

                // Obtener la materia
                const materia = await Materia.findById(tutoria.materia);
                
                if (!materia) {
                    console.log(`✗ No se encontró materia para tutoría ${tutoria._id} (materia ID: ${tutoria.materia})`);
                    errores++;
                    continue;
                }

                // Actualizar materiaNombre
                tutoria.materiaNombre = materia.nombre;
                await tutoria.save();

                console.log(`✓ Tutoría ${tutoria._id} actualizada: ${materia.nombre}`);
                actualizadas++;

            } catch (error) {
                console.error(`✗ Error actualizando tutoría ${tutoria._id}:`, error.message);
                errores++;
            }
        }

        console.log('\n📊 RESUMEN:');
        console.log(`   ✓ Tutorías actualizadas: ${actualizadas}`);
        console.log(`   ✓ Ya completas: ${yaCompletas}`);
        console.log(`   ✗ Con errores: ${errores}`);
        console.log(`   📚 Total: ${tutorias.length}`);

        console.log('\n✅ Proceso completado');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Desconectado de MongoDB');
    }
}

actualizarMateriaNombre();
