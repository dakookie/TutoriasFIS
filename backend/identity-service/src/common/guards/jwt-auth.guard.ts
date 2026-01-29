import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Excluir rutas de métricas y health
    const request = context.switchToHttp().getRequest();
    if (request.url === '/metrics' || request.url === '/health') {
      return true;
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    console.log(`[JwtAuthGuard] Route: ${context.getHandler().name}, isPublic: ${isPublic}`);

    if (isPublic) {
      console.log('[JwtAuthGuard] Public route, allowing access');
      return true;
    }

    return super.canActivate(context);
  }
}
