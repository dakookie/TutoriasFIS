import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { TutoriasService } from './tutorias.service';
import { CrearTutoriaDto, ConfigurarAulaDto, ActualizarTutoriaDto } from './dto/tutoria.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';

@Controller('tutorias')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TutoriasController {
  constructor(private readonly tutoriasService: TutoriasService) {}

  @Post()
  @Roles('Tutor')
  async crear(@Body() dto: CrearTutoriaDto, @Request() req) {
    const tutoria = await this.tutoriasService.crear(
      dto,
      req.user.userId,
      `${req.user.nombre} ${req.user.apellido}`,
    );
    return {
      success: true,
      message: 'Tutoría creada exitosamente',
      tutoria,
    };
  }

  @Get()
  @Public()
  async findAll() {
    const tutorias = await this.tutoriasService.findAll();
    return {
      success: true,
      tutorias,
    };
  }

  @Get('disponibles')
  @Public()
  async findDisponibles() {
    const tutorias = await this.tutoriasService.findDisponibles();
    return {
      success: true,
      tutorias,
    };
  }

  @Get('mis-tutorias')
  async misTutorias(@Request() req) {
    // Verificar que el usuario esté autenticado
    if (!req.user || !req.user.userId) {
      return {
        success: true,
        tutorias: [],
      };
    }

    const tutorias = await this.tutoriasService.findByTutor(req.user.userId);
    return {
      success: true,
      tutorias,
    };
  }

  @Get('tutor/:tutorId')
  async findByTutor(@Param('tutorId') tutorId: string) {
    const tutorias = await this.tutoriasService.findByTutor(tutorId);
    return {
      success: true,
      tutorias,
    };
  }

  @Get(':id')
  @Public()
  async findById(@Param('id') id: string) {
    const tutoria = await this.tutoriasService.findById(id);
    return {
      success: true,
      tutoria,
    };
  }

  @Put(':id')
  @Roles('Tutor')
  async actualizar(@Param('id') id: string, @Body() dto: ActualizarTutoriaDto) {
    const tutoria = await this.tutoriasService.actualizar(id, dto);
    return {
      success: true,
      message: 'Tutoría actualizada exitosamente',
      tutoria,
    };
  }

  @Patch(':id')
  @Roles('Tutor')
  async actualizarPatch(@Param('id') id: string, @Body() dto: ActualizarTutoriaDto) {
    return this.actualizar(id, dto);
  }

  @Put(':id/configurar-aula')
  @Roles('Tutor')
  async configurarAula(@Param('id') id: string, @Body() dto: ConfigurarAulaDto) {
    const tutoria = await this.tutoriasService.configurarAula(id, dto);
    return {
      success: true,
      message: 'Aula configurada exitosamente',
      tutoria,
    };
  }

  @Patch(':id/configurar-aula')
  @Roles('Tutor')
  async configurarAulaPatch(@Param('id') id: string, @Body() dto: ConfigurarAulaDto) {
    return this.configurarAula(id, dto);
  }

  @Put(':id/publicar')
  @Roles('Tutor')
  async publicar(@Param('id') id: string) {
    const tutoria = await this.tutoriasService.publicar(id);
    return {
      success: true,
      message: 'Tutoría publicada exitosamente',
      tutoria,
    };
  }

  @Patch(':id/publicar')
  @Roles('Tutor')
  async publicarPatch(@Param('id') id: string) {
    return this.publicar(id);
  }

  @Put(':id/cancelar')
  @Roles('Tutor')
  async cancelar(@Param('id') id: string) {
    const tutoria = await this.tutoriasService.cancelar(id);
    return {
      success: true,
      message: 'Tutoría cancelada exitosamente',
      tutoria,
    };
  }

  @Patch(':id/cancelar')
  @Roles('Tutor')
  async cancelarPatch(@Param('id') id: string) {
    return this.cancelar(id);
  }
}
