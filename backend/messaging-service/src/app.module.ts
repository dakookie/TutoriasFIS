import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

// Importar módulos (serán creados después)
import { MensajesModule } from './modules/mensajes/mensajes.module';
// import { ChatModule } from './modules/chat/chat.module';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { JwtStrategy } from './common/strategies/jwt.strategy';
import { MetricsController } from './common/controllers/metrics.controller';
import { MetricsMiddleware } from './common/middleware/metrics.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI') || 
             'mongodb://127.0.0.1:27017/tutorias_fis',
      }),
      inject: [ConfigService],
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'defaultsecret',
        signOptions: { expiresIn: 604800 },
      }),
      inject: [ConfigService],
    }),
    // Descomenta cuando crees los módulos:
    MensajesModule,
    // ChatModule,
  ],
  controllers: [MetricsController],
  providers: [
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MetricsMiddleware).forRoutes('*');
  }
}
