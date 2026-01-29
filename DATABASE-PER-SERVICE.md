# Database per Microservice - Implementación

## ✅ Patrón Implementado

Se ha implementado exitosamente el patrón **"Database per Microservice"**, donde cada microservicio tiene su propia base de datos independiente.

## 📊 Arquitectura de Bases de Datos

### Antes (Anti-patrón)
```
┌─────────────────┐
│  MongoDB        │
│                 │
│  tutorias_fis   │◄──── Identity Service
│                 │◄──── Academic Service
│                 │◄──── Messaging Service
└─────────────────┘
```

### Después (Correcto)
```
┌─────────────────┐
│  MongoDB        │
│                 │
│  identity_db    │◄──── Identity Service
│  academic_db    │◄──── Academic Service  
│  messaging_db   │◄──── Messaging Service
└─────────────────┘
```

## 🗄️ Distribución de Datos

### Identity DB (`identity_db`)
**Propietario**: Identity Service (puerto 4001)
- **Colecciones**:
  - `usuarios` - Información de usuarios, autenticación, roles

### Academic DB (`academic_db`)
**Propietario**: Academic Service (puerto 4002)
- **Colecciones**:
  - `materias` - Catálogo de materias
  - `tutorias` - Tutorías disponibles
  - `solicitudes` - Solicitudes de estudiantes
  - `bibliografias` - Referencias bibliográficas
  - `preguntas` - Preguntas de encuestas
  - `respuestas` - Respuestas de estudiantes
  - `publicaciones` - Publicaciones académicas

### Messaging DB (`messaging_db`)
**Propietario**: Messaging Service (puerto 4003)
- **Colecciones**:
  - `mensajes` - Mensajes del chat en tiempo real

## 🔒 Principios de Aislamiento

### ✅ Acceso Permitido
Cada servicio **SOLO** puede acceder a su propia base de datos:
- Identity Service → `identity_db`
- Academic Service → `academic_db`
- Messaging Service → `messaging_db`

### ❌ Acceso Prohibido
- **NO** hay acceso directo entre bases de datos
- **NO** hay queries cross-database
- **NO** hay foreign keys entre servicios

## 🔄 Comunicación Entre Servicios

Los servicios se comunican **exclusivamente** a través de APIs REST:

```typescript
// ✅ CORRECTO - Messaging Service obtiene datos de Academic via API
const tutoriaResponse = await axios.get(
  `${this.academicServiceUrl}/tutorias/${tutoriaId}`,
  { headers }
);

// ❌ INCORRECTO - Acceso directo a otra base de datos (NO HACER)
const tutoria = await this.tutoriaModel.findById(tutoriaId);
```

## 📋 Migración Realizada

### Script de Migración
```javascript
// scripts/migrate-databases.js
// Migra datos de tutorias_fis → identity_db, academic_db, messaging_db
```

### Resultados de la Migración
- ✓ 13 usuarios → identity_db
- ✓ 14 materias → academic_db
- ✓ 4 tutorías → academic_db
- ✓ 28 preguntas → academic_db
- ✓ 3 mensajes → messaging_db

## 🚀 Configuración (docker-compose.yml)

```yaml
identity-service:
  environment:
    - MONGODB_URI=mongodb://mongodb:27017/identity_db
    
academic-service:
  environment:
    - MONGODB_URI=mongodb://mongodb:27017/academic_db
    
messaging-service:
  environment:
    - MONGODB_URI=mongodb://mongodb:27017/messaging_db
```

## 🎯 Beneficios Obtenidos

1. **Independencia**: Cada servicio es independiente
2. **Escalabilidad**: Se puede escalar cada BD por separado
3. **Aislamiento**: Cambios en un esquema no afectan otros servicios
4. **Despliegue**: Servicios se pueden desplegar independientemente
5. **Tecnología**: Cada servicio podría usar diferente motor de BD en el futuro

## ⚠️ Consideraciones

### Consistencia Eventual
- No hay transacciones ACID entre servicios
- Se implementa consistencia eventual via eventos (si es necesario)

### Datos Duplicados
- Algunos datos pueden estar duplicados (ej: nombre de usuario)
- Esto es normal y aceptable en microservicios

### Comunicación
- La comunicación entre servicios es via HTTP/REST
- En producción considerar: Circuit Breaker, Retry, Timeout

## 🔍 Verificación

```bash
# Ver bases de datos
docker exec tutorias_db mongosh --eval "show dbs"

# Verificar configuración
docker exec identity_service printenv MONGODB_URI
docker exec academic_service printenv MONGODB_URI  
docker exec messaging_service printenv MONGODB_URI

# Contar documentos
docker exec tutorias_db mongosh --eval "
  db.getSiblingDB('identity_db').usuarios.countDocuments();
  db.getSiblingDB('academic_db').tutorias.countDocuments();
  db.getSiblingDB('messaging_db').mensajes.countDocuments();
"
```

## 📚 Referencias

- [Microservices Patterns - Database per Service](https://microservices.io/patterns/data/database-per-service.html)
- [Martin Fowler - Microservices](https://martinfowler.com/articles/microservices.html)
