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
import { AulaService } from './aula.service';
import { TutoriasService } from '../tutorias/tutorias.service';
import { CrearBibliografiaDto, CrearPublicacionDto } from './dto/aula.dto';
import { ConfigurarAulaDto } from '../tutorias/dto/tutoria.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('aula')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AulaController {
  constructor(
    private readonly aulaService: AulaService,
    private readonly tutoriasService: TutoriasService,
  ) {}

  @Get(':tutoriaId')
  async getAulaData(@Param('tutoriaId') tutoriaId: string, @Req() req) {
    const data = await this.aulaService.findAulaData(tutoriaId, req.user.userId, req.user.rol);
    return { success: true, ...data };
  }

  @Put(':tutoriaId/configurar')
  @Roles('Tutor')
  async configurarAula(@Param('tutoriaId') tutoriaId: string, @Body() dto: ConfigurarAulaDto) {
    const tutoria = await this.tutoriasService.configurarAula(tutoriaId, dto);
    return { success: true, tutoria };
  }

  // Bibliografías
  @Post('bibliografia')
  @Roles('Tutor')
  async crearBibliografia(@Body() dto: CrearBibliografiaDto, @Req() req) {
    const bibliografia = await this.aulaService.crearBibliografia(
      dto,
      req.user.userId,
      `${req.user.nombre} ${req.user.apellido}`,
    );
    return { success: true, bibliografia };
  }

  @Post(':tutoriaId/bibliografias')
  @Roles('Tutor')
  async crearBibliografiaAlt(@Param('tutoriaId') tutoriaId: string, @Body() dto: CrearBibliografiaDto, @Req() req) {
    // Asegurar que el tutoriaId del path se use
    const dtoWithTutoria = { ...dto, tutoria: tutoriaId };
    return this.crearBibliografia(dtoWithTutoria, req);
  }

  @Get('bibliografia/tutoria/:tutoriaId')
  async getBibliografias(@Param('tutoriaId') tutoriaId: string) {
    const bibliografias = await this.aulaService.findBibliografiasByTutoria(tutoriaId);
    return { success: true, bibliografias };
  }

  @Get(':tutoriaId/bibliografias')
  async getBibliografiasByTutoria(@Param('tutoriaId') tutoriaId: string) {
    return this.getBibliografias(tutoriaId);
  }

  @Delete('bibliografia/:id')
  @Roles('Tutor')
  async deleteBibliografia(@Param('id') id: string) {
    await this.aulaService.deleteBibliografia(id);
    return { success: true, message: 'Bibliografía eliminada' };
  }

  // Publicaciones
  @Post('publicacion')
  async crearPublicacion(@Body() dto: CrearPublicacionDto, @Req() req) {
    const publicacion = await this.aulaService.crearPublicacion(
      dto,
      req.user.userId,
      `${req.user.nombre} ${req.user.apellido}`,
    );
    return { success: true, publicacion };
  }

  @Post(':tutoriaId/publicaciones')
  async crearPublicacionAlt(@Param('tutoriaId') tutoriaId: string, @Body() dto: CrearPublicacionDto, @Req() req) {
    // Asegurar que el tutoriaId del path se use
    const dtoWithTutoria = { ...dto, tutoria: tutoriaId };
    return this.crearPublicacion(dtoWithTutoria, req);
  }

  @Get('publicacion/tutoria/:tutoriaId')
  async getPublicaciones(@Param('tutoriaId') tutoriaId: string) {
    const publicaciones = await this.aulaService.findPublicacionesByTutoria(tutoriaId);
    return { success: true, publicaciones };
  }

  @Get(':tutoriaId/publicaciones')
  async getPublicacionesByTutoria(@Param('tutoriaId') tutoriaId: string) {
    return this.getPublicaciones(tutoriaId);
  }

  @Delete('publicacion/:id')
  async deletePublicacion(@Param('id') id: string, @Req() req) {
    await this.aulaService.deletePublicacion(id);
    return { success: true, message: 'Publicación eliminada' };
  }
}
