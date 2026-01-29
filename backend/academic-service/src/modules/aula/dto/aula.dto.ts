import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsMongoId } from 'class-validator';

export class CrearBibliografiaDto {
  @IsOptional()
  @IsMongoId()
  tutoria?: string;

  @IsNotEmpty()
  @IsString()
  titulo: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  tipo?: string;

  @IsOptional()
  @IsString()
  tipoArchivo?: string; // Alias para tipo

  @IsOptional()
  @IsString()
  url?: string;

  @IsNotEmpty()
  @IsString()
  archivo: string;
}

export class CrearPublicacionDto {
  @IsOptional()
  @IsMongoId()
  tutoria?: string;

  @IsNotEmpty()
  @IsString()
  titulo: string;

  @IsNotEmpty()
  @IsString()
  contenido: string;

  @IsOptional()
  @IsString()
  imagen?: string; // Alias para archivo

  @IsOptional()
  @IsString()
  tipoImagen?: string;

  @IsOptional()
  @IsString()
  archivo?: string;

  @IsOptional()
  @IsBoolean()
  destacada?: boolean;
}
