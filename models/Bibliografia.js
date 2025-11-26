const mongoose = require('mongoose');

const bibliografiaSchema = new mongoose.Schema({
    tutoria: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tutoria',
        required: true
    },
    titulo: {
        type: String,
        required: [true, 'El título es requerido'],
        trim: true
    },
    descripcion: {
        type: String,
        trim: true
    },
    archivo: {
        type: String, // Base64 del archivo PDF o imagen
        required: [true, 'El archivo es requerido']
    },
    tipoArchivo: {
        type: String,
        enum: ['pdf', 'png', 'jpg', 'jpeg'],
        required: true
    },
    tutor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    tutorNombre: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

// Índice para búsquedas por tutoría
bibliografiaSchema.index({ tutoria: 1, createdAt: -1 });

module.exports = mongoose.model('Bibliografia', bibliografiaSchema);
