const express = require('express');
const router = express.Router();
const Usuario = require('../models/Usuario');
const { requireAuth, requireRole } = require('../middleware/auth');

// GET /api/admin/solicitudes/tutores - Obtener solicitudes de tutores pendientes
router.get('/solicitudes/tutores', requireRole('Administrador'), async (req, res) => {
    try {
        const solicitudes = await Usuario.find({
            rol: 'Tutor',
            activo: false
        }).select('-password');

        res.json({
            success: true,
            solicitudes
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener solicitudes',
            error: error.message
        });
    }
});

// GET /api/admin/solicitudes/estudiantes - Obtener solicitudes de estudiantes pendientes
router.get('/solicitudes/estudiantes', requireRole('Administrador'), async (req, res) => {
    try {
        const solicitudes = await Usuario.find({
            rol: 'Estudiante',
            activo: false
        }).select('-password');

        res.json({
            success: true,
            solicitudes
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener solicitudes',
            error: error.message
        });
    }
});

// PUT /api/admin/solicitudes/:id/aprobar - Aprobar solicitud
router.put('/solicitudes/:id/aprobar', requireRole('Administrador'), async (req, res) => {
    try {
        const usuario = await Usuario.findByIdAndUpdate(
            req.params.id,
            { activo: true },
            { new: true }
        ).select('-password');

        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Emitir evento Socket.IO para notificar
        req.app.get('io').emit('solicitudAprobada', {
            usuarioId: usuario._id,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            rol: usuario.rol
        });

        res.json({
            success: true,
            message: 'Solicitud aprobada exitosamente',
            usuario
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al aprobar solicitud',
            error: error.message
        });
    }
});

// DELETE /api/admin/solicitudes/:id - Rechazar solicitud
router.delete('/solicitudes/:id', requireRole('Administrador'), async (req, res) => {
    try {
        const usuario = await Usuario.findByIdAndDelete(req.params.id);

        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Solicitud rechazada exitosamente'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al rechazar solicitud',
            error: error.message
        });
    }
});

module.exports = router;
