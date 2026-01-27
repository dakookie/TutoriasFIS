const mongoose = require('mongoose');
require('dotenv').config();

async function corregirMateriasSaid() {
  try {
    console.log('🔍 CONECTANDO A MONGODB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://saidlohan:UfAdRbF8t8rprFZO@clustersis.v4rh3.mongodb.net/tutoriasFIS');
    
    console.log('✅ Conectado!');

    const Usuario = mongoose.model('Usuario', new mongoose.Schema({}, { strict: false, collection: 'usuarios' }));
    const Materia = mongoose.model('Materia', new mongoose.Schema({}, { strict: false, collection: 'materias' }));

    // 1. Obtener las materias que corresponden a esos ObjectIds
    const objectIds = [
      '697316c7f0576e776297ebed',
      '697316c7f0576e776297ebef',
      '697316c7f0576e776297ebec'
    ];
    
    console.log('\n📚 CONSULTANDO MATERIAS:');
    const materias = await Materia.find({ _id: { $in: objectIds } });
    
    const materiasMap = {};
    materias.forEach(materia => {
      materiasMap[materia._id.toString()] = materia.nombre;
      console.log(`   ${materia._id} -> "${materia.nombre}"`);
    });
    
    // 2. Obtener Said Luna
    const saidLuna = await Usuario.findOne({ email: 'said.luna@epn.edu.ec' });
    if (!saidLuna) {
      console.log('❌ No se encontró a Said Luna');
      return;
    }
    
    console.log('\n👤 USUARIO ENCONTRADO:');
    console.log(`   Nombre: ${saidLuna.nombre} ${saidLuna.apellido}`);
    console.log(`   Materias actuales:`, saidLuna.materias);
    
    // 3. Convertir ObjectIds a nombres
    const nuevasMaterias = saidLuna.materias.map(materia => {
      if (materiasMap[materia]) {
        console.log(`   ✅ Convirtiendo ${materia} -> "${materiasMap[materia]}"`);
        return materiasMap[materia];
      } else {
        console.log(`   ⚠️  No se encontró materia para ${materia}, manteniendo como está`);
        return materia;
      }
    });
    
    console.log('\n🔄 NUEVAS MATERIAS:', nuevasMaterias);
    
    // 4. Actualizar usuario
    const resultado = await Usuario.updateOne(
      { _id: saidLuna._id },
      { $set: { materias: nuevasMaterias } }
    );
    
    if (resultado.modifiedCount > 0) {
      console.log('✅ Usuario actualizado exitosamente');
      
      // Verificar actualización
      const usuarioActualizado = await Usuario.findById(saidLuna._id);
      console.log('\n✅ VERIFICACIÓN - Nuevas materias:');
      usuarioActualizado.materias.forEach((materia, index) => {
        console.log(`   ${index + 1}. "${materia}"`);
      });
    } else {
      console.log('❌ No se pudo actualizar el usuario');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

corregirMateriasSaid();