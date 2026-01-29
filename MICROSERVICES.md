# 🏗️ Arquitectura de Microservicios - TutoriasFIS

## 📋 Descripción General

Sistema de gestión de tutorías implementado con arquitectura de microservicios usando NestJS, MongoDB y Docker.

## 🎯 Arquitectura

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CLIENTE (Frontend)                              │
│                         Next.js - Puerto 3001                           │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  │ HTTP/REST + WebSockets
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY                                     │
│                    Enrutador Central - Puerto 4000                      │
│                                                                         │
│  • Punto de entrada único                                              │
│  • Enrutamiento a microservicios                                       │
│  • Gestión de cookies y headers                                        │
└───────────┬─────────────────────┬────────────────────┬──────────────────┘
            │                     │                    │
            ▼                     ▼                    ▼
┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐
│ IDENTITY SERVICE  │  │ ACADEMIC SERVICE  │  │ MESSAGING SERVICE │
│    Puerto 4001    │  │    Puerto 4002    │  │    Puerto 4003    │
│                   │  │                   │  │                   │
│ • Autenticación   │  │ • Materias        │  │ • Mensajes        │
│ • Usuarios        │  │ • Tutorías        │  │ • Chat WebSocket  │
│ • JWT             │  │ • Solicitudes     │  │ • Notificaciones  │
│ • Roles           │  │ • Encuestas       │  │                   │
│                   │  │ • Aula Virtual    │  │                   │
└─────────┬─────────┘  └─────────┬─────────┘  └─────────┬─────────┘
          │                      │                        │
          └──────────────────────┼────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │      MONGODB           │
                    │ tutorias_fis (BD)      │
                    │   Puerto 27017         │
                    └────────────────────────┘
