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
import { CreatePreguntaDto, CreateRespuestaDto } from './dto/encuestas.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('encuestas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EncuestasController {
  constructor(private readonly encuestasService: EncuestasService) {}

  // =============== PREGUNTAS ===============

  @Post('preguntas')
  @Roles('Administrador')
  async crearPregunta(@Body() createDto: CreatePreguntaDto) {
    const pregunta = await this.encuestasService.crearPregunta(createDto);
    return {
      ok: true,
      success: true,
      message: 'Pregunta creada exitosamente',
      pregunta,
    };
  }

  @Get('preguntas')
  @Roles('Administrador')
  async getPreguntas() {
    const preguntas = await this.encuestasService.findAllPreguntas();
    return {
      ok: true,
      success: true,
      preguntas,
    };
  }

  @Get('preguntas/materia/:materia')
  async getPreguntasPorMateria(@Param('materia') materia: string) {
    // Decodificar el parámetro (por si viene con URL encoding)
    const materiaParam = decodeURIComponent(materia);
    
    // Detectar si es un ObjectId de MongoDB (24 caracteres hexadecimales)
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(materiaParam);
    
    let preguntas;
    if (isObjectId) {
      // Buscar por ID de materia
      preguntas = await this.encuestasService.findPreguntasByMateriaId(materiaParam);
    } else {
      // Buscar por nombre de materia
      preguntas = await this.encuestasService.findPreguntasByMateriaNombre(materiaParam);
    }
    
    return {
      ok: true,
      success: true,
      preguntas,
    };
  }

  // =============== RESPUESTAS ===============

  @Post('respuestas')
  @Roles('Estudiante')
  async enviarRespuestas(@Body() createDto: CreateRespuestaDto, @Request() req) {
    console.log('Controller: enviarRespuestas received:', { createDto, userId: req.user?.userId });
    const respuesta = await this.encuestasService.enviarRespuestas(
      createDto,
      req.user.userId.toString(),
    );
    return {
      ok: true,
      success: true,
      message: 'Encuesta respondida exitosamente',
      respuesta,
    };
  }

  @Get('verificar/:tutoriaId')
  @Roles('Estudiante')
  async verificarRespuesta(@Param('tutoriaId') tutoriaId: string, @Request() req) {
    const respondido = await this.encuestasService.verificarRespuesta(
      tutoriaId,
      req.user.userId.toString(),
    );
    return {
      ok: true,
      success: true,
      respondido,
    };
  }

  @Get('tutoria/:tutoriaId/promedio')
  async getPromedioTutoria(@Param('tutoriaId') tutoriaId: string) {
    const resultado = await this.encuestasService.getPromedioTutoria(tutoriaId);
    return {
      ok: true,
      success: true,
      ...resultado,
    };
  }

  @Get('tutoria/:tutoriaId/promedios-preguntas')
  async getPromediosPorPregunta(@Param('tutoriaId') tutoriaId: string) {
    const resultado = await this.encuestasService.getPromediosPorPregunta(tutoriaId);
    return {
      ok: true,
      success: true,
      promediosPorPregunta: resultado.promedios,
      totalRespuestas: resultado.totalRespuestas,
    };
  }
}
