# Monitoreo y CI/CD - Sistema de Tutorías FIS

## Tabla de Contenidos
1. [Introducción](#introducción)
2. [Monitoreo con Prometheus y Grafana](#monitoreo-con-prometheus-y-grafana)
3. [CI/CD con GitHub Actions](#cicd-con-github-actions)
4. [Implementación y Configuración](#implementación-y-configuración)
5. [Mejores Prácticas](#mejores-prácticas)

---

## 1. Introducción

Este documento detalla la implementación de monitoreo, observabilidad y pipelines de CI/CD para el sistema de tutorías mediante:

- **Prometheus**: Recolección y almacenamiento de métricas
- **Grafana**: Visualización de métricas y dashboards
- **Node Exporter**: Métricas del sistema operativo
- **GitHub Actions**: Automatización de CI/CD

---

## 2. Monitoreo con Prometheus y Grafana

### 2.1 Arquitectura de Monitoreo

```
┌─────────────────────────────────────────────────────────────────┐
│                     MONITOREO Y OBSERVABILIDAD                   │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ API Gateway  │   │  Identity    │   │  Academic    │   │  Messaging   │
│  Port 4000   │   │   Service    │   │   Service    │   │   Service    │
│              │   │  Port 4001   │   │  Port 4002   │   │  Port 4003   │
│ /metrics     │   │  /metrics    │   │  /metrics    │   │  /metrics    │
└──────┬───────┘   └──────┬───────┘   └──────┬───────┘   └──────┬───────┘
       │                  │                  │                  │
       │                  │                  │                  │
       └──────────────────┴──────────────────┴──────────────────┘
                                  │
                            Scrape (15s)
                                  │
                                  ▼
                    ┌─────────────────────────────┐
                    │       PROMETHEUS            │
                    │       Port 9090             │
                    │                             │
                    │  • Time-series database     │
                    │  • Metrics storage          │
                    │  • Alerting rules           │
                    │  • PromQL queries           │
                    └─────────────┬───────────────┘
                                  │
                            Query API
                                  │
                                  ▼
                    ┌─────────────────────────────┐
                    │        GRAFANA              │
                    │        Port 3002            │
                    │                             │
                    │  • Dashboards               │
                    │  • Visualizations           │
                    │  • Alerting UI              │
                    │  • User: admin/admin        │
                    └─────────────────────────────┘

                    ┌─────────────────────────────┐
                    │     NODE EXPORTER           │
                    │     Port 9100               │
                    │                             │
                    │  • CPU metrics              │
                    │  • Memory metrics           │
                    │  • Disk I/O                 │
                    │  • Network stats            │
                    └─────────────────────────────┘
```

### 2.2 Métricas Recolectadas

#### Métricas de Aplicación

1. **HTTP Requests Total** (`http_requests_total`)
   - Contador total de requests HTTP
   - Labels: method, route, status, service
   - Uso: Calcular tasas de requests, errores

2. **HTTP Request Duration** (`http_request_duration_seconds`)
   - Histograma de tiempos de respuesta
   - Labels: method, route, status, service
   - Buckets: 0.1s, 0.3s, 0.5s, 0.7s, 1s, 3s, 5s, 7s, 10s
   - Uso: Calcular percentiles (p50, p95, p99)

3. **Active Connections** (`active_connections`)
   - Gauge de conexiones activas simultáneas
   - Labels: service
   - Uso: Monitorear carga del servidor

4. **Node.js Metrics** (automáticas con prom-client)
   - `nodejs_heap_size_total_bytes`: Tamaño total del heap
   - `nodejs_heap_size_used_bytes`: Heap utilizado
   - `nodejs_external_memory_bytes`: Memoria externa
   - `nodejs_gc_duration_seconds`: Duración de GC
   - `nodejs_eventloop_lag_seconds`: Lag del event loop

#### Métricas del Sistema (Node Exporter)

- **CPU**: Uso por core, tiempo idle, user, system
- **Memoria**: Total, disponible, buffers, cache
- **Disco**: Espacio utilizado, I/O read/write
- **Red**: Bytes recibidos/enviados, errores, drops

### 2.3 Implementación en NestJS

#### Middleware de Métricas

```typescript
// metrics.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import * as promClient from 'prom-client';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  private static httpRequestsTotal: promClient.Counter;
  private static httpRequestDuration: promClient.Histogram;

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = (Date.now() - start) / 1000;
      
      MetricsMiddleware.httpRequestsTotal.inc({
        method: req.method,
        route: this.normalizeRoute(req),
        status: res.statusCode.toString(),
        service: process.env.SERVICE_NAME
      });
      
      MetricsMiddleware.httpRequestDuration.observe({
        method: req.method,
        route: this.normalizeRoute(req),
        status: res.statusCode.toString(),
        service: process.env.SERVICE_NAME
      }, duration);
    });
    
    next();
  }
}
```

#### Controller de Métricas

```typescript
// metrics.controller.ts
@Controller()
export class MetricsController {
  @Get('metrics')
  async getMetrics(@Res() res: Response) {
    res.set('Content-Type', promClient.register.contentType);
    const metrics = await promClient.register.metrics();
    res.send(metrics);
  }

  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      service: process.env.SERVICE_NAME,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };
  }
}
```

### 2.4 Alertas Configuradas

#### 1. Service Down
```yaml
- alert: ServiceDown
  expr: up == 0
  for: 2m
  annotations:
    summary: "Service {{ $labels.job }} is down"
```

#### 2. High Error Rate
```yaml
- alert: HighErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
  for: 5m
  annotations:
    summary: "High error rate on {{ $labels.job }}"
```

#### 3. High Response Time
```yaml
- alert: HighResponseTime
  expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
  for: 5m
  annotations:
    summary: "High response time on {{ $labels.job }}"
```

### 2.5 Dashboards de Grafana

#### Dashboard: Services Overview

**Paneles incluidos:**

1. **Request Rate by Service**
   - Gráfico de líneas
   - Muestra requests/segundo por servicio
   - Query: `rate(http_requests_total[5m])`

2. **Services Status**
   - Gauge
   - Estado UP/DOWN de cada servicio
   - Query: `up`

3. **Response Time (p95 and p50)**
   - Gráfico de líneas
   - Percentiles 50 y 95 de tiempo de respuesta
   - Query: `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))`

4. **Error Rate**
   - Gráfico de barras
   - Tasa de errores 5xx por servicio
   - Query: `rate(http_requests_total{status=~"5.."}[5m])`

5. **Active Connections**
   - Gráfico de área
   - Conexiones activas por servicio
   - Query: `active_connections`

6. **Memory Usage**
   - Gráfico de líneas
   - Uso de memoria heap de Node.js
   - Query: `nodejs_heap_size_used_bytes`

7. **CPU Usage**
   - Gauge
   - Porcentaje de CPU utilizado
   - Query: `100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)`

---

## 3. CI/CD con GitHub Actions

### 3.1 Arquitectura de CI/CD

```
┌─────────────────────────────────────────────────────────────────┐
│                    GITHUB ACTIONS WORKFLOW                       │
└─────────────────────────────────────────────────────────────────┘

                          PUSH / PR
                              ↓
                    ┌──────────────────┐
                    │   LINT & FORMAT  │
                    │                  │
                    │  • ESLint        │
                    │  • Prettier      │
                    │  • TypeScript    │
                    └────────┬─────────┘
                             ↓
                    ┌──────────────────┐
                    │      TESTS       │
                    │                  │
                    │  • Unit Tests    │
                    │  • E2E Tests     │
                    │  • Coverage      │
                    └────────┬─────────┘
                             ↓
                    ┌──────────────────┐
                    │   BUILD IMAGES   │
                    │                  │
                    │  • Docker Build  │
                    │  • Multi-stage   │
                    │  • Layer Cache   │
                    └────────┬─────────┘
                             ↓
                    ┌──────────────────┐
                    │  SECURITY SCAN   │
                    │                  │
                    │  • Trivy         │
                    │  • npm audit     │
                    │  • SARIF Upload  │
                    └────────┬─────────┘
                             ↓
                    ┌──────────────────┐
                    │   PUSH TO GHCR   │
                    │                  │
                    │  • Tag: latest   │
                    │  • Tag: sha      │
                    │  • Tag: semver   │
                    └────────┬─────────┘
                             ↓
                    ┌──────────────────┐
                    │  DEPLOY STAGING  │
                    │                  │
                    │  • SSH Deploy    │
                    │  • Health Check  │
                    │  • Smoke Tests   │
                    └────────┬─────────┘
                             ↓
                    ┌──────────────────┐
                    │ DEPLOY PRODUCTION│
                    │                  │
                    │  • Backup DB     │
                    │  • Blue/Green    │
                    │  • Rollback      │
                    └──────────────────┘
```

### 3.2 Workflows Implementados

#### Workflow 1: CI (Continuous Integration)

**Archivo**: `.github/workflows/ci.yml`

**Triggers:**
- Push a `main` o `develop`
- Pull requests a `main` o `develop`

**Jobs:**

1. **Lint** (paralelo por servicio)
   - Ejecuta ESLint
   - Valida formato de código
   - Chequea tipos TypeScript

2. **Test** (paralelo por servicio)
   - Levanta MongoDB en service container
   - Ejecuta tests unitarios
   - Ejecuta tests E2E
   - Genera reporte de cobertura
   - Sube coverage a Codecov

3. **Build**
   - Construye imágenes Docker
   - Usa cache de GitHub Actions
   - Valida que la imagen funcione

4. **Security**
   - Escanea vulnerabilidades con Trivy
   - Ejecuta `npm audit`
   - Sube resultados a GitHub Security

5. **SonarCloud** (opcional)
   - Análisis estático de código
   - Code smells y bugs
   - Deuda técnica

#### Workflow 2: CD (Continuous Deployment)

**Archivo**: `.github/workflows/cd.yml`

**Triggers:**
- Push a `main`
- Tags con formato `v*.*.*`
- Manual dispatch

**Jobs:**

1. **Build and Push**
   - Construye imágenes optimizadas
   - Etiqueta con múltiples tags
   - Publica a GitHub Container Registry

2. **Deploy Staging**
   - Conecta por SSH al servidor staging
   - Actualiza código con `git pull`
   - Ejecuta `docker-compose pull`
   - Reinicia servicios
   - Health check post-deploy

3. **Deploy Production**
   - Requiere tag `v*` o aprobación manual
   - Crea backup de base de datos
   - Conecta por SSH a producción
   - Deploy con zero-downtime
   - Smoke tests automáticos
   - Rollback automático si falla

4. **Database Migrations**
   - Ejecuta migraciones después del deploy
   - Solo en producción
   - Transaccional y reversible

### 3.3 Secretos de GitHub

Secretos necesarios en el repositorio:

```
# SSH Keys
SSH_PRIVATE_KEY_STAGING
SSH_PRIVATE_KEY_PROD
SSH_USER
SSH_HOST_STAGING
SSH_HOST_PROD

# Database
MONGODB_URI_PROD

# Notifications
SLACK_WEBHOOK

# Code Quality
SONAR_TOKEN
CODECOV_TOKEN

# Container Registry
GITHUB_TOKEN (automático)
```

### 3.4 Configuración en package.json

```json
{
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:prod": "node dist/main",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  }
}
```

### 3.5 Docker Multi-Stage Optimizado

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Copy dependencies
COPY --from=builder /app/node_modules ./node_modules

# Copy built application
COPY --from=builder /app/dist ./dist

# Copy package.json
COPY --from=builder /app/package.json ./

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:${PORT}/health')"

# Run as non-root
USER node

# Expose port
EXPOSE ${PORT}

# Start application
CMD ["node", "dist/main"]
```

---

## 4. Implementación y Configuración

### 4.1 Instalación de Dependencias

```bash
# En cada servicio backend
cd backend/api-gateway
npm install prom-client

cd backend/identity-service
npm install prom-client

cd backend/academic-service
npm install prom-client

cd backend/messaging-service
npm install prom-client
```

### 4.2 Configuración en main.ts

```typescript
// main.ts - API Gateway
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MetricsMiddleware } from './common/middleware/metrics.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Aplicar middleware de métricas
  app.use(new MetricsMiddleware().use);
  
  // Configurar CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL,
    credentials: true
  });
  
  // Variables de entorno
  process.env.SERVICE_NAME = 'api-gateway';
  
  await app.listen(process.env.PORT || 4000);
  
  console.log(`
    ╔══════════════════════════════════════════════╗
    ║   📊 API Gateway - Metrics Enabled           ║
    ║   🚀 Port: ${process.env.PORT}             ║
    ║   📈 Metrics: /metrics                       ║
    ║   ❤️  Health: /health                         ║
    ╚══════════════════════════════════════════════╝
  `);
}
bootstrap();
```

### 4.3 Configuración en AppModule

```typescript
// app.module.ts
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { MetricsMiddleware } from './common/middleware/metrics.middleware';
import { MetricsController } from './common/controllers/metrics.controller';

@Module({
  imports: [...],
  controllers: [MetricsController, ...],
  providers: [...]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(MetricsMiddleware)
      .forRoutes('*');
  }
}
```

### 4.4 Levantar Stack Completo

```bash
# Levantar todos los servicios incluyendo Prometheus y Grafana
docker-compose up -d

# Ver logs
docker-compose logs -f prometheus
docker-compose logs -f grafana

# Acceder a las interfaces
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3002 (admin/admin)
# Node Exporter: http://localhost:9100/metrics
```

### 4.5 Configurar Grafana

1. **Acceder a Grafana**: http://localhost:3002
2. **Login**: admin / admin (cambiar en primer acceso)
3. **Datasource ya configurado**: Prometheus (automático via provisioning)
4. **Dashboard ya importado**: Services Overview (automático)

### 4.6 Queries PromQL Útiles

```promql
# Request rate total
sum(rate(http_requests_total[5m]))

# Request rate por servicio
sum(rate(http_requests_total[5m])) by (service)

# Error rate (%)
sum(rate(http_requests_total{status=~"5.."}[5m])) 
  / 
sum(rate(http_requests_total[5m])) * 100

# Response time p95
histogram_quantile(0.95, 
  sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service)
)

