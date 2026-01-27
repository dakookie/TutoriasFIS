// Script para limpiar solicitudes duplicadas
// Mantiene solo la solicitud más reciente por cada par (tutoria, estudiante)

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tutoriasfis';

const solicitudSchema = new mongoose.Schema({
  tutoria: { type: mongoose.Schema.Types.ObjectId, ref: 'Tutoria' },
  estudiante: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
  estado: String,
  estudianteNombre: String,
}, { timestamps: true });

const Solicitud = mongoose.model('Solicitud', solicitudSchema);

async function limpiarDuplicados() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Conectado a MongoDB');

    // Encontrar duplicados
    const duplicados = await Solicitud.aggregate([
      {
        $group: {
          _id: { tutoria: '$tutoria', estudiante: '$estudiante' },
          count: { $sum: 1 },
          docs: { $push: { id: '$_id', createdAt: '$createdAt', estado: '$estado' } }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]);

    console.log(`Encontrados ${duplicados.length} grupos con duplicados`);

    for (const grupo of duplicados) {
      console.log(`\nGrupo: tutoria=${grupo._id.tutoria}, estudiante=${grupo._id.estudiante}`);
      console.log(`  Solicitudes: ${grupo.count}`);
      
      // Ordenar por fecha (más reciente primero) y luego por estado (Aceptada > Pendiente > Rechazada)
      const ordenados = grupo.docs.sort((a, b) => {
        // Primero por estado (prioridad: Aceptada > Pendiente > Rechazada)
        const prioridad = { 'Aceptada': 3, 'Pendiente': 2, 'Rechazada': 1 };
        const prioridadA = prioridad[a.estado] || 0;
        const prioridadB = prioridad[b.estado] || 0;
        if (prioridadA !== prioridadB) return prioridadB - prioridadA;
        
        // Luego por fecha (más reciente primero)
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      // Mantener el primero (mejor estado o más reciente), eliminar el resto
      const mantener = ordenados[0];
      const eliminar = ordenados.slice(1);

      console.log(`  Mantener: ${mantener.id} (estado: ${mantener.estado})`);
      
      for (const sol of eliminar) {
        console.log(`  Eliminar: ${sol.id} (estado: ${sol.estado})`);
        await Solicitud.findByIdAndDelete(sol.id);
      }
    }

    console.log('\n=== Limpieza completada ===');
    
    // Mostrar estado final
    const todas = await Solicitud.find({}).select('tutoria estudiante estado');
    console.log(`\nTotal de solicitudes ahora: ${todas.length}`);

    await mongoose.disconnect();
    console.log('Desconectado de MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

limpiarDuplicados();
