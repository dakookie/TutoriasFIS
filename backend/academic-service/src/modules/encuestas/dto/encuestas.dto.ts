import { IsNotEmpty, IsString, IsMongoId } from 'class-validator';

export class CrearPreguntaDto {
  @IsNotEmpty()
  @IsString()
  pregunta: string;

  @IsNotEmpty()
  @IsMongoId()
  materia: string;
}

export class CrearRespuestaDto {
  @IsNotEmpty()
  @IsMongoId()
  tutoriaId: string;

  @IsNotEmpty()
  respuestas: {
    pregunta: string;
    calificacion: number;
    comentario?: string;
  }[];
}
