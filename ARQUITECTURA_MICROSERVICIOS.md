# Arquitectura de Microservicios - Sistema de Tutorías FIS

## 1. Introducción

Este documento detalla la arquitectura de microservicios implementada en el sistema de tutorías, incluyendo el diseño del frontend y backend, la estrategia de base de datos, patrones de diseño utilizados y medidas de seguridad implementadas.

---

## 2. Diagrama de Arquitectura del Sistema

### 2.1 Vista General de la Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTE (Browser)                        │
│                    http://localhost:3001                         │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      │ HTTP/HTTPS
                      │ Cookies (JWT Token)
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                       FRONTEND LAYER                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │           Next.js 16 Application (Port 3001)              │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  • React Components (App Router)                    │  │  │
│  │  │  • API Client (lib/api/client.ts)                   │  │  │
│  │  │  • Context Providers (AuthContext, etc.)            │  │  │
│  │  │  • TypeScript + Tailwind CSS                        │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      │ HTTP/REST API
                      │ WebSocket (Chat)
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │         API Gateway - NestJS (Port 4000)                  │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  Responsabilidades:                                  │  │  │
│  │  │  • Routing y Proxy inverso                          │  │  │
│  │  │  • Decodificación JWT de cookies                    │  │  │
│  │  │  • Inyección de headers personalizados              │  │  │
│  │  │  • Logging y monitoreo centralizado                 │  │  │
│  │  │  • Rate limiting y CORS                             │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└──────┬──────────────┬──────────────┬──────────────┬─────────────┘
       │              │              │              │
       │ HTTP         │ HTTP         │ HTTP         │ HTTP/WS
       │              │              │              │
       ▼              ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Identity   │ │  Academic    │ │  Messaging   │ │   Future     │
│   Service    │ │   Service    │ │   Service    │ │  Services    │
│  Port 4001   │ │  Port 4002   │ │  Port 4003   │ │    ...       │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────────────┘
       │                │                │
       │                │                │
       ▼                ▼                ▼
┌──────────────────────────────────────────────────────────────────┐
│                    PERSISTENCE LAYER                             │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              MongoDB (Port 27017)                          │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │  │
│  │  │   usuarios   │  │   materias   │  │  mensajes    │    │  │
│  │  │   (Identity) │  │   tutorias   │  │  (Messaging) │    │  │
│  │  │              │  │   solicitudes│  │              │    │  │
│  │  │              │  │   (Academic) │  │              │    │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘    │  │
│  │          Database: tutorias_fis                            │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 Flujo de Autenticación

```
┌────────┐                ┌──────────┐              ┌──────────┐
│ Client │                │   API    │              │ Identity │
│        │                │ Gateway  │              │ Service  │
└───┬────┘                └────┬─────┘              └────┬─────┘
    │                          │                         │
    │ POST /api/auth/login     │                         │
    ├─────────────────────────>│                         │
    │  {email, password}       │  Forward request        │
    │                          ├────────────────────────>│
    │                          │                         │
    │                          │                         │ Validate
    │                          │                         │ credentials
    │                          │                         │
    │                          │   JWT Token             │
    │                          │<────────────────────────┤
    │  Set-Cookie: token=JWT   │                         │
    │<─────────────────────────┤                         │
    │  {success: true}         │                         │
    │                          │                         │
    │ GET /api/academic/...    │                         │
    ├─────────────────────────>│                         │
    │  Cookie: token=JWT       │                         │
    │                          │ Decode JWT              │
    │                          │ Extract userId, rol     │
    │                          │                         │
    │                          │ Headers:                │
    │                          │  x-user-id: <id>        │
    │                          │  x-user-rol: <rol>      │
    │                          │  x-jwt-token: <token>   │
    │                          ├─────────────────────────>
    │                          │                         │
    │  Response data           │                         │
    │<─────────────────────────┤                         │
    │                          │                         │
```

---

## 3. Arquitectura de Microservicios

### 3.1 API Gateway (Port 4000)

**Responsabilidades:**
- Punto de entrada único para todas las peticiones del cliente
- Enrutamiento dinámico a microservicios internos
- Decodificación de tokens JWT desde cookies HTTP-Only
- Inyección de headers personalizados (x-user-id, x-user-rol, x-jwt-token)
- Gestión de CORS y políticas de seguridad
- Logging y monitoreo centralizado

