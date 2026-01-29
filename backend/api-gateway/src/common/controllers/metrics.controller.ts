import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import * as promClient from 'prom-client';

@Controller()
export class MetricsController {
  private register: promClient.Registry;

  constructor() {
    this.register = promClient.register;
    
    // Habilitar métricas por defecto (CPU, memoria, etc.)
    promClient.collectDefaultMetrics({
      register: this.register,
      prefix: 'nodejs_',
      gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
    });
  }

  @Get('metrics')
  async getMetrics(@Res() res: Response) {
    res.set('Content-Type', this.register.contentType);
    const metrics = await this.register.metrics();
    res.send(metrics);
  }

  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      service: process.env.SERVICE_NAME || 'unknown-service',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }
}
