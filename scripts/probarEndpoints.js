const axios = require('axios');

async function probarEndpoints() {
  try {
    console.log('🧪 PROBANDO ENDPOINTS DEL BACKEND...\n');
    
    // Primero hacer login para obtener el token
    console.log('🔐 Haciendo login para obtener token...');
    const loginResponse = await axios.post('http://localhost:4000/api/auth/login', {
      email: 'admin@fis.epn.edu.ec',
      password: 'admin123'
    });
    
    const token = loginResponse.data.access_token;
    console.log('✅ Token obtenido exitosamente');
    
    // Headers con autorización
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Probar endpoint de tutores
    console.log('\n📚 Probando endpoint /api/usuarios/tutores...');
    const tutoresResponse = await axios.get('http://localhost:4000/api/usuarios/tutores', { headers });
    console.log('✅ Respuesta del endpoint tutores:');
    console.log(`   - Total de tutores encontrados: ${tutoresResponse.data.length}`);
    
    if (tutoresResponse.data.length > 0) {
      console.log('   - Tutores:');
      tutoresResponse.data.forEach((tutor, index) => {
        console.log(`     ${index + 1}. ${tutor.nombre} (${tutor.email}) - Rol: ${tutor.rol}, Activo: ${tutor.activo}`);
      });
    }
    
    // Probar endpoint de estudiantes
    console.log('\n🎓 Probando endpoint /api/usuarios/estudiantes...');
    const estudiantesResponse = await axios.get('http://localhost:4000/api/usuarios/estudiantes', { headers });
    console.log('✅ Respuesta del endpoint estudiantes:');
    console.log(`   - Total de estudiantes encontrados: ${estudiantesResponse.data.length}`);
    
    if (estudiantesResponse.data.length > 0) {
      console.log('   - Estudiantes:');
      estudiantesResponse.data.forEach((estudiante, index) => {
        console.log(`     ${index + 1}. ${estudiante.nombre} (${estudiante.email}) - Rol: ${estudiante.rol}, Activo: ${estudiante.activo}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    if (tutoresResponse.data.length > 0 && estudiantesResponse.data.length > 0) {
      console.log('🎉 ¡ÉXITO! Los endpoints ya devuelven usuarios correctamente');
      console.log('   Ahora el frontend debería mostrar las listas de usuarios');
    } else {
      console.log('❌ PROBLEMA: Algunos endpoints aún devuelven listas vacías');
    }
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error al probar endpoints:');
    if (error.response) {
      console.error('   - Status:', error.response.status);
      console.error('   - Data:', error.response.data);
    } else if (error.request) {
      console.error('   - No response received:', error.request);
    } else {
      console.error('   - Error:', error.message);
    }
  }
}

probarEndpoints();