import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  // Body parser con límite aumentado
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 4002;
  await app.listen(port);

  console.log(`
╔══════════════════════════════════════════════╗
║                                              ║
║   📚 ACADEMIC SERVICE - TutoriasFIS          ║
║                                              ║
║   🌐 Puerto: ${port}                          ║
║   📦 MongoDB: Conectado                      ║
║   📖 Materias, Tutorías, Solicitudes         ║
║                                              ║
╚══════════════════════════════════════════════╝
  `);
}
bootstrap();
