import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AulaService } from './aula.service';
import {
  ConfigurarAulaDto,
  CreatePublicacionDto,
  UpdatePublicacionDto,
  CreateBibliografiaDto,
  UpdateBibliografiaDto,
} from './dto/aula.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('aula')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AulaController {
  constructor(private readonly aulaService: AulaService) {}

  // Obtener información del aula
  @Get(':tutoriaId')
  async getAulaInfo(@Param('tutoriaId') tutoriaId: string, @Request() req) {
    const result = await this.aulaService.getAulaInfo(
      tutoriaId,
      req.user.userId.toString(),
      req.user.rol,
    );
    return {
      ok: true,
      success: true,
      ...result,
    };
  }

  // Configurar aula (primera vez)
  @Post(':tutoriaId/configurar')
  @Roles('Tutor')
  async configurarAula(
    @Param('tutoriaId') tutoriaId: string,
    @Body() dto: ConfigurarAulaDto,
    @Request() req,
  ) {
    const tutoria = await this.aulaService.configurarAula(
      tutoriaId,
      dto,
      req.user.userId.toString(),
    );
    return {
      ok: true,
      success: true,
      message: 'Aula configurada exitosamente',
      tutoria,
    };
  }

  // Editar configuración del aula
  @Put(':tutoriaId/configurar')
  @Roles('Tutor')
  async editarConfiguracion(
    @Param('tutoriaId') tutoriaId: string,
    @Body() dto: ConfigurarAulaDto,
    @Request() req,
  ) {
    const tutoria = await this.aulaService.editarConfiguracion(
      tutoriaId,
      dto,
      req.user.userId.toString(),
    );
    return {
      ok: true,
      success: true,
      message: 'Configuración actualizada exitosamente',
      tutoria,
    };
  }

  // ========== PUBLICACIONES ==========

  // Crear publicación
  @Post(':tutoriaId/publicaciones')
  @Roles('Tutor')
  async crearPublicacion(
    @Param('tutoriaId') tutoriaId: string,
    @Body() dto: CreatePublicacionDto,
    @Request() req,
  ) {
    const userName = `${req.user.nombre} ${req.user.apellido}`;
    const publicacion = await this.aulaService.crearPublicacion(
      tutoriaId,
      dto,
      req.user.userId.toString(),
      userName,
    );
    return {
      ok: true,
      success: true,
      message: 'Publicación creada exitosamente',
      publicacion,
    };
  }

  // Obtener publicaciones
  @Get(':tutoriaId/publicaciones')
  async getPublicaciones(@Param('tutoriaId') tutoriaId: string) {
    const publicaciones = await this.aulaService.getPublicaciones(tutoriaId);
    return {
      ok: true,
      success: true,
      publicaciones,
    };
  }

  // Editar publicación
  @Put(':tutoriaId/publicaciones/:publicacionId')
  @Roles('Tutor')
  async editarPublicacion(
    @Param('tutoriaId') tutoriaId: string,
    @Param('publicacionId') publicacionId: string,
    @Body() dto: UpdatePublicacionDto,
    @Request() req,
  ) {
    const publicacion = await this.aulaService.editarPublicacion(
      tutoriaId,
      publicacionId,
      dto,
      req.user.userId.toString(),
    );
    return {
      ok: true,
      success: true,
      message: 'Publicación actualizada exitosamente',
      publicacion,
    };
  }

  // Eliminar publicación
  @Delete(':tutoriaId/publicaciones/:publicacionId')
  @Roles('Tutor')
  async eliminarPublicacion(
    @Param('tutoriaId') tutoriaId: string,
    @Param('publicacionId') publicacionId: string,
    @Request() req,
  ) {
    await this.aulaService.eliminarPublicacion(
      tutoriaId,
      publicacionId,
      req.user.userId.toString(),
    );
    return {
      ok: true,
      success: true,
      message: 'Publicación eliminada exitosamente',
    };
  }

  // ========== BIBLIOGRAFÍAS ==========

  // Crear bibliografía
  @Post(':tutoriaId/bibliografias')
  @Roles('Tutor')
  async crearBibliografia(
    @Param('tutoriaId') tutoriaId: string,
    @Body() dto: CreateBibliografiaDto,
    @Request() req,
  ) {
    const userName = `${req.user.nombre} ${req.user.apellido}`;
    const bibliografia = await this.aulaService.crearBibliografia(
      tutoriaId,
      dto,
      req.user.userId.toString(),
      userName,
    );
    return {
      ok: true,
      success: true,
      message: 'Bibliografía subida exitosamente',
      bibliografia,
    };
  }

  // Obtener bibliografías
  @Get(':tutoriaId/bibliografias')
  async getBibliografias(@Param('tutoriaId') tutoriaId: string) {
    const bibliografias = await this.aulaService.getBibliografias(tutoriaId);
    return {
      ok: true,
      success: true,
      bibliografias,
    };
  }

  // Editar bibliografía
  @Put(':tutoriaId/bibliografias/:bibliografiaId')
  @Roles('Tutor')
  async editarBibliografia(
    @Param('tutoriaId') tutoriaId: string,
    @Param('bibliografiaId') bibliografiaId: string,
    @Body() dto: UpdateBibliografiaDto,
    @Request() req,
  ) {
    const bibliografia = await this.aulaService.editarBibliografia(
      tutoriaId,
      bibliografiaId,
      dto,
      req.user.userId.toString(),
    );
    return {
      ok: true,
      success: true,
      message: 'Bibliografía actualizada exitosamente',
      bibliografia,
    };
  }

  // Eliminar bibliografía
  @Delete(':tutoriaId/bibliografias/:bibliografiaId')
  @Roles('Tutor')
  async eliminarBibliografia(
    @Param('tutoriaId') tutoriaId: string,
    @Param('bibliografiaId') bibliografiaId: string,
    @Request() req,
  ) {
    await this.aulaService.eliminarBibliografia(
      tutoriaId,
      bibliografiaId,
      req.user.userId.toString(),
    );
    return {
      ok: true,
      success: true,
      message: 'Bibliografía eliminada exitosamente',
    };
  }
}
