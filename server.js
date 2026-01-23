const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/database');

// Crear aplicación Express
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:3000'],
        credentials: true
    }
});

// Conectar a MongoDB
connectDB();

// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? false : 'http://localhost:3000',
    credentials: true
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' })); // Aumentar límite para PDFs
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Middleware para Socket.IO - Autenticación JWT
io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.cookie?.split('token=')[1]?.split(';')[0];
    
    if (!token) {
        return next();
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded;
        next();
    } catch (error) {
        next();
    }
});

// Hacer io accesible en las rutas
app.set('io', io);

// Rutas API (ANTES de static para que tengan prioridad)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/materias', require('./routes/materias'));
app.use('/api/tutorias', require('./routes/tutorias'));
app.use('/api/solicitudes', require('./routes/solicitudes'));
app.use('/api/encuestas', require('./routes/encuestas'));
app.use('/api/aula', require('./routes/aula'));
app.use('/api/mensajes', require('./routes/mensajes'));

// Ruta principal - Servir login.html (ANTES de static)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Alias para login
app.get('/login', (req, res) => {
    res.redirect('/');
});

// Ruta para admin
app.get('/admin', (req, res) => {
    const token = req.cookies.token;
    
    if (!token) {
        return res.redirect('/');
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.rol !== 'Administrador') {
            return res.redirect('/');
        }
        res.sendFile(path.join(__dirname, 'public', 'admin.html'));
    } catch (error) {
        return res.redirect('/');
    }
});

// Ruta para tutores
app.get('/tutor', (req, res) => {
    const token = req.cookies.token;
    
    if (!token) {
        return res.redirect('/');
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.rol !== 'Tutor') {
            return res.redirect('/');
        }
        res.sendFile(path.join(__dirname, 'public', 'tutor.html'));
    } catch (error) {
        return res.redirect('/');
    }
});

// Ruta para estudiantes
app.get('/estudiante', (req, res) => {
    const token = req.cookies.token;
    
    if (!token) {
        return res.redirect('/');
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.rol !== 'Estudiante') {
            return res.redirect('/');
        }
        res.sendFile(path.join(__dirname, 'public', 'estudiante.html'));
    } catch (error) {
        return res.redirect('/');
    }
});

// Servir archivos estáticos (DESPUÉS de las rutas específicas)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));

