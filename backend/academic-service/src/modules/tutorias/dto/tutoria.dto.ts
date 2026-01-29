import { IsNotEmpty, IsString, IsDateString, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';

export class CrearTutoriaDto {
  @IsNotEmpty()
  @IsString()
  materia: string;

  @IsNotEmpty()
  @IsDateString()
  fecha: string;

  @IsNotEmpty()
  @IsString()
  horaInicio: string;

  @IsNotEmpty()
  @IsString()
  horaFin: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  cuposOriginales: number;

  @IsOptional()
  @IsEnum(['Presencial', 'Virtual'])
  modalidadAula?: string;

  @IsOptional()
  @IsString()
  nombreAula?: string;

  @IsOptional()
  @IsString()
  enlaceAula?: string;
}

export class ConfigurarAulaDto {
  @IsNotEmpty()
  @IsEnum(['Presencial', 'Virtual'])
  modalidadAula: string;

  @IsOptional()
  @IsString()
  nombreAula?: string;

  @IsOptional()
  @IsString()
  enlaceReunion?: string;
}

export class ActualizarTutoriaDto {
  @IsOptional()
  @IsString()
  materia?: string;

  @IsOptional()
  @IsDateString()
  fecha?: string;

  @IsOptional()
  @IsString()
  horaInicio?: string;

  @IsOptional()
  @IsString()
  horaFin?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  cuposOriginales?: number;

  @IsOptional()
  @IsEnum(['Presencial', 'Virtual'])
  modalidadAula?: string;

  @IsOptional()
  @IsString()
  nombreAula?: string;

  @IsOptional()
  @IsString()
  enlaceAula?: string;
}