# Memory usage
nodejs_heap_size_used_bytes / nodejs_heap_size_total_bytes * 100

# Active connections
sum(active_connections) by (service)

# CPU usage
100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
```

---

## 5. Mejores Prácticas

### 5.1 Monitoreo

**✅ DO:**
- Monitorear métricas de negocio (tutorías creadas, solicitudes aceptadas)
- Establecer SLOs (Service Level Objectives) claros
- Crear dashboards específicos por equipo/rol
- Configurar alertas con niveles de severidad (critical, warning, info)
- Usar tags/labels consistentes en todas las métricas
- Documentar qué significa cada alerta
- Revisar y ajustar umbrales periódicamente

**❌ DON'T:**
- Crear alertas para todo (alert fatigue)
- Ignorar métricas del sistema operativo
- Olvidar ajustar retention de Prometheus
- Usar queries PromQL ineficientes en dashboards
- Mezclar métricas de desarrollo y producción

### 5.2 CI/CD

**✅ DO:**
- Ejecutar tests en paralelo para velocidad
- Usar cache de Docker y npm
- Implementar smoke tests post-deploy
- Crear backups antes de deploy a producción
- Usar feature flags para releases graduales
- Mantener logs de todos los deploys
- Documentar proceso de rollback

**❌ DON'T:**
- Deploy directo a producción sin staging
- Omitir tests por "urgencia"
- Usar credenciales hardcodeadas
- Deploy sin health checks
- Ignorar fallos de tests
- Deploy manual sin automatización

### 5.3 Seguridad

**✅ DO:**
- Escanear vulnerabilidades en cada build
- Rotar secretos periódicamente
- Usar secrets managers (GitHub Secrets, Vault)
- Limitar permisos de GitHub Actions al mínimo
- Firmar imágenes Docker
- Auditar accesos a sistemas de producción

**❌ DON'T:**
- Commitear secretos al repositorio
- Usar `latest` tag en producción
- Ejecutar contenedores como root
- Compartir credenciales entre ambientes
- Deshabilitar security scans

### 5.4 Performance

**✅ DO:**
- Usar multi-stage Dockerfiles
- Optimizar layers de Docker
- Implementar health checks
- Usar connection pooling para DB
- Configurar timeouts apropiados
- Monitorear memory leaks

**❌ DON'T:**
- Incluir node_modules en imagen final
- Copiar archivos innecesarios
- Usar imágenes base pesadas
- Ignorar resource limits
- Deploy sin profiling previo

---

## 6. Troubleshooting

### 6.1 Prometheus no scrapeando servicios

**Problema**: Métricas no aparecen en Prometheus

**Solución**:
```bash
# 1. Verificar que el endpoint /metrics responda
curl http://localhost:4000/metrics

