const express = require('express');
const router = express.Router();
const Materia = require('../models/Materia');
const auth = require('../middleware/auth');

// Obtener todas las materias activas
router.get('/', auth, async (req, res) => {
    try {
        const materias = await Materia.find({ activa: true })
            .sort({ semestre: 1, nombre: 1 })
            .select('nombre codigo semestre');
        
        res.json(materias);
    } catch (error) {
        console.error('Error al obtener materias:', error);
        res.status(500).json({ 
            message: 'Error al obtener las materias',
            error: error.message 
        });
    }
});

// Obtener materias por semestre
router.get('/semestre/:semestre', auth, async (req, res) => {
    try {
        const { semestre } = req.params;
        const materias = await Materia.find({ 
            semestre: parseInt(semestre), 
            activa: true 
        })
        .sort({ nombre: 1 })
        .select('nombre codigo semestre');
        
        res.json(materias);
    } catch (error) {
        console.error('Error al obtener materias por semestre:', error);
        res.status(500).json({ 
            message: 'Error al obtener las materias',
            error: error.message 
        });
    }
});

// Obtener una materia por ID
router.get('/:id', auth, async (req, res) => {
    try {
        const materia = await Materia.findById(req.params.id);
        
        if (!materia) {
            return res.status(404).json({ message: 'Materia no encontrada' });
        }
        
        res.json(materia);
    } catch (error) {
        console.error('Error al obtener materia:', error);
        res.status(500).json({ 
            message: 'Error al obtener la materia',
            error: error.message 
        });
    }
});

module.exports = router;
