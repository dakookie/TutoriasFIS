import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    const secret = configService.get<string>('JWT_SECRET') || 'defaultsecret';
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: any) => {
          return request?.cookies?.token;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: { userId: string; email: string; rol: string; nombre: string; apellido: string }) {
    if (!payload.userId) {
      throw new UnauthorizedException('Usuario no autorizado');
    }

    return {
      userId: payload.userId,
      email: payload.email,
      rol: payload.rol,
      nombre: payload.nombre,
      apellido: payload.apellido,
    };
  }
}
