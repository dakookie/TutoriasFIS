const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

// POST /api/auth/registro - Registrar nuevo usuario (tutor o estudiante)
router.post('/registro', async (req, res) => {
    try {
        const { nombre, apellido, email, password, rol, materias, pdf, username } = req.body;

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
                message: 'El correo electrónico ya está registrado'
            });
        }

        // Verificar si el username ya existe (si se proporciona)
        if (username) {
            const usernameExistente = await Usuario.findOne({ username });
            if (usernameExistente) {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre de usuario ya está en uso'
                });
            }
        }

        // Crear nuevo usuario (pendiente de aprobación)
        const usuario = new Usuario({
            nombre,
            apellido,
            email,
            password,
            rol,
            username: username || null,
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

        // Buscar usuario por email o username
        const usuario = await Usuario.findOne({
            $or: [
                { email: email },
                { username: email }
            ]
        });
        
        if (!usuario) {
            return res.status(401).json({
                success: false,
                message: 'Usuario o contraseña incorrectos'
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
                message: 'Usuario o contraseña incorrectos'
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

// POST /api/auth/forgot-password - Solicitar reseteo de contraseña
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        // Buscar usuario por email
        const usuario = await Usuario.findOne({ email });
        
        if (!usuario) {
            // Por seguridad, no revelar si el email existe o no
            return res.json({
                success: true,
                message: 'Si el email existe, recibirás instrucciones para resetear tu contraseña'
            });
        }

        // Generar token de reseteo (simulación - en producción usarías crypto)
        const resetToken = Math.random().toString(36).substring(2, 15) + 
                          Math.random().toString(36).substring(2, 15);
        
        // Guardar token y fecha de expiración (1 hora)
        usuario.resetPasswordToken = resetToken;
        usuario.resetPasswordExpires = Date.now() + 3600000; // 1 hora
        await usuario.save();

        // En producción, aquí enviarías un email
        // Por ahora, devolvemos el token directamente (solo para desarrollo)
        console.log(`Token de reseteo para ${email}: ${resetToken}`);
        console.log(`URL de reseteo: http://localhost:3000/reset-password.html?token=${resetToken}`);

        res.json({
            success: true,
            message: 'Si el email existe, recibirás instrucciones para resetear tu contraseña',
            devToken: resetToken
        });

    } catch (error) {
        console.error('Error en forgot-password:', error);
        res.status(500).json({
            success: false,
            message: 'Error al procesar la solicitud',
            error: error.message
        });
    }
});

// POST /api/auth/reset-password - Resetear contraseña con token
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Token y nueva contraseña son requeridos'
            });
        }

        // Validar contraseña (mínimo 8 caracteres, con letra, número y carácter especial)
        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe tener al menos 8 caracteres'
            });
        }

        const tieneLetra = /[a-zA-Z]/.test(newPassword);
        const tieneNumero = /[0-9]/.test(newPassword);
        const tieneEspecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
        
        if (!tieneLetra || !tieneNumero || !tieneEspecial) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe incluir al menos una letra, un número y un carácter especial'
            });
        }

        // Buscar usuario con token válido y no expirado
        const usuario = await Usuario.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!usuario) {
            return res.status(400).json({
                success: false,
                message: 'Token inválido o expirado'
            });
        }

        // Actualizar contraseña y limpiar campos de reseteo
        usuario.password = newPassword;
        usuario.resetPasswordToken = null;
        usuario.resetPasswordExpires = null;
        await usuario.save();

        res.json({
            success: true,
            message: 'Contraseña actualizada exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña.'
        });

    } catch (error) {
        console.error('Error en reset-password:', error);
        res.status(500).json({
            success: false,
            message: 'Error al resetear la contraseña',
            error: error.message
        });
    }
});

// GET /api/auth/verify-reset-token - Verificar si un token de reseteo es válido
router.get('/verify-reset-token/:token', async (req, res) => {
    try {
        const { token } = req.params;

        const usuario = await Usuario.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!usuario) {
            return res.status(400).json({
                success: false,
                message: 'Token inválido o expirado'
            });
        }

        res.json({
            success: true,
            message: 'Token válido',
            email: usuario.email
        });

    } catch (error) {
        console.error('Error en verify-reset-token:', error);
        res.status(500).json({
            success: false,
            message: 'Error al verificar el token'
        });
    }
});

module.exports = router;
