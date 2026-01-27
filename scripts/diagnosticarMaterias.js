const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function diagnosticarMaterias() {
  try {
    console.log('🔍 DIAGNOSTICANDO PROBLEMA DE MATERIAS...\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');
    
    const Usuario = mongoose.model('Usuario', new mongoose.Schema({}, { collection: 'usuarios' }));
    const Materia = mongoose.model('Materia', new mongoose.Schema({}, { collection: 'materias' }));
    
    // Obtener tutores con populate
    console.log('\n📚 PROBANDO QUERY CON POPULATE:');
    const tutoresPopulated = await Usuario.find({ rol: 'Tutor', activo: true })
      .populate({
        path: 'materias',
        select: 'nombre codigo semestre',
        options: { strictPopulate: false }
      })
      .sort({ nombre: 1 });
    
    console.log(`✅ Tutores encontrados con populate: ${tutoresPopulated.length}\n`);
    
    tutoresPopulated.forEach((tutor, index) => {
      console.log(`${index + 1}. 👤 ${tutor.nombre} ${tutor.apellido}`);
      console.log(`   📧 Email: ${tutor.email}`);
      
      if (tutor.materias && tutor.materias.length > 0) {
        console.log(`   📚 Materias (${tutor.materias.length}):`);
        tutor.materias.forEach((materia, matIndex) => {
          if (typeof materia === 'string') {
            console.log(`      ${matIndex + 1}. STRING: "${materia}"`);
          } else if (materia && materia.nombre) {
            console.log(`      ${matIndex + 1}. OBJETO: "${materia.nombre}" (${materia.codigo || 'Sin código'})`);
          } else {
            console.log(`      ${matIndex + 1}. PROBLEMA: ${JSON.stringify(materia)}`);
          }
        });
      } else {
        console.log('   📚 Sin materias');
      }
      console.log('');
    });
    
    // Verificar las materias que causaron problemas
    console.log('\n🔍 VERIFICANDO MATERIAS ESPECÍFICAS:');
    const materiasProblemáticas = [
      '697316c7f0576e776297ebed',
      '697316c7f0576e776297ebef'
    ];
    
    for (const id of materiasProblemáticas) {
      try {
        const materia = await Materia.findById(id);
        if (materia) {
          console.log(`✅ ID ${id}: "${materia.nombre}" (${materia.codigo || 'Sin código'})`);
        } else {
          console.log(`❌ ID ${id}: No encontrada en colección materias`);
        }
      } catch (error) {
        console.log(`❌ ID ${id}: Error - ${error.message}`);
      }
    }
    
    console.log('\n📊 RESUMEN:');
    console.log('   Si ves "OBJETO" arriba, el populate funciona');
    console.log('   Si ves "STRING", son materias guardadas como texto');
    console.log('   Si ves "PROBLEMA", el populate falló');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

diagnosticarMaterias();