**Tecnologías:**
- NestJS con Express
- Axios para proxy HTTP
- jsonwebtoken para decodificación JWT

**Configuración de Rutas:**
```typescript
/api/auth/*        → Identity Service (4001)
/api/materias/*    → Academic Service (4002)
/api/tutorias/*    → Academic Service (4002)
/api/solicitudes/* → Academic Service (4002)
/api/encuestas/*   → Academic Service (4002)
/api/aula/*        → Academic Service (4002)
/api/mensajes/*    → Messaging Service (4003)
```

### 3.2 Identity Service (Port 4001)

**Responsabilidades:**
- Autenticación de usuarios (login/register)
- Generación y validación de tokens JWT
- Gestión de sesiones y cookies
- Control de acceso basado en roles (RBAC)
- Reset de contraseñas

**Modelos de Datos:**
- `Usuario`: información de usuario, credenciales hashadas (bcrypt)
- Roles: Estudiante, Tutor, Admin

**Seguridad:**
- Passwords hasheados con bcrypt (salt rounds: 10)
- JWT con expiración de 7 días
- Cookies HTTP-Only con SameSite=Lax
- Validación de datos con class-validator

### 3.3 Academic Service (Port 4002)

**Responsabilidades:**
- Gestión de materias
- Gestión de tutorías (crear, editar, eliminar)
- Solicitudes de tutoría (crear, aceptar, rechazar)
- Sistema de encuestas y calificaciones
- Aula virtual (bibliografía, publicaciones)

**Modelos de Datos:**
- `Materia`: información de materias
- `Tutoria`: sesiones de tutoría con estado
- `Solicitud`: peticiones de estudiantes
- `Pregunta` y `Respuesta`: sistema de encuestas
- `Bibliografia` y `Publicacion`: contenido del aula

**Lógica de Negocio:**
- Validación de capacidad de tutorías
- Estados de solicitudes (Pendiente, Aceptada, Rechazada)
- Cálculo de promedios de calificaciones
- Verificación de permisos por rol

### 3.4 Messaging Service (Port 4003)

**Responsabilidades:**
- Chat en tiempo real con WebSocket
- Historial de conversaciones
- Notificaciones de mensajes nuevos
- Gestión de conversaciones por tutoría

**Tecnologías:**
- Socket.IO para comunicación bidireccional
- REST API para historial y gestión
- Autenticación JWT en WebSocket

**Modelos de Datos:**
- `Mensaje`: contenido, timestamps, participantes
- Relación con tutorías y usuarios

---

## 4. Análisis y Refactoring de Base de Datos

### 4.1 Estrategia: Database per Service Pattern

El sistema implementa el patrón **Database per Microservice** mediante una base de datos MongoDB compartida (`tutorias_fis`) con colecciones segregadas por dominio de servicio.

#### Segregación de Colecciones:

**Identity Service:**
```
Colecciones:
├── usuarios
    ├── _id (ObjectId)
    ├── nombre, apellido, email
    ├── password (hashed)
    ├── rol (Estudiante, Tutor, Admin)
    ├── carnet
    └── timestamps
```

**Academic Service:**
```
Colecciones:
├── materias
│   ├── _id (ObjectId)
│   ├── nombre, codigo, descripcion
│   └── activa (boolean)
│
├── tutorias
│   ├── _id (ObjectId)
│   ├── tutor (ref: Usuario)
│   ├── materia (ref: Materia)
│   ├── fecha, hora, capacidad
│   └── estado (Pendiente, Activa, Finalizada)
│
├── solicitudes
│   ├── _id (ObjectId)
│   ├── estudiante (ref: Usuario)
│   ├── tutoria (ref: Tutoria)
│   └── estado (Pendiente, Aceptada, Rechazada)
│
├── preguntas
│   ├── _id (ObjectId)
│   ├── pregunta (texto)
│   ├── materia (ref: Materia)
│   └── activa (boolean)
│
├── respuestas
│   ├── _id (ObjectId)
│   ├── estudiante (ref: Usuario)
│   ├── tutoria (ref: Tutoria)
│   ├── pregunta (ref: Pregunta)
│   ├── calificacion (1-5)
│   └── Index: {tutoria, estudiante, pregunta} unique
│
├── bibliografias
│   ├── _id (ObjectId)
│   ├── tutoria (ref: Tutoria)
│   ├── titulo, descripcion
│   ├── archivoUrl, tipoArchivo
│   └── timestamps
│
└── publicaciones
    ├── _id (ObjectId)
    ├── tutoria (ref: Tutoria)
    ├── usuario (ref: Usuario)
    ├── contenido
    └── timestamps
```

