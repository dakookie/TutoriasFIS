const mongoose = require('mongoose');

const preguntaSchema = new mongoose.Schema({
    pregunta: {
        type: String,
        required: [true, 'El texto de la pregunta es requerido']
    },
    materia: {
        type: String,
        required: [true, 'La materia es requerida']
    },
    activa: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Índice para búsquedas por materia
preguntaSchema.index({ materia: 1, activa: 1 });

module.exports = mongoose.model('Pregunta', preguntaSchema);
