import {
  Controller,
  Post,
  Body,
  Get,
  Res,
  Req,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';
import { CreateUsuarioDto } from '../usuarios/dto/usuario.dto';
import { Public } from '../../common/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('registro')
  async registro(@Body() createUsuarioDto: CreateUsuarioDto) {
    return this.authService.registro(createUsuarioDto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(loginDto);

    response.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return result;
  }

  @Public()
  @Post('logout')
  async logout(@Res() response: Response) {
    console.log('[Auth] Logout request received');
    response.clearCookie('token', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });
    console.log('[Auth] Cookie cleared, sending JSON response');
    return response.status(200).json({ 
      success: true, 
      message: 'Sesión cerrada correctamente' 
    });
  }

  @Public()
  @Get('verificar')
  async verificar(@Req() request: Request) {
    const token = (request as any).cookies?.token;
    
    if (!token) {
      return { success: false, message: 'No hay sesión activa' };
    }

    return this.authService.verificarToken(token);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Public()
  @Get('verify-reset-token/:token')
  async verifyResetToken(@Param('token') token: string) {
    return this.authService.verifyResetToken(token);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }
}
