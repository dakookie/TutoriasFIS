const mongoose = require('mongoose');

const tutoriaSchema = new mongoose.Schema({
    materia: {
        type: String,
        required: [true, 'La materia es requerida']
    },
    fecha: {
        type: Date,
        required: [true, 'La fecha es requerida']
    },
    horaInicio: {
        type: String,
        required: [true, 'La hora de inicio es requerida']
    },
    horaFin: {
        type: String,
        required: [true, 'La hora de fin es requerida']
    },
    cuposOriginales: {
        type: Number,
        required: [true, 'Los cupos son requeridos'],
        min: 1
    },
    cuposDisponibles: {
        type: Number,
        required: true,
        min: 0
    },
    tutor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    tutorNombre: {
        type: String,
        required: true
    },
    activa: {
        type: Boolean,
        default: true
    },
    // Configuración del aula
    modalidadAula: {
        type: String,
        enum: ['Presencial', 'Virtual'],
        default: null
    },
    nombreAula: {
        type: String,
        default: null
    },
    enlaceReunion: {
        type: String,
        default: null
    },
    aulaConfigurada: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Índice para búsquedas por materia y fecha
tutoriaSchema.index({ materia: 1, fecha: 1 });

module.exports = mongoose.model('Tutoria', tutoriaSchema);
