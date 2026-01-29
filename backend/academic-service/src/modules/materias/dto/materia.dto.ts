import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class CreateMateriaDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  nombre: string;

  @IsString()
  @IsNotEmpty({ message: 'El código es requerido' })
  codigo: string;

  @IsNumber()
  @Min(1)
  @Max(10)
  semestre: number;
}

export class UpdateMateriaDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  codigo?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(10)
  semestre?: number;

  @IsOptional()
  activa?: boolean;
}
