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

// Encriptar password antes de guardar
usuarioSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const Usuario = mongoose.model('Usuario', usuarioSchema);

async function resetPassword() {
  try {
    console.log('🔍 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');
    
    const email = 'said.luna@epn.edu.ec';
    const nuevaPassword = 'tutor123';
    
    console.log(`\n🔐 RESETEANDO PASSWORD PARA: ${email}`);
    console.log('='.repeat(50));
    
    // Buscar el usuario
    const usuario = await Usuario.findOne({ email: email.toLowerCase() });
    
    if (!usuario) {
      console.log('❌ Usuario NO encontrado en la base de datos');
      process.exit(1);
    }
    
    console.log('✅ Usuario encontrado:');
    console.log(`   📧 Email: ${usuario.email}`);
    console.log(`   👤 Nombre: ${usuario.nombre} ${usuario.apellido}`);
    console.log(`   🎭 Rol: ${usuario.rol}`);
    
    // Actualizar password
    console.log(`\n🔄 Actualizando password a "${nuevaPassword}"...`);
    
    usuario.password = nuevaPassword;
    await usuario.save();
    
    console.log('✅ Password actualizada exitosamente');
    
    // Verificar que funciona
    console.log('\n🔐 Verificando nueva password...');
    const passwordActualizada = await bcrypt.compare(nuevaPassword, usuario.password);
    
    if (passwordActualizada) {
      console.log('✅ Verificación exitosa - Password funciona correctamente');
    } else {
      console.log('❌ Error en la verificación');
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ CREDENCIALES ACTUALIZADAS:');
    console.log(`   📧 Email: ${usuario.email}`);
    console.log(`   🔑 Password: ${nuevaPassword}`);
    console.log(`   🎭 Rol: ${usuario.rol}`);
    console.log('='.repeat(50));
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error durante el reset:', error);
    process.exit(1);
  }
}

resetPassword();