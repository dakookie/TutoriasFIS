const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function crearAdminTemporal() {
  try {
    console.log('🔍 CONECTANDO A MONGODB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://saidlohan:UfAdRbF8t8rprFZO@clustersis.v4rh3.mongodb.net/tutoriasFIS');
    
    console.log('✅ Conectado!');

    const Usuario = mongoose.model('Usuario', new mongoose.Schema({}, { strict: false, collection: 'usuarios' }));
    
    // Eliminar admin existente
    await Usuario.deleteOne({ email: 'test@epn.edu.ec' });
    
    // Crear hash de contraseña
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    // Crear nuevo admin
    const admin = new Usuario({
      nombre: 'Test',
      apellido: 'Admin',
      email: 'test@epn.edu.ec',
      password: hashedPassword,
      rol: 'Administrador',
      activo: true
    });
    
    await admin.save();
    console.log('✅ Admin temporal creado:');
    console.log('   Email: test@epn.edu.ec');
    console.log('   Password: 123456');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

crearAdminTemporal();