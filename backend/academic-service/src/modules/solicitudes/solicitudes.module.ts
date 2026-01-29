import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SolicitudesController } from './solicitudes.controller';
import { SolicitudesService } from './solicitudes.service';
import { Solicitud, SolicitudSchema } from './schemas/solicitud.schema';
import { Tutoria, TutoriaSchema } from '../tutorias/schemas/tutoria.schema';
import { TutoriasModule } from '../tutorias/tutorias.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Solicitud.name, schema: SolicitudSchema },
      { name: Tutoria.name, schema: TutoriaSchema },
    ]),
    forwardRef(() => TutoriasModule),
  ],
  controllers: [SolicitudesController],
  providers: [SolicitudesService],
  exports: [SolicitudesService],
})
export class SolicitudesModule {}
