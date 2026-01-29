import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

// Módulos de la aplicación
import { MateriasModule } from './modules/materias/materias.module';
import { TutoriasModule } from './modules/tutorias/tutorias.module';
import { SolicitudesModule } from './modules/solicitudes/solicitudes.module';
import { EncuestasModule } from './modules/encuestas/encuestas.module';
import { AulaModule } from './modules/aula/aula.module';

// Guards y estrategias para autenticación
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
    MateriasModule,
    TutoriasModule,
    SolicitudesModule,
    EncuestasModule,
    AulaModule,
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