// Socket.IO - Conexiones en tiempo real
io.on('connection', (socket) => {
    const user = socket.user;
    
    if (user && user.userId) {
        console.log(`✅ Usuario conectado: ${user.nombre} ${user.apellido} (${user.rol})`);
        
        // Unir a sala específica según rol
        if (user.rol === 'Tutor') {
            socket.join(`tutor-${user.userId}`);
        } else if (user.rol === 'Estudiante') {
            socket.join(`estudiante-${user.userId}`);
        }
        
        // Emitir información de conexión
        socket.emit('connected', {
            userId: user.userId,
            nombre: user.nombre,
            apellido: user.apellido,
            rol: user.rol
        });
    }

    // Evento: Enviar mensaje de chat (grupal por tutoría)
    socket.on('chat:enviar-mensaje', async (data) => {
        try {
            const { tutoriaId, receptorId, contenido } = data;
            
            if (!user || !user.userId) {
                return socket.emit('chat:error', { message: 'Usuario no autenticado' });
            }

            // Validar datos
            if (!tutoriaId || !contenido || !contenido.trim()) {
                return socket.emit('chat:error', { message: 'Datos incompletos' });
            }

            // Obtener información de la tutoría y participantes
            const Tutoria = require('./models/Tutoria');
            const Solicitud = require('./models/Solicitud');
            const Usuario = require('./models/Usuario');
            const Mensaje = require('./models/Mensaje');
            
            const tutoria = await Tutoria.findById(tutoriaId).populate('tutor', 'nombre apellido');
            
            if (!tutoria) {
                return socket.emit('chat:error', { message: 'Tutoría no encontrada' });
            }

            // Obtener todos los estudiantes aceptados en la tutoría
            const solicitudesAceptadas = await Solicitud.find({
                tutoria: tutoriaId,
                estado: 'Aceptada'
            }).populate('estudiante', '_id nombre apellido');

            const estudiantes = solicitudesAceptadas.map(s => s.estudiante);

            // Guardar mensajes para todos los participantes
            const mensajesGuardados = [];
            
            if (user.rol === 'Tutor') {
                // El tutor envía a todos los estudiantes
                for (const estudiante of estudiantes) {
                    const mensaje = new Mensaje({
                        tutoria: tutoriaId,
                        emisor: user.userId,
                        emisorNombre: `${user.nombre} ${user.apellido}`,
                        emisorRol: user.rol,
                        receptor: estudiante._id,
                        receptorNombre: `${estudiante.nombre} ${estudiante.apellido}`,
                        contenido: contenido.trim()
                    });
                    await mensaje.save();
                    mensajesGuardados.push(mensaje);
                }
            } else {
                // El estudiante envía al tutor y también se guarda para otros estudiantes verlo
                // Mensaje principal al tutor
                const mensajeAlTutor = new Mensaje({
                    tutoria: tutoriaId,
                    emisor: user.userId,
                    emisorNombre: `${user.nombre} ${user.apellido}`,
                    emisorRol: user.rol,
                    receptor: tutoria.tutor._id,
                    receptorNombre: `${tutoria.tutor.nombre} ${tutoria.tutor.apellido}`,
                    contenido: contenido.trim()
                });
                await mensajeAlTutor.save();
                mensajesGuardados.push(mensajeAlTutor);
                
                // También guardar para otros estudiantes
                for (const estudiante of estudiantes) {
                    if (estudiante._id.toString() !== user.userId) {
                        const mensaje = new Mensaje({
                            tutoria: tutoriaId,
                            emisor: user.userId,
                            emisorNombre: `${user.nombre} ${user.apellido}`,
                            emisorRol: user.rol,
                            receptor: estudiante._id,
                            receptorNombre: `${estudiante.nombre} ${estudiante.apellido}`,
                            contenido: contenido.trim()
                        });
                        await mensaje.save();
                        mensajesGuardados.push(mensaje);
                    }
                }
            }

            // Crear objeto de mensaje para enviar (usar el primero como referencia)
            const mensajeReferencia = mensajesGuardados[0];
            const mensajeEnviado = {
                _id: mensajeReferencia._id,
                tutoria: mensajeReferencia.tutoria,
                emisor: mensajeReferencia.emisor,
                emisorNombre: mensajeReferencia.emisorNombre,
                emisorRol: mensajeReferencia.emisorRol,
                contenido: mensajeReferencia.contenido,
                leido: mensajeReferencia.leido,
                createdAt: mensajeReferencia.createdAt
            };

            // Enviar confirmación SOLO al emisor
            socket.emit('chat:mensaje-enviado', mensajeEnviado);

            // Enviar a todos los OTROS participantes de la tutoría (no al emisor)
            if (user.rol === 'Tutor') {
                // Enviar a todos los estudiantes (no incluir al tutor emisor)
                estudiantes.forEach(est => {
                    io.to(`estudiante-${est._id}`).emit('chat:nuevo-mensaje', mensajeEnviado);
                });
                console.log(`💬 Tutor ${user.nombre} envió mensaje a ${estudiantes.length} estudiantes`);
            } else {
                // Enviar al tutor
                io.to(`tutor-${tutoria.tutor._id}`).emit('chat:nuevo-mensaje', mensajeEnviado);
                // Enviar a otros estudiantes (NO al emisor)
                estudiantes.forEach(est => {
                    if (est._id.toString() !== user.userId) {
                        io.to(`estudiante-${est._id}`).emit('chat:nuevo-mensaje', mensajeEnviado);
                    }
                });
                console.log(`💬 Estudiante ${user.nombre} envió mensaje al tutor y ${estudiantes.length - 1} otros estudiantes`);
            }

        } catch (error) {
            console.error('Error al enviar mensaje:', error);
            socket.emit('chat:error', { message: 'Error al enviar mensaje' });
        }
    });

    // Evento: Usuario está escribiendo
    socket.on('chat:escribiendo', (data) => {
        const { tutoriaId, receptorId } = data;
        if (receptorId) {
            io.to(`tutor-${receptorId}`).to(`estudiante-${receptorId}`).emit('chat:usuario-escribiendo', {
                tutoriaId,
                usuario: {
                    id: user.userId,
                    nombre: `${user.nombre} ${user.apellido}`
                }
            });
        }
    });

    // Evento: Usuario dejó de escribir
    socket.on('chat:dejo-escribir', (data) => {
        const { tutoriaId, receptorId } = data;
        if (receptorId) {
            io.to(`tutor-${receptorId}`).to(`estudiante-${receptorId}`).emit('chat:usuario-dejo-escribir', {
                tutoriaId,
                usuario: {
                    id: user.userId
                }
            });
        }
    });

    socket.on('disconnect', () => {
        if (user && user.userId) {
            console.log(`❌ Usuario desconectado: ${user.nombre} ${user.apellido}`);
        }
    });
});

// Manejo de errores
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// Ruta 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada'
    });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════╗
║                                              ║
║   🎓 SISTEMA DE TUTORÍAS FIS - EPN           ║
║                                              ║
║   🚀 Servidor iniciado en puerto ${PORT}       ║
║   🌐 URL: http://localhost:${PORT}            ║
║   📊 MongoDB: Conectado                      ║
║   ⚡ Socket.IO: Activo                       ║
║                                              ║
╚══════════════════════════════════════════════╝
    `);
});

module.exports = { app, httpServer, io };
