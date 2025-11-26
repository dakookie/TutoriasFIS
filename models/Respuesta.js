const mongoose = require('mongoose');

const respuestaSchema = new mongoose.Schema({
    tutoria: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tutoria',
        required: true
    },
    estudiante: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    respuestas: {
        type: Map,
        of: Number, // preguntaId: calificacion (1-5)
        required: true
    }
}, {
    timestamps: true
});

// Índice compuesto para evitar respuestas duplicadas
respuestaSchema.index({ tutoria: 1, estudiante: 1 }, { unique: true });

module.exports = mongoose.model('Respuesta', respuestaSchema);