**Messaging Service:**
```
Colecciones:
└── mensajes
    ├── _id (ObjectId)
    ├── tutoria (ref: Tutoria)
    ├── remitente (ref: Usuario)
    ├── contenido
    ├── leido (boolean)
    └── timestamps
```

### 4.2 Ventajas del Patrón Database per Service

1. **Independencia de Servicios:**
   - Cada servicio gestiona sus propias colecciones
   - Cambios en el esquema no afectan otros servicios
   - Despliegue independiente sin conflictos de datos

2. **Escalabilidad:**
   - Posibilidad de escalar bases de datos por servicio
   - Optimización de índices según carga específica
   - Caché y sharding por dominio

3. **Resiliencia:**
   - Fallos en un servicio no comprometen otros
   - Transacciones limitadas al contexto del servicio
   - Backup y recovery granular

### 4.3 Desafíos y Soluciones Implementadas

**Desafío 1: Referencias entre servicios**
- **Solución:** Uso de ObjectId como referencias, servicios comunican datos necesarios por headers (x-user-id, x-user-rol)

**Desafío 2: Consistencia eventual**
- **Solución:** Validaciones en API Gateway antes de enrutar, propagación de cambios mediante headers personalizados

**Desafío 3: Transacciones distribuidas**
- **Solución:** Evitar transacciones complejas, diseñar operaciones idempotentes, validación previa en cada servicio

### 4.4 Índices Implementados

```javascript
// Identity Service
usuarios: {
  email: unique,
  carnet: unique
}

// Academic Service
respuestas: {
  {tutoria: 1, estudiante: 1, pregunta: 1}: unique
}

tutorias: {
  tutor: 1,
  materia: 1,
  estado: 1
}

// Messaging Service
mensajes: {
  tutoria: 1,
  remitente: 1,
  createdAt: -1
}
```

---

## 5. Patrones de Diseño para Microservicios

### 5.1 Patrón: API Gateway

**Definición:**
Punto de entrada único que enruta peticiones a microservicios internos, abstrayendo la complejidad de la arquitectura distribuida.

**Implementación en el Sistema:**

```typescript
// proxy.service.ts
async forwardRequest(
  url: string,
  method: string,
  body: any,
  headers: Record<string, string>,
  params: any,
  user?: { userId: string; rol: string; nombre: string; apellido: string }
): Promise<any> {
  // 1. Determinar servicio destino
  const targetUrl = this.getTargetService(url);
  
  // 2. Inyectar headers personalizados
  const customHeaders = this.buildCustomHeaders(headers, user, url);
  
  // 3. Realizar petición proxy
  const response = await axios({
    method,
    url: targetUrl,
    data: body,
    headers: customHeaders,
    params,
    validateStatus: () => true
  });
  
  return response.data;
}
```

**Beneficios:**
- **Single Entry Point:** Cliente solo conoce una URL
- **Security Layer:** Autenticación centralizada
- **Cross-Cutting Concerns:** Logging, rate limiting, CORS
- **Service Discovery:** Ocultación de topología interna
- **Protocol Translation:** REST → WebSocket, HTTP → gRPC

**Flujo de Procesamiento:**
```
Client Request
    ↓
[CORS Validation]
    ↓
[JWT Decode from Cookie]
    ↓
[Route Matching]
    ↓
[Header Injection]
    ↓
[Forward to Service]
    ↓
[Response Aggregation]
    ↓
Client Response
```

### 5.2 Patrón: Database per Service

**Definición:**
Cada microservicio posee su propio almacenamiento de datos, eliminando acoplamiento y dependencias compartidas.

**Implementación en el Sistema:**

```
Identity Service (4001)
    ↓
MongoDB: tutorias_fis.usuarios
    - Ownership completo del dominio de usuarios
    - Esquema independiente
    - Migrations aisladas

Academic Service (4002)
    ↓
MongoDB: tutorias_fis.{materias, tutorias, solicitudes, encuestas}
    - Ownership del dominio académico
    - Esquema independiente
    - Business logic encapsulada

Messaging Service (4003)
    ↓
MongoDB: tutorias_fis.mensajes
    - Ownership del dominio de comunicación
    - Esquema independiente
    - WebSocket + REST separados
```

