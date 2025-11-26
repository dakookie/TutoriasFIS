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
app.use('/api/tutorias', require('./routes/tutorias'));
app.use('/api/solicitudes', require('./routes/solicitudes'));
app.use('/api/encuestas', require('./routes/encuestas'));
app.use('/api/aula', require('./routes/aula'));

// Ruta principal - Servir login.html (ANTES de static)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
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
