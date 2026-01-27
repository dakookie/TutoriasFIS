const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const MONGO_URI = 'mongodb+srv://TutoriasFIS:TUTORIASFIS2025-*@tutoriasfis.g1jx9dg.mongodb.net/tutoriasFIS?retryWrites=true&w=majority';

async function checkPassword() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    const usuarioSchema = new mongoose.Schema({}, { collection: 'usuarios', strict: false });
    const Usuario = mongoose.model('Usuario', usuarioSchema);

    const tutor = await Usuario.findOne({ email: 'juan.perez@epn.edu.ec' });
    
    if (tutor) {
      console.log('\n📝 Información del tutor Juan:');
      console.log('  - ID:', tutor._id);
      console.log('  - Email:', tutor.email);
      console.log('  - Password hash:', tutor.password ? 'Existe' : 'No existe');
      console.log('  - Primer parte del hash:', tutor.password?.substring(0, 20) + '...');

      // Verificar varias contraseñas posibles
      const passwordsToTry = ['password123', 'juan123', '123456', 'tutor123'];
      
      console.log('\n🔐 Probando contraseñas comunes...');
      for (const pwd of passwordsToTry) {
        try {
          const match = await bcrypt.compare(pwd, tutor.password);
          console.log(`  - "${pwd}": ${match ? '✅ CORRECTO' : '❌'}`);
          if (match) {
            console.log(`\n🎉 ¡Contraseña encontrada! Usa: "${pwd}"`);
            break;
          }
        } catch (error) {
          console.log(`  - "${pwd}": ❌ Error comparando`);
        }
      }
    } else {
      console.log('❌ No se encontró el tutor');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkPassword();