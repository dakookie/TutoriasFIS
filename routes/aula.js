const express = require('express');
const router = express.Router();
const Publicacion = require('../models/Publicacion');
const Bibliografia = require('../models/Bibliografia');
const Tutoria = require('../models/Tutoria');
const Solicitud = require('../models/Solicitud');
const { requireAuth, requireRole } = require('../middleware/auth');

// POST /api/aula/:tutoriaId/configurar - Configurar el aula (solo tutor, primera vez)
router.post('/:tutoriaId/configurar', requireRole('Tutor'), async (req, res) => {
    try {
        const { tutoriaId } = req.params;
        const { modalidadAula, nombreAula, enlaceReunion } = req.body;

        // Verificar que la tutoría existe y pertenece al tutor
        const tutoria = await Tutoria.findById(tutoriaId);
        
        if (!tutoria) {
            return res.status(404).json({
                success: false,
                message: 'Tutoría no encontrada'
            });
        }

        if (tutoria.tutor.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para configurar esta aula'
            });
        }

        // Verificar que no esté ya configurada
        if (tutoria.aulaConfigurada) {
            return res.status(400).json({
                success: false,
                message: 'El aula ya está configurada'
            });
        }

        // Validar campos según modalidad
        if (!modalidadAula || !['Presencial', 'Virtual'].includes(modalidadAula)) {
            return res.status(400).json({
                success: false,
                message: 'Modalidad inválida'
            });
        }

        if (modalidadAula === 'Presencial' && !nombreAula) {
            return res.status(400).json({
                success: false,
                message: 'El nombre del aula es requerido para modalidad presencial'
            });
        }

        if (modalidadAula === 'Virtual' && !enlaceReunion) {
            return res.status(400).json({
                success: false,
                message: 'El enlace de reunión es requerido para modalidad virtual'
            });
        }

        // Actualizar la tutoría con la configuración
        tutoria.modalidadAula = modalidadAula;
        tutoria.nombreAula = modalidadAula === 'Presencial' ? nombreAula : null;
        tutoria.enlaceReunion = modalidadAula === 'Virtual' ? enlaceReunion : null;
        tutoria.aulaConfigurada = true;

        await tutoria.save();

        res.json({
            success: true,
            message: 'Aula configurada exitosamente',
            tutoria
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al configurar el aula',
            error: error.message
        });
    }
});

// PUT /api/aula/:tutoriaId/configurar - Editar configuración del aula (solo tutor)
router.put('/:tutoriaId/configurar', requireRole('Tutor'), async (req, res) => {
    try {
        const { tutoriaId } = req.params;
        const { modalidadAula, nombreAula, enlaceReunion } = req.body;

        // Verificar que la tutoría existe y pertenece al tutor
        const tutoria = await Tutoria.findById(tutoriaId);
        
        if (!tutoria) {
            return res.status(404).json({
                success: false,
                message: 'Tutoría no encontrada'
            });
        }

        if (tutoria.tutor.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para editar esta aula'
            });
        }

        // Validar campos según modalidad
        if (!modalidadAula || !['Presencial', 'Virtual'].includes(modalidadAula)) {
            return res.status(400).json({
                success: false,
                message: 'Modalidad inválida'
            });
        }

        if (modalidadAula === 'Presencial' && !nombreAula) {
            return res.status(400).json({
                success: false,
                message: 'El nombre del aula es requerido para modalidad presencial'
            });
        }

        if (modalidadAula === 'Virtual' && !enlaceReunion) {
            return res.status(400).json({
                success: false,
                message: 'El enlace de reunión es requerido para modalidad virtual'
            });
        }

        // Actualizar la tutoría con la nueva configuración
        tutoria.modalidadAula = modalidadAula;
        tutoria.nombreAula = modalidadAula === 'Presencial' ? nombreAula : null;
        tutoria.enlaceReunion = modalidadAula === 'Virtual' ? enlaceReunion : null;
        tutoria.aulaConfigurada = true;

        await tutoria.save();

        // Notificar via Socket.IO a los estudiantes del aula
        req.app.get('io').to(`aula-${tutoriaId}`).emit('configuracionActualizada', {
            tutoria
        });

        res.json({
            success: true,
            message: 'Configuración del aula actualizada exitosamente',
            tutoria
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al editar la configuración del aula',
            error: error.message
        });
    }
});

// GET /api/aula/:tutoriaId - Obtener información del aula (tutor y estudiantes aceptados)
router.get('/:tutoriaId', requireAuth, async (req, res) => {
    try {
        const { tutoriaId } = req.params;
        
        // Verificar que la tutoría existe
        const tutoria = await Tutoria.findById(tutoriaId).populate('tutor', 'nombre apellido');
        
        if (!tutoria) {
            return res.status(404).json({
                success: false,
                message: 'Tutoría no encontrada'
            });
        }

        // Verificar permisos: el tutor de la tutoría o estudiantes con solicitud aceptada
        const esTutor = tutoria.tutor._id.toString() === req.user.userId.toString();
        
        let esEstudianteAceptado = false;
        let motivoRechazo = '';
        
        if (req.user.rol === 'Estudiante') {
            const solicitud = await Solicitud.findOne({
                tutoria: tutoriaId,
                estudiante: req.user.userId,
                estado: 'Aceptada'
            });
            esEstudianteAceptado = !!solicitud;
            if (!esEstudianteAceptado) {
                // Verificar si tiene solicitud pero no aceptada
                const solicitudExistente = await Solicitud.findOne({
                    tutoria: tutoriaId,
                    estudiante: req.user.userId
                });
                if (solicitudExistente) {
                    motivoRechazo = `Tu solicitud está en estado: ${solicitudExistente.estado}`;
                } else {
                    motivoRechazo = 'No tienes una solicitud para esta tutoría';
                }
            }
        } else if (req.user.rol === 'Administrador') {
            // Los administradores NO tienen acceso a las aulas virtuales
            motivoRechazo = 'Los administradores no pueden acceder a las aulas virtuales';
        }

        // Log para debugging
        console.log('Acceso a aula:');
        console.log(`  TutoriaId: ${tutoriaId}`);
        console.log(`  Usuario ID: ${req.user.userId}`);
        console.log(`  Usuario rol: ${req.user.rol}`);
        console.log(`  Tutor ID: ${tutoria.tutor._id.toString()}`);
        console.log(`  Es tutor: ${esTutor}`);
        console.log(`  Es estudiante aceptado: ${esEstudianteAceptado}`);
        console.log(`  Motivo rechazo: ${motivoRechazo}`);

        if (!esTutor && !esEstudianteAceptado) {
            return res.status(403).json({
                success: false,
                message: motivoRechazo || 'No tienes acceso a esta aula'
            });
        }

        res.json({
            success: true,
            tutoria,
            esTutor,
            esEstudiante: esEstudianteAceptado
        });

    } catch (error) {
        console.error('Error en GET /api/aula/:tutoriaId:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener información del aula',
            error: error.message
        });
    }
});

// POST /api/aula/:tutoriaId/publicaciones - Crear nueva publicación (solo tutor)
router.post('/:tutoriaId/publicaciones', requireRole('Tutor'), async (req, res) => {
    try {
        const { tutoriaId } = req.params;
        const { titulo, contenido, imagen, tipoImagen } = req.body;

        // Validar campos
        if (!titulo || !titulo.trim()) {
            return res.status(400).json({
                success: false,
                message: 'El título es requerido'
            });
        }

        if (!contenido || !contenido.trim()) {
            return res.status(400).json({
                success: false,
                message: 'El contenido es requerido'
            });
        }

        // Validar imagen si se proporciona
        if (imagen && tipoImagen) {
            const tiposImagenPermitidos = ['png', 'jpg', 'jpeg', 'gif'];
            if (!tiposImagenPermitidos.includes(tipoImagen.toLowerCase())) {
                return res.status(400).json({
                    success: false,
                    message: 'Solo se permiten imágenes (PNG, JPG, JPEG, GIF)'
                });
            }
        }

        // Verificar que la tutoría existe y pertenece al tutor
        const tutoria = await Tutoria.findById(tutoriaId);
        
        if (!tutoria) {
            return res.status(404).json({
                success: false,
                message: 'Tutoría no encontrada'
            });
        }

        if (tutoria.tutor.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para publicar en esta tutoría'
            });
        }

        // Crear publicación
        const publicacion = new Publicacion({
            tutoria: tutoriaId,
            titulo: titulo.trim(),
            contenido: contenido.trim(),
            imagen: imagen || null,
            tipoImagen: tipoImagen ? tipoImagen.toLowerCase() : null,
            tutor: req.user.userId,
            tutorNombre: `${req.user.nombre} ${req.user.apellido}`
        });

        await publicacion.save();

        // Notificar via Socket.IO a los estudiantes del aula
        req.app.get('io').to(`aula-${tutoriaId}`).emit('nuevaPublicacion', {
            publicacion,
            tutoria: tutoria.materia
        });

        res.status(201).json({
            success: true,
            message: 'Publicación creada exitosamente',
            publicacion
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al crear publicación',
            error: error.message
        });
    }
});

