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
} from '@nestjs/common';
import { MateriasService } from './materias.service';
import { CreateMateriaDto, UpdateMateriaDto } from './dto/materia.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';

@Controller('materias')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MateriasController {
  constructor(private readonly materiasService: MateriasService) {}

  @Post()
  @Roles('Administrador')
  async crear(@Body() createMateriaDto: CreateMateriaDto) {
    const materia = await this.materiasService.crear(createMateriaDto);
    return {
      ok: true,
      materia,
    };
  }

  @Get()
  @Public()
  async findAll(@Query('todas') todas?: string) {
    const soloActivas = todas !== 'true';
    const materias = await this.materiasService.findAll(soloActivas);
    return {
      ok: true,
      materias,
    };
  }

  @Get('estadisticas')
  @Roles('Administrador')
  async getEstadisticas() {
    const total = await this.materiasService.contar();
    return {
      ok: true,
      total,
    };
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const materia = await this.materiasService.findById(id);
    return {
      ok: true,
      materia,
    };
  }

  @Put(':id')
  @Roles('Administrador')
  async actualizar(
    @Param('id') id: string,
    @Body() updateDto: UpdateMateriaDto,
  ) {
    const materia = await this.materiasService.actualizar(id, updateDto);
    return {
      ok: true,
      materia,
    };
  }

  @Patch(':id/estado')
  @Roles('Administrador')
  async cambiarEstado(
    @Param('id') id: string,
    @Body('activa') activa: boolean,
  ) {
    const materia = await this.materiasService.cambiarEstado(id, activa);
    return {
      ok: true,
      materia,
    };
  }

  @Delete(':id')
  @Roles('Administrador')
  async eliminar(@Param('id') id: string) {
    await this.materiasService.eliminar(id);
    return {
      ok: true,
      mensaje: 'Materia eliminada correctamente',
    };
  }
}
