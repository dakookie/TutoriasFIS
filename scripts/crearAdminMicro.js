// Script para crear un usuario Administrador
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tutorias_fis';

const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  apellido: { type: String, required: true },
  username: { type: String, unique: true, sparse: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  rol: { type: String, enum: ['Administrador', 'Tutor', 'Estudiante'], required: true },
  materias: [String],
  activo: { type: Boolean, default: false },
  pdf: { type: String, default: null },
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null }
}, { timestamps: true });

const Usuario = mongoose.model('Usuario', usuarioSchema);

async function crearAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const email = 'admin@epn.edu.ec';
    
    // Verificar si ya existe
    const existente = await Usuario.findOne({ email });
    if (existente) {
      console.log('⚠️  Ya existe un administrador con ese email');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Hashear contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('admin123', salt);

    // Crear administrador
    const admin = new Usuario({
      nombre: 'Administrador',
      apellido: 'Sistema',
      email: email,
      password: passwordHash,
      rol: 'Administrador',
      materias: [],
      activo: true
    });

    await admin.save();
    
    console.log('✅ Administrador creado exitosamente');
    console.log('📧 Email:', email);
    console.log('🔑 Contraseña: admin123');
    console.log('⚠️  IMPORTANTE: Cambia la contraseña después del primer login');

    await mongoose.connection.close();
    console.log('✅ Conexión cerrada');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

crearAdmin();
