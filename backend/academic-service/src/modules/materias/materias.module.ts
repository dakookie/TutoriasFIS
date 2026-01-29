import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Materia, MateriaSchema } from './schemas/materia.schema';
import { MateriasService } from './materias.service';
import { MateriasController } from './materias.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Materia.name, schema: MateriaSchema }]),
  ],
  controllers: [MateriasController],
  providers: [MateriasService],
  exports: [MateriasService, MongooseModule],
})
export class MateriasModule {}
