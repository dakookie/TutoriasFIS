import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tutoria } from './schemas/tutoria.schema';
import { Materia } from '../materias/schemas/materia.schema';
import { CrearTutoriaDto, ConfigurarAulaDto, ActualizarTutoriaDto } from './dto/tutoria.dto';

@Injectable()
export class TutoriasService {
  constructor(
    @InjectModel(Tutoria.name) private tutoriaModel: Model<Tutoria>,
    @InjectModel(Materia.name) private materiaModel: Model<Materia>,
  ) {}

  async crear(dto: CrearTutoriaDto, tutorId: string, tutorNombre: string): Promise<Tutoria> {
    const materia = await this.materiaModel.findById(dto.materia);
    if (!materia) {
      throw new NotFoundException('Materia no encontrada');
    }

    const nuevaTutoria = new this.tutoriaModel({
      materia: dto.materia,
      materiaNombre: materia.nombre,
      fecha: new Date(dto.fecha),
      horaInicio: dto.horaInicio,
      horaFin: dto.horaFin,
      cuposOriginales: dto.cuposOriginales,
      cuposDisponibles: dto.cuposOriginales,
      tutor: tutorId,
      tutorNombre,
      modalidadAula: dto.modalidadAula || null,
      nombreAula: dto.nombreAula || null,
      enlaceReunion: dto.enlaceAula || null,
      aulaConfigurada: !!(dto.modalidadAula),
    });

    return nuevaTutoria.save();
  }

  async findAll(): Promise<Tutoria[]> {
    return this.tutoriaModel
      .find({ activa: true })
      .populate('materia')
      .sort({ fecha: 1 })
      .exec();
  }

  async findDisponibles(): Promise<Tutoria[]> {
    return this.tutoriaModel
      .find({ 
        activa: true, 
        cuposDisponibles: { $gt: 0 },
        fecha: { $gte: new Date() }
      })
      .populate('materia')
      .sort({ fecha: 1 })
      .exec();
  }

  async findByTutor(tutorId: string): Promise<Tutoria[]> {
    return this.tutoriaModel
      .find({ tutor: tutorId })
      .populate('materia')
      .sort({ fecha: -1 })
      .exec();
  }

  async findById(id: string): Promise<Tutoria> {
    const tutoria = await this.tutoriaModel
      .findById(id)
      .populate('materia')
      .exec();

    if (!tutoria) {
      throw new NotFoundException('Tutoría no encontrada');
    }

    return tutoria;
  }

  async actualizar(id: string, dto: ActualizarTutoriaDto): Promise<Tutoria> {
    const tutoria = await this.tutoriaModel.findById(id);
    if (!tutoria) {
      throw new NotFoundException('Tutoría no encontrada');
    }

    // Si se actualiza la materia, obtener el nombre
    if (dto.materia && dto.materia !== tutoria.materia.toString()) {
      const materia = await this.materiaModel.findById(dto.materia);
      if (!materia) {
        throw new NotFoundException('Materia no encontrada');
      }
      tutoria.materiaNombre = materia.nombre;
    }

    // Actualizar campos
    Object.assign(tutoria, dto);

    // Si se actualizan los cupos originales, ajustar disponibles proporcionalmente
    if (dto.cuposOriginales !== undefined) {
      const diferencia = dto.cuposOriginales - tutoria.cuposOriginales;
      tutoria.cuposDisponibles += diferencia;
      if (tutoria.cuposDisponibles < 0) tutoria.cuposDisponibles = 0;
    }

    return tutoria.save();
  }

  async configurarAula(id: string, dto: ConfigurarAulaDto): Promise<Tutoria> {
    const tutoria = await this.tutoriaModel.findById(id);
    if (!tutoria) {
      throw new NotFoundException('Tutoría no encontrada');
    }

    tutoria.modalidadAula = dto.modalidadAula;
    tutoria.nombreAula = dto.nombreAula || null;
    tutoria.enlaceReunion = dto.enlaceReunion || null;
    tutoria.aulaConfigurada = true;

    return tutoria.save();
  }

  async publicar(id: string): Promise<Tutoria> {
    const tutoria = await this.tutoriaModel.findById(id);
    if (!tutoria) {
      throw new NotFoundException('Tutoría no encontrada');
    }

    tutoria.publicada = true;
    return tutoria.save();
  }

  async cancelar(id: string): Promise<Tutoria> {
    const tutoria = await this.tutoriaModel.findById(id);
    if (!tutoria) {
      throw new NotFoundException('Tutoría no encontrada');
    }

    tutoria.activa = false;
    return tutoria.save();
  }

  async actualizarCupos(id: string, incremento: number): Promise<Tutoria> {
    const tutoria = await this.tutoriaModel.findById(id);
    if (!tutoria) {
      throw new NotFoundException('Tutoría no encontrada');
    }

    tutoria.cuposDisponibles += incremento;
    
    if (tutoria.cuposDisponibles < 0) {
      tutoria.cuposDisponibles = 0;
    }
    
    if (tutoria.cuposDisponibles > tutoria.cuposOriginales) {
      tutoria.cuposDisponibles = tutoria.cuposOriginales;
    }

    return tutoria.save();
  }
}
