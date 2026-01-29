import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false, // Desactivar para usar configuración personalizada
  });

  // Body parser con límite aumentado para PDFs
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));

  // Cookie parser
  app.use(cookieParser());

  // Validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false, // Cambiar a false para no rechazar propiedades extra
      transform: true,
      skipMissingProperties: true, // Permitir requests sin body
    }),
  );

  const port = process.env.PORT || 4001;
  await app.listen(port);

  console.log(`
╔══════════════════════════════════════════════╗
║                                              ║
║   🔐 IDENTITY SERVICE - TutoriasFIS          ║
║                                              ║
║   🌐 Puerto: ${port}                          ║
║   📦 MongoDB: Conectado                      ║
║   🔑 Auth & Usuarios                         ║
║                                              ║
╚══════════════════════════════════════════════╝
  `);
}
bootstrap();
