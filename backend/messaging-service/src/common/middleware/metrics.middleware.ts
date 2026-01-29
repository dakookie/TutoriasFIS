import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as promClient from 'prom-client';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  private static httpRequestsTotal: promClient.Counter;
  private static httpRequestDuration: promClient.Histogram;
  private static activeConnections: promClient.Gauge;

  constructor() {
    if (!MetricsMiddleware.httpRequestsTotal) {
      // Contador de requests HTTP
      MetricsMiddleware.httpRequestsTotal = new promClient.Counter({
        name: 'http_requests_total',
        help: 'Total de requests HTTP',
        labelNames: ['method', 'route', 'status', 'service'],
      });

      // Histograma de duración de requests
      MetricsMiddleware.httpRequestDuration = new promClient.Histogram({
        name: 'http_request_duration_seconds',
        help: 'Duración de requests HTTP en segundos',
        labelNames: ['method', 'route', 'status', 'service'],
        buckets: [0.1, 0.3, 0.5, 0.7, 10],
      });

      // Gauge de conexiones activas
      MetricsMiddleware.activeConnections = new promClient.Gauge({
        name: 'active_connections',
        help: 'Número de conexiones activas',
        labelNames: ['service'],
      });
    }
  }

  use(req: Request, res: Response, next: NextFunction) {
    const serviceName = process.env.SERVICE_NAME || 'unknown-service';
    const start = Date.now();

    // Incrementar conexiones activas
    MetricsMiddleware.activeConnections.inc({ service: serviceName });

    // Guardar el método write original
    const originalWrite = res.write;
    const originalEnd = res.end;

    // Capturar cuando la respuesta se completa
    res.on('finish', () => {
      const duration = (Date.now() - start) / 1000;
      const route = this.getRoute(req);
      const status = res.statusCode.toString();

      // Registrar métricas
      MetricsMiddleware.httpRequestsTotal.inc({
        method: req.method,
        route,
        status,
        service: serviceName,
      });

      MetricsMiddleware.httpRequestDuration.observe(
        {
          method: req.method,
          route,
          status,
          service: serviceName,
        },
        duration,
      );

      // Decrementar conexiones activas
      MetricsMiddleware.activeConnections.dec({ service: serviceName });
    });

    next();
  }

  private getRoute(req: Request): string {
    // Normalizar la ruta para agrupar endpoints con parámetros
    let route = req.route?.path || req.path;
    
    // Reemplazar UUIDs y ObjectIds con :id
    route = route.replace(/[0-9a-f]{24}/gi, ':id');
    route = route.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id');
    
    return route;
  }
}
