const mongoose = require('mongoose');
require('dotenv').config();

async function debug() {
  try {
    console.log('🔍 CONECTANDO A MONGODB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://saidlohan:UfAdRbF8t8rprFZO@clustersis.v4rh3.mongodb.net/tutoriasFIS', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Conectado!');

    // Obtener una muestra directa
    const Usuario = mongoose.model('Usuario', new mongoose.Schema({}, { strict: false, collection: 'usuarios' }));
    const Materia = mongoose.model('Materia', new mongoose.Schema({}, { strict: false, collection: 'materias' }));

    console.log('\n📚 OBTENIENDO TUTORES SIN POPULATE:');
    const tutoresSin = await Usuario.find({ rol: 'Tutor', activo: true });
    
    for (let i = 0; i < Math.min(tutoresSin.length, 2); i++) {
      const tutor = tutoresSin[i];
      console.log(`\n👤 ${tutor.nombre} ${tutor.apellido}`);
      console.log(`   Email: ${tutor.email}`);
      console.log(`   Materias (raw):`, tutor.materias);
      
      if (tutor.materias && tutor.materias.length > 0) {
        console.log(`   Tipo primer elemento:`, typeof tutor.materias[0]);
        console.log(`   Es ObjectId:`, mongoose.Types.ObjectId.isValid(tutor.materias[0]));
      }
    }

    console.log('\n📚 PROBANDO POPULATE CON MATERIAS SCHEMA:');
    
    // Intentar populate
    const tutoresPopulated = await Usuario.find({ rol: 'Tutor', activo: true })
      .populate({
        path: 'materias',
        model: 'Materia',
        options: { strictPopulate: false }
      });
    
    for (let i = 0; i < Math.min(tutoresPopulated.length, 2); i++) {
      const tutor = tutoresPopulated[i];
      console.log(`\n👤 ${tutor.nombre} ${tutor.apellido} (POPULATED)`);
      console.log(`   Materias:`, tutor.materias);
    }

    // Verificar las materias específicas
    console.log('\n🔍 VERIFICANDO MATERIAS ESPECÍFICAS:');
    const materia1 = await Materia.findById('697316c7f0576e776297ebed');
    const materia2 = await Materia.findById('697316c7f0576e776297ebef');
    
    console.log('Materia 1:', materia1);
    console.log('Materia 2:', materia2);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

debug();