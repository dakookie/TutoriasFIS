import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Solicitud, SolicitudSchema } from './schemas/solicitud.schema';
import { Usuario, UsuarioSchema } from '../usuarios/schemas/usuario.schema';
import { SolicitudesService } from './solicitudes.service';
import { SolicitudesController } from './solicitudes.controller';
import { TutoriasModule } from '../tutorias/tutorias.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Solicitud.name, schema: SolicitudSchema },
      { name: Usuario.name, schema: UsuarioSchema },
    ]),
    TutoriasModule,
  ],
  controllers: [SolicitudesController],
  providers: [SolicitudesService],
  exports: [SolicitudesService],
})
export class SolicitudesModule {}
