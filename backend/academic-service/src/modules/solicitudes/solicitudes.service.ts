import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Solicitud } from './schemas/solicitud.schema';
import { Tutoria } from '../tutorias/schemas/tutoria.schema';
import { TutoriasService } from '../tutorias/tutorias.service';
import { CrearSolicitudDto } from './dto/solicitud.dto';

@Injectable()
export class SolicitudesService {
  constructor(
    @InjectModel(Solicitud.name) private solicitudModel: Model<Solicitud>,
    @InjectModel(Tutoria.name) private tutoriaModel: Model<Tutoria>,
    private tutoriasService: TutoriasService,
  ) {}

  async crear(dto: CrearSolicitudDto, estudianteId: string, estudianteNombre: string): Promise<Solicitud> {
    // Aceptar tanto tutoriaId como tutoria
    const tutoriaId = dto.tutoriaId || dto.tutoria;
    if (!tutoriaId) {
      throw new BadRequestException('tutoriaId es requerido');
    }

    const tutoria = await this.tutoriaModel.findById(tutoriaId);
    if (!tutoria) {
      throw new NotFoundException('Tutoría no encontrada');
    }

    if (tutoria.cuposDisponibles <= 0) {
      throw new BadRequestException('No hay cupos disponibles');
    }

    // Verificar si ya existe una solicitud
    const solicitudExistente = await this.solicitudModel.findOne({
      tutoria: tutoriaId,
      estudiante: estudianteId,
    });

    if (solicitudExistente) {
      throw new BadRequestException('Ya has enviado una solicitud para esta tutoría');
    }

    const nuevaSolicitud = new this.solicitudModel({
      tutoria: tutoriaId,
      estudiante: estudianteId,
      estudianteNombre,
      materia: tutoria.materiaNombre,
      fecha: tutoria.fecha,
      horaInicio: tutoria.horaInicio,
      horaFin: tutoria.horaFin,
      tutor: tutoria.tutorNombre,
    });

    return nuevaSolicitud.save();
  }

  async findByEstudiante(estudianteId: string): Promise<Solicitud[]> {
    return this.solicitudModel
      .find({ estudiante: estudianteId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByTutoria(tutoriaId: string): Promise<Solicitud[]> {
    return this.solicitudModel
      .find({ tutoria: tutoriaId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async aceptar(id: string): Promise<Solicitud> {
    const solicitud = await this.solicitudModel.findById(id);
    if (!solicitud) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    if (solicitud.estado !== 'Pendiente') {
      throw new BadRequestException('La solicitud ya fue procesada');
    }

    const tutoria = await this.tutoriaModel.findById(solicitud.tutoria);
    if (!tutoria) {
      throw new NotFoundException('Tutoría no encontrada');
    }

    if (tutoria.cuposDisponibles <= 0) {
      throw new BadRequestException('No hay cupos disponibles');
    }

    solicitud.estado = 'Aceptada';
    await solicitud.save();

    // Actualizar cupos
    await this.tutoriasService.actualizarCupos(tutoria._id.toString(), -1);

    return solicitud;
  }

  async rechazar(id: string): Promise<Solicitud> {
    const solicitud = await this.solicitudModel.findById(id);
    if (!solicitud) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    if (solicitud.estado !== 'Pendiente') {
      throw new BadRequestException('La solicitud ya fue procesada');
    }

    solicitud.estado = 'Rechazada';
    return solicitud.save();
  }

  async cancelar(id: string, estudianteId: string): Promise<void> {
    const solicitud = await this.solicitudModel.findOne({
      _id: id,
      estudiante: estudianteId,
    });

    if (!solicitud) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    // Si estaba aceptada, devolver el cupo
    if (solicitud.estado === 'Aceptada') {
      await this.tutoriasService.actualizarCupos(solicitud.tutoria.toString(), 1);
    }

    await this.solicitudModel.deleteOne({ _id: id });
  }
}
