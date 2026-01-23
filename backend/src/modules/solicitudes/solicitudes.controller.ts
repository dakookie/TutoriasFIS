import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SolicitudesService } from './solicitudes.service';
import { CreateSolicitudDto, FiltrosSolicitudDto } from './dto/solicitud.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('solicitudes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SolicitudesController {
  constructor(private readonly solicitudesService: SolicitudesService) {}

  @Post()
  @Roles('Estudiante')
  async crear(@Body() createDto: CreateSolicitudDto, @Request() req) {
    const solicitud = await this.solicitudesService.crear(createDto, req.user.userId);
    return {
      ok: true,
      solicitud,
    };
  }

  @Get()
  @Roles('Administrador')
  async findAll(@Query() filtros: FiltrosSolicitudDto) {
    const solicitudes = await this.solicitudesService.findAll(filtros);
    return {
      ok: true,
      solicitudes,
    };
  }

  @Get('mis-solicitudes')
  @Roles('Estudiante')
  async getMisSolicitudes(@Request() req) {
    const solicitudes = await this.solicitudesService.findByEstudiante(req.user.userId);
    return {
      ok: true,
      solicitudes,
    };
  }

  @Get('pendientes')
  @Roles('Tutor')
  async getPendientes(@Request() req) {
    const solicitudes = await this.solicitudesService.findPendientesByTutor(req.user.userId);
    return {
      ok: true,
      solicitudes,
    };
  }

  @Get('tutoria/:tutoriaId')
  @Roles('Tutor', 'Administrador')
  async getByTutoria(@Param('tutoriaId') tutoriaId: string) {
    const solicitudes = await this.solicitudesService.findByTutoria(tutoriaId);
    return {
      ok: true,
      solicitudes,
    };
  }

  @Get('estadisticas')
  @Roles('Administrador')
  async getEstadisticas() {
    const conteo = await this.solicitudesService.contarPorEstado();
    return {
      ok: true,
      ...conteo,
    };
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const solicitud = await this.solicitudesService.findById(id);
    return {
      ok: true,
      solicitud,
    };
  }

  @Patch(':id/aprobar')
  @Roles('Tutor', 'Administrador')
  async aprobar(@Param('id') id: string, @Request() req) {
    const solicitud = await this.solicitudesService.aprobar(
      id,
      req.user.userId,
      req.user.rol,
    );
    return {
      ok: true,
      solicitud,
      mensaje: 'Solicitud aprobada correctamente',
    };
  }

  @Patch(':id/rechazar')
  @Roles('Tutor', 'Administrador')
  async rechazar(
    @Param('id') id: string,
    @Body('motivo') motivo: string,
    @Request() req,
  ) {
    const solicitud = await this.solicitudesService.rechazar(
      id,
      req.user.userId,
      req.user.rol,
      motivo,
    );
    return {
      ok: true,
      solicitud,
      mensaje: 'Solicitud rechazada',
    };
  }

  @Patch(':id/cancelar')
  @Roles('Estudiante')
  async cancelar(@Param('id') id: string, @Request() req) {
    const solicitud = await this.solicitudesService.cancelar(id, req.user.userId);
    return {
      ok: true,
      solicitud,
      mensaje: 'Solicitud cancelada',
    };
  }

  @Delete(':id')
  async eliminar(@Param('id') id: string, @Request() req) {
    await this.solicitudesService.eliminar(id, req.user.userId, req.user.rol);
    return {
      ok: true,
      mensaje: 'Solicitud eliminada correctamente',
    };
  }
}