// GET /api/aula/:tutoriaId/publicaciones - Obtener publicaciones del aula
router.get('/:tutoriaId/publicaciones', requireAuth, async (req, res) => {
    try {
        const { tutoriaId } = req.params;

        const publicaciones = await Publicacion.find({ tutoria: tutoriaId })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            publicaciones
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener publicaciones',
            error: error.message
        });
    }
});

// PUT /api/aula/:tutoriaId/publicaciones/:publicacionId - Editar publicación (solo tutor)
router.put('/:tutoriaId/publicaciones/:publicacionId', requireRole('Tutor'), async (req, res) => {
    try {
        const { tutoriaId, publicacionId } = req.params;
        const { titulo, contenido, imagen, tipoImagen } = req.body;

        // Validar campos
        if (!titulo || !titulo.trim()) {
            return res.status(400).json({
                success: false,
                message: 'El título es requerido'
            });
        }

        if (!contenido || !contenido.trim()) {
            return res.status(400).json({
                success: false,
                message: 'El contenido es requerido'
            });
        }

        // Validar imagen si se proporciona
        if (imagen && tipoImagen) {
            const tiposImagenPermitidos = ['png', 'jpg', 'jpeg', 'gif'];
            if (!tiposImagenPermitidos.includes(tipoImagen.toLowerCase())) {
                return res.status(400).json({
                    success: false,
                    message: 'Solo se permiten imágenes (PNG, JPG, JPEG, GIF)'
                });
            }
        }

        // Verificar que la publicación existe
        const publicacion = await Publicacion.findById(publicacionId);
        
        if (!publicacion) {
            return res.status(404).json({
                success: false,
                message: 'Publicación no encontrada'
            });
        }

        // Verificar que pertenece a la tutoría
        if (publicacion.tutoria.toString() !== tutoriaId) {
            return res.status(400).json({
                success: false,
                message: 'La publicación no pertenece a esta tutoría'
            });
        }

        // Verificar que el tutor es el dueño
        if (publicacion.tutor.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para editar esta publicación'
            });
        }

        // Actualizar publicación
        publicacion.titulo = titulo.trim();
        publicacion.contenido = contenido.trim();
        
        // Solo actualizar imagen si se proporciona una nueva
        if (imagen && tipoImagen) {
            publicacion.imagen = imagen;
            publicacion.tipoImagen = tipoImagen.toLowerCase();
        }

        await publicacion.save();

        // Notificar via Socket.IO
        req.app.get('io').to(`aula-${tutoriaId}`).emit('publicacionEditada', {
            publicacion
        });

        res.json({
            success: true,
            message: 'Publicación actualizada exitosamente',
            publicacion
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al actualizar publicación',
            error: error.message
        });
    }
});

// DELETE /api/aula/:tutoriaId/publicaciones/:publicacionId - Eliminar publicación (solo tutor)
router.delete('/:tutoriaId/publicaciones/:publicacionId', requireRole('Tutor'), async (req, res) => {
    try {
        const { tutoriaId, publicacionId } = req.params;

        // Verificar que la publicación existe
        const publicacion = await Publicacion.findById(publicacionId);
        
        if (!publicacion) {
            return res.status(404).json({
                success: false,
                message: 'Publicación no encontrada'
            });
        }

        // Verificar que pertenece a la tutoría
        if (publicacion.tutoria.toString() !== tutoriaId) {
            return res.status(400).json({
                success: false,
                message: 'La publicación no pertenece a esta tutoría'
            });
        }

        // Verificar que el tutor es el dueño
        if (publicacion.tutor.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para eliminar esta publicación'
            });
        }

        await Publicacion.findByIdAndDelete(publicacionId);

        // Notificar via Socket.IO
        req.app.get('io').to(`aula-${tutoriaId}`).emit('publicacionEliminada', {
            publicacionId
        });

        res.json({
            success: true,
            message: 'Publicación eliminada exitosamente'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al eliminar publicación',
            error: error.message
        });
    }
});


