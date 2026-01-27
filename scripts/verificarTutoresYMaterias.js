const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function verificarTutoresYMaterias() {
  try {
    console.log('🔍 VERIFICANDO TUTORES Y MATERIAS EN LA BASE DE DATOS...\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');
    
    const Usuario = mongoose.model('Usuario', new mongoose.Schema({}, { collection: 'usuarios' }));
    const Materia = mongoose.model('Materia', new mongoose.Schema({}, { collection: 'materias' }));
    
    // Obtener todos los tutores
    const tutores = await Usuario.find({ rol: 'Tutor', activo: true }).sort({ nombre: 1 });
    
    console.log('\n👥 TUTORES ENCONTRADOS:');
    console.log('─'.repeat(80));
    console.log('Nombre'.padEnd(25) + 'Email'.padEnd(30) + 'Materias');
    console.log('─'.repeat(80));
    
    for (const tutor of tutores) {
      const nombre = tutor.nombre || 'N/A';
      const email = tutor.email || 'N/A';
      const materias = tutor.materias || [];
      let materiasInfo = '';
      
      if (materias.length > 0) {
        // Si tiene materias, obtener la información completa
        const materiasCompletas = await Materia.find({ _id: { $in: materias } });
        materiasInfo = materiasCompletas.map(m => m.nombre || 'Sin nombre').join(', ');
      } else {
        materiasInfo = 'Sin materias';
      }
      
      console.log(`${nombre.padEnd(25)}${email.padEnd(30)}${materiasInfo}`);
    }
    
    // Obtener todas las materias disponibles
    const todasMaterias = await Materia.find({}).sort({ nombre: 1 });
    
    console.log('\n📚 MATERIAS DISPONIBLES EN EL SISTEMA:');
    console.log('─'.repeat(50));
    todasMaterias.forEach(materia => {
      console.log(`   - ${materia.nombre} (${materia.codigo || 'Sin código'}) - Semestre ${materia.semestre || 'N/A'}`);
    });
    
    console.log('\n' + '='.repeat(60));
    const tutoresConMaterias = tutores.filter(t => t.materias && t.materias.length > 0);
    console.log(`📊 RESUMEN:`);
    console.log(`   - Total de tutores activos: ${tutores.length}`);
    console.log(`   - Tutores con materias: ${tutoresConMaterias.length}`);
    console.log(`   - Tutores sin materias: ${tutores.length - tutoresConMaterias.length}`);
    console.log(`   - Total de materias en el sistema: ${todasMaterias.length}`);
    
    if (tutoresConMaterias.length === 0) {
      console.log('\n❌ PROBLEMA: Ningún tutor tiene materias asignadas');
      console.log('   Esto explica por qué aparece "Sin materias" en el frontend');
      console.log('   Necesitas asignar materias a los tutores');
    } else {
      console.log('\n✅ Algunos tutores tienen materias asignadas');
    }
    console.log('='.repeat(60));
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verificarTutoresYMaterias();