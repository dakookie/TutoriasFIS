const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

// POST /api/auth/registro - Registrar nuevo usuario (tutor o estudiante)
router.post('/registro', async (req, res) => {
    try {
        const { nombre, apellido, email, password, rol, materias, pdf } = req.body;

        // Validar que el rol sea válido
        if (!['Tutor', 'Estudiante'].includes(rol)) {
            return res.status(400).json({
                success: false,
                message: 'Rol inválido. Debe ser Tutor o Estudiante'
            });
        }

        // Verificar si el email ya existe
        const usuarioExistente = await Usuario.findOne({ email });
        if (usuarioExistente) {
            return res.status(400).json({
                success: false,
                message: 'El email ya está registrado'
            });
        }

        // Crear nuevo usuario (pendiente de aprobación)
        const usuario = new Usuario({
            nombre,
            apellido,
            email,
            password,
            rol,
            materias: materias || [],
            pdf: pdf || null,
            activo: false
        });

        await usuario.save();

        res.status(201).json({
            success: true,
            message: 'Solicitud de registro enviada. Espera la aprobación del administrador.',
            usuario: {
                id: usuario._id,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                email: usuario.email,
                rol: usuario.rol
            }
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({
            success: false,
            message: 'Error al procesar el registro',
            error: error.message
        });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Buscar usuario por email
        const usuario = await Usuario.findOne({ email });
        
        if (!usuario) {
            return res.status(401).json({
                success: false,
                message: 'Email o contraseña incorrectos'
            });
        }

        // Verificar si el usuario está activo
        if (!usuario.activo) {
            return res.status(403).json({
                success: false,
                message: 'Tu cuenta aún no ha sido aprobada por el administrador'
            });
        }

        // Verificar contraseña
        const passwordCorrecta = await usuario.compararPassword(password);
        
        if (!passwordCorrecta) {
            return res.status(401).json({
                success: false,
                message: 'Email o contraseña incorrectos'
            });
        }

        // Generar JWT
        const token = jwt.sign(
            {
                userId: usuario._id,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                email: usuario.email,
                rol: usuario.rol,
                materias: usuario.materias
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Enviar token en cookie HTTP-only
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
        });

        res.json({
            success: true,
            message: 'Inicio de sesión exitoso',
            usuario: {
                id: usuario._id,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                email: usuario.email,
                rol: usuario.rol,
                materias: usuario.materias
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error al iniciar sesión',
            error: error.message
        });
    }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({
        success: true,
        message: 'Sesión cerrada exitosamente'
    });
});

// GET /api/auth/session - Obtener información de sesión actual
router.get('/session', (req, res) => {
    const token = req.cookies.token;
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'No hay sesión activa'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        res.json({
            success: true,
            usuario: {
                _id: decoded.userId,
                nombre: decoded.nombre,
                apellido: decoded.apellido,
                email: decoded.email,
                rol: decoded.rol,
                materias: decoded.materias
            }
        });
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token inválido o expirado'
        });
    }
});

module.exports = router;
