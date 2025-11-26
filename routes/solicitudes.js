const express = require('express');
const router = express.Router();
const Solicitud = require('../models/Solicitud');
const Tutoria = require('../models/Tutoria');
const { requireAuth, requireRole } = require('../middleware/auth');

// POST /api/solicitudes - Crear nueva solicitud (estudiantes)
router.post('/', requireRole('Estudiante'), async (req, res) => {
    try {
        const { tutoriaId } = req.body;

        // Verificar que la tutoría existe y tiene cupos
        const tutoria = await Tutoria.findById(tutoriaId);
        
        if (!tutoria) {
            return res.status(404).json({
                success: false,
                message: 'Tutoría no encontrada'
            });
        }

        if (tutoria.cuposDisponibles <= 0) {
            return res.status(400).json({
                success: false,
                message: 'No hay cupos disponibles para esta tutoría'
            });
        }

        // Verificar que no existe una solicitud previa
        const solicitudExistente = await Solicitud.findOne({
            tutoria: tutoriaId,
            estudiante: req.user.userId
        });

        if (solicitudExistente) {
            return res.status(400).json({
                success: false,
                message: 'Ya enviaste una solicitud para esta tutoría'
            });
        }

        // Crear solicitud
        const solicitud = new Solicitud({
            tutoria: tutoriaId,
            estudiante: req.user.userId,
            estudianteNombre: `${req.user.nombre} ${req.user.apellido}`,
            materia: tutoria.materia,
            fecha: tutoria.fecha,
            horaInicio: tutoria.horaInicio,
            horaFin: tutoria.horaFin,
            tutor: tutoria.tutorNombre
        });

        await solicitud.save();

        // Notificar via Socket.IO al tutor
        req.app.get('io').to(`tutor-${tutoria.tutor}`).emit('nuevaSolicitud', {
            solicitud,
            tutoria: tutoria.materia
        });

        res.status(201).json({
            success: true,
            message: 'Solicitud enviada exitosamente',
            solicitud
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al crear solicitud',
            error: error.message
        });
    }
});

// GET /api/solicitudes/estudiante - Obtener solicitudes del estudiante actual
router.get('/estudiante', requireRole('Estudiante'), async (req, res) => {
    try {
        const solicitudes = await Solicitud.find({ estudiante: req.user.userId })
            .populate('tutoria')
            .sort({ createdAt: -1 });

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

// GET /api/solicitudes/tutoria/:tutoriaId - Obtener solicitudes de una tutoría (tutor)
router.get('/tutoria/:tutoriaId', requireAuth, async (req, res) => {
    try {
        const { estado } = req.query;
        let filtro = { tutoria: req.params.tutoriaId };

        if (estado && estado !== 'Todas') {
            filtro.estado = estado;
        }

        const solicitudes = await Solicitud.find(filtro)
            .populate('estudiante', 'nombre apellido email')
            .sort({ createdAt: -1 });

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

// PUT /api/solicitudes/:id/aceptar - Aceptar solicitud (tutor)
router.put('/:id/aceptar', requireRole('Tutor'), async (req, res) => {
    try {
        const solicitud = await Solicitud.findById(req.params.id).populate('tutoria');

        if (!solicitud) {
            return res.status(404).json({
                success: false,
                message: 'Solicitud no encontrada'
            });
        }

        const tutoria = solicitud.tutoria;

        // Verificar que la tutoría pertenece al tutor
        if (tutoria.tutor.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para gestionar esta solicitud'
            });
        }

        // Si ya está aceptada, no hacer nada
        if (solicitud.estado === 'Aceptada') {
            return res.json({
                success: true,
                message: 'La solicitud ya estaba aceptada',
                solicitud
            });
        }

        // Verificar cupos disponibles
        if (tutoria.cuposDisponibles <= 0) {
            return res.status(400).json({
                success: false,
                message: 'No hay cupos disponibles para aceptar esta solicitud'
            });
        }

        // Actualizar estado y reducir cupos
        solicitud.estado = 'Aceptada';
        await solicitud.save();

        tutoria.cuposDisponibles -= 1;
        await tutoria.save();

        console.log(`✅ Solicitud aceptada - Cupos restantes: ${tutoria.cuposDisponibles}/${tutoria.cuposOriginales}`);

        // Notificar via Socket.IO al estudiante
        req.app.get('io').to(`estudiante-${solicitud.estudiante}`).emit('solicitudAceptada', {
            solicitudId: solicitud._id,
            tutoria: tutoria.materia
        });

        res.json({
            success: true,
            message: 'Solicitud aceptada exitosamente',
            solicitud
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al aceptar solicitud',
            error: error.message
        });
    }
});

// PUT /api/solicitudes/:id/rechazar - Rechazar solicitud (tutor)
router.put('/:id/rechazar', requireRole('Tutor'), async (req, res) => {
    try {
        const solicitud = await Solicitud.findById(req.params.id).populate('tutoria');

        if (!solicitud) {
            return res.status(404).json({
                success: false,
                message: 'Solicitud no encontrada'
            });
        }

        const tutoria = solicitud.tutoria;

        // Verificar que la tutoría pertenece al tutor
        if (tutoria.tutor.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para gestionar esta solicitud'
            });
        }

        const estadoAnterior = solicitud.estado;

        // Actualizar estado
        solicitud.estado = 'Rechazada';
        await solicitud.save();

        // Si estaba aceptada, restaurar cupos
        if (estadoAnterior === 'Aceptada') {
            tutoria.cuposDisponibles += 1;
            await tutoria.save();
            console.log(`🔄 Solicitud rechazada - Cupos restaurados: ${tutoria.cuposDisponibles}/${tutoria.cuposOriginales}`);
        }

        // Notificar via Socket.IO al estudiante
        req.app.get('io').to(`estudiante-${solicitud.estudiante}`).emit('solicitudRechazada', {
            solicitudId: solicitud._id,
            tutoria: tutoria.materia
        });

        res.json({
            success: true,
            message: 'Solicitud rechazada exitosamente',
            solicitud
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al rechazar solicitud',
            error: error.message
        });
    }
});

// DELETE /api/solicitudes/:id - Eliminar solicitud (estudiante)
router.delete('/:id', requireRole('Estudiante'), async (req, res) => {
    try {
        const solicitud = await Solicitud.findById(req.params.id).populate('tutoria');

        if (!solicitud) {
            return res.status(404).json({
                success: false,
                message: 'Solicitud no encontrada'
            });
        }

        // Verificar que la solicitud pertenece al estudiante
        if (solicitud.estudiante.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para eliminar esta solicitud'
            });
        }

        const estadoAnterior = solicitud.estado;

        // Eliminar solicitud
        await solicitud.deleteOne();

        // Si estaba aceptada, restaurar cupos
        if (estadoAnterior === 'Aceptada') {
            const tutoria = solicitud.tutoria;
            tutoria.cuposDisponibles += 1;
            await tutoria.save();
            console.log(`🔄 Solicitud eliminada - Cupos restaurados: ${tutoria.cuposDisponibles}/${tutoria.cuposOriginales}`);
        }

        res.json({
            success: true,
            message: 'Solicitud eliminada exitosamente'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al eliminar solicitud',
            error: error.message
        });
    }
});

module.exports = router;
