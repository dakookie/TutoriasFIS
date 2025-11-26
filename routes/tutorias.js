const express = require('express');
const router = express.Router();
const Tutoria = require('../models/Tutoria');
const Materia = require('../models/Materia');
const Solicitud = require('../models/Solicitud');
const { requireAuth, requireRole } = require('../middleware/auth');

// POST /api/tutorias - Crear nueva tutoría (solo tutores)
router.post('/', requireRole('Tutor'), async (req, res) => {
    try {
        const { materia, fecha, horaInicio, horaFin, cupos } = req.body;

        // Validar que hora inicio < hora fin
        if (horaInicio >= horaFin) {
            return res.status(400).json({
                success: false,
                message: 'La hora de inicio debe ser menor que la hora de fin'
            });
        }

        // Obtener nombre de la materia
        const materiaDoc = await Materia.findById(materia);
        if (!materiaDoc) {
            return res.status(404).json({
                success: false,
                message: 'Materia no encontrada'
            });
        }

        const tutoria = new Tutoria({
            materia,
            materiaNombre: materiaDoc.nombre,
            fecha,
            horaInicio,
            horaFin,
            cuposOriginales: cupos,
            cuposDisponibles: cupos,
            tutor: req.user.userId,
            tutorNombre: `${req.user.nombre} ${req.user.apellido}`
        });

        await tutoria.save();

        // Notificar via Socket.IO
        req.app.get('io').emit('nuevaTutoria', tutoria);

        res.status(201).json({
            success: true,
            message: 'Tutoría creada exitosamente',
            tutoria
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al crear tutoría',
            error: error.message
        });
    }
});

// PUT /api/tutorias/:id - Actualizar tutoría (solo el tutor dueño)
router.put('/:id', requireRole('Tutor'), async (req, res) => {
    try {
        const { id } = req.params;
        const { fecha, horaInicio, horaFin, cupos } = req.body;

        const tutoria = await Tutoria.findById(id);
        
        if (!tutoria) {
            return res.status(404).json({
                success: false,
                message: 'Tutoría no encontrada'
            });
        }

        // Verificar que el tutor sea el dueño
        if (tutoria.tutor.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para editar esta tutoría'
            });
        }

        // Validar que hora inicio < hora fin
        if (horaInicio >= horaFin) {
            return res.status(400).json({
                success: false,
                message: 'La hora de inicio debe ser menor que la hora de fin'
            });
        }

        // Calcular diferencia de cupos
        const diferenciaCupos = cupos - tutoria.cuposOriginales;
        
        // Actualizar campos
        tutoria.fecha = fecha;
        tutoria.horaInicio = horaInicio;
        tutoria.horaFin = horaFin;
        tutoria.cuposOriginales = cupos;
        tutoria.cuposDisponibles = tutoria.cuposDisponibles + diferenciaCupos;

        // Asegurar que cupos disponibles no sea negativo
        if (tutoria.cuposDisponibles < 0) {
            tutoria.cuposDisponibles = 0;
        }

        await tutoria.save();

        res.json({
            success: true,
            message: 'Tutoría actualizada exitosamente',
            tutoria
        });
    } catch (error) {
        console.error('Error al actualizar tutoría:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar la tutoría',
            error: error.message
        });
    }
});

// DELETE /api/tutorias/:id - Eliminar tutoría y todo relacionado (solo el tutor dueño)
router.delete('/:id', requireRole('Tutor'), async (req, res) => {
    try {
        const { id } = req.params;
        const Publicacion = require('../models/Publicacion');
        const Bibliografia = require('../models/Bibliografia');
        const Respuesta = require('../models/Respuesta');

        const tutoria = await Tutoria.findById(id);
        
        if (!tutoria) {
            return res.status(404).json({
                success: false,
                message: 'Tutoría no encontrada'
            });
        }

        // Verificar que el tutor sea el dueño
        if (tutoria.tutor.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para eliminar esta tutoría'
            });
        }

        // Eliminar todo lo relacionado
        await Solicitud.deleteMany({ tutoria: id });
        await Publicacion.deleteMany({ tutoria: id });
        await Bibliografia.deleteMany({ tutoria: id });
        await Respuesta.deleteMany({ tutoria: id });
        
        // Eliminar la tutoría
        await Tutoria.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Tutoría y todos sus datos relacionados eliminados exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar tutoría:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar la tutoría',
            error: error.message
        });
    }
});

// GET /api/tutorias - Obtener tutorías (con filtros)
router.get('/', requireAuth, async (req, res) => {
    try {
        const { materia, tutorId } = req.query;
        let filtro = { activa: true };

        if (materia && materia !== 'Todas') {
            filtro.materia = materia;
        }

        if (tutorId) {
            filtro.tutor = tutorId;
        }

        const tutorias = await Tutoria.find(filtro)
            .populate('tutor', 'nombre apellido email')
            .populate('materia', 'nombre codigo semestre')
            .sort({ fecha: 1, horaInicio: 1 });

        res.json({
            success: true,
            tutorias
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener tutorías',
            error: error.message
        });
    }
});

// GET /api/tutorias/tutor/:tutorId - Obtener tutorías de un tutor específico
router.get('/tutor/:tutorId', requireAuth, async (req, res) => {
    try {
        const tutorias = await Tutoria.find({ tutor: req.params.tutorId })
            .populate('materia', 'nombre codigo semestre')
            .sort({ fecha: -1 });

        res.json({
            success: true,
            tutorias
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener tutorías',
            error: error.message
        });
    }
});

// GET /api/tutorias/disponibles - Obtener tutorías disponibles (con cupos)
router.get('/disponibles', requireAuth, async (req, res) => {
    try {
        const { materia } = req.query;
        
        // Obtener la fecha actual y establecer al inicio del día (00:00:00)
        const hoy = new Date();
        const year = hoy.getFullYear();
        const month = hoy.getMonth();
        const day = hoy.getDate();
        
        // Crear fecha de inicio del día en UTC
        const inicioDia = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
        
        console.log('📅 Filtrando tutorías desde:', inicioDia.toISOString());
        console.log('📅 (Esto incluye hoy y días futuros)');
        
        let filtro = {
            activa: true,
            cuposDisponibles: { $gt: 0 },
            fecha: { $gte: inicioDia }  // Desde el inicio del día actual en adelante
        };

        if (materia && materia !== 'Todas') {
            filtro.materia = materia;
        }

        console.log('🔍 Filtro aplicado:', JSON.stringify(filtro, null, 2));

        const tutorias = await Tutoria.find(filtro)
            .populate('tutor', 'nombre apellido')
            .populate('materia', 'nombre codigo semestre')
            .sort({ fecha: 1, horaInicio: 1 });

        console.log(`✅ Tutorías encontradas: ${tutorias.length}`);
        if (tutorias.length > 0) {
            tutorias.forEach((t, i) => {
                console.log(`   Tutoría ${i+1}: ${t.materia} - ${t.fecha.toISOString()}`);
            });
        }

        res.json({
            success: true,
            tutorias
        });

    } catch (error) {
        console.error('❌ Error en /disponibles:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener tutorías disponibles',
            error: error.message
        });
    }
});

module.exports = router;
