import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Tutoria, TutoriaSchema } from './schemas/tutoria.schema';
import { TutoriasService } from './tutorias.service';
import { TutoriasController } from './tutorias.controller';
import { Usuario, UsuarioSchema } from '../usuarios/schemas/usuario.schema';
import { Materia, MateriaSchema } from '../materias/schemas/materia.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tutoria.name, schema: TutoriaSchema },
      { name: Usuario.name, schema: UsuarioSchema },
      { name: Materia.name, schema: MateriaSchema },
    ]),
  ],
  controllers: [TutoriasController],
  providers: [TutoriasService],
  exports: [TutoriasService, MongooseModule],
})
export class TutoriasModule {}