```

## 🚀 Microservicios

### 1️⃣ API Gateway (Puerto 4000)
**Responsabilidad:** Punto de entrada único y enrutamiento

**Tecnologías:**
- NestJS
- Axios (para proxy)
- Cookie-parser

**Endpoints:**
- Redirige `/auth/*` → Identity Service
- Redirige `/usuarios/*` → Identity Service
- Redirige `/materias/*` → Academic Service
- Redirige `/tutorias/*` → Academic Service
- Redirige `/solicitudes/*` → Academic Service
- Redirige `/encuestas/*` → Academic Service
- Redirige `/aula/*` → Academic Service
- Redirige `/mensajes/*` → Messaging Service
- Redirige `/chat/*` → Messaging Service

### 2️⃣ Identity Service (Puerto 4001)
**Responsabilidad:** Autenticación, autorización y gestión de usuarios

**Módulos:**
- `auth` - Login, registro, recuperación de contraseña
- `usuarios` - CRUD de usuarios, perfiles, roles

**Schemas:**
- `Usuario` - Información de usuarios con roles (Admin, Tutor, Estudiante)

**Seguridad:**
- JWT con expiración de 7 días
- Passwords hasheados con bcrypt
- HTTP-only cookies
- Guards por rol

### 3️⃣ Academic Service (Puerto 4002)
**Responsabilidad:** Gestión académica (materias, tutorías, solicitudes)

**Módulos (Pendientes de implementar):**
- `materias` - Catálogo de materias
- `tutorias` - Sesiones de tutoría
- `solicitudes` - Solicitudes de estudiantes
- `encuestas` - Evaluación de tutorías
- `aula` - Configuración de aulas (presencial/virtual)

**Schemas:**
- `Materia` - Código, nombre, semestre
- `Tutoria` - Fecha, horario, cupos, tutor, materia
- `Solicitud` - Relación estudiante-tutoría con estado

### 4️⃣ Messaging Service (Puerto 4003)
**Responsabilidad:** Comunicación en tiempo real

**Módulos (Pendientes de implementar):**
- `mensajes` - Historial y gestión de mensajes
- `chat` - WebSockets para chat en tiempo real

**Schemas:**
- `Mensaje` - Emisor, receptor, contenido, tutoría

**Características:**
- Socket.IO para WebSockets
- Salas por usuario (tutor-{id}, estudiante-{id})
- Eventos: envío, lectura, escribiendo

## 🛠️ Instalación y Ejecución

### Prerrequisitos
- Node.js 20+
- Docker y Docker Compose
- MongoDB (si no usas Docker)

### 📦 Instalación Local (sin Docker)

#### 1. Instalar dependencias en cada microservicio

```bash
# API Gateway
cd backend/api-gateway
npm install

# Identity Service
cd ../identity-service
npm install

# Academic Service
cd ../academic-service
npm install

# Messaging Service
cd ../messaging-service
npm install

# Frontend
cd ../../frontend
npm install
```

#### 2. Configurar variables de entorno

Copia los archivos `.env.example` a `.env` en cada servicio:

```bash
# En cada carpeta de servicio
cp .env.example .env
```

#### 3. Iniciar MongoDB

```bash
# Si tienes MongoDB instalado localmente
mongod

# O con Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

#### 4. Iniciar cada servicio (en terminales separadas)

```bash
# Terminal 1 - Identity Service
cd backend/identity-service
npm run start:dev

# Terminal 2 - Academic Service
cd backend/academic-service
npm run start:dev

# Terminal 3 - Messaging Service
cd backend/messaging-service
npm run start:dev

# Terminal 4 - API Gateway
cd backend/api-gateway
npm run start:dev

# Terminal 5 - Frontend
cd frontend
npm run dev
```

### 🐳 Instalación con Docker Compose (Recomendado)

```bash
# En la raíz del proyecto
docker-compose up --build

# O en segundo plano
docker-compose up -d --build
```

## 🌐 URLs de Acceso

| Servicio | URL | Descripción |
|----------|-----|-------------|
| Frontend | http://localhost:3001 | Aplicación web |
| API Gateway | http://localhost:4000 | Punto de entrada API |
| Identity Service | http://localhost:4001 | Auth interno |
| Academic Service | http://localhost:4002 | Academic interno |
| Messaging Service | http://localhost:4003 | Messaging interno |
| MongoDB | mongodb://localhost:27017 | Base de datos |
| Prometheus | http://localhost:9090 | Métricas |
| Grafana | http://localhost:3002 | Visualización |

## 📂 Estructura de Directorios

```
TutoriasFIS/
├── backend/
│   ├── api-gateway/           ✅ COMPLETO
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   └── proxy/
│   │   ├── package.json
│   │   ├── dockerfile
│   │   └── .env.example
│   │
│   ├── identity-service/      ✅ COMPLETO
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   └── usuarios/
│   │   │   └── common/
│   │   ├── package.json
│   │   ├── dockerfile
│   │   └── .env.example
│   │
│   ├── academic-service/      ⚠️ BASE CREADA - FALTA MÓDULOS
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── modules/        ← IMPLEMENTAR
│   │   │   │   ├── materias/
│   │   │   │   ├── tutorias/
│   │   │   │   ├── solicitudes/
│   │   │   │   ├── encuestas/
│   │   │   │   └── aula/
│   │   │   └── common/         ✅
│   │   ├── package.json
│   │   ├── dockerfile
│   │   └── .env.example
│   │
│   └── messaging-service/     ⚠️ BASE CREADA - FALTA MÓDULOS
│       ├── src/
│       │   ├── main.ts
│       │   ├── app.module.ts
│       │   ├── modules/        ← IMPLEMENTAR
│       │   │   ├── mensajes/
│       │   │   └── chat/
│       │   └── common/         ✅
│       ├── package.json
│       ├── dockerfile
│       └── .env.example
│
├── frontend/                   (Existente)
├── docker-compose.yml          ✅ ACTUALIZADO
└── MICROSERVICES.md            (Este archivo)
```

## 🔄 Próximos Pasos

### Para completar Academic Service:

1. **Copiar módulos del backend actual:**
   ```bash
   # Desde backend/src/modules/ copiar a academic-service/src/modules/
   - materias/
   - tutorias/
   - solicitudes/
   - encuestas/
   - aula/
   ```

2. **Ajustar imports** en cada módulo
3. **Descomentar imports** en `academic-service/src/app.module.ts`
4. **Probar endpoints**

### Para completar Messaging Service:

1. **Copiar módulo mensajes** de `backend/src/modules/mensajes`
2. **Implementar gateway WebSocket** para chat
3. **Descomentar imports** en `messaging-service/src/app.module.ts`
4. **Configurar Socket.IO** con autenticación JWT

## 🧪 Testing

```bash
# En cada microservicio
npm run test

# E2E
npm run test:e2e

# Coverage
npm run test:cov
```

## 📊 Monitoreo

- **Prometheus:** Recolecta métricas de cada servicio
- **Grafana:** Dashboards visuales
- Cada servicio NestJS expone `/metrics` para Prometheus

## 🔐 Seguridad

- JWT con secret compartido entre servicios
- HTTP-only cookies para el token
- Guards de autenticación en cada servicio
- Validación de DTOs con class-validator
- CORS configurado

## 🚨 Troubleshooting

### Problema: "Cannot connect to MongoDB"
**Solución:** Verifica que MongoDB esté corriendo y accesible en el puerto 27017

### Problema: "Port already in use"
**Solución:** Cambia los puertos en `.env` y `docker-compose.yml`

### Problema: "Module not found" al compilar
**Solución:** Ejecuta `npm install` en el servicio correspondiente

### Problema: "Unauthorized" en requests
**Solución:** Verifica que el JWT_SECRET sea el mismo en todos los servicios

## 📚 Documentación Adicional

- [NestJS Documentation](https://docs.nestjs.com)
- [Docker Compose](https://docs.docker.com/compose/)
- [MongoDB](https://docs.mongodb.com/)
- [Socket.IO](https://socket.io/docs/)

## 👥 Contribución

Para añadir un nuevo microservicio:

1. Crear carpeta en `backend/`
2. Usar estructura base (package.json, tsconfig, nest-cli.json)
3. Implementar `main.ts` y `app.module.ts`
4. Añadir entrada en `docker-compose.yml`
5. Actualizar enrutamiento en API Gateway

---

**Versión:** 1.0.0  
**Fecha:** Enero 2026  
**Estado:** En desarrollo - Servicios base implementados