**Comunicación entre Servicios:**

```typescript
// Messaging Service necesita info de usuario
// NO hace query directa a usuarios collection
// SÍ recibe datos en headers del API Gateway

@MessageBody() data: { tutoriaId: string; contenido: string },
@ConnectedSocket() client: Socket
) {
  // Extraer de headers inyectados por API Gateway
  const userId = client.handshake.headers['x-user-id'];
  const userRol = client.handshake.headers['x-user-rol'];
  
  // Crear mensaje con referencia a userId (ObjectId)
  const mensaje = await this.mensajesService.crearMensaje({
    tutoria: data.tutoriaId,
    remitente: userId, // Solo ID, no todo el objeto
    contenido: data.contenido
  });
}
```

**Beneficios:**
- **Bounded Context:** Cada servicio encapsula su dominio
- **Technology Diversity:** Servicios pueden usar diferentes DBs
- **Scalability:** Escalar DB por servicio según demanda
- **Fault Isolation:** Fallo en DB no afecta otros servicios

### 5.3 Patrón Adicional: Sidecar Pattern (Implícito)

**Implementación:**
Cada microservicio corre en su propio contenedor Docker con configuración aislada.

```yaml
# docker-compose.yml
services:
  api-gateway:
    container_name: api_gateway
    ports: ["4000:4000"]
    networks: [tutorias-network]
  
  identity-service:
    container_name: identity_service
    ports: ["4001:4001"]
    networks: [tutorias-network]
  
  academic-service:
    container_name: academic_service
    ports: ["4002:4002"]
    networks: [tutorias-network]
```

**Beneficios:**
- Aislamiento de procesos
- Gestión de recursos independiente
- Health checks por servicio
- Logs segregados

---

## 6. Medidas de Seguridad Implementadas

### 6.1 Autenticación con JWT (JSON Web Tokens)

**Flujo de Autenticación:**

```typescript
// 1. Login - Identity Service
async login(loginDto: LoginDto): Promise<any> {
  // Validar credenciales
  const usuario = await this.usuarioModel.findOne({ email: loginDto.email });
  if (!usuario) {
    throw new UnauthorizedException('Credenciales inválidas');
  }
  
  // Verificar password con bcrypt
  const passwordValido = await bcrypt.compare(
    loginDto.password,
    usuario.password
  );
  if (!passwordValido) {
    throw new UnauthorizedException('Credenciales inválidas');
  }
  
  // Generar JWT
  const payload = {
    userId: usuario._id,
    email: usuario.email,
    rol: usuario.rol,
    nombre: usuario.nombre,
    apellido: usuario.apellido
  };
  
  const token = this.jwtService.sign(payload, {
    secret: process.env.JWT_SECRET,
    expiresIn: '7d'
  });
  
  return { token, usuario };
}

// 2. Almacenar en cookie HTTP-Only
@Post('login')
async login(
  @Body() loginDto: LoginDto,
  @Res({ passthrough: true }) response: Response
) {
  const { token, usuario } = await this.authService.login(loginDto);
  
  // Cookie segura
  response.cookie('token', token, {
    httpOnly: true,      // No accesible desde JavaScript
    secure: true,        // Solo HTTPS en producción
    sameSite: 'lax',     // Protección CSRF
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    path: '/'
  });
  
  return { success: true, usuario };
}
```

**Configuración JWT:**
```typescript
// JWT Module
JwtModule.register({
  secret: process.env.JWT_SECRET || 'secret-key-change-in-production',
  signOptions: {
    expiresIn: '7d',
    algorithm: 'HS256'
  }
})
```

**JWT Payload:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "email": "usuario@ejemplo.com",
  "rol": "Estudiante",
  "nombre": "Juan",
  "apellido": "Pérez",
  "iat": 1738166400,
  "exp": 1738771200
}
```

### 6.2 Protección de Contraseñas

**Hashing con bcrypt:**

```typescript
// Registro de usuario
async register(createUsuarioDto: CreateUsuarioDto): Promise<any> {
  // Hash password con salt rounds = 10
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(createUsuarioDto.password, salt);
  
  const usuario = new this.usuarioModel({
    ...createUsuarioDto,
    password: hashedPassword
  });
  
  await usuario.save();
  return { success: true };
}

