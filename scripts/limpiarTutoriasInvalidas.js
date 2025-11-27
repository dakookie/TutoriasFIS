const mongoose = require('mongoose');
require('dotenv').config();

// Modelos
const Tutoria = require('../models/Tutoria');

async function limpiarTutoriasInvalidas() {
    try {
        // Conectar a MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado a MongoDB');

        // Buscar tutorías con materia undefined o tutor undefined
        const tutoriasInvalidas = await Tutoria.find({
            $or: [
                { materia: { $exists: false } },
                { materia: null },
                { tutor: { $exists: false } },
                { tutor: null },
                { materiaNombre: { $exists: false } }
            ]
        });

        console.log(`\n🗑️  Tutorías inválidas encontradas: ${tutoriasInvalidas.length}`);

        if (tutoriasInvalidas.length > 0) {
            console.log('\nDetalles:');
            tutoriasInvalidas.forEach((t, i) => {
                console.log(`${i + 1}. ID: ${t._id}`);
                console.log(`   Materia: ${t.materia}`);
                console.log(`   MateriaNombre: ${t.materiaNombre}`);
                console.log(`   Tutor: ${t.tutor}`);
                console.log(`   Fecha: ${t.fecha}`);
            });

            // Eliminar tutorías inválidas
            const resultado = await Tutoria.deleteMany({
                $or: [
                    { materia: { $exists: false } },
                    { materia: null },
                    { tutor: { $exists: false } },
                    { tutor: null },
                    { materiaNombre: { $exists: false } }
                ]
            });

            console.log(`\n✓ Tutorías eliminadas: ${resultado.deletedCount}`);
        } else {
            console.log('\n✓ No hay tutorías inválidas');
        }

        // Mostrar resumen de tutorías válidas
        const tutoriasValidas = await Tutoria.countDocuments();
        console.log(`\n📚 Tutorías válidas restantes: ${tutoriasValidas}`);

        console.log('\n✅ Proceso completado');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Desconectado de MongoDB');
    }
}

limpiarTutoriasInvalidas();
