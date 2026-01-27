const mongoose = require('mongoose');

// Conexión a la base de datos
const MONGO_URI = 'mongodb+srv://TutoriasFIS:TUTORIASFIS2025-*@tutoriasfis.g1jx9dg.mongodb.net/tutoriasFIS?retryWrites=true&w=majority';

async function testTutoriaCreation() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Conectado a MongoDB Atlas');

    // Esquemas
    const UsuarioSchema = new mongoose.Schema({
      nombre: String,
      email: String,
      rol: String,
      materias: [String],
    }, { collection: 'usuarios' });

    const MateriaSchema = new mongoose.Schema({
      nombre: String,
      codigo: String,
      activa: Boolean
    }, { collection: 'materias' });

    const TutoriaSchema = new mongoose.Schema({
      materia: { type: mongoose.Schema.Types.ObjectId, ref: 'Materia' },
      tutor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
      fecha: Date,
      horaInicio: String,
      horaFin: String,
      cuposOriginales: Number,
      cuposDisponibles: Number,
      modalidadAula: String,
      nombreAula: String,
      enlaceAula: String,
      tutorNombre: String,
      materiaNombre: String,
      publicada: { type: Boolean, default: false },
      activa: { type: Boolean, default: true }
    }, { collection: 'tutorias', timestamps: true });

    const Usuario = mongoose.model('Usuario', UsuarioSchema);
    const Materia = mongoose.model('Materia', MateriaSchema);
    const Tutoria = mongoose.model('Tutoria', TutoriaSchema);

    // 1. Encontrar un tutor
    const tutor = await Usuario.findOne({ rol: 'Tutor' });
    console.log('\n📝 Tutor encontrado:', {
      id: tutor?._id,
      nombre: tutor?.nombre,
      materias: tutor?.materias
    });

    if (!tutor) {
      console.log('❌ No se encontró ningún tutor');
      return;
    }

    // 2. Encontrar una materia
    const materia = await Materia.findOne({ activa: true });
    console.log('\n📚 Materia encontrada:', {
      id: materia?._id,
      nombre: materia?.nombre,
      codigo: materia?.codigo
    });

    if (!materia) {
      console.log('❌ No se encontró ninguna materia activa');
      return;
    }

    // 3. Preparar datos para crear tutoría
    const tutoriaData = {
      materia: materia._id,
      tutor: tutor._id,
      fecha: new Date(Date.now() + 24 * 60 * 60 * 1000), // Mañana
      horaInicio: '14:00',
      horaFin: '15:00',
      cuposOriginales: 10,
      cuposDisponibles: 10,
      modalidadAula: 'Virtual',
      nombreAula: 'Sala de prueba',
      enlaceAula: 'https://meet.google.com/test-room',
      tutorNombre: tutor.nombre,
      materiaNombre: materia.nombre
    };

    console.log('\n🔧 Datos para crear tutoría:', tutoriaData);

    // 4. Intentar crear la tutoría
    const nuevaTutoria = new Tutoria(tutoriaData);
    const tutoriaGuardada = await nuevaTutoria.save();

    console.log('\n✅ Tutoría creada exitosamente:', {
      id: tutoriaGuardada._id,
      materia: tutoriaGuardada.materiaNombre,
      tutor: tutoriaGuardada.tutorNombre,
      fecha: tutoriaGuardada.fecha,
      cupos: tutoriaGuardada.cuposOriginales
    });

    // 5. Verificar que se puede consultar
    const tutoriaConsultada = await Tutoria.findById(tutoriaGuardada._id);
    console.log('\n🔍 Tutoría consultada:', tutoriaConsultada ? '✅ Encontrada' : '❌ No encontrada');

    // 6. Limpiar la tutoría de prueba
    await Tutoria.findByIdAndDelete(tutoriaGuardada._id);
    console.log('\n🧹 Tutoría de prueba eliminada');

  } catch (error) {
    console.error('\n❌ Error en la prueba:', error);
    
    // Detalles específicos del error
    if (error.name === 'ValidationError') {
      console.log('\n🔍 Errores de validación:');
      Object.keys(error.errors).forEach(key => {
        console.log(`  - ${key}: ${error.errors[key].message}`);
      });
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n📝 Desconectado de MongoDB');
  }
}

testTutoriaCreation();