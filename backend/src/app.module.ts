import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_GUARD } from '@nestjs/core';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

// Modules - Updated with AulaModule for virtual classroom functionality
import { AuthModule } from './modules/auth/auth.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { MateriasModule } from './modules/materias/materias.module';
import { TutoriasModule } from './modules/tutorias/tutorias.module';
import { SolicitudesModule } from './modules/solicitudes/solicitudes.module';
import { MensajesModule } from './modules/mensajes/mensajes.module';
import { AulaModule } from './modules/aula/aula.module';
import { EncuestasModule } from './modules/encuestas/encuestas.module';

// Guards
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Module({
  imports: [
    // Configuración global
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Conexión a MongoDB
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI') || 
             'mongodb://127.0.0.1:27017/tutorias_fis',
      }),
      inject: [ConfigService],
    }),

    PrometheusModule.register({
      path: '/metrics', // Endpoint que leerá Prometheus
    }),

    // Módulos de la aplicación
    AuthModule,
    UsuariosModule,
    MateriasModule,
    TutoriasModule,
    SolicitudesModule,
    MensajesModule,
    AulaModule,
    EncuestasModule,
  ],
  controllers: [],
  providers: [
    // Guard global de autenticación JWT
    // Las rutas públicas deben usar el decorador @Public()
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
