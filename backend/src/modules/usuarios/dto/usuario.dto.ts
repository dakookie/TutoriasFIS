import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  Matches,
  IsArray,
  IsMongoId,
} from 'class-validator';
import { Rol } from '../schemas/usuario.schema';

export class CreateUsuarioDto {
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @IsString()
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, {
    message: 'El nombre solo debe contener letras',
  })
  nombre: string;

  @IsNotEmpty({ message: 'El apellido es requerido' })
  @IsString()
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, {
    message: 'El apellido solo debe contener letras',
  })
  apellido: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'El usuario solo puede contener letras, números y guión bajo',
  })
  username?: string;

  @IsNotEmpty({ message: 'El email es requerido' })
  @IsEmail({}, { message: 'Email no válido' })
  email: string;

  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @IsNotEmpty({ message: 'El rol es requerido' })
  @IsEnum(Rol, { message: 'Rol no válido' })
  rol: Rol;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  materias?: string[];

  @IsOptional()
  @IsString()
  pdf?: string;
}

export class UpdateUsuarioDto {
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, {
    message: 'El nombre solo debe contener letras',
  })
  nombre?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, {
    message: 'El apellido solo debe contener letras',
  })
  apellido?: string;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  materias?: string[];

  @IsOptional()
  activo?: boolean;

  @IsOptional()
  @IsEmail({}, { message: 'Email no válido' })
  email?: string;

  @IsOptional()
  @IsEnum(Rol, { message: 'Rol no válido' })
  rol?: Rol;
}
