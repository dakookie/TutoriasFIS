import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';

async function bootstrap() {
  // Desactivar body parser de NestJS para usar el de Express con límite personalizado
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  });

  // Body parser con límite aumentado (debe ir antes de cualquier ruta)
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));

  // Cookie parser
  app.use(cookieParser());

  // Prefijo global 'api' excepto para métricas y health
  app.setGlobalPrefix('api', {
    exclude: ['/metrics', '/health'],
  });

  const port = process.env.PORT || 4000;
  await app.listen(port);

  console.log(`
╔══════════════════════════════════════════════╗
║                                              ║
║   🚀 API GATEWAY - TutoriasFIS               ║
║                                              ║
║   🌐 Puerto: ${port}                          ║
║   📡 Enrutando a microservicios              ║
║                                              ║
╚══════════════════════════════════════════════╝
  `);
}
bootstrap();