# 2. Ver targets en Prometheus
# Ir a http://localhost:9090/targets

# 3. Revisar logs de Prometheus
docker logs prometheus

# 4. Verificar conectividad de red
docker network inspect tutorias-net
```

### 6.2 Grafana sin datos

**Problema**: Dashboards vacíos

**Solución**:
```bash
# 1. Verificar datasource configurado
# Grafana > Configuration > Data Sources

# 2. Probar query directamente
# Grafana > Explore > Ejecutar query simple: up

# 3. Verificar rango de tiempo
# Cambiar a "Last 5 minutes"

# 4. Ver logs de Grafana
docker logs grafana
```

### 6.3 GitHub Actions falla en tests

**Problema**: Tests pasan local pero fallan en CI

**Solución**:
```yaml
# Agregar más información en el workflow
- name: Run tests with debug
  run: npm run test -- --verbose --detectOpenHandles
  env:
    NODE_ENV: test
    DEBUG: '*'

# Verificar servicios
- name: Check MongoDB
  run: |
    docker ps
    mongosh --eval "db.adminCommand('ping')"
```

---

## 7. Métricas de Éxito

### KPIs de CI/CD

- **Build Time**: < 10 minutos
- **Test Coverage**: > 80%
- **Deployment Frequency**: Múltiples por día
- **Lead Time**: < 1 hora
- **Mean Time to Recovery (MTTR)**: < 30 minutos
- **Change Failure Rate**: < 15%

### SLOs del Sistema

- **Availability**: 99.9% uptime
- **Response Time (p95)**: < 500ms
- **Error Rate**: < 1%
- **Throughput**: > 100 req/s por servicio

---

## 8. Recursos Adicionales

### Documentación

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Tutorials](https://grafana.com/tutorials/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [prom-client](https://github.com/siimon/prom-client)

### Dashboards Recomendados

- [Node.js Application Dashboard](https://grafana.com/grafana/dashboards/11159)
- [Docker Container Dashboard](https://grafana.com/grafana/dashboards/179)
- [MongoDB Exporter Dashboard](https://grafana.com/grafana/dashboards/2583)

### Herramientas Complementarias

- **Loki**: Logs aggregation
- **Jaeger**: Distributed tracing
- **AlertManager**: Alert routing y grouping
- **Sentry**: Error tracking
- **Datadog**: APM completo (alternativa comercial)

---

**Documento generado**: Enero 2026  
**Versión**: 1.0  
**Sistema**: Tutorías FIS - Monitoreo y CI/CD
