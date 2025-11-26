const mongoose = require('mongoose');
const Usuario = require('../models/Usuario');
require('dotenv').config();

async function crearAdmin() {
    try {
        // Conectar a MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado a MongoDB');

        // Verificar si ya existe un admin
        const adminExistente = await Usuario.findOne({ rol: 'Administrador' });
        if (adminExistente) {
            console.log('⚠️  Ya existe un administrador:', adminExistente.email);
            console.log('Si quieres crear otro admin, modifica este script');
            process.exit(0);
        }

        // Crear nuevo administrador
        const admin = new Usuario({
            nombre: 'Admin',
            apellido: 'Sistema',
            email: 'admin@epn.edu.ec',
            password: 'Admin123!', // Cambiar después del primer login
            rol: 'Administrador',
            activo: true // Los admins se crean activos directamente
        });

        await admin.save();
        console.log('✅ Administrador creado exitosamente');
        console.log('📧 Email:', admin.email);
        console.log('🔑 Contraseña: Admin123!');
        console.log('⚠️  IMPORTANTE: Cambia la contraseña después del primer inicio de sesión');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error al crear administrador:', error);
        process.exit(1);
    }
}

crearAdmin();
