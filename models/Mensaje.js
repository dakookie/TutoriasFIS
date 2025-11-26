const mongoose = require('mongoose');

const mensajeSchema = new mongoose.Schema({
    tutoria: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tutoria',
        required: [true, 'La tutoría es requerida']
    },
    emisor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: [true, 'El emisor es requerido']
    },
    emisorNombre: {
        type: String,
        required: true
    },
    emisorRol: {
        type: String,
        enum: ['Tutor', 'Estudiante'],
        required: true
    },
    receptor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: [true, 'El receptor es requerido']
    },
    receptorNombre: {
        type: String,
        required: true
    },
    contenido: {
        type: String,
        required: [true, 'El contenido del mensaje es requerido'],
        trim: true,
        maxlength: [1000, 'El mensaje no puede exceder 1000 caracteres']
    },
    leido: {
        type: Boolean,
        default: false
    },
    fechaLectura: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Índices para mejorar rendimiento
mensajeSchema.index({ tutoria: 1, createdAt: -1 });
mensajeSchema.index({ receptor: 1, leido: 1 });
mensajeSchema.index({ emisor: 1, receptor: 1 });

// Método para marcar mensaje como leído
mensajeSchema.methods.marcarComoLeido = async function() {
    if (!this.leido) {
        this.leido = true;
        this.fechaLectura = new Date();
        await this.save();
    }
};

// Método estático para obtener mensajes no leídos por usuario
mensajeSchema.statics.contarNoLeidos = async function(receptorId) {
    return await this.countDocuments({ 
        receptor: receptorId, 
        leido: false 
    });
};

// Método estático para obtener mensajes por tutoría
mensajeSchema.statics.obtenerPorTutoria = async function(tutoriaId, limite = 50) {
    return await this.find({ tutoria: tutoriaId })
        .sort({ createdAt: 1 })
        .limit(limite)
        .lean();
};

module.exports = mongoose.model('Mensaje', mensajeSchema);
