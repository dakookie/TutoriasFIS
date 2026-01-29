import { IsNotEmpty, IsString, IsMongoId, MaxLength } from 'class-validator';

export class EnviarMensajeDto {
  @IsNotEmpty()
  @IsMongoId()
  tutoriaId: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(1000)
  contenido: string;
}