// Verificación en login
const passwordValido = await bcrypt.compare(
  plainPassword,
  hashedPassword
);
```

**Características:**
- Salt rounds: 10 (2^10 = 1024 iteraciones)
- Salt único por password
- Resistente a rainbow tables
- Tiempo de hashing ~100ms (seguridad vs performance)

### 6.3 Control de Acceso Basado en Roles (RBAC)

**Implementación con Guards y Decorators:**

```typescript
// roles.decorator.ts
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

// roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler()
    );
    
    if (!requiredRoles) {
      return true;
    }
    
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    // Verificar si el rol del usuario está en los roles permitidos
    return requiredRoles.includes(user.rol);
  }
}

// Uso en controladores
@Post()
@Roles('Tutor', 'Admin')
async crearTutoria(@Body() dto: CreateTutoriaDto, @Request() req) {
  // Solo tutores y admins pueden crear tutorías
  return this.tutoriasService.create(dto, req.user.userId);
}

@Get('mis-solicitudes')
@Roles('Estudiante')
async getMisSolicitudes(@Request() req) {
  // Solo estudiantes pueden ver sus solicitudes
  return this.solicitudesService.getMisSolicitudes(req.user.userId);
}
```

**Matriz de Permisos:**

| Recurso              | Estudiante | Tutor | Admin |
|---------------------|-----------|-------|-------|
| Ver materias        | ✓         | ✓     | ✓     |
| Crear tutorías      | ✗         | ✓     | ✓     |
| Crear solicitudes   | ✓         | ✗     | ✓     |
| Aceptar solicitudes | ✗         | ✓     | ✓     |
| Gestionar usuarios  | ✗         | ✗     | ✓     |
| Ver encuestas       | ✗         | ✓     | ✓     |
| Responder encuestas | ✓         | ✗     | ✓     |

### 6.4 Seguridad en API Gateway

**Inyección de Headers de Autenticación:**

```typescript
// API Gateway - proxy.service.ts
private buildCustomHeaders(
  originalHeaders: Record<string, string>,
  user: UserPayload,
  url: string
): Record<string, string> {
  const headers = { ...originalHeaders };
  
  // Remover cookies originales (seguridad)
  delete headers['cookie'];
  
  // Inyectar información de usuario para servicios internos
  if (user && url.includes('/mensajes')) {
    headers['x-user-id'] = user.userId;
    headers['x-user-rol'] = user.rol;
    headers['x-user-nombre'] = user.nombre;
    headers['x-user-apellido'] = user.apellido;
    headers['x-jwt-token'] = this.extractJwtFromCookies(originalHeaders);
  }
  
  return headers;
}
```

**Ventajas:**
- Servicios internos no necesitan decodificar JWT
- Headers personalizados con información validada
- Prevención de token tampering
- Servicios confían en headers del Gateway

### 6.5 Cookies HTTP-Only y CSRF Protection

**Configuración de Cookies:**

```typescript
// Configuración segura
response.cookie('token', jwt, {
  httpOnly: true,    // No accesible desde document.cookie
  secure: true,      // Solo HTTPS (producción)
  sameSite: 'lax',   // Protección CSRF moderada
  path: '/',         // Disponible en toda la app
  maxAge: 604800000  // 7 días en milisegundos
});
```

**Protección contra Ataques:**

1. **XSS (Cross-Site Scripting):**
   - `httpOnly: true` → JavaScript no puede acceder al token
   - Validación de inputs con class-validator
   - Sanitización de HTML en frontend

2. **CSRF (Cross-Site Request Forgery):**
   - `sameSite: 'lax'` → Cookie no se envía en requests cross-site
   - Verificación de origen en API Gateway

3. **Token Theft:**
   - Almacenamiento en memoria del cliente (AuthContext)
   - No persistencia en localStorage/sessionStorage
   - Expiración de tokens (7 días)

### 6.6 Validación de Datos

**Class-Validator en DTOs:**

```typescript
// create-usuario.dto.ts
export class CreateUsuarioDto {
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @IsString()
  nombre: string;

  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password debe tener al menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password debe contener mayúsculas, minúsculas y números'
  })
  password: string;

  @IsEnum(['Estudiante', 'Tutor', 'Admin'])
  rol: string;
}

