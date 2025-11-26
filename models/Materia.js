const mongoose = require('mongoose');

const materiaSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre de la materia es requerido'],
        unique: true,
        trim: true
    },
    codigo: {
        type: String,
        required: [true, 'El código de la materia es requerido'],
        unique: true,
        trim: true,
        uppercase: true
    },
    semestre: {
        type: Number,
        required: [true, 'El semestre es requerido'],
        min: 1,
        max: 10
    },
    activa: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Índice para búsquedas por nombre
materiaSchema.index({ nombre: 1 });
materiaSchema.index({ semestre: 1 });

module.exports = mongoose.model('Materia', materiaSchema);
