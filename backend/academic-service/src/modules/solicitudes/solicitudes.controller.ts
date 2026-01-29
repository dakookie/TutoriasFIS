import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SolicitudesService } from './solicitudes.service';
import { CrearSolicitudDto } from './dto/solicitud.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('solicitudes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SolicitudesController {
  constructor(private readonly solicitudesService: SolicitudesService) {}

  @Post()
  async crear(@Body() dto: CrearSolicitudDto, @Req() req) {
    const solicitud = await this.solicitudesService.crear(
      dto,
      req.user.userId,
      `${req.user.nombre} ${req.user.apellido}`,
    );
    return { success: true, solicitud };
  }

  @Get('estudiante')
  async findByEstudiante(@Req() req) {
    const solicitudes = await this.solicitudesService.findByEstudiante(req.user.userId);
    return { success: true, solicitudes };
  }

  @Get('mis-solicitudes')
  async misSolicitudes(@Req() req) {
    return this.findByEstudiante(req);
  }

  @Get('tutoria/:tutoriaId')
  async findByTutoria(@Param('tutoriaId') tutoriaId: string) {
    const solicitudes = await this.solicitudesService.findByTutoria(tutoriaId);
    return { success: true, solicitudes };
  }

  @Put(':id/aceptar')
  @Roles('Tutor')
  async aceptar(@Param('id') id: string) {
    const solicitud = await this.solicitudesService.aceptar(id);
    return { success: true, solicitud };
  }

  @Put(':id/rechazar')
  @Roles('Tutor')
  async rechazar(@Param('id') id: string) {
    const solicitud = await this.solicitudesService.rechazar(id);
    return { success: true, solicitud };
  }

  @Delete(':id')
  async cancelar(@Param('id') id: string, @Req() req) {
    await this.solicitudesService.cancelar(id, req.user.userId);
    return { success: true, message: 'Solicitud cancelada' };
  }
}
