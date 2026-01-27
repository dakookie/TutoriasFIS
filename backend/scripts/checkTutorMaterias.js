const mongoose = require('mongoose');

// Configuración
const MONGO_URI = 'mongodb+srv://TutoriasFIS:TUTORIASFIS2025-*@tutoriasfis.g1jx9dg.mongodb.net/tutoriasFIS?retryWrites=true&w=majority';

async function checkTutorAndMateria() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    // Esquemas básicos
    const usuarioSchema = new mongoose.Schema({}, { collection: 'usuarios', strict: false });
    const materiaSchema = new mongoose.Schema({}, { collection: 'materias', strict: false });

    const Usuario = mongoose.model('Usuario', usuarioSchema);
    const Materia = mongoose.model('Materia', materiaSchema);

    // 1. Encontrar tutor Juan
    const tutor = await Usuario.findOne({ 
      $or: [
        { email: 'juan.tutor@epn.edu.ec' },
        { nombre: 'Juan' }
      ]
    });

    if (tutor) {
      console.log('\n📝 Tutor Juan encontrado:');
      console.log('  - ID:', tutor._id);
      console.log('  - Email:', tutor.email || 'No definido');
      console.log('  - Rol:', tutor.rol);
      console.log('  - Materias:', tutor.materias || []);
      
      if (tutor.email) {
        console.log('\n✅ Puedes usar estos datos para login:');
        console.log(`  Email: ${tutor.email}`);
        console.log('  Password: password123 (asumo que es este)');
      }
    } else {
      console.log('❌ No se encontró el tutor Juan');
    }

    // 2. Buscar materias activas
    const materias = await Materia.find({ activa: true }).limit(3);
    console.log('\n📚 Materias activas disponibles:');
    materias.forEach((materia, index) => {
      console.log(`  ${index + 1}. ${materia.nombre} (${materia.codigo}) - ID: ${materia._id}`);
    });

    // 3. Verificar si el tutor puede dar alguna materia
    if (tutor && tutor.materias) {
      console.log('\n🔍 Verificando compatibilidad tutor-materias:');
      const materiasDelTutor = materias.filter(m => 
        tutor.materias.some(tm => 
          tm === m.nombre || tm === m.codigo || tm === m._id.toString()
        )
      );
      
      if (materiasDelTutor.length > 0) {
        console.log('✅ Materias que el tutor puede enseñar:');
        materiasDelTutor.forEach(m => {
          console.log(`  - ${m.nombre} (${m._id})`);
        });
      } else {
        console.log('⚠️ El tutor no está asignado a ninguna materia activa');
        console.log('   Materias del tutor:', tutor.materias);
        console.log('   Materias activas:', materias.map(m => m.nombre));
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkTutorAndMateria();