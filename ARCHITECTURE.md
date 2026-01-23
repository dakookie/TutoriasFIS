# Arquitectura del Sistema de Tutorías FIS

## Visión General

El sistema ha sido migrado de un monolito Express.js a una arquitectura desacoplada:

```
┌─────────────────────────────────────────────────────────────────┐
│                        ARQUITECTURA                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐        ┌─────────────────────────────────┐│
│  │   Frontend      │        │         Backend NestJS          ││
│  │   Next.js       │◄──────►│                                 ││
│  │   :3001         │  REST  │  ┌──────────────────────────┐   ││
│  │                 │  API   │  │  /api/auth               │   ││
│  │  • React 19     │        │  │  /api/usuarios           │   ││
│  │  • TypeScript   │        │  │  /api/materias           │   ││
│  │  • Tailwind 4   │        │  │  /api/tutorias           │   ││
│  │  • Zod          │◄──────►│  │  /api/solicitudes        │   ││
│  │                 │ Socket │  │  /api/mensajes           │   ││
│  └─────────────────┘  .IO   │  └──────────────────────────┘   ││
│                             │                :4000             ││
│                             └──────────────┬──────────────────┘│
│                                            │                   │
│                                            ▼                   │
│                             ┌──────────────────────────────────┐│
│                             │         MongoDB                  ││
│                             │   tutorias_fis                   ││
│                             │                                  ││
│                             │  • usuarios                      ││
│                             │  • materias                      ││
│                             │  • tutorias                      ││
│                             │  • solicituds                    ││
│                             │  • mensajes                      ││
│                             └──────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Componentes

### 1. Frontend (Next.js 16.x)
- **Puerto**: 3001
- **Ubicación**: `/frontend`
- **Stack**: React 19, TypeScript, Tailwind CSS 4, Zod 4
- **Características**:
  - Server-Side Rendering (SSR)
  - App Router (Next.js 14+)
  - Validación con Zod
  - Diseño responsivo

### 2. Backend (NestJS 11.x)
- **Puerto**: 4000
- **Ubicación**: `/backend`
- **Stack**: NestJS, TypeScript, Mongoose, Passport JWT, Socket.IO
- **Características**:
  - API RESTful
  - WebSockets para chat en tiempo real
  - Autenticación JWT con HTTP-only cookies
  - Validación con class-validator
  - Guards para autorización por roles

### 3. Monolito Original (Express.js)
- **Puerto**: 3000
- **Estado**: Puede seguir funcionando en paralelo durante la migración
- **Base de datos**: Comparte la misma BD con el nuevo backend

## Flujo de Autenticación

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Usuario    │      │   Frontend   │      │   Backend    │
│              │      │   Next.js    │      │   NestJS     │
└──────┬───────┘      └──────┬───────┘      └──────┬───────┘
       │                     │                     │
       │  1. Login           │                     │
       │────────────────────►│                     │
       │                     │  2. POST /api/auth/login
       │                     │────────────────────►│
       │                     │                     │
       │                     │  3. JWT + Cookie    │
       │                     │◄────────────────────│
       │  4. Dashboard       │                     │
       │◄────────────────────│                     │
       │                     │                     │
       │  5. Petición        │                     │
       │────────────────────►│                     │
       │                     │  6. API + Cookie    │
       │                     │────────────────────►│
       │                     │                     │
       │                     │  7. Datos           │
       │                     │◄────────────────────│
       │  8. Respuesta       │                     │
       │◄────────────────────│                     │
       │                     │                     │
```

## Módulos del Backend

```
backend/src/modules/
├── auth/          # Autenticación y autorización
├── usuarios/      # Gestión de usuarios
├── materias/      # Catálogo de materias
├── tutorias/      # Sesiones de tutoría
├── solicitudes/   # Solicitudes de estudiantes
└── mensajes/      # Chat y mensajería
```

## Base de Datos (MongoDB)

### Colecciones y Relaciones

```
usuarios
├── _id
├── nombre, apellido
├── email (unique)
├── password (bcrypt)
├── rol: Administrador | Tutor | Estudiante
├── materias: [ObjectId] → materias
└── activo: boolean

materias
├── _id
├── nombre
├── descripcion
└── activo: boolean

tutorias
├── _id
├── tutor: ObjectId → usuarios
├── materia: ObjectId → materias
├── fecha, horaInicio, horaFin
├── cuposOriginales, cuposDisponibles
├── modalidadAula: Presencial | Virtual
└── activa, publicada: boolean

solicituds
├── _id
├── tutoria: ObjectId → tutorias
├── estudiante: ObjectId → usuarios
├── estado: Pendiente | Aceptada | Rechazada
└── createdAt

mensajes
├── _id
├── emisor: ObjectId → usuarios
├── receptor: ObjectId → usuarios
├── contenido
├── leido: boolean
└── tutoria: ObjectId → tutorias (opcional)
```

## Comandos de Desarrollo

### Iniciar todo el sistema

```bash
# Terminal 1: MongoDB (si no está como servicio)
mongod

# Terminal 2: Backend NestJS
cd backend
npm run start:dev

# Terminal 3: Frontend Next.js
cd frontend
npm run dev
```

### URLs

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:3001 |
| Backend API | http://localhost:4000/api |
| Backend WebSocket | http://localhost:4000/chat |
| MongoDB | mongodb://127.0.0.1:27017/tutorias_fis |

## Migración Gradual

El sistema permite una migración gradual:

1. **Fase 1**: Frontend apunta a Express (monolito)
2. **Fase 2**: Frontend apunta a NestJS (nuevo backend)
3. **Fase 3**: Apagar monolito cuando todo funcione

Para cambiar el backend en el frontend, modificar `NEXT_PUBLIC_API_URL` en `.env.local`.

## Seguridad

- JWT almacenado en HTTP-only cookies (no accesible desde JS)
- CORS configurado para orígenes específicos
- Validación de entrada con class-validator (backend) y Zod (frontend)
- Contraseñas hasheadas con bcrypt
- Guards para autorización por roles
