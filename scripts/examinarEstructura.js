const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function examinarEstructuraDatos() {
  try {
    console.log('🔍 EXAMINANDO ESTRUCTURA DE DATOS...\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');
    
    const Usuario = mongoose.model('Usuario', new mongoose.Schema({}, { collection: 'usuarios' }));
    const Materia = mongoose.model('Materia', new mongoose.Schema({}, { collection: 'materias' }));
    
    // Examinar un tutor
    console.log('\n👤 EXAMINANDO ESTRUCTURA DE UN TUTOR:');
    const unTutor = await Usuario.findOne({ rol: 'Tutor', activo: true });
    if (unTutor) {
      console.log(JSON.stringify(unTutor, null, 2));
    }
    
    // Examinar una materia
    console.log('\n📚 EXAMINANDO ESTRUCTURA DE UNA MATERIA:');
    const unaMateria = await Materia.findOne({});
    if (unaMateria) {
      console.log(JSON.stringify(unaMateria, null, 2));
    }
    
    // Contar documentos
    const totalTutores = await Usuario.countDocuments({ rol: 'Tutor' });
    const totalMaterias = await Materia.countDocuments({});
    
    console.log('\n📊 CONTEOS:');
    console.log(`   - Total tutores: ${totalTutores}`);
    console.log(`   - Total materias: ${totalMaterias}`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

examinarEstructuraDatos();