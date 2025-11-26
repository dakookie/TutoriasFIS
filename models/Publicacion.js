const mongoose = require('mongoose');

const publicacionSchema = new mongoose.Schema({
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
    contenido: {
        type: String,
        required: [true, 'El contenido es requerido']
    },
    imagen: {
        type: String, // Base64
        default: null
    },
    tipoImagen: {
        type: String,
        enum: ['png', 'jpg', 'jpeg', 'gif', null],
        default: null
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
publicacionSchema.index({ tutoria: 1, createdAt: -1 });

module.exports = mongoose.model('Publicacion', publicacionSchema);
