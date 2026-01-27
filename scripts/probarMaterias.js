const axios = require('axios');

async function probarMateriasEndpoint() {
  try {
    console.log('🧪 PROBANDO ENDPOINT DE TUTORES CON MATERIAS...\n');
    
    // Hacer login para obtener el token
    console.log('🔐 Haciendo login...');
    const loginResponse = await axios.post('http://localhost:4000/api/auth/login', {
      usuario: 'said.luna@epn.edu.ec',
      password: 'tutor123'
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
      console.log('\n📖 INFORMACIÓN DETALLADA DE LOS TUTORES:');
      console.log('─'.repeat(80));
      
      tutoresResponse.data.forEach((tutor, index) => {
        console.log(`\n${index + 1}. 👤 ${tutor.nombre} ${tutor.apellido} (${tutor.email})`);
        console.log(`   📧 Rol: ${tutor.rol}, Activo: ${tutor.activo}`);
        
        if (tutor.materias && tutor.materias.length > 0) {
          console.log(`   📚 Materias (${tutor.materias.length}):`);
          tutor.materias.forEach((materia, matIndex) => {
            if (typeof materia === 'object') {
              console.log(`      ${matIndex + 1}. ${materia.nombre} ${materia.codigo ? `(${materia.codigo})` : ''} ${materia.semestre ? `- Semestre ${materia.semestre}` : ''}`);
            } else {
              console.log(`      ${matIndex + 1}. ${materia} (solo ID)`);
            }
          });
        } else {
          console.log('   📚 Materias: Sin materias asignadas');
        }
      });
      
      console.log('\n' + '='.repeat(60));
      const tutoresConMaterias = tutoresResponse.data.filter(tutor => tutor.materias && tutor.materias.length > 0);
      if (tutoresConMaterias.length > 0) {
        console.log('🎉 ¡ÉXITO! Se encontraron tutores con materias:');
        console.log(`   - ${tutoresConMaterias.length} de ${tutoresResponse.data.length} tutores tienen materias asignadas`);
      } else {
        console.log('❌ PROBLEMA: Ningún tutor tiene materias asignadas');
        console.log('   Esto puede significar que los tutores no tienen materias en la DB');
        console.log('   o que el populate no está funcionando correctamente');
      }
      console.log('='.repeat(60));
    }
    
  } catch (error) {
    console.error('❌ Error al probar endpoint:', error.response?.data || error.message);
  }
}

probarMateriasEndpoint();