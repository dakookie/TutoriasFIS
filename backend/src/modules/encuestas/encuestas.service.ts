import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Pregunta, PreguntaDocument } from './schemas/pregunta.schema';
import { Respuesta, RespuestaDocument } from './schemas/respuesta.schema';
import { CreatePreguntaDto, CreateRespuestaDto } from './dto/encuestas.dto';
import { MateriasService } from '../materias/materias.service';
import { SolicitudesService } from '../solicitudes/solicitudes.service';

@Injectable()
export class EncuestasService {
  constructor(
    @InjectModel(Pregunta.name) private preguntaModel: Model<PreguntaDocument>,
    @InjectModel(Respuesta.name) private respuestaModel: Model<RespuestaDocument>,
    private materiasService: MateriasService,
    private solicitudesService: SolicitudesService,
  ) {}

  // =============== PREGUNTAS ===============

  async crearPregunta(createDto: CreatePreguntaDto): Promise<PreguntaDocument> {
    const materia = await this.materiasService.findById(createDto.materia);
    if (!materia) {
      throw new NotFoundException('Materia no encontrada');
    }

    const pregunta = new this.preguntaModel({
      pregunta: createDto.pregunta,
      materia: createDto.materia,
      materiaNombre: materia.nombre,
    });

    return pregunta.save();
  }

  async findAllPreguntas(): Promise<PreguntaDocument[]> {
    return this.preguntaModel
      .find({ activa: true })
      .sort({ materia: 1, createdAt: -1 })
      .exec();
  }

  async findPreguntasByMateriaNombre(materiaNombre: string): Promise<PreguntaDocument[]> {
    return this.preguntaModel
      .find({ materiaNombre, activa: true })
      .sort({ createdAt: 1 })
      .exec();
  }

  async findPreguntasByMateriaId(materiaId: string): Promise<PreguntaDocument[]> {
    return this.preguntaModel
      .find({ materia: materiaId, activa: true })
      .sort({ createdAt: 1 })
      .exec();
  }

  async findPreguntaById(id: string): Promise<PreguntaDocument> {
    const pregunta = await this.preguntaModel.findById(id).exec();
    if (!pregunta) {
      throw new NotFoundException('Pregunta no encontrada');
    }
    return pregunta;
  }

  async desactivarPregunta(id: string): Promise<PreguntaDocument> {
    const pregunta = await this.preguntaModel
      .findByIdAndUpdate(id, { activa: false }, { new: true })
      .exec();
    if (!pregunta) {
      throw new NotFoundException('Pregunta no encontrada');
    }
    return pregunta;
  }

  // =============== RESPUESTAS ===============

  async enviarRespuestas(
    createDto: CreateRespuestaDto,
    estudianteId: string,
  ): Promise<RespuestaDocument> {
    console.log('enviarRespuestas called with:', { createDto, estudianteId });
    
    // Verificar que el estudiante tiene una solicitud aceptada para esta tutoría
    const solicitudesEstudiante = await this.solicitudesService.findByEstudiante(estudianteId);
    console.log('Solicitudes del estudiante:', solicitudesEstudiante.map(s => ({
      tutoriaId: s.tutoria?._id?.toString() || s.tutoria?.toString(),
      estado: s.estado,
    })));
    
    const solicitudAceptada = solicitudesEstudiante.find((s) => {
      const tutoriaIdFromSolicitud = s.tutoria?._id?.toString() || s.tutoria?.toString();
      return tutoriaIdFromSolicitud === createDto.tutoriaId && s.estado === 'Aceptada';
    });

    if (!solicitudAceptada) {
      console.log('No se encontró solicitud aceptada para tutoriaId:', createDto.tutoriaId);
      throw new ForbiddenException('No tienes una solicitud aceptada para esta tutoría');
    }

    console.log('Solicitud aceptada encontrada, verificando si ya respondió...');

    // Verificar si ya respondió
    const respuestaExistente = await this.respuestaModel.findOne({
      tutoria: createDto.tutoriaId,
      estudiante: estudianteId,
    });

    console.log('Respuesta existente:', respuestaExistente);

    if (respuestaExistente) {
      console.log('El estudiante ya respondió esta encuesta');
      throw new BadRequestException('Ya has respondido esta encuesta');
    }

    console.log('No hay respuesta previa, procediendo a guardar...');

    // Validar calificaciones (1-5)
    for (const [preguntaId, calificacion] of Object.entries(createDto.respuestas)) {
      if (calificacion < 1 || calificacion > 5) {
        throw new BadRequestException('Las calificaciones deben estar entre 1 y 5');
      }
    }

    // Crear respuesta
    const respuesta = new this.respuestaModel({
      tutoria: createDto.tutoriaId,
      estudiante: estudianteId,
      respuestas: new Map(Object.entries(createDto.respuestas)),
    });

    return respuesta.save();
  }

  async verificarRespuesta(tutoriaId: string, estudianteId: string): Promise<boolean> {
    const respuesta = await this.respuestaModel.findOne({
      tutoria: tutoriaId,
      estudiante: estudianteId,
    });
    return !!respuesta;
  }

  async getPromedioTutoria(tutoriaId: string): Promise<{ promedio: number; totalRespuestas: number }> {
    console.log('getPromedioTutoria llamado con tutoriaId:', tutoriaId);
    const respuestas = await this.respuestaModel.find({ tutoria: tutoriaId });
    console.log('Respuestas encontradas:', respuestas.length, respuestas);

    if (respuestas.length === 0) {
      return { promedio: 0, totalRespuestas: 0 };
    }

    let sumaTotal = 0;
    let totalCalificaciones = 0;

    respuestas.forEach((respuesta) => {
      respuesta.respuestas.forEach((calificacion) => {
        sumaTotal += calificacion;
        totalCalificaciones++;
      });
    });

    const promedio = parseFloat((sumaTotal / totalCalificaciones).toFixed(2));
    console.log('Promedio calculado:', promedio, 'Total respuestas:', respuestas.length);

    return { promedio, totalRespuestas: respuestas.length };
  }

  async getPromediosPorPregunta(tutoriaId: string): Promise<{
    promedios: Record<string, number>;
    totalRespuestas: number;
  }> {
    const respuestas = await this.respuestaModel.find({ tutoria: tutoriaId });

    if (respuestas.length === 0) {
      return { promedios: {}, totalRespuestas: 0 };
    }

    const sumasPorPregunta: Record<string, number> = {};
    const conteosPorPregunta: Record<string, number> = {};

    respuestas.forEach((respuesta) => {
      if (respuesta.respuestas) {
        respuesta.respuestas.forEach((calificacion, preguntaId) => {
          if (!sumasPorPregunta[preguntaId]) {
            sumasPorPregunta[preguntaId] = 0;
            conteosPorPregunta[preguntaId] = 0;
          }
          sumasPorPregunta[preguntaId] += calificacion;
          conteosPorPregunta[preguntaId]++;
        });
      }
    });

    const promedios: Record<string, number> = {};
    Object.keys(sumasPorPregunta).forEach((preguntaId) => {
      promedios[preguntaId] = parseFloat(
        (sumasPorPregunta[preguntaId] / conteosPorPregunta[preguntaId]).toFixed(2),
      );
    });

    return { promedios, totalRespuestas: respuestas.length };
  }
}
