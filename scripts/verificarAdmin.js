const mongoose = require('mongoose');
require('dotenv').config();

async function verificarAdmin() {
  try {
    console.log('🔍 CONECTANDO A MONGODB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://saidlohan:UfAdRbF8t8rprFZO@clustersis.v4rh3.mongodb.net/tutoriasFIS');
    
    console.log('✅ Conectado!');

    const Usuario = mongoose.model('Usuario', new mongoose.Schema({}, { strict: false, collection: 'usuarios' }));
    
    console.log('\n🔍 BUSCANDO ADMINISTRADORES:');
    const admins = await Usuario.find({ rol: 'Administrador' });
    
    console.log(`Encontrados: ${admins.length} administradores`);
    
    admins.forEach((admin, index) => {
      console.log(`\n👤 Admin ${index + 1}:`);
      console.log(`   Nombre: ${admin.nombre} ${admin.apellido}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Activo: ${admin.activo}`);
      console.log(`   Password hash: ${admin.password.substring(0, 20)}...`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

verificarAdmin();