import { IsString, IsNotEmpty, IsMongoId, IsObject, IsNumber, Min, Max } from 'class-validator';

export class CreatePreguntaDto {
  @IsString()
  @IsNotEmpty()
  pregunta: string;

  @IsMongoId()
  @IsNotEmpty()
  materia: string;
}

export class CreateRespuestaDto {
  @IsMongoId()
  @IsNotEmpty()
  tutoriaId: string;

  @IsObject()
  @IsNotEmpty()
  respuestas: Record<string, number>; // preguntaId: calificacion (1-5)
}
