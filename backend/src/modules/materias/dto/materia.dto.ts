import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateMateriaDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  nombre: string;

  @IsString()
  @IsOptional()
  descripcion?: string;
}

export class UpdateMateriaDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
