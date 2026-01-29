import { IsNotEmpty, IsMongoId, IsOptional } from 'class-validator';

export class CrearSolicitudDto {
  @IsOptional()
  @IsMongoId()
  tutoriaId?: string;

  @IsOptional()
  @IsMongoId()
  tutoria?: string;
}
