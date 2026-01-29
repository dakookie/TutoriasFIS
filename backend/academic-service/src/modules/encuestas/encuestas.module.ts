import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EncuestasController } from './encuestas.controller';
import { EncuestasService } from './encuestas.service';
import { Pregunta, PreguntaSchema } from './schemas/pregunta.schema';
import { Respuesta, RespuestaSchema } from './schemas/respuesta.schema';
import { Materia, MateriaSchema } from '../materias/schemas/materia.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Pregunta.name, schema: PreguntaSchema },
      { name: Respuesta.name, schema: RespuestaSchema },
      { name: Materia.name, schema: MateriaSchema },
    ]),
  ],
  controllers: [EncuestasController],
  providers: [EncuestasService],
  exports: [EncuestasService],
})
export class EncuestasModule {}
