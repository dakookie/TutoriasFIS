# Sistema de Gestión de Tutorías FIS - EPN

## 🚀 Stack Tecnológico

- **Backend:** Node.js + Express.js
- **Base de Datos:** MongoDB Atlas
- **Tiempo Real:** Socket.IO
- **Frontend:** HTML5 + CSS3 + JavaScript (Vanilla)
- **Estilos:** Bootstrap 5.3.0
- **Sesiones:** express-session + connect-mongo

## 📋 Requisitos Previos

- Node.js v18+ instalado
- Cuenta de MongoDB Atlas (ya configurada)
- Git

## 🔧 Instalación

1. **Clonar el repositorio:**
```bash
git clone https://github.com/dakookie/TutoriasFIS.git
cd "Tutorias FIS"
```

2. **Instalar dependencias:**
```bash
npm install
```

3. **Configurar variables de entorno:**

El archivo `.env` ya está configurado con:
```
MONGODB_URI=mongodb+srv://TutoriasFIS:TUTORIASFIS2025-*@tutoriasfis.g1jx9dg.mongodb.net/tutoriasFIS
PORT=3000
NODE_ENV=development
SESSION_SECRET=TutoriasFIS2025SecretKey_EPN_ISW
```

4. **Poblar base de datos con datos de prueba:**
```bash
npm run seed
```

5. **Iniciar servidor:**
```bash
npm start
```

O en modo desarrollo con nodemon:
```bash
npm run dev
```

## 🎯 Acceso al Sistema

Una vez iniciado el servidor, accede a: **http://localhost:3000**

### Usuarios de Prueba

**Administrador:**
- Email: `admin@fis.epn.edu.ec`
- Contraseña: `admin123!`

**Tutores:**
- `juan.perez@epn.edu.ec` / `tutor123`
- `maria.gonzalez@epn.edu.ec` / `tutor123`
- `carlos.ramirez@epn.edu.ec` / `tutor123`

**Estudiantes:**
- `ana.lopez@epn.edu.ec` / `estudiante123`
- `pedro.martinez@epn.edu.ec` / `estudiante123`
- `lucia.torres@epn.edu.ec` / `estudiante123`

## 📁 Estructura del Proyecto

```
Tutorias FIS/
├── config/
│   └── database.js          # Configuración MongoDB
├── models/
│   ├── Usuario.js           # Modelo de usuarios
│   ├── Tutoria.js           # Modelo de tutorías
│   ├── Solicitud.js         # Modelo de solicitudes
│   ├── Pregunta.js          # Modelo de preguntas
│   ├── Respuesta.js         # Modelo de respuestas
│   └── Mensaje.js           # Modelo de mensajes de chat
├── routes/
│   ├── auth.js              # Rutas de autenticación
│   ├── admin.js             # Rutas de administración
│   ├── tutorias.js          # Rutas de tutorías
│   ├── solicitudes.js       # Rutas de solicitudes
│   ├── encuestas.js         # Rutas de encuestas
│   └── mensajes.js          # Rutas de mensajería
├── middleware/
│   └── auth.js              # Middleware de autenticación
├── scripts/
│   └── seed.js              # Script para poblar BD
├── public/
│   ├── login.html
│   ├── registro.html
│   ├── admin.html
│   ├── index.html
│   ├── chat.html            # Interfaz de chat
│   ├── css/
│   │   ├── styles.css
│   │   └── app.css          # Estilos globales y chat
│   └── js/
│       ├── api-client.js    # Cliente API REST
│       ├── socket-client.js # Cliente Socket.IO
│       ├── auth.js
│       ├── admin.js
│       ├── tutor.js
│       ├── estudiante.js
│       ├── chat.js          # Lógica del chat
│       └── main.js
├── .env                     # Variables de entorno
├── .gitignore
├── package.json
├── server.js                # Servidor principal
└── README.md
```

## 🔌 API Endpoints

### Autenticación
- `POST /api/auth/registro` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/logout` - Cerrar sesión
- `GET /api/auth/session` - Obtener sesión actual

### Administración
- `GET /api/admin/solicitudes/tutores` - Solicitudes de tutores
- `GET /api/admin/solicitudes/estudiantes` - Solicitudes de estudiantes
- `PUT /api/admin/solicitudes/:id/aprobar` - Aprobar solicitud
- `DELETE /api/admin/solicitudes/:id` - Rechazar solicitud

### Tutorías
- `POST /api/tutorias` - Crear tutoría (Tutor)
- `GET /api/tutorias` - Listar tutorías
- `GET /api/tutorias/disponibles` - Tutorías con cupos
- `GET /api/tutorias/tutor/:tutorId` - Tutorías de un tutor

### Solicitudes
- `POST /api/solicitudes` - Crear solicitud (Estudiante)
- `GET /api/solicitudes/estudiante` - Mis solicitudes
- `GET /api/solicitudes/tutoria/:id` - Solicitudes de tutoría
- `PUT /api/solicitudes/:id/aceptar` - Aceptar solicitud (Tutor)
- `PUT /api/solicitudes/:id/rechazar` - Rechazar solicitud (Tutor)
- `DELETE /api/solicitudes/:id` - Eliminar solicitud (Estudiante)

### Encuestas
- `POST /api/encuestas/preguntas` - Crear pregunta (Admin)
- `GET /api/encuestas/preguntas` - Listar preguntas
- `GET /api/encuestas/preguntas/materia/:materia` - Preguntas por materia
- `POST /api/encuestas/respuestas` - Enviar respuestas
- `GET /api/encuestas/tutoria/:id/promedio` - Promedio de tutoría
- `GET /api/encuestas/tutoria/:id/promedios-preguntas` - Promedios por pregunta
- `GET /api/encuestas/verificar/:id` - Verificar si respondió

### Chat/Mensajería
- `GET /api/mensajes/conversaciones` - Listar conversaciones del usuario
- `GET /api/mensajes/tutoria/:id` - Obtener mensajes de una tutoría
- `GET /api/mensajes/no-leidos` - Contar mensajes no leídos
- `PUT /api/mensajes/:id/marcar-leido` - Marcar mensaje como leído

## ⚡ Eventos Socket.IO

### Notificaciones Generales
- `nuevaSolicitud` - Nueva solicitud de tutoría (Tutor)
- `solicitudAceptada` - Solicitud aceptada (Estudiante)
- `solicitudRechazada` - Solicitud rechazada (Estudiante)
- `solicitudAprobada` - Usuario aprobado (Admin)
- `nuevaTutoria` - Nueva tutoría creada (Todos)

### Chat en Tiempo Real
- `chat:enviar-mensaje` - Enviar mensaje en el chat
- `chat:mensaje-enviado` - Confirmación de mensaje enviado
- `chat:nuevo-mensaje` - Nuevo mensaje recibido
- `chat:escribiendo` - Usuario está escribiendo
- `chat:dejo-escribir` - Usuario dejó de escribir

## 🛠️ Funcionalidades Principales

### Para Administradores
- ✅ Aprobar/rechazar solicitudes de registro de tutores y estudiantes
- ✅ Crear y gestionar preguntas de encuestas por materia
- ✅ Visualizar todas las preguntas guardadas

### Para Tutores
- ✅ Registrar nuevas tutorías (materia, fecha, horario, cupos)
- ✅ Ver y gestionar tutorías creadas
- ✅ Aceptar/rechazar solicitudes de estudiantes
- ✅ Filtrar solicitudes por estado (HU-005)
- ✅ Ver promedios de calificación de tutorías (HU-008)
- ✅ Ver respuestas detalladas de encuestas
- ✅ **Chat grupal con todos los estudiantes de cada tutoría**
- ✅ **Indicador de mensajes no leídos**
- ✅ **Ver lista de participantes por tutoría**

### Para Estudiantes
- ✅ Consultar tutorías disponibles
- ✅ Filtrar tutorías por materia (HU-001)
- ✅ Solicitar unirse a tutorías
- ✅ Ver y gestionar solicitudes
- ✅ Calificar tutorías completadas (HU-009)
- ✅ Responder encuestas de calificación
- ✅ **Chat en tiempo real con tutor y otros estudiantes**
- ✅ **Notificaciones de nuevos mensajes**
- ✅ **Indicador de "escribiendo..."**

## 📊 Base de Datos - MongoDB

### Colecciones:
- **usuarios** - Almacena administradores, tutores y estudiantes
- **tutorias** - Tutorías creadas por tutores
- **solicitudes** - Solicitudes de estudiantes a tutorías
- **preguntas** - Preguntas de encuestas por materia
- **respuestas** - Respuestas de estudiantes a encuestas
- **mensajes** - Mensajes del chat grupal por tutoría

## 🎨 Diseño UI/UX

- Bootstrap 5.3.0 para diseño responsive
- Gradiente moderno (#667eea → #764ba2)
- Iconos Bootstrap Icons y Font Awesome
- Animaciones CSS suaves con keyframes
- Tablas interactivas con hover effects
- Modales para encuestas y formularios
- **Interfaz de chat estilo WhatsApp con burbujas de mensajes**
- **Scrollbar personalizado para mejor UX**
- **Diseño adaptativo mobile-first para chat**

## 🔒 Seguridad

- ✅ Contraseñas hasheadas con bcryptjs
- ✅ Sesiones seguras con express-session
- ✅ Middleware de autenticación y autorización por roles
- ✅ Validación de datos en backend
- ✅ Prevención de solicitudes duplicadas (índices únicos)

## 🚀 Deploy

Para producción, configurar:

1. `NODE_ENV=production` en `.env`
2. Usar dominio HTTPS
3. Configurar `cookie.secure = true`
4. Variables de entorno seguras
5. Proxy inverso (nginx/Apache)

## 📝 Licencia

MIT License - EPN FIS 2025

## 👥 Equipo

Carrera de Ingeniería de Software - Escuela Politécnica Nacional

---

**Desarrollado con ❤️ para mejorar el aprendizaje colaborativo en FIS**
