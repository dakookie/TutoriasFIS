const mongoose = require('mongoose');
require('dotenv').config();

// Configurar los esquemas como en el backend actual
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

async function diagnosticarUsuarios() {
  try {
    console.log('🔍 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');
    
    // Obtener información de la conexión
    const dbName = mongoose.connection.name;
    const host = mongoose.connection.host;
    console.log(`📊 Base de datos: ${dbName}`);
    console.log(`🌐 Host: ${host}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 DIAGNÓSTICO DE USUARIOS');
    console.log('='.repeat(60));
    
    // Contar total de usuarios
    const totalUsuarios = await Usuario.countDocuments();
    console.log(`\n📊 Total de usuarios en DB: ${totalUsuarios}`);
    
    // Buscar el usuario específico por email
    console.log('\n🔍 Buscando usuario: said.luna@epn.edu.ec');
    const usuarioEspecifico = await Usuario.findOne({ email: 'said.luna@epn.edu.ec' });
    
    if (usuarioEspecifico) {
      console.log('✅ Usuario ENCONTRADO:');
      console.log(`   - ID: ${usuarioEspecifico._id}`);
      console.log(`   - Nombre: ${usuarioEspecifico.nombre} ${usuarioEspecifico.apellido}`);
      console.log(`   - Email: ${usuarioEspecifico.email}`);
      console.log(`   - Username: ${usuarioEspecifico.username || 'No definido'}`);
      console.log(`   - Rol: ${usuarioEspecifico.rol}`);
      console.log(`   - Activo: ${usuarioEspecifico.activo}`);
      console.log(`   - Creado: ${usuarioEspecifico.createdAt}`);
      console.log(`   - Materias: ${usuarioEspecifico.materias?.length || 0}`);
    } else {
      console.log('❌ Usuario NO ENCONTRADO en la base de datos');
    }
    
    // Buscar usuarios con emails similares
    console.log('\n🔍 Buscando usuarios con emails similares...');
    const usuariosSimilares = await Usuario.find({ 
      email: { $regex: 'said', $options: 'i' }
    });
    
    if (usuariosSimilares.length > 0) {
      console.log(`✅ Encontrados ${usuariosSimilares.length} usuarios con "said" en el email:`);
      usuariosSimilares.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (${user.nombre} ${user.apellido}) - ${user.rol}`);
      });
    } else {
      console.log('❌ No se encontraron usuarios con "said" en el email');
    }
    
    // Listar todos los usuarios para ver qué hay
    console.log('\n📋 TODOS LOS USUARIOS EN LA BASE DE DATOS:');
    const todosUsuarios = await Usuario.find({}, 'email nombre apellido rol activo createdAt').sort({ createdAt: 1 });
    
    if (todosUsuarios.length > 0) {
      console.log('─'.repeat(80));
      console.log('Email'.padEnd(30) + 'Nombre'.padEnd(20) + 'Rol'.padEnd(15) + 'Activo'.padEnd(8) + 'Fecha');
      console.log('─'.repeat(80));
      
      todosUsuarios.forEach(user => {
        const fecha = user.createdAt ? user.createdAt.toISOString().split('T')[0] : 'N/A';
        console.log(
          user.email.padEnd(30) + 
          `${user.nombre} ${user.apellido}`.padEnd(20) + 
          user.rol.padEnd(15) + 
          (user.activo ? 'Sí' : 'No').padEnd(8) + 
          fecha
        );
      });
    } else {
      console.log('❌ No hay usuarios en la base de datos');
    }
    
    // Verificar colecciones disponibles
    console.log('\n📦 COLECCIONES EN LA BASE DE DATOS:');
    const collections = await mongoose.connection.db.listCollections().toArray();
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ DIAGNÓSTICO COMPLETADO');
    console.log('='.repeat(60));
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error);
    process.exit(1);
  }
}

diagnosticarUsuarios();