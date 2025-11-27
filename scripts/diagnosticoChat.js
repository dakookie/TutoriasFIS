const mongoose = require('mongoose');
require('dotenv').config();

// Modelos
const Tutoria = require('../models/Tutoria');
const Solicitud = require('../models/Solicitud');
const Usuario = require('../models/Usuario');

async function diagnosticoChat() {
    try {
        // Conectar a MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado a MongoDB\n');

        // Ver todas las solicitudes con todos sus campos
        const solicitudes = await Solicitud.find();
        console.log(`📋 SOLICITUDES TOTALES: ${solicitudes.length}\n`);

        for (let i = 0; i < solicitudes.length; i++) {
            const sol = solicitudes[i];
            console.log(`${i + 1}. Solicitud ID: ${sol._id}`);
            console.log(`   Estado: ${sol.estado}`);
            console.log(`   Estudiante ID: ${sol.estudiante}`);
            console.log(`   Tutoría ID: ${sol.tutoria}`);
            
            // Verificar si el estudiante existe
            if (sol.estudiante) {
                const est = await Usuario.findById(sol.estudiante);
                if (est) {
                    console.log(`   ✓ Estudiante existe: ${est.nombre} ${est.apellido} (${est.email})`);
                } else {
                    console.log(`   ✗ Estudiante NO existe`);
                }
            }
            
            // Verificar si la tutoría existe
            if (sol.tutoria) {
                const tut = await Tutoria.findById(sol.tutoria);
                if (tut) {
                    console.log(`   ✓ Tutoría existe: ${tut.materiaNombre} - ${new Date(tut.fecha).toLocaleDateString()}`);
                } else {
                    console.log(`   ✗ Tutoría NO existe`);
                }
            }
            console.log('');
        }

        // Ver todos los usuarios
        console.log('\n👥 USUARIOS EN EL SISTEMA:');
        const usuarios = await Usuario.find().select('nombre apellido rol email');
        usuarios.forEach((u, i) => {
            console.log(`${i + 1}. [${u.rol}] ${u.nombre} ${u.apellido} - ${u.email} (ID: ${u._id})`);
        });

        // Ver todas las tutorías
        console.log('\n📚 TUTORÍAS EN EL SISTEMA:');
        const tutorias = await Tutoria.find();
        for (let i = 0; i < tutorias.length; i++) {
            const t = tutorias[i];
            console.log(`${i + 1}. ${t.materiaNombre} - ${new Date(t.fecha).toLocaleDateString()}`);
            console.log(`   ID: ${t._id}`);
            console.log(`   Tutor ID: ${t.tutor}`);
            
            const tutor = await Usuario.findById(t.tutor);
            if (tutor) {
                console.log(`   ✓ Tutor: ${tutor.nombre} ${tutor.apellido}`);
            } else {
                console.log(`   ✗ Tutor NO existe`);
            }
            console.log('');
        }

        console.log('\n✅ Diagnóstico completado');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

diagnosticoChat();