// POST /api/aula/:tutoriaId/bibliografias - Subir bibliografía (solo tutor)
router.post('/:tutoriaId/bibliografias', requireRole('Tutor'), async (req, res) => {
    try {
        const { tutoriaId } = req.params;
        const { titulo, descripcion, archivo, tipoArchivo } = req.body;

        // Validar campos
        if (!titulo || !titulo.trim()) {
            return res.status(400).json({
                success: false,
                message: 'El título es requerido'
            });
        }

        if (!archivo) {
            return res.status(400).json({
                success: false,
                message: 'El archivo es requerido'
            });
        }

        // Validar tipo de archivo
        const tiposPermitidos = ['pdf', 'docx', 'xlsx', 'ppt', 'pptx'];
        if (!tipoArchivo || !tiposPermitidos.includes(tipoArchivo.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: 'Solo se permiten documentos: PDF, DOCX, XLSX, PPT, PPTX'
            });
        }

        // Verificar que la tutoría existe y pertenece al tutor
        const tutoria = await Tutoria.findById(tutoriaId);
        
        if (!tutoria) {
            return res.status(404).json({
                success: false,
                message: 'Tutoría no encontrada'
            });
        }

        if (tutoria.tutor.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para subir bibliografía en esta tutoría'
            });
        }

        // Crear bibliografía
        const bibliografia = new Bibliografia({
            tutoria: tutoriaId,
            titulo: titulo.trim(),
            descripcion: '',
            archivo,
            tipoArchivo: tipoArchivo.toLowerCase(),
            tutor: req.user.userId,
            tutorNombre: `${req.user.nombre} ${req.user.apellido}`
        });

        await bibliografia.save();

        // Notificar via Socket.IO
        req.app.get('io').to(`aula-${tutoriaId}`).emit('nuevaBibliografia', {
            bibliografia,
            tutoria: tutoria.materia
        });

        res.status(201).json({
            success: true,
            message: 'Bibliografía subida exitosamente',
            bibliografia
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al subir bibliografía',
            error: error.message
        });
    }
});

// GET /api/aula/:tutoriaId/bibliografias - Obtener bibliografías del aula
router.get('/:tutoriaId/bibliografias', requireAuth, async (req, res) => {
    try {
        const { tutoriaId } = req.params;

        const bibliografias = await Bibliografia.find({ tutoria: tutoriaId })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            bibliografias
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener bibliografías',
            error: error.message
        });
    }
});

// PUT /api/aula/:tutoriaId/bibliografias/:bibliografiaId - Editar bibliografía (solo tutor)
router.put('/:tutoriaId/bibliografias/:bibliografiaId', requireRole('Tutor'), async (req, res) => {
    try {
        const { tutoriaId, bibliografiaId } = req.params;
        const { titulo } = req.body;

        // Validar campos
        if (!titulo || !titulo.trim()) {
            return res.status(400).json({
                success: false,
                message: 'El título es requerido'
            });
        }

        // Verificar que la bibliografía existe
        const bibliografia = await Bibliografia.findById(bibliografiaId);
        
        if (!bibliografia) {
            return res.status(404).json({
                success: false,
                message: 'Bibliografía no encontrada'
            });
        }

        // Verificar que pertenece a la tutoría
        if (bibliografia.tutoria.toString() !== tutoriaId) {
            return res.status(400).json({
                success: false,
                message: 'La bibliografía no pertenece a esta tutoría'
            });
        }

        // Verificar que el tutor es el dueño
        if (bibliografia.tutor.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para editar esta bibliografía'
            });
        }

        // Actualizar bibliografía
        bibliografia.titulo = titulo.trim();
        await bibliografia.save();

        // Notificar via Socket.IO
        req.app.get('io').to(`aula-${tutoriaId}`).emit('bibliografiaEditada', {
            bibliografia
        });

        res.json({
            success: true,
            message: 'Bibliografía actualizada exitosamente',
            bibliografia
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al actualizar bibliografía',
            error: error.message
        });
    }
});

// DELETE /api/aula/:tutoriaId/bibliografias/:bibliografiaId - Eliminar bibliografía (solo tutor)
router.delete('/:tutoriaId/bibliografias/:bibliografiaId', requireRole('Tutor'), async (req, res) => {
    try {
        const { tutoriaId, bibliografiaId } = req.params;

        // Verificar que la bibliografía existe
        const bibliografia = await Bibliografia.findById(bibliografiaId);
        
        if (!bibliografia) {
            return res.status(404).json({
                success: false,
                message: 'Bibliografía no encontrada'
            });
        }

        // Verificar que pertenece a la tutoría
        if (bibliografia.tutoria.toString() !== tutoriaId) {
            return res.status(400).json({
                success: false,
                message: 'La bibliografía no pertenece a esta tutoría'
            });
        }

        // Verificar que el tutor es el dueño
        if (bibliografia.tutor.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para eliminar esta bibliografía'
            });
        }

        await Bibliografia.findByIdAndDelete(bibliografiaId);

        // Notificar via Socket.IO
        req.app.get('io').to(`aula-${tutoriaId}`).emit('bibliografiaEliminada', {
            bibliografiaId
        });

        res.json({
            success: true,
            message: 'Bibliografía eliminada exitosamente'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al eliminar bibliografía',
            error: error.message
        });
    }
});

module.exports = router;

