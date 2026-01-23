import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MensajesService } from './mensajes.service';
import { CreateMensajeDto } from './dto/mensaje.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('mensajes')
@UseGuards(JwtAuthGuard)
export class MensajesController {
  constructor(private readonly mensajesService: MensajesService) {}

  @Post()
  async crear(@Body() createDto: CreateMensajeDto, @Request() req) {
    const mensaje = await this.mensajesService.crear(createDto, req.user.userId);
    return {
      ok: true,
      mensaje,
    };
  }

  @Get('chats')
  async getChats(@Request() req) {
    const chats = await this.mensajesService.getChatsUsuario(req.user.userId);
    return {
      ok: true,
      chats,
    };
  }

  @Get('no-leidos')
  async getNoLeidos(@Request() req) {
    const cantidad = await this.mensajesService.contarNoLeidos(req.user.userId);
    return {
      ok: true,
      cantidad,
    };
  }

  @Get('conversacion/:usuarioId')
  async getConversacion(@Param('usuarioId') usuarioId: string, @Request() req) {
    const mensajes = await this.mensajesService.getConversacion(
      req.user.userId,
      usuarioId,
    );
    return {
      ok: true,
      mensajes,
    };
  }

  @Get('tutoria/:tutoriaId')
  async getMensajesTutoria(@Param('tutoriaId') tutoriaId: string) {
    const mensajes = await this.mensajesService.getMensajesTutoria(tutoriaId);
    return {
      ok: true,
      mensajes,
    };
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const mensaje = await this.mensajesService.findById(id);
    return {
      ok: true,
      mensaje,
    };
  }

  @Patch(':id/leido')
  async marcarLeido(@Param('id') id: string, @Request() req) {
    const mensaje = await this.mensajesService.marcarComoLeido(id, req.user.userId);
    return {
      ok: true,
      mensaje,
    };
  }

  @Patch('conversacion/:usuarioId/leidos')
  async marcarConversacionLeida(
    @Param('usuarioId') usuarioId: string,
    @Request() req,
  ) {
    const actualizados = await this.mensajesService.marcarConversacionLeida(
      usuarioId,
      req.user.userId,
    );
    return {
      ok: true,
      actualizados,
    };
  }

  @Delete(':id')
  async eliminar(@Param('id') id: string, @Request() req) {
    await this.mensajesService.eliminar(id, req.user.userId);
    return {
      ok: true,
      mensaje: 'Mensaje eliminado correctamente',
    };
  }
}
