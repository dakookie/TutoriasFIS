import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AulaController } from './aula.controller';
import { AulaService } from './aula.service';
import { Publicacion, PublicacionSchema } from './schemas/publicacion.schema';
import { Bibliografia, BibliografiaSchema } from './schemas/bibliografia.schema';
import { Tutoria, TutoriaSchema } from '../tutorias/schemas/tutoria.schema';
import { Solicitud, SolicitudSchema } from '../solicitudes/schemas/solicitud.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Publicacion.name, schema: PublicacionSchema },
      { name: Bibliografia.name, schema: BibliografiaSchema },
      { name: Tutoria.name, schema: TutoriaSchema },
      { name: Solicitud.name, schema: SolicitudSchema },
    ]),
  ],
  controllers: [AulaController],
  providers: [AulaService],
  exports: [AulaService],
})
export class AulaModule {}
