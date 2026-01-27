import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUrl } from 'class-validator';

export enum ModalidadAula {
  PRESENCIAL = 'Presencial',
  VIRTUAL = 'Virtual',
}

// DTOs para configuración del aula
export class ConfigurarAulaDto {
  @IsNotEmpty({ message: 'La modalidad es requerida' })
  @IsEnum(ModalidadAula, { message: 'Modalidad inválida' })
  modalidadAula: ModalidadAula;

  @IsOptional()
  @IsString()
  nombreAula?: string;

  @IsOptional()
  @IsString()
  enlaceReunion?: string;
}

// DTOs para publicaciones
export class CreatePublicacionDto {
  @IsNotEmpty({ message: 'El título es requerido' })
  @IsString()
  titulo: string;

  @IsNotEmpty({ message: 'El contenido es requerido' })
  @IsString()
  contenido: string;

  @IsOptional()
  @IsString()
  imagen?: string;

  @IsOptional()
  @IsString()
  tipoImagen?: string;
}

export class UpdatePublicacionDto {
  @IsNotEmpty({ message: 'El título es requerido' })
  @IsString()
  titulo: string;

  @IsNotEmpty({ message: 'El contenido es requerido' })
  @IsString()
  contenido: string;

  @IsOptional()
  @IsString()
  imagen?: string;

  @IsOptional()
  @IsString()
  tipoImagen?: string;
}

// DTOs para bibliografía
export class CreateBibliografiaDto {
  @IsNotEmpty({ message: 'El título es requerido' })
  @IsString()
  titulo: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsNotEmpty({ message: 'El archivo es requerido' })
  @IsString()
  archivo: string;

  @IsNotEmpty({ message: 'El tipo de archivo es requerido' })
  @IsString()
  tipoArchivo: string;
}

export class UpdateBibliografiaDto {
  @IsNotEmpty({ message: 'El título es requerido' })
  @IsString()
  titulo: string;
}
