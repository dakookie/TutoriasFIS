const express = require('express');
const router = express.Router();
const Pregunta = require('../models/Pregunta');
const Materia = require('../models/Materia');
const Respuesta = require('../models/Respuesta');
const Solicitud = require('../models/Solicitud');
const { requireAuth, requireRole } = require('../middleware/auth');

// POST /api/encuestas/preguntas - Crear pregunta (admin)
router.post('/preguntas', requireRole('Administrador'), async (req, res) => {
    try {
        const { pregunta, materia } = req.body;

        // Obtener nombre de la materia
        const materiaDoc = await Materia.findById(materia);
        if (!materiaDoc) {
            return res.status(404).json({
                success: false,
                message: 'Materia no encontrada'
            });
        }

        const nuevaPregunta = new Pregunta({
            pregunta,
            materia,
            materiaNombre: materiaDoc.nombre
        });

        await nuevaPregunta.save();

        res.status(201).json({
            success: true,
            message: 'Pregunta creada exitosamente',
            pregunta: nuevaPregunta
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al crear pregunta',
            error: error.message
        });
    }
});

// GET /api/encuestas/preguntas - Obtener todas las preguntas guardadas (admin)
router.get('/preguntas', requireRole('Administrador'), async (req, res) => {
    try {
        const preguntas = await Pregunta.find({ activa: true })
            .sort({ materia: 1, createdAt: -1 });

        res.json({
            success: true,
            preguntas
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener preguntas',
            error: error.message
        });
    }
});

// GET /api/encuestas/preguntas/materia/:materia - Obtener preguntas por materia (búsqueda por nombre)
router.get('/preguntas/materia/:materia', requireAuth, async (req, res) => {
    try {
        const preguntas = await Pregunta.find({
            materiaNombre: req.params.materia,
            activa: true
        }).sort({ createdAt: 1 });

        res.json({
            success: true,
            preguntas
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener preguntas',
            error: error.message
        });
    }
});

// POST /api/encuestas/respuestas - Enviar respuestas de encuesta (estudiante)
router.post('/respuestas', requireRole('Estudiante'), async (req, res) => {
    try {
        const { tutoriaId, respuestas } = req.body;

        // Verificar que el estudiante tiene una solicitud aceptada para esta tutoría
        const solicitud = await Solicitud.findOne({
            tutoria: tutoriaId,
            estudiante: req.user.userId,
            estado: 'Aceptada'
        });

        if (!solicitud) {
            return res.status(403).json({
                success: false,
                message: 'No tienes una solicitud aceptada para esta tutoría'
            });
        }

        // Verificar si ya respondió
        const respuestaExistente = await Respuesta.findOne({
            tutoria: tutoriaId,
            estudiante: req.user.userId
        });

        if (respuestaExistente) {
            return res.status(400).json({
                success: false,
                message: 'Ya has respondido esta encuesta'
            });
        }

        // Crear respuesta
        const nuevaRespuesta = new Respuesta({
            tutoria: tutoriaId,
            estudiante: req.user.userId,
            respuestas: new Map(Object.entries(respuestas))
        });

        await nuevaRespuesta.save();

        res.status(201).json({
            success: true,
            message: 'Encuesta respondida exitosamente',
            respuesta: nuevaRespuesta
        });

    } catch (error) {
        console.error('Error al guardar respuestas:', error);
        console.error('Stack trace:', error.stack);
        console.error('Request body:', req.body);
        res.status(500).json({
            success: false,
            message: 'Error al guardar respuestas',
            error: error.message
        });
    }
});

// GET /api/encuestas/tutoria/:tutoriaId/promedio - Obtener promedio de calificación
router.get('/tutoria/:tutoriaId/promedio', requireAuth, async (req, res) => {
    try {
        const respuestas = await Respuesta.find({ tutoria: req.params.tutoriaId });

        if (respuestas.length === 0) {
            return res.json({
                success: true,
                promedio: 0,
                totalRespuestas: 0
            });
        }

        let sumaTotal = 0;
        let totalCalificaciones = 0;

        respuestas.forEach(respuesta => {
            respuesta.respuestas.forEach(calificacion => {
                sumaTotal += calificacion;
                totalCalificaciones++;
            });
        });

        const promedio = (sumaTotal / totalCalificaciones).toFixed(2);

        res.json({
            success: true,
            promedio: parseFloat(promedio),
            totalRespuestas: respuestas.length
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al calcular promedio',
            error: error.message
        });
    }
});

// GET /api/encuestas/tutoria/:tutoriaId/promedios-preguntas - Obtener promedios por pregunta
router.get('/tutoria/:tutoriaId/promedios-preguntas', requireAuth, async (req, res) => {
    try {
        const respuestas = await Respuesta.find({ tutoria: req.params.tutoriaId });

        if (respuestas.length === 0) {
            return res.json({
                success: true,
                promedios: {},
                totalRespuestas: 0
            });
        }

        const sumasPorPregunta = {};
        const conteosPorPregunta = {};

        respuestas.forEach(respuesta => {
            if (respuesta.respuestas && typeof respuesta.respuestas === 'object') {
                // Manejar si respuestas es un Map o un objeto
                const respuestasMap = respuesta.respuestas instanceof Map 
                    ? respuesta.respuestas 
                    : new Map(Object.entries(respuesta.respuestas));
                
                respuestasMap.forEach((calificacion, preguntaId) => {
                    if (!sumasPorPregunta[preguntaId]) {
                        sumasPorPregunta[preguntaId] = 0;
                        conteosPorPregunta[preguntaId] = 0;
                    }
                    sumasPorPregunta[preguntaId] += calificacion;
                    conteosPorPregunta[preguntaId]++;
                });
            }
        });

        const promedios = {};
        Object.keys(sumasPorPregunta).forEach(preguntaId => {
            promedios[preguntaId] = parseFloat((sumasPorPregunta[preguntaId] / conteosPorPregunta[preguntaId]).toFixed(2));
        });

        res.json({
            success: true,
            promedios,
            totalRespuestas: respuestas.length
        });

    } catch (error) {
        console.error('Error al calcular promedios por pregunta:', error);
        res.status(500).json({
            success: false,
            message: 'Error al calcular promedios por pregunta',
            error: error.message
        });
    }
});

// GET /api/encuestas/verificar/:tutoriaId - Verificar si el estudiante ya respondió
router.get('/verificar/:tutoriaId', requireRole('Estudiante'), async (req, res) => {
    try {
        const respuesta = await Respuesta.findOne({
            tutoria: req.params.tutoriaId,
            estudiante: req.user.userId
        });

        res.json({
            success: true,
            respondido: !!respuesta
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al verificar respuesta',
            error: error.message
        });
    }
});

module.exports = router;