// Configuración global
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,              // Eliminar propiedades no definidas
  forbidNonWhitelisted: false,  // Permite campos extra (flexible)
  transform: true,              // Auto-transformación de tipos
  skipMissingProperties: true   // No validar propiedades faltantes
}));
```

### 6.7 Variables de Entorno y Secretos

**Gestión de Configuración:**

```bash
# .env (NO commitear a Git)
JWT_SECRET=super-secret-key-change-in-production-256-bits
MONGODB_URI=mongodb://tutorias_db:27017/tutorias_fis
NODE_ENV=production

# Docker secrets (producción)
docker secret create jwt_secret ./secrets/jwt.txt
```

**Carga de Variables:**

```typescript
// ConfigModule de NestJS
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        JWT_SECRET: Joi.string().required(),
        MONGODB_URI: Joi.string().required(),
        NODE_ENV: Joi.string().default('development')
      })
    })
  ]
})
```

### 6.8 CORS (Cross-Origin Resource Sharing)

**Configuración en API Gateway:**

```typescript
// main.ts
app.enableCors({
  origin: [
    'http://localhost:3001',  // Frontend dev
    'https://tutorias.fis.com' // Frontend prod
  ],
  credentials: true,  // Permitir cookies cross-origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-user-id',
    'x-user-rol'
  ]
});
```

---

## 7. Consideraciones para OAuth 2.0 / OpenID Connect (Futuro)

### 7.1 Arquitectura Propuesta con OAuth 2.0

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │
       │ 1. Redirect to Authorization Server
       ▼
┌─────────────────────┐
│  Identity Provider  │
│  (Google, GitHub)   │
│                     │
│  - User Login       │
│  - Consent Screen   │
│  - Issue Auth Code  │
└──────┬──────────────┘
       │
       │ 2. Authorization Code
       ▼
┌─────────────────────┐
│   Identity Service  │
│   (Backend OAuth)   │
│                     │
│  - Exchange Code    │
│  - Validate Token   │
│  - Create Session   │
└──────┬──────────────┘
       │
       │ 3. JWT Token + User Info
       ▼
┌─────────────┐
│   Client    │
│ (Logged In) │
└─────────────┘
```

### 7.2 Beneficios de OAuth 2.0/OIDC

- **Single Sign-On (SSO):** Login con cuentas existentes
- **Delegated Authorization:** Permisos granulares
- **Security:** No almacenar passwords de terceros
- **User Experience:** Login rápido y confiable

---

## 8. Monitoreo y Logging

### 8.1 Logging Centralizado

```typescript
// Implementación en API Gateway
console.log('[API Gateway] Request:', {
  method: req.method,
  url: req.url,
  userId: user?.userId,
  timestamp: new Date().toISOString()
});

console.log('[API Gateway] Response:', {
  status: response.status,
  duration: Date.now() - startTime
});
```

### 8.2 Health Checks

```typescript
// Endpoint de health en cada servicio
@Get('health')
healthCheck() {
  return {
    status: 'ok',
    service: 'academic-service',
    timestamp: new Date().toISOString(),
    database: 'connected'
  };
}
```

---

## 9. Conclusiones

La arquitectura de microservicios implementada proporciona:

✅ **Escalabilidad:** Servicios independientes escalables por demanda

✅ **Mantenibilidad:** Código modular y desacoplado

✅ **Seguridad:** JWT, RBAC, validación de datos, cookies seguras

✅ **Resiliencia:** Fallos aislados por servicio

✅ **Flexibilidad:** Fácil agregar nuevos servicios

### Próximos Pasos Recomendados:

1. Implementar OAuth 2.0 con Google/GitHub
2. Separar bases de datos físicamente por servicio
3. Implementar Event Bus (RabbitMQ/Kafka) para comunicación asíncrona
4. Agregar Rate Limiting por usuario
5. Implementar Circuit Breaker para resiliencia
6. Configurar API Gateway con Kong o NGINX
7. Implementar Service Mesh (Istio) para observabilidad

---

**Documento generado:** Enero 2026  
**Versión:** 1.0  
**Sistema:** Tutorías FIS - Arquitectura de Microservicios
