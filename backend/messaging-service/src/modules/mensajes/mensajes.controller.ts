import {
  Controller,
  Get,
  Param,
  Req,
} from '@nestjs/common';
import { MensajesService } from './mensajes.service';

@Controller('mensajes')
export class MensajesController {
  constructor(private readonly mensajesService: MensajesService) {}

  @Get('tutoria/:tutoriaId')
  async getMensajesPorTutoria(@Param('tutoriaId') tutoriaId: string, @Req() req) {
    console.log('=== GET /mensajes/tutoria/:tutoriaId ===');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('TutoriaId:', tutoriaId);
    
    const jwtToken = req.headers['x-jwt-token'] || '';
    const userId = req.headers['x-user-id'] || '';
    
    console.log('UserId from header:', userId);
    console.log('JWT Token:', jwtToken ? 'Present' : 'Missing');
    
    const mensajes = await this.mensajesService.obtenerMensajesPorTutoria(
      tutoriaId,
      userId,
      jwtToken,
    );
    return { success: true, data: mensajes };
  }

  @Get('conversaciones')
  async getConversaciones(@Req() req) {
    console.log('=== GET /mensajes/conversaciones ===');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Cookies:', req.cookies);
    
    const jwtToken = req.headers['x-jwt-token'] || '';
    const userId = req.headers['x-user-id'] || '';
    const userRol = req.headers['x-user-rol'] || '';
    
    console.log('JWT Token:', jwtToken ? 'Present' : 'Missing');
    console.log('UserId from header:', userId);
    console.log('UserRol from header:', userRol);
    
    const conversaciones = await this.mensajesService.obtenerConversaciones(
      userId,
      userRol,
      jwtToken,
    );
    return { success: true, data: conversaciones };
  }

  @Get('no-leidos')
  async getNoLeidos(@Req() req) {
    const userId = req.headers['x-user-id'] || '';
    const cantidad = await this.mensajesService.contarNoLeidos(userId);
    return { success: true, data: cantidad };
  }
}
