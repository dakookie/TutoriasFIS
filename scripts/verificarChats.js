const mongoose = require('mongoose');
require('dotenv').config();

// Modelos
const Tutoria = require('../models/Tutoria');
const Solicitud = require('../models/Solicitud');
const Usuario = require('../models/Usuario');
const Mensaje = require('../models/Mensaje');

async function verificarChats() {
    try {
        // Conectar a MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado a MongoDB');

        // 1. Verificar tutorías existentes
        const tutorias = await Tutoria.find()
            .populate('tutor', 'nombre apellido rol')
            .lean();
        
        console.log('\n📚 TUTORÍAS REGISTRADAS:', tutorias.length);
        tutorias.forEach((t, i) => {
            console.log(`\n${i + 1}. ID: ${t._id}`);
            console.log(`   Materia: ${t.materiaNombre || t.materia}`);
            console.log(`   Tutor: ${t.tutor ? `${t.tutor.nombre} ${t.tutor.apellido}` : 'Tutor no encontrado'}`);
            console.log(`   Fecha: ${new Date(t.fecha).toLocaleDateString()}`);
            console.log(`   Cupos: ${t.cuposDisponibles}/${t.cuposOriginales || t.cuposDisponibles}`);
        });

        // 2. Verificar solicitudes aceptadas
        const solicitudesAceptadas = await Solicitud.find({ estado: 'Aceptada' })
            .populate('estudiante', 'nombre apellido rol')
            .populate('tutoria')
            .lean();

        console.log('\n\n✅ SOLICITUDES ACEPTADAS:', solicitudesAceptadas.length);
        solicitudesAceptadas.forEach((s, i) => {
            const estudiante = s.estudiante ? `${s.estudiante.nombre} ${s.estudiante.apellido}` : 'Estudiante no encontrado';
            const tutoria = s.tutoria ? (s.tutoria.materiaNombre || s.tutoria.materia) : 'Tutoría no encontrada';
            console.log(`\n${i + 1}. Estudiante: ${estudiante}`);
            console.log(`   Tutoría: ${tutoria}`);
            console.log(`   Estado: ${s.estado}`);
        });

        // 3. Agrupar por tutoría
        console.log('\n\n💬 CHATS DISPONIBLES POR TUTORÍA:');
        const tutoriasConEstudiantes = {};
        
        solicitudesAceptadas.forEach(s => {
            const tutoriaId = s.tutoria._id.toString();
            if (!tutoriasConEstudiantes[tutoriaId]) {
                tutoriasConEstudiantes[tutoriaId] = {
                    tutoria: s.tutoria,
                    estudiantes: []
                };
            }
            tutoriasConEstudiantes[tutoriaId].estudiantes.push(s.estudiante);
        });

        Object.values(tutoriasConEstudiantes).forEach((data, i) => {
            const materiaNombre = data.tutoria.materiaNombre || data.tutoria.materia;
            console.log(`\n${i + 1}. ${materiaNombre} (${new Date(data.tutoria.fecha).toLocaleDateString()})`);
            console.log(`   Tutor ID: ${data.tutoria.tutor}`);
            console.log(`   Estudiantes inscritos: ${data.estudiantes.length}`);
            data.estudiantes.forEach((est, j) => {
                if (est) {
                    console.log(`     ${j + 1}. ${est.nombre} ${est.apellido} (ID: ${est._id})`);
                }
            });
        });

        // 4. Verificar mensajes
        const mensajes = await Mensaje.find().lean();
        console.log(`\n\n📨 MENSAJES TOTALES: ${mensajes.length}`);

        // 5. Verificar usuarios
        const usuarios = await Usuario.find().select('nombre apellido rol email').lean();
        console.log('\n\n👥 USUARIOS REGISTRADOS:', usuarios.length);
        usuarios.forEach((u, i) => {
            console.log(`${i + 1}. ${u.nombre} ${u.apellido} (${u.rol}) - ${u.email}`);
        });

        console.log('\n✅ Verificación completada');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

verificarChats();
