import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Solicitud, SolicitudDocument, EstadoSolicitud } from './schemas/solicitud.schema';
import { Usuario, UsuarioDocument } from '../usuarios/schemas/usuario.schema';
import { CreateSolicitudDto, UpdateSolicitudDto, FiltrosSolicitudDto } from './dto/solicitud.dto';
import { TutoriasService } from '../tutorias/tutorias.service';

@Injectable()
export class SolicitudesService {
  constructor(
    @InjectModel(Solicitud.name) private solicitudModel: Model<SolicitudDocument>,
    @InjectModel(Usuario.name) private usuarioModel: Model<UsuarioDocument>,
    private tutoriasService: TutoriasService,
  ) {}

  async crear(createDto: CreateSolicitudDto, estudianteId: string): Promise<SolicitudDocument> {
    // Verificar que la tutoría existe
    const tutoria = await this.tutoriasService.findById(createDto.tutoria);

    // Obtener datos del estudiante
    const estudiante = await this.usuarioModel.findById(estudianteId).exec();
    if (!estudiante) {
      throw new NotFoundException('Estudiante no encontrado');
    }

    // Verificar que no existe una solicitud previa
    const existente = await this.solicitudModel.findOne({
      tutoria: createDto.tutoria,
      estudiante: estudianteId,
    });

    if (existente) {
      throw new ConflictException('Ya tienes una solicitud para esta tutoría');
    }

    // Verificar cupos disponibles
    if (tutoria.cuposDisponibles <= 0) {
      throw new BadRequestException('No hay cupos disponibles para esta tutoría');
    }

    const solicitud = new this.solicitudModel({
      ...createDto,
      estudiante: estudianteId,
      estudianteNombre: `${estudiante.nombre} ${estudiante.apellido}`,
      // Añadir datos desnormalizados para consultas rápidas
      materia: tutoria.materiaNombre,
      fecha: tutoria.fecha,
      horaInicio: tutoria.horaInicio,
      horaFin: tutoria.horaFin,
      tutor: tutoria.tutorNombre,
    });

    const saved = await solicitud.save();
    return this.findById(saved._id.toString());
  }

