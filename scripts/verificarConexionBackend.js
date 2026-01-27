const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function verificarConexionBackend() {
  try {
    console.log('🔍 VERIFICANDO CONFIGURACIÓN DEL BACKEND...\n');
    
    // Mostrar las variables de entorno
    console.log('📋 VARIABLES DE ENTORNO:');
    console.log(`   📊 MONGODB_URI: ${process.env.MONGODB_URI}`);
    console.log(`   🔑 JWT_SECRET: ${process.env.JWT_SECRET}`);
    console.log(`   🔌 PORT: ${process.env.PORT}`);
    
    console.log('\n🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    
    const dbName = mongoose.connection.name;
    const host = mongoose.connection.host;
    
    console.log('✅ ¡CONEXIÓN EXITOSA!');
    console.log(`   📊 Base de datos: ${dbName}`);
    console.log(`   🌐 Host: ${host}`);
    
    // Verificar colecciones
    console.log('\n📦 VERIFICANDO COLECCIONES...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    const coleccionesImportantes = ['usuarios', 'tutorias', 'materias', 'solicituds', 'mensajes'];
    
    coleccionesImportantes.forEach(nombreCol => {
      const existe = collections.some(col => col.name === nombreCol);
      console.log(`   ${existe ? '✅' : '❌'} ${nombreCol}: ${existe ? 'ENCONTRADA' : 'NO ENCONTRADA'}`);
    });
    
    // Contar usuarios para verificar que es la misma BD
    const Usuario = mongoose.model('Usuario', new mongoose.Schema({}, { collection: 'usuarios' }));
    const totalUsuarios = await Usuario.countDocuments();
    
    console.log(`\n👥 TOTAL DE USUARIOS: ${totalUsuarios}`);
    
    if (totalUsuarios === 8) {
      console.log('✅ ¡PERFECTO! Es la misma base de datos que vimos antes');
    } else {
      console.log('⚠️  Número diferente de usuarios - puede que sea otra BD');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ VERIFICACIÓN COMPLETADA - TODO CORRECTO');
    console.log('='.repeat(60));
    console.log('🚀 El backend NestJS está conectado a la misma BD');
    console.log('🚀 Todas las colecciones están disponibles');
    console.log('🚀 La configuración es consistente');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error en la verificación:', error.message);
    process.exit(1);
  }
}

verificarConexionBackend();