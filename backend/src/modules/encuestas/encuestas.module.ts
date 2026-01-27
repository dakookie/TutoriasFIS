import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EncuestasController } from './encuestas.controller';
import { EncuestasService } from './encuestas.service';
import { Pregunta, PreguntaSchema } from './schemas/pregunta.schema';
import { Respuesta, RespuestaSchema } from './schemas/respuesta.schema';
import { MateriasModule } from '../materias/materias.module';
import { SolicitudesModule } from '../solicitudes/solicitudes.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Pregunta.name, schema: PreguntaSchema },
      { name: Respuesta.name, schema: RespuestaSchema },
    ]),
    MateriasModule,
    forwardRef(() => SolicitudesModule),
    AuthModule,
  ],
  controllers: [EncuestasController],
  providers: [EncuestasService],
  exports: [EncuestasService],
})
export class EncuestasModule {}
