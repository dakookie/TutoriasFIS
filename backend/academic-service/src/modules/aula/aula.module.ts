import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AulaController } from './aula.controller';
import { AulaService } from './aula.service';
import { Bibliografia, BibliografiaSchema } from './schemas/bibliografia.schema';
import { Publicacion, PublicacionSchema } from './schemas/publicacion.schema';
import { Tutoria, TutoriaSchema } from '../tutorias/schemas/tutoria.schema';
import { Solicitud, SolicitudSchema } from '../solicitudes/schemas/solicitud.schema';
import { TutoriasModule } from '../tutorias/tutorias.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Bibliografia.name, schema: BibliografiaSchema },
      { name: Publicacion.name, schema: PublicacionSchema },
      { name: Tutoria.name, schema: TutoriaSchema },
      { name: Solicitud.name, schema: SolicitudSchema },
    ]),
    forwardRef(() => TutoriasModule),
  ],
  controllers: [AulaController],
  providers: [AulaService],
  exports: [AulaService],
})
export class AulaModule {}
