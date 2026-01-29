import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'El email o usuario es requerido' })
  @IsString()
  usuario: string;

  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;
}

export class ForgotPasswordDto {
  @IsNotEmpty({ message: 'El email es requerido' })
  @IsEmail({}, { message: 'Email no válido' })
  email: string;
}

export class ResetPasswordDto {
  @IsNotEmpty({ message: 'El token es requerido' })
  @IsString()
  token: string;

  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;
}
