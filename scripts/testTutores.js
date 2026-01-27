const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';

async function testTutores() {
  try {
    console.log('🔍 PROBANDO ENDPOINT DE TUTORES...');
    
    // Hacer login como admin
    console.log('🔐 Haciendo login como admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      usuario: 'test@epn.edu.ec',
      password: '123456'
    });
    
    if (!loginResponse.data.token) {
      throw new Error('No se recibió token de acceso');
    }
    
    const token = loginResponse.data.token;
    console.log('✅ Login exitoso');
    
    // Obtener tutores
    console.log('👨‍🏫 Obteniendo tutores...');
    const tutoresResponse = await axios.get(`${BASE_URL}/usuarios/tutores`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const response = tutoresResponse.data;
    console.log(`✅ Respuesta de la API:`, response.ok ? 'OK' : 'Error');
    
    if (!response.tutores || !Array.isArray(response.tutores)) {
      console.log('❌ La respuesta no contiene array de tutores');
      return;
    }
    
    const tutores = response.tutores;
    console.log(`✅ ${tutores.length} tutores obtenidos`);
    
    // Mostrar las materias de cada tutor
    tutores.forEach((tutor, index) => {
      console.log(`\n👤 ${tutor.nombre} ${tutor.apellido}:`);
      console.log(`   📧 ${tutor.email}`);
      console.log(`   📚 Materias:`, tutor.materias);
      
      if (tutor.materias && tutor.materias.length > 0) {
        tutor.materias.forEach((materia, i) => {
          console.log(`      ${i + 1}. "${materia}" (${typeof materia})`);
        });
      } else {
        console.log('      Sin materias');
      }
    });
    
    console.log('\n🎉 PRUEBA COMPLETADA EXITOSAMENTE');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testTutores();