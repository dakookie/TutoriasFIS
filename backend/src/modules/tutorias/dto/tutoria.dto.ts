import {
  IsNotEmpty,
  IsString,
  IsDateString,
  IsNumber,
  Min,
  Max,
  IsMongoId,
  IsOptional,
  IsEnum,
  IsUrl,
} from 'class-validator';
import { ModalidadAula } from '../schemas/tutoria.schema';

export class CreateTutoriaDto {
  @IsNotEmpty({ message: 'La materia es requerida' })
  @IsMongoId({ message: 'ID de materia no válido' })
  materia: string;

  @IsNotEmpty({ message: 'La fecha es requerida' })
  @IsDateString({}, { message: 'Fecha no válida' })
  fecha: string;

  @IsNotEmpty({ message: 'La hora de inicio es requerida' })
  @IsString()
  horaInicio: string;

  @IsNotEmpty({ message: 'La hora de fin es requerida' })
  @IsString()
  horaFin: string;

  @IsNotEmpty({ message: 'Los cupos son requeridos' })
  @IsNumber({}, { message: 'Los cupos deben ser un número' })
  @Min(1, { message: 'Debe haber al menos 1 cupo' })
  @Max(50, { message: 'No puede haber más de 50 cupos' })
  cuposOriginales: number;

  @IsOptional()
  @IsEnum(ModalidadAula, { message: 'Modalidad no válida' })
  modalidadAula?: ModalidadAula;

  @IsOptional()
  @IsString()
  nombreAula?: string;

  @IsOptional()
  @IsUrl({}, { message: 'URL no válida' })
  enlaceAula?: string;

  @IsOptional()
  @IsString()
  infoAdicionalAula?: string;
}

export class UpdateTutoriaDto {
  @IsOptional()
  @IsDateString({}, { message: 'Fecha no válida' })
  fecha?: string;

  @IsOptional()
  @IsString()
  horaInicio?: string;

  @IsOptional()
  @IsString()
  horaFin?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Los cupos deben ser un número' })
  @Min(1, { message: 'Debe haber al menos 1 cupo' })
  @Max(50, { message: 'No puede haber más de 50 cupos' })
  cuposOriginales?: number;

  @IsOptional()
  activa?: boolean;

  @IsOptional()
  publicada?: boolean;
}

export class ConfigurarAulaDto {
  @IsNotEmpty({ message: 'La modalidad es requerida' })
  @IsEnum(ModalidadAula, { message: 'Modalidad no válida' })
  modalidad: ModalidadAula;

  @IsNotEmpty({ message: 'El nombre del aula es requerido' })
  @IsString()
  nombreAula: string;

  @IsOptional()
  @IsUrl({}, { message: 'URL no válida' })
  enlaceAula?: string;

  @IsOptional()
  @IsString()
  infoAdicional?: string;
}

export class FiltrosTutoriaDto {
  @IsOptional()
  @IsMongoId()
  tutor?: string;

  @IsOptional()
  @IsMongoId()
  materia?: string;

  @IsOptional()
  @IsString()
  estado?: string;

  @IsOptional()
  @IsDateString()
  fecha?: string;

  @IsOptional()
  @IsEnum(ModalidadAula)
  modalidad?: ModalidadAula;
}
