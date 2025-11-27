const express = require('express');
const router = express.Router();
const Mensaje = require('../models/Mensaje');
const Tutoria = require('../models/Tutoria');
const Usuario = require('../models/Usuario');
const { requireAuth } = require('../middleware/auth');

// GET /api/mensajes/tutoria/:tutoriaId - Obtener mensajes de una tutoría
router.get('/tutoria/:tutoriaId', requireAuth, async (req, res) => {
    try {
        const { tutoriaId } = req.params;
        const userId = req.user.userId;

        // Verificar que la tutoría existe
        const tutoria = await Tutoria.findById(tutoriaId);
        if (!tutoria) {
            return res.status(404).json({
                success: false,
                message: 'Tutoría no encontrada'
            });
        }

        // Verificar que el usuario es parte de la tutoría (tutor o estudiante inscrito)
        const esTutor = tutoria.tutor.toString() === userId;
        
        if (!esTutor) {
            // Verificar si es estudiante inscrito
            const Solicitud = require('../models/Solicitud');
            const solicitud = await Solicitud.findOne({
                tutoria: tutoriaId,
                estudiante: userId,
                estado: 'Aceptada'
            });

            if (!solicitud) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permiso para ver estos mensajes'
                });
            }
        }

        // Obtener mensajes
        const mensajes = await Mensaje.obtenerPorTutoria(tutoriaId);

        // Marcar como leídos los mensajes recibidos por este usuario
        await Mensaje.updateMany(
            { 
                tutoria: tutoriaId,
                receptor: userId,
                leido: false 
            },
            { 
                leido: true,
                fechaLectura: new Date()
            }
        );

        res.json({
            success: true,
            mensajes
        });

    } catch (error) {
        console.error('Error al obtener mensajes:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener mensajes',
            error: error.message
        });
    }
});

// GET /api/mensajes/conversaciones - Obtener lista de conversaciones del usuario
router.get('/conversaciones', requireAuth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRol = req.user.rol;
        const Solicitud = require('../models/Solicitud');

        // Obtener tutorías donde el usuario participa
        let tutorias;
        if (userRol === 'Tutor') {
            // Tutorías donde es tutor
            tutorias = await Tutoria.find({ tutor: userId })
                .populate('tutor', 'nombre apellido')
                .select('materia materiaNombre fecha tutor tutorNombre')
                .lean();
        } else {
            // Tutorías donde es estudiante aceptado
            const solicitudes = await Solicitud.find({
                estudiante: userId,
                estado: 'Aceptada'
            }).select('tutoria');

            const tutoriaIds = solicitudes.map(s => s.tutoria);
            tutorias = await Tutoria.find({ _id: { $in: tutoriaIds } })
                .populate('tutor', 'nombre apellido')
                .select('materia materiaNombre fecha tutor tutorNombre')
                .lean();
        }

        // Para cada tutoría, obtener participantes, último mensaje y contar no leídos
        const conversaciones = await Promise.all(tutorias.map(async (tutoria) => {
            try {
                // Obtener estudiantes aceptados en esta tutoría
                const solicitudesAceptadas = await Solicitud.find({
                    tutoria: tutoria._id,
                    estado: 'Aceptada'
                }).populate('estudiante', 'nombre apellido').lean();

                // Filtrar solo estudiantes que existen (populate no devolvió null)
                const estudiantes = solicitudesAceptadas
                    .filter(s => s.estudiante)
                    .map(s => ({
                        _id: s.estudiante._id,
                        nombre: s.estudiante.nombre,
                        apellido: s.estudiante.apellido
                    }));

                const ultimoMensaje = await Mensaje.findOne({ tutoria: tutoria._id })
                    .sort({ createdAt: -1 })
                    .lean();

                const noLeidos = await Mensaje.countDocuments({
                    tutoria: tutoria._id,
                    receptor: userId,
                    leido: false
                });

                return {
                    tutoria: {
                        _id: tutoria._id,
                        materia: tutoria.materiaNombre || tutoria.materia,
                        fecha: tutoria.fecha,
                        tutor: tutoria.tutor,
                        tutorNombre: tutoria.tutorNombre
                    },
                    estudiantes,
                    participantes: estudiantes.length + 1, // +1 por el tutor
                    ultimoMensaje,
                    mensajesNoLeidos: noLeidos
                };
            } catch (error) {
                console.error(`Error procesando tutoría ${tutoria._id}:`, error);
                return null;
            }
        }));

        // Filtrar conversaciones nulas (que tuvieron error) y con al menos un estudiante
        const conversacionesConParticipantes = conversaciones
            .filter(c => c !== null && c.estudiantes.length > 0);

        // Ordenar por última actividad
        conversacionesConParticipantes.sort((a, b) => {
            const fechaA = a.ultimoMensaje ? new Date(a.ultimoMensaje.createdAt) : new Date(a.tutoria.fecha);
            const fechaB = b.ultimoMensaje ? new Date(b.ultimoMensaje.createdAt) : new Date(b.tutoria.fecha);
            return fechaB - fechaA;
        });

        res.json({
            success: true,
            conversaciones: conversacionesConParticipantes
        });

    } catch (error) {
        console.error('Error al obtener conversaciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener conversaciones',
            error: error.message
        });
    }
});

// GET /api/mensajes/no-leidos - Contar mensajes no leídos
router.get('/no-leidos', requireAuth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const count = await Mensaje.contarNoLeidos(userId);

        res.json({
            success: true,
            count
        });

    } catch (error) {
        console.error('Error al contar mensajes no leídos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al contar mensajes no leídos',
            error: error.message
        });
    }
});

// PUT /api/mensajes/:mensajeId/marcar-leido - Marcar mensaje como leído
router.put('/:mensajeId/marcar-leido', requireAuth, async (req, res) => {
    try {
        const { mensajeId } = req.params;
        const userId = req.user.userId;

        const mensaje = await Mensaje.findById(mensajeId);
        
        if (!mensaje) {
            return res.status(404).json({
                success: false,
                message: 'Mensaje no encontrado'
            });
        }

        // Verificar que el usuario es el receptor
        if (mensaje.receptor.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para marcar este mensaje'
            });
        }

        await mensaje.marcarComoLeido();

        res.json({
            success: true,
            message: 'Mensaje marcado como leído'
        });

    } catch (error) {
        console.error('Error al marcar mensaje como leído:', error);
        res.status(500).json({
            success: false,
            message: 'Error al marcar mensaje como leído',
            error: error.message
        });
    }
});

module.exports = router;
