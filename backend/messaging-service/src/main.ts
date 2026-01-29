import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  });

  const port = process.env.PORT || 4003;
  await app.listen(port);

  console.log(`
╔══════════════════════════════════════════════╗
║                                              ║
║   💬 MESSAGING SERVICE - TutoriasFIS         ║
║                                              ║
║   🌐 Puerto: ${port}                          ║
║   📦 MongoDB: Conectado                      ║
║   💬 Chat & WebSockets                       ║
║                                              ║
╚══════════════════════════════════════════════╝
  `);
}
bootstrap();
