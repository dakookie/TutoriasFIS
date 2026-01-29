import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Pregunta } from './schemas/pregunta.schema';
import { Respuesta } from './schemas/respuesta.schema';
import { Materia } from '../materias/schemas/materia.schema';
import { CrearPreguntaDto, CrearRespuestaDto } from './dto/encuestas.dto';

@Injectable()
export class EncuestasService {
  constructor(
    @InjectModel(Pregunta.name) private preguntaModel: Model<Pregunta>,
    @InjectModel(Respuesta.name) private respuestaModel: Model<Respuesta>,
    @InjectModel(Materia.name) private materiaModel: Model<Materia>,
  ) {}

  async crearPregunta(dto: CrearPreguntaDto): Promise<Pregunta> {
    const materia = await this.materiaModel.findById(dto.materia);
    if (!materia) {
      throw new NotFoundException('Materia no encontrada');
    }

    const nuevaPregunta = new this.preguntaModel({
      pregunta: dto.pregunta,
      materia: dto.materia,
      materiaNombre: materia.nombre,
    });

    return nuevaPregunta.save();
  }

  async obtenerPreguntas(): Promise<Pregunta[]> {
    return this.preguntaModel
      .find({ activa: true })
      .sort({ materia: 1, createdAt: -1 })
      .exec();
  }

  async obtenerPreguntasPorMateria(materiaNombre: string): Promise<Pregunta[]> {
    return this.preguntaModel
      .find({ materiaNombre, activa: true })
      .sort({ createdAt: 1 })
      .exec();
  }

  async crearRespuesta(dto: CrearRespuestaDto, estudianteId: string): Promise<any> {
    // Verificar si ya respondió todas las preguntas
    const respuestasExistentes = await this.respuestaModel.countDocuments({
      tutoria: dto.tutoriaId,
      estudiante: estudianteId,
    });

    // Si ya hay respuestas y coinciden con el número de preguntas que está enviando, ya respondió
    if (respuestasExistentes > 0 && respuestasExistentes >= dto.respuestas.length) {
      throw new BadRequestException('Ya has respondido esta encuesta');
    }

    // Crear múltiples respuestas
    const respuestas = dto.respuestas.map(r => ({
      tutoria: dto.tutoriaId,
      estudiante: estudianteId,
      pregunta: r.pregunta,
      calificacion: r.calificacion,
      comentario: r.comentario,
    }));

    try {
      return await this.respuestaModel.insertMany(respuestas);
    } catch (error) {
      // Si hay error de duplicados, significa que ya respondió
      if (error.code === 11000) {
        throw new BadRequestException('Ya has respondido esta encuesta');
      }
      throw error;
    }
  }

  async verificarRespuesta(tutoriaId: string, estudianteId: string): Promise<boolean> {
    const respuesta = await this.respuestaModel.findOne({
      tutoria: tutoriaId,
      estudiante: estudianteId,
    });

    return !!respuesta;
  }

  async obtenerPromedioTutoria(tutoriaId: string): Promise<any> {
    const respuestas = await this.respuestaModel.find({ tutoria: tutoriaId });

    if (respuestas.length === 0) {
      return {
        promedio: 0,
        totalRespuestas: 0,
      };
    }

    const suma = respuestas.reduce((acc, r) => acc + r.calificacion, 0);
    const promedio = suma / respuestas.length;

    return {
      promedio: parseFloat(promedio.toFixed(2)),
      totalRespuestas: respuestas.length,
    };
  }

  async obtenerPromediosPorPregunta(tutoriaId: string): Promise<any> {
    const respuestas = await this.respuestaModel
      .find({ tutoria: tutoriaId });

    if (respuestas.length === 0) {
      return {
        promediosPorPregunta: {},
        totalRespuestas: 0,
      };
    }

    const sumasPorPregunta: Record<string, { suma: number; count: number }> = {};
    const estudiantesUnicos = new Set();

    respuestas.forEach(r => {
      const preguntaId = r.pregunta.toString();
      estudiantesUnicos.add(r.estudiante.toString());
      
      if (!sumasPorPregunta[preguntaId]) {
        sumasPorPregunta[preguntaId] = { suma: 0, count: 0 };
      }
      sumasPorPregunta[preguntaId].suma += r.calificacion;
      sumasPorPregunta[preguntaId].count++;
    });

    const promediosPorPregunta: Record<string, number> = {};
    Object.keys(sumasPorPregunta).forEach(preguntaId => {
      const { suma, count } = sumasPorPregunta[preguntaId];
      promediosPorPregunta[preguntaId] = parseFloat((suma / count).toFixed(2));
    });

    return {
      promediosPorPregunta,
      totalRespuestas: estudiantesUnicos.size,
    };
  }
}
