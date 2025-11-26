const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const usuarioSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre es requerido'],
        trim: true
    },
    apellido: {
        type: String,
        required: [true, 'El apellido es requerido'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'El email es requerido'],
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'La contraseña es requerida'],
        minlength: 6
    },
    rol: {
        type: String,
        enum: ['Administrador', 'Tutor', 'Estudiante'],
        required: true
    },
    materias: [{
        type: String
    }],
    activo: {
        type: Boolean,
        default: false
    },
    pdf: {
        type: String,
        default: null
    },
    resetPasswordToken: {
        type: String,
        default: null
    },
    resetPasswordExpires: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Hash password antes de guardar
usuarioSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Método para comparar contraseñas
usuarioSchema.methods.compararPassword = async function(passwordIngresada) {
    return await bcrypt.compare(passwordIngresada, this.password);
};

module.exports = mongoose.model('Usuario', usuarioSchema);
