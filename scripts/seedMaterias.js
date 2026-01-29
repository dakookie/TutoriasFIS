// Script para poblar materias iniciales en la base de datos
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tutorias_fis';

const materias = [
  { nombre: 'Cálculo Diferencial', codigo: 'MAT101', semestre: 1, activa: true },
  { nombre: 'Álgebra Lineal', codigo: 'MAT102', semestre: 1, activa: true },
  { nombre: 'Física I', codigo: 'FIS101', semestre: 1, activa: true },
  { nombre: 'Programación I', codigo: 'INF101', semestre: 1, activa: true },
  { nombre: 'Cálculo Integral', codigo: 'MAT201', semestre: 2, activa: true },
  { nombre: 'Física II', codigo: 'FIS201', semestre: 2, activa: true },
  { nombre: 'Programación II', codigo: 'INF201', semestre: 2, activa: true },
  { nombre: 'Estructuras de Datos', codigo: 'INF202', semestre: 2, activa: true },
  { nombre: 'Bases de Datos', codigo: 'INF301', semestre: 3, activa: true },
  { nombre: 'Ingeniería de Software', codigo: 'INF302', semestre: 3, activa: true },
  { nombre: 'Redes de Computadores', codigo: 'INF303', semestre: 3, activa: true },
  { nombre: 'Sistemas Operativos', codigo: 'INF304', semestre: 4, activa: true },
];

const materiaSchema = new mongoose.Schema({
  nombre: { type: String, required: true, unique: true },
  codigo: { type: String, required: true, unique: true },
  semestre: { type: Number, required: true },
  activa: { type: Boolean, default: true }
}, { timestamps: true });

const Materia = mongoose.model('Materia', materiaSchema);

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Limpiar materias existentes
    await Materia.deleteMany({});
    console.log('🗑️  Materias antiguas eliminadas');

    // Insertar materias
    await Materia.insertMany(materias);
    console.log(`✅ ${materias.length} materias insertadas correctamente`);

    const count = await Materia.countDocuments();
    console.log(`📊 Total de materias en BD: ${count}`);

    await mongoose.connection.close();
    console.log('✅ Conexión cerrada');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seed();
