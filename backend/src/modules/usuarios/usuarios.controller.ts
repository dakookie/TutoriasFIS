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
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto, UpdateUsuarioDto } from './dto/usuario.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post()
  @Roles('Administrador')
  async crear(@Body() createUsuarioDto: CreateUsuarioDto) {
    const usuario = await this.usuariosService.crear(createUsuarioDto);
    return {
      ok: true,
      usuario,
    };
  }

  @Get()
  @Roles('Administrador')
  async findAll(
    @Query('rol') rol?: string,
    @Query('activo') activo?: string,
  ) {
    const filtros = {
      rol,
      activo: activo ? activo === 'true' : undefined,
    };
    
    const usuarios = await this.usuariosService.findAll(filtros);
    return {
      ok: true,
      usuarios,
    };
  }

  @Get('perfil')
  async getPerfil(@Request() req) {
    const usuario = await this.usuariosService.findById(req.user.userId);
    return {
      ok: true,
      usuario,
    };
  }

  @Get('tutores')
  async getTutores() {
    const tutores = await this.usuariosService.findTutores();
    return {
      ok: true,
      tutores,
    };
  }

  @Get('estudiantes')
  @Roles('Administrador', 'Tutor')
  async getEstudiantes() {
    const estudiantes = await this.usuariosService.findEstudiantes();
    return {
      ok: true,
      estudiantes,
    };
  }

  @Get('estadisticas')
  @Roles('Administrador')
  async getEstadisticas() {
    const conteo = await this.usuariosService.contarPorRol();
    return {
      ok: true,
      ...conteo,
    };
  }

  @Get(':id')
  @Roles('Administrador')
  async findById(@Param('id') id: string) {
    const usuario = await this.usuariosService.findById(id);
    return {
      ok: true,
      usuario,
    };
  }

  @Put('perfil')
  async actualizarPerfil(
    @Request() req,
    @Body() updateDto: UpdateUsuarioDto,
  ) {
    // No permitir cambiar rol ni estado desde el perfil
    delete updateDto.rol;
    delete (updateDto as any).activo;
    
    const usuario = await this.usuariosService.actualizar(req.user.userId, updateDto);
    return {
      ok: true,
      usuario,
    };
  }

  @Put(':id')
  @Roles('Administrador')
  async actualizar(
    @Param('id') id: string,
    @Body() updateDto: UpdateUsuarioDto,
  ) {
    const usuario = await this.usuariosService.actualizar(id, updateDto);
    return {
      ok: true,
      usuario,
    };
  }

  @Patch(':id/estado')
  @Roles('Administrador')
  async cambiarEstado(
    @Param('id') id: string,
    @Body('activo') activo: boolean,
  ) {
    const usuario = await this.usuariosService.cambiarEstado(id, activo);
    return {
      ok: true,
      usuario,
    };
  }

  @Delete(':id')
  @Roles('Administrador')
  async eliminar(@Param('id') id: string) {
    await this.usuariosService.eliminar(id);
    return {
      ok: true,
      mensaje: 'Usuario eliminado correctamente',
    };
  }
}
