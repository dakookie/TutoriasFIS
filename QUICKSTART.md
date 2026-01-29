# 🚀 Quick Start - Monitoreo y CI/CD

## Levantar Sistema Completo con Monitoreo

```bash
# 1. Clonar repositorio
git clone https://github.com/tu-usuario/TutoriasFIS.git
cd TutoriasFIS

# 2. Levantar todos los servicios (incluye Prometheus y Grafana)
docker-compose up -d

# 3. Verificar que todos los servicios estén UP
docker-compose ps

# 4. Esperar ~30 segundos para que los servicios inicien
```

## 🎯 Acceso a Servicios

| Servicio | URL | Credenciales |
|----------|-----|--------------|
| **Frontend** | http://localhost:3001 | - |
| **API Gateway** | http://localhost:4000 | - |
| **Prometheus** | http://localhost:9090 | - |
| **Grafana** | http://localhost:3002 | admin/admin |
| **Node Exporter** | http://localhost:9100/metrics | - |

## 📊 Endpoints de Métricas

```bash
# API Gateway
curl http://localhost:4000/metrics
curl http://localhost:4000/health

# Identity Service
curl http://localhost:4001/metrics
curl http://localhost:4001/health

# Academic Service
curl http://localhost:4002/metrics
curl http://localhost:4002/health

# Messaging Service
curl http://localhost:4003/metrics
curl http://localhost:4003/health
```

## 🔍 Grafana Dashboards

1. Acceder a http://localhost:3002
2. Login: `admin` / `admin`
3. Dashboard pre-configurado: **Services Overview**
   - Request Rate
   - Services Status
   - Response Times (p50, p95)
   - Error Rates
   - Active Connections
   - Memory Usage
   - CPU Usage

## 📈 Prometheus Queries

Acceder a http://localhost:9090 y ejecutar:

```promql
# Request rate total
sum(rate(http_requests_total[5m]))

# Request rate por servicio
sum(rate(http_requests_total[5m])) by (service)

# Error rate
sum(rate(http_requests_total{status=~"5.."}[5m])) 
  / sum(rate(http_requests_total[5m])) * 100

# Response time p95
histogram_quantile(0.95, 
  sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service)
)
```

## 🔧 CI/CD con GitHub Actions

### Configuración Inicial

1. **Fork el repositorio**
2. **Configurar Secrets en GitHub**:
   ```
   Settings > Secrets and variables > Actions > New repository secret
   ```

   Secretos necesarios:
   - `SSH_PRIVATE_KEY_STAGING`
   - `SSH_PRIVATE_KEY_PROD`
   - `SSH_USER`
   - `SSH_HOST_STAGING`
   - `SSH_HOST_PROD`
   - `MONGODB_URI_PROD`
   - `SLACK_WEBHOOK` (opcional)
   - `SONAR_TOKEN` (opcional)

### Workflows Disponibles

#### CI - Build and Test
- **Trigger**: Push/PR a main/develop
- **Jobs**:
  - ✅ Lint código
  - ✅ Run tests
  - ✅ Build Docker images
  - ✅ Security scan
  - ✅ SonarCloud analysis

#### CD - Deploy to Production
- **Trigger**: Push a main, tags v*.*.*, manual
- **Jobs**:
  - 📦 Build and push images to GHCR
  - 🚀 Deploy to staging
  - 🚀 Deploy to production
  - 📊 Database migrations

### Comandos Útiles

```bash
# Ejecutar tests localmente
cd backend/api-gateway
npm test
npm run test:e2e

# Build imagen Docker
docker build -t tutoriasfis-api-gateway:local .

# Lint código
npm run lint

# Ver workflows en GitHub
# https://github.com/tu-usuario/TutoriasFIS/actions
```

## 📝 Desarrollo

### Agregar Nuevas Métricas

```typescript
// En tu servicio
import * as promClient from 'prom-client';

// Crear métrica personalizada
const customCounter = new promClient.Counter({
  name: 'tutorias_created_total',
  help: 'Total de tutorías creadas',
  labelNames: ['materia', 'tutor']
});

// Incrementar
customCounter.inc({ materia: 'Bases de Datos', tutor: 'Juan' });
```

### Crear Nueva Alerta

```yaml
# monitoring/alerts.yml
- alert: TutoriaCreationRate
  expr: rate(tutorias_created_total[5m]) > 10
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Alta tasa de creación de tutorías"
```

## 🐛 Troubleshooting

### Prometheus no muestra métricas

```bash
# 1. Verificar endpoints
curl http://localhost:4000/metrics

# 2. Ver targets en Prometheus
# http://localhost:9090/targets

# 3. Revisar logs
docker logs prometheus
docker logs api_gateway
```

### Grafana sin datos

```bash
# 1. Verificar datasource
# Grafana > Configuration > Data Sources > Prometheus

# 2. Probar query simple
# Grafana > Explore > Ejecutar: up

# 3. Ver logs
docker logs grafana
```

### CI/CD falla

```bash
# 1. Ver logs del workflow
# GitHub > Actions > Click en el workflow fallido

# 2. Re-ejecutar workflow
# Click en "Re-run all jobs"

# 3. Verificar secrets configurados
# Settings > Secrets and variables > Actions
```

## 📚 Documentación Completa

- [Arquitectura de Microservicios](./ARQUITECTURA_MICROSERVICIOS.md)
- [Monitoreo y CI/CD](./MONITORING_CICD.md)
- [README Principal](./README.md)

## 🛠️ Stack Tecnológico

### Backend
- NestJS 10
- TypeScript
- MongoDB + Mongoose
- Socket.IO
- JWT + bcrypt
- prom-client (métricas)

### Frontend
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS

### DevOps
- Docker + Docker Compose
- Prometheus (métricas)
- Grafana (visualización)
- Node Exporter (métricas del sistema)
- GitHub Actions (CI/CD)
- GitHub Container Registry

## 📊 Arquitectura

```
Frontend (3001) → API Gateway (4000) → Identity Service (4001)
                                     → Academic Service (4002)
                                     → Messaging Service (4003)
                                     ↓
                                  MongoDB (27017)
                                     ↓
                               Prometheus (9090)
                                     ↓
                                Grafana (3002)
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crear branch (`git checkout -b feature/amazing-feature`)
3. Commit cambios (`git commit -m 'Add amazing feature'`)
4. Push al branch (`git push origin feature/amazing-feature`)
5. Abrir Pull Request

Los workflows de CI se ejecutarán automáticamente.

## 📄 Licencia

Este proyecto es académico para la Escuela Politécnica Nacional.

---

**Desarrollado con ❤️ por el equipo de Tutorías FIS**
