// Script para probar las APIs de tutorías desde el frontend
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:4000/api';

// Token de ejemplo (necesitarás uno real)
let authToken = '';

const api = {
  // Función para hacer login y obtener el token
  async login(email, password) {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    
    if (data.ok && data.access_token) {
      authToken = data.access_token;
      console.log('✅ Login exitoso');
      return data;
    } else {
      console.log('❌ Error en login:', data.message);
      throw new Error('Login failed');
    }
  },

  // Función para obtener materias
  async getMaterias() {
    const response = await fetch(`${BASE_URL}/materias`, {
      headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {},
    });

    const data = await response.json();
    console.log('📚 Materias obtenidas:', data.materias?.length || 0);
    return data;
  },

  // Función para crear tutoría
  async crearTutoria(tutoriaData) {
    const response = await fetch(`${BASE_URL}/tutorias`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(tutoriaData),
    });

    const data = await response.json();
    
    if (data.ok) {
      console.log('✅ Tutoría creada exitosamente:', data.tutoria._id);
      return data;
    } else {
      console.log('❌ Error creando tutoría:', data.message);
      return data;
    }
  }
};

async function testTutoriaFlow() {
  try {
    console.log('🔧 Iniciando prueba de flujo de tutorías...\n');

    // 1. Login con un tutor
    console.log('1. Intentando login con tutor...');
    await api.login('juan.tutor@epn.edu.ec', 'password123');

    // 2. Obtener materias
    console.log('\n2. Obteniendo materias disponibles...');
    const materiasResult = await api.getMaterias();
    
    if (!materiasResult.ok || !materiasResult.materias) {
      console.log('❌ No se pudieron obtener las materias');
      return;
    }

    const primeraMateria = materiasResult.materias[0];
    console.log('🎯 Usando materia:', primeraMateria.nombre, primeraMateria._id);

    // 3. Crear una tutoría de prueba
    console.log('\n3. Creando tutoría de prueba...');
    const tutoriaData = {
      materia: primeraMateria._id,
      fecha: '2026-01-30',
      horaInicio: '10:00',
      horaFin: '11:00',
      cuposOriginales: 5,
      modalidadAula: 'Virtual',
      nombreAula: 'Aula de prueba API',
      enlaceAula: 'https://meet.google.com/test-api'
    };

    const result = await api.crearTutoria(tutoriaData);
    
    if (result.ok) {
      console.log('🎉 ¡Flujo completo exitoso!');
      console.log('📝 ID de tutoría creada:', result.tutoria._id);
    } else {
      console.log('⚠️ Problemas encontrados:');
      console.log('   - Mensaje:', result.message);
    }

  } catch (error) {
    console.error('\n💥 Error en el flujo:', error.message);
    console.error('Detalles:', error);
  }
}

testTutoriaFlow();