import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Usuario, UsuarioDocument } from '../../usuarios/schemas/usuario.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectModel(Usuario.name) private usuarioModel: Model<UsuarioDocument>,
  ) {
    const secret = configService.get<string>('JWT_SECRET') || 'defaultsecret';
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Extraer de cookie
        (request: any) => {
          return request?.cookies?.token;
        },
        // O del header Authorization
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: { userId: string; email: string; rol: string }) {
    const usuario = await this.usuarioModel
      .findById(payload.userId)
      .select('-password');

    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException('Usuario no autorizado');
    }

    return {
      userId: usuario._id,
      email: usuario.email,
      rol: usuario.rol,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      materias: usuario.materias,
    };
  }
}
