import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { TutoriasService } from './tutorias.service';
import { CreateTutoriaDto, UpdateTutoriaDto, FiltrosTutoriaDto } from './dto/tutoria.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('tutorias')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TutoriasController {
  constructor(private readonly tutoriasService: TutoriasService) {}

  @Post()
  @Roles('Tutor', 'Administrador')
  async crear(@Body() createDto: CreateTutoriaDto, @Request() req) {
    const tutoria = await this.tutoriasService.crear(createDto, req.user.userId);
    return {
      ok: true,
      tutoria,
    };
  }

  @Get()
  async findAll(@Query() filtros: FiltrosTutoriaDto) {
    const tutorias = await this.tutoriasService.findAll(filtros);
    return {
      ok: true,
      tutorias,
    };
  }

  @Get('disponibles')
  async findDisponibles(@Query('materia') materiaId?: string) {
    const tutorias = await this.tutoriasService.findDisponibles(materiaId);
    return {
      ok: true,
      tutorias,
    };
  }

  @Get('mis-tutorias')
  @Roles('Tutor')
  async getMisTutorias(@Request() req) {
    const tutorias = await this.tutoriasService.findByTutor(req.user.userId);
    return {
      ok: true,
      tutorias,
    };
  }

  @Get('semana')
  async getTutoriasSemana(@Query('tutor') tutorId?: string) {
    const tutorias = await this.tutoriasService.getTutoriasPorSemana(tutorId);
    return {
      ok: true,
      tutorias,
    };
  }

  @Get('estadisticas')
  @Roles('Administrador')
  async getEstadisticas() {
    const conteo = await this.tutoriasService.contarPorEstado();
    return {
      ok: true,
      ...conteo,
    };
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const tutoria = await this.tutoriasService.findById(id);
    return {
      ok: true,
      tutoria,
    };
  }

  @Put(':id')
  @Roles('Tutor', 'Administrador')
  async actualizar(
    @Param('id') id: string,
    @Body() updateDto: UpdateTutoriaDto,
    @Request() req,
  ) {
    const tutoria = await this.tutoriasService.actualizar(
      id,
      updateDto,
      req.user.userId,
      req.user.rol,
    );
    return {
      ok: true,
      tutoria,
    };
  }

  @Patch(':id/estado')
  @Roles('Tutor', 'Administrador')
  async cambiarEstado(
    @Param('id') id: string,
    @Body('estado') estado: string,
    @Request() req,
  ) {
    const tutoria = await this.tutoriasService.cambiarEstado(
      id,
      estado,
      req.user.userId,
      req.user.rol,
    );
    return {
      ok: true,
      tutoria,
    };
  }

  @Delete(':id')
  @Roles('Tutor', 'Administrador')
  async eliminar(@Param('id') id: string, @Request() req) {
    await this.tutoriasService.eliminar(id, req.user.userId, req.user.rol);
    return {
      ok: true,
      mensaje: 'Tutoría eliminada correctamente',
    };
  }
}
