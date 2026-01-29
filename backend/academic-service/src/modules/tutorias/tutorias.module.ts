import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TutoriasController } from './tutorias.controller';
import { TutoriasService } from './tutorias.service';
import { Tutoria, TutoriaSchema } from './schemas/tutoria.schema';
import { Materia, MateriaSchema } from '../materias/schemas/materia.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tutoria.name, schema: TutoriaSchema },
      { name: Materia.name, schema: MateriaSchema },
    ]),
  ],
  controllers: [TutoriasController],
  providers: [TutoriasService],
  exports: [TutoriasService],
})
export class TutoriasModule {}
