import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { Usuario, UsuarioDocument } from '../usuarios/schemas/usuario.schema';
import { LoginDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';
import { CreateUsuarioDto } from '../usuarios/dto/usuario.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Usuario.name) private usuarioModel: Model<UsuarioDocument>,
    private jwtService: JwtService,
  ) {}

  async registro(createUsuarioDto: CreateUsuarioDto) {
    const { email, username } = createUsuarioDto;

    const existeEmail = await this.usuarioModel.findOne({ email });
    if (existeEmail) {
      throw new BadRequestException('El email ya está registrado');
    }

    if (username) {
      const existeUsername = await this.usuarioModel.findOne({ username });
      if (existeUsername) {
        throw new BadRequestException('El nombre de usuario ya está en uso');
      }
    }

    const usuario = new this.usuarioModel({
      ...createUsuarioDto,
      activo: false,
    });

    await usuario.save();

    return {
      success: true,
      message: 'Registro exitoso. Tu cuenta será revisada por un administrador.',
    };
  }

  async login(loginDto: LoginDto) {
    const { usuario: identificador, password } = loginDto;

    const usuario = await this.usuarioModel.findOne({
      $or: [{ email: identificador.toLowerCase() }, { username: identificador }],
    });

    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordValida = await bcrypt.compare(password, usuario.password);
    if (!passwordValida) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!usuario.activo) {
      throw new UnauthorizedException(
        'Tu cuenta aún no ha sido activada por un administrador',
      );
    }

    const payload = {
      userId: usuario._id,
      email: usuario.email,
      rol: usuario.rol,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
    };

    const token = this.jwtService.sign(payload);

    return {
      success: true,
      token,
      usuario: {
        userId: usuario._id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        rol: usuario.rol,
        materias: usuario.materias,
      },
    };
  }

  async verificarToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      const usuario = await this.usuarioModel
        .findById(payload.userId)
        .select('-password');

      if (!usuario || !usuario.activo) {
        throw new UnauthorizedException('Token inválido');
      }

      return {
        success: true,
        usuario: {
          userId: usuario._id,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          email: usuario.email,
          rol: usuario.rol,
          materias: usuario.materias,
        },
      };
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;
    const usuario = await this.usuarioModel.findOne({ email });

    if (!usuario) {
      return {
        success: true,
        message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña',
      };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    usuario.resetPasswordToken = resetTokenHash;
    usuario.resetPasswordExpires = new Date(Date.now() + 3600000);
    await usuario.save();

    return {
      success: true,
      message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña',
      resetToken,
    };
  }

  async verifyResetToken(token: string) {
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const usuario = await this.usuarioModel.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!usuario) {
      return { success: false, message: 'Token inválido o expirado' };
    }

    return { success: true, message: 'Token válido' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, password } = resetPasswordDto;

    const resetTokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const usuario = await this.usuarioModel.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!usuario) {
      throw new BadRequestException('Token inválido o expirado');
    }

    usuario.password = password;
    usuario.resetPasswordToken = undefined;
    usuario.resetPasswordExpires = undefined;
    await usuario.save();

    return {
      success: true,
      message: 'Contraseña actualizada correctamente',
    };
  }
}