  async findAll(filtros?: FiltrosSolicitudDto): Promise<SolicitudDocument[]> {
    const query: any = {};

    if (filtros?.estudiante) {
      query.estudiante = filtros.estudiante;
    }

    if (filtros?.tutoria) {
      query.tutoria = filtros.tutoria;
    }

    if (filtros?.estado) {
      query.estado = filtros.estado;
    }

    return this.solicitudModel
      .find(query)
      .populate('estudiante', 'nombre email')
      .populate({
        path: 'tutoria',
        populate: [
          { path: 'tutor', select: 'nombre email' },
          { path: 'materia', select: 'nombre' },
        ],
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findById(id: string): Promise<SolicitudDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de solicitud inválido');
    }

    const solicitud = await this.solicitudModel
      .findById(id)
      .populate('estudiante', 'nombre email')
      .populate({
        path: 'tutoria',
        populate: [
          { path: 'tutor', select: 'nombre email' },
          { path: 'materia', select: 'nombre' },
        ],
      })
      .exec();

    if (!solicitud) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    return solicitud;
  }

  async findByEstudiante(estudianteId: string): Promise<SolicitudDocument[]> {
    return this.solicitudModel
      .find({ estudiante: estudianteId })
      .populate({
        path: 'tutoria',
        populate: [
          { path: 'tutor', select: 'nombre email' },
          { path: 'materia', select: 'nombre' },
        ],
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByTutoria(tutoriaId: string): Promise<SolicitudDocument[]> {
    return this.solicitudModel
      .find({ tutoria: tutoriaId })
      .populate('estudiante', 'nombre email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findPendientesByTutor(tutorId: string): Promise<SolicitudDocument[]> {
    // Primero obtener las tutorías del tutor
    const tutorias = await this.tutoriasService.findByTutor(tutorId);
    const tutoriaIds = tutorias.map(t => t._id);

    return this.solicitudModel
      .find({
        tutoria: { $in: tutoriaIds },
        estado: 'pendiente',
      })
      .populate('estudiante', 'nombre email')
      .populate({
        path: 'tutoria',
        populate: { path: 'materia', select: 'nombre' },
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async aprobar(id: string, userId: string, userRol: string): Promise<SolicitudDocument> {
    const solicitud = await this.findById(id);

    // Verificar permisos - convertir todos los IDs a string para comparar
    const tutorId = (solicitud.tutoria as any).tutor?._id?.toString() || 
                   (solicitud.tutoria as any).tutor?.toString();
    const userIdString = userId.toString();
    
    const esAdmin = userRol === 'Administrador' || userRol === 'admin';
    const esTutor = tutorId === userIdString;
    
    if (!esAdmin && !esTutor) {
      throw new ForbiddenException('No tienes permiso para aprobar esta solicitud');
    }

    if (solicitud.estado !== EstadoSolicitud.PENDIENTE) {
      throw new BadRequestException('Solo se pueden aprobar solicitudes pendientes');
    }

    // Incrementar inscritos en la tutoría
    const tutoriaId = (solicitud.tutoria as any)._id?.toString();
    await this.tutoriasService.incrementarInscritos(tutoriaId);

    const updated = await this.solicitudModel
      .findByIdAndUpdate(id, { estado: EstadoSolicitud.ACEPTADA }, { new: true })
      .populate('estudiante', 'nombre email')
      .populate({
        path: 'tutoria',
        populate: [
          { path: 'tutor', select: 'nombre email' },
          { path: 'materia', select: 'nombre' },
        ],
      })
      .exec();

    if (!updated) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    return updated;
  }

  async rechazar(
    id: string, 
    userId: string, 
    userRol: string,
    motivo?: string
  ): Promise<SolicitudDocument> {
    const solicitud = await this.findById(id);

    // Verificar permisos - convertir IDs a string para comparar
    const tutorId = (solicitud.tutoria as any).tutor?._id?.toString() || 
                   (solicitud.tutoria as any).tutor?.toString();
    const userIdString = userId.toString();
    
    const esAdmin = userRol === 'Administrador' || userRol === 'admin';
    const esTutor = tutorId === userIdString;
    
    if (!esAdmin && !esTutor) {
      throw new ForbiddenException('No tienes permiso para rechazar esta solicitud');
    }

    // Permitir rechazar solicitudes Pendientes o Aceptadas (revocar acceso)
    if (solicitud.estado === EstadoSolicitud.RECHAZADA) {
      throw new BadRequestException('Esta solicitud ya fue rechazada');
    }

    // Si estaba aceptada, decrementar inscritos
    if (solicitud.estado === EstadoSolicitud.ACEPTADA) {
      const tutoriaId = (solicitud.tutoria as any)._id?.toString();
      await this.tutoriasService.decrementarInscritos(tutoriaId);
    }

    const updateData: any = { estado: EstadoSolicitud.RECHAZADA };
    if (motivo) {
      updateData.motivoRechazo = motivo;
    }

    const updated = await this.solicitudModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('estudiante', 'nombre email')
      .populate({
        path: 'tutoria',
        populate: [
          { path: 'tutor', select: 'nombre email' },
          { path: 'materia', select: 'nombre' },
        ],
      })
      .exec();

    if (!updated) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    return updated;
  }

  async cancelar(id: string, estudianteId: string): Promise<SolicitudDocument> {
    const solicitud = await this.findById(id);

    // Verificar que el estudiante es el dueño - convertir IDs a string
    const solicitanteId = (solicitud.estudiante as any)._id?.toString() || 
                         solicitud.estudiante.toString();
    const estudianteIdString = estudianteId.toString();
    
    if (solicitanteId !== estudianteIdString) {
      throw new ForbiddenException('No tienes permiso para cancelar esta solicitud');
    }

    if (solicitud.estado === EstadoSolicitud.ACEPTADA) {
      // Si estaba aprobada, decrementar inscritos
      const tutoriaId = (solicitud.tutoria as any)._id?.toString();
      await this.tutoriasService.decrementarInscritos(tutoriaId);
    }

    const updated = await this.solicitudModel
      .findByIdAndUpdate(id, { estado: EstadoSolicitud.RECHAZADA }, { new: true })
      .populate('estudiante', 'nombre email')
      .populate({
        path: 'tutoria',
        populate: [
          { path: 'tutor', select: 'nombre email' },
          { path: 'materia', select: 'nombre' },
        ],
      })
      .exec();

    if (!updated) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    return updated;
  }

  async eliminar(id: string, userId: string): Promise<void> {
    const solicitud = await this.findById(id);

    // Verificar que la solicitud pertenece al estudiante
    let estudianteId: string;
    if (typeof solicitud.estudiante === 'object' && solicitud.estudiante._id) {
      estudianteId = solicitud.estudiante._id.toString();
    } else {
      estudianteId = solicitud.estudiante.toString();
    }

    // Convertir ambos a string para comparar
    const userIdString = userId.toString();

    if (estudianteId !== userIdString) {
      throw new ForbiddenException('No tienes permiso para eliminar esta solicitud');
    }

    await this.solicitudModel.findByIdAndDelete(id).exec();
  }

  async contarPorEstado(): Promise<Record<string, number>> {
    const resultados = await this.solicitudModel.aggregate([
      { $group: { _id: '$estado', count: { $sum: 1 } } },
    ]);

    const conteo: Record<string, number> = {
      pendiente: 0,
      aprobada: 0,
      rechazada: 0,
      cancelada: 0,
    };

    resultados.forEach((r) => {
      conteo[r._id] = r.count;
    });

    return conteo;
  }
}
