import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { EncuestasService } from './encuestas.service';
import { CrearPreguntaDto, CrearRespuestaDto } from './dto/encuestas.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('encuestas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EncuestasController {
  constructor(private readonly encuestasService: EncuestasService) {}

  @Post('preguntas')
  @Roles('Administrador')
  async crearPregunta(@Body() dto: CrearPreguntaDto) {
    const pregunta = await this.encuestasService.crearPregunta(dto);
    return {
      success: true,
      message: 'Pregunta creada exitosamente',
      pregunta,
    };
  }

  @Get('preguntas')
  @Roles('Administrador')
  async obtenerPreguntas() {
    const preguntas = await this.encuestasService.obtenerPreguntas();
    return {
      success: true,
      preguntas,
    };
  }

  @Get('preguntas/materia/:materia')
  async obtenerPreguntasPorMateria(@Param('materia') materia: string) {
    const preguntas = await this.encuestasService.obtenerPreguntasPorMateria(materia);
    return {
      success: true,
      preguntas,
    };
  }

  @Post('respuestas')
  @Roles('Estudiante')
  async crearRespuesta(@Body() dto: CrearRespuestaDto, @Request() req) {
    console.log('[Encuestas] Datos recibidos:', JSON.stringify(dto, null, 2));
    console.log('[Encuestas] Tipo de respuestas:', typeof dto.respuestas, 'Es array:', Array.isArray(dto.respuestas));
    const respuesta = await this.encuestasService.crearRespuesta(
      dto,
      req.user.userId,
    );
    return {
      success: true,
      message: 'Encuesta respondida exitosamente',
      respuesta,
    };
  }

  @Get('verificar/:tutoriaId')
  @Roles('Estudiante')
  async verificarRespuesta(@Param('tutoriaId') tutoriaId: string, @Request() req) {
    const respondida = await this.encuestasService.verificarRespuesta(
      tutoriaId,
      req.user.userId,
    );
    return {
      success: true,
      respondida,
    };
  }

  @Get('tutoria/:tutoriaId/promedio')
  async obtenerPromedioTutoria(@Param('tutoriaId') tutoriaId: string) {
    const resultado = await this.encuestasService.obtenerPromedioTutoria(tutoriaId);
    return {
      success: true,
      ...resultado,
    };
  }

  @Get('tutoria/:tutoriaId/promedios-preguntas')
  async obtenerPromediosPorPregunta(@Param('tutoriaId') tutoriaId: string) {
    const resultado = await this.encuestasService.obtenerPromediosPorPregunta(tutoriaId);
    console.log('[Encuestas] Promedios calculados:', JSON.stringify(resultado, null, 2));
    return {
      success: true,
      ...resultado,
    };
  }
}
