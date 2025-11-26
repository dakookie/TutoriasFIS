const mongoose = require('mongoose');

const solicitudSchema = new mongoose.Schema({
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
    estudianteNombre: {
        type: String,
        required: true
    },
    estado: {
        type: String,
        enum: ['Pendiente', 'Aceptada', 'Rechazada'],
        default: 'Pendiente'
    },
    // Datos desnormalizados para consultas rápidas
    materia: String,
    fecha: Date,
    horaInicio: String,
    horaFin: String,
    tutor: String
}, {
    timestamps: true
});

// Índice compuesto para evitar solicitudes duplicadas
solicitudSchema.index({ tutoria: 1, estudiante: 1 }, { unique: true });

module.exports = mongoose.model('Solicitud', solicitudSchema);
