const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function verificarRoles() {
  try {
    console.log('🔍 VERIFICANDO ROLES EN LA BASE DE DATOS...\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');
    
    const Usuario = mongoose.model('Usuario', new mongoose.Schema({}, { collection: 'usuarios' }));
    
    // Obtener todos los usuarios y sus roles
    const usuarios = await Usuario.find({}, 'email nombre rol activo').sort({ rol: 1, nombre: 1 });
    
    console.log('\n📋 TODOS LOS USUARIOS Y SUS ROLES:');
    console.log('─'.repeat(80));
    console.log('Email'.padEnd(30) + 'Nombre'.padEnd(20) + 'Rol'.padEnd(15) + 'Activo');
    console.log('─'.repeat(80));
    
    usuarios.forEach(user => {
      const email = user.email || 'N/A';
      const nombre = user.nombre || 'N/A';
      const rol = user.rol || 'N/A';
      const activo = user.activo ? 'Sí' : 'No';
      
      console.log(
        email.padEnd(30) + 
        nombre.padEnd(20) + 
        `"${rol}"`.padEnd(15) + 
        activo
      );
    });
    
    // Contar por rol exacto
    console.log('\n📊 CONTEO POR ROL (EXACTO):');
    const rolesCounts = await Usuario.aggregate([
      { $group: { _id: '$rol', count: { $sum: 1 }, activos: { $sum: { $cond: ['$activo', 1, 0] } } } }
    ]);
    
    rolesCounts.forEach(role => {
      console.log(`   - "${role._id}": ${role.count} total, ${role.activos} activos`);
    });
    
    // Probar queries específicas
    console.log('\n🔍 PROBANDO QUERIES ESPECÍFICAS:');
    
    const tutoresMinuscula = await Usuario.countDocuments({ rol: 'tutor', activo: true });
    const tutoresMayuscula = await Usuario.countDocuments({ rol: 'Tutor', activo: true });
    
    const estudiantesMinuscula = await Usuario.countDocuments({ rol: 'estudiante', activo: true });
    const estudiantesMayuscula = await Usuario.countDocuments({ rol: 'Estudiante', activo: true });
    
    console.log(`   🎓 Tutores con 'tutor' (minúscula): ${tutoresMinuscula}`);
    console.log(`   🎓 Tutores con 'Tutor' (mayúscula): ${tutoresMayuscula}`);
    console.log(`   📚 Estudiantes con 'estudiante' (minúscula): ${estudiantesMinuscula}`);
    console.log(`   📚 Estudiantes con 'Estudiante' (mayúscula): ${estudiantesMayuscula}`);
    
    console.log('\n' + '='.repeat(60));
    if (tutoresMayuscula > 0 || estudiantesMayuscula > 0) {
      console.log('❌ PROBLEMA ENCONTRADO:');
      console.log('   Los roles están con MAYÚSCULA inicial pero el backend');
      console.log('   busca con minúscula. Necesitamos corregir el service.');
    } else {
      console.log('✅ Los roles están correctamente en minúscula');
    }
    console.log('='.repeat(60));
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verificarRoles();