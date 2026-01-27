const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Esquema del usuario
const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  apellido: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  username: { type: String },
  password: { type: String, required: true },
  rol: { type: String, enum: ['Estudiante', 'Tutor', 'Administrador'], required: true },
  materias: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Materia' }],
  activo: { type: Boolean, default: false },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
}, { 
  timestamps: true,
  collection: 'usuarios' 
});

const Usuario = mongoose.model('Usuario', usuarioSchema);

async function verificarLogin() {
  try {
    console.log('🔍 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');
    
    const email = 'said.luna@epn.edu.ec';
    const password = 'tutor123'; // Asumiendo que usas la misma password del seed
    
    console.log(`\n🔐 VERIFICANDO LOGIN PARA: ${email}`);
    console.log('='.repeat(50));
    
    // Buscar el usuario
    const usuario = await Usuario.findOne({
      $or: [{ email: email.toLowerCase() }, { username: email }],
    });
    
    if (!usuario) {
      console.log('❌ Usuario NO encontrado en la base de datos');
      process.exit(1);
    }
    
    console.log('✅ Usuario encontrado:');
    console.log(`   📧 Email: ${usuario.email}`);
    console.log(`   👤 Username: ${usuario.username || 'No definido'}`);
    console.log(`   📝 Nombre: ${usuario.nombre} ${usuario.apellido}`);
    console.log(`   🎭 Rol: ${usuario.rol}`);
    console.log(`   ✅ Activo: ${usuario.activo}`);
    console.log(`   🔑 Password Hash: ${usuario.password.substring(0, 20)}...`);
    
    // Verificar password
    console.log(`\n🔐 Verificando password "${password}"...`);
    const passwordValida = await bcrypt.compare(password, usuario.password);
    
    if (passwordValida) {
      console.log('✅ PASSWORD CORRECTA - Login exitoso');
    } else {
      console.log('❌ PASSWORD INCORRECTA');
      
      // Intentar con otras passwords comunes
      const passwordsComunes = ['admin123', 'estudiante123', '123456', 'password'];
      
      for (const pwd of passwordsComunes) {
        const esValida = await bcrypt.compare(pwd, usuario.password);
        if (esValida) {
          console.log(`✅ La password correcta es: "${pwd}"`);
          break;
        }
      }
    }
    
    if (usuario.materias && usuario.materias.length > 0) {
      console.log(`\n📚 Materias asignadas (${usuario.materias.length}):`);
      usuario.materias.forEach((materia, index) => {
        console.log(`   ${index + 1}. ${materia}`);
      });
    }
    
    console.log('\n' + '='.repeat(50));
    
    // Información para MongoDB Compass
    console.log('\n🧭 INFORMACIÓN PARA MONGODB COMPASS:');
    console.log('─'.repeat(40));
    console.log(`📊 Base de datos: tutoriasFIS`);
    console.log(`📁 Colección: usuarios`);
    console.log(`🔍 Filtro para encontrar este usuario:`);
    console.log(`   { "email": "${usuario.email}" }`);
    console.log(`   O`);
    console.log(`   { "_id": ObjectId("${usuario._id}") }`);
    
    console.log('\n✅ VERIFICACIÓN COMPLETADA');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
    process.exit(1);
  }
}

verificarLogin();