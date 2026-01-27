import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Tutoria, TutoriaDocument } from './schemas/tutoria.schema';
import { CreateTutoriaDto, UpdateTutoriaDto, FiltrosTutoriaDto } from './dto/tutoria.dto';
import { Usuario, UsuarioDocument } from '../usuarios/schemas/usuario.schema';
import { Materia, MateriaDocument } from '../materias/schemas/materia.schema';

@Injectable()
export class TutoriasService {
  constructor(
    @InjectModel(Tutoria.name) private tutoriaModel: Model<TutoriaDocument>,
    @InjectModel(Usuario.name) private usuarioModel: Model<UsuarioDocument>,
    @InjectModel(Materia.name) private materiaModel: Model<MateriaDocument>,
  ) {}

  async crear(createDto: CreateTutoriaDto, tutorId: string): Promise<TutoriaDocument> {
    // Obtener datos del tutor
    const tutor = await this.usuarioModel.findById(tutorId);
    if (!tutor) {
      throw new NotFoundException('Tutor no encontrado');
    }

    // Obtener datos de la materia
    const materia = await this.materiaModel.findById(createDto.materia);
    if (!materia) {
      throw new NotFoundException('Materia no encontrada');
    }

    // Crear la tutoría con todos los datos requeridos
    const tutoria = new this.tutoriaModel({
      ...createDto,
      tutor: tutorId,
      tutorNombre: tutor.nombre,
      materiaNombre: materia.nombre,
      cuposDisponibles: createDto.cuposOriginales,
    });
    
    const saved = await tutoria.save();
    return this.findById(saved._id.toString());
  }

  async findAll(filtros?: FiltrosTutoriaDto): Promise<TutoriaDocument[]> {
    const query: any = {};

    if (filtros?.tutor) {
      query.tutor = filtros.tutor;
    }

    if (filtros?.materia) {
      query.materia = filtros.materia;
    }

    if (filtros?.estado) {
      query.estado = filtros.estado;
    }

    if (filtros?.fecha) {
      const fecha = new Date(filtros.fecha);
      const siguienteDia = new Date(fecha);
      siguienteDia.setDate(siguienteDia.getDate() + 1);
      
      query.fecha = {
        $gte: fecha,
        $lt: siguienteDia,
      };
    }

    if (filtros?.modalidad) {
      query.modalidadAula = filtros.modalidad;
    }

    return this.tutoriaModel
      .find(query)
      .populate('tutor', 'nombre email')
      .populate('materia', 'nombre')
      .sort({ fecha: 1, horaInicio: 1 })
      .exec();
  }

  async findById(id: string): Promise<TutoriaDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de tutoría inválido');
    }

    const tutoria = await this.tutoriaModel
      .findById(id)
      .populate('tutor', 'nombre email')
      .populate('materia', 'nombre')
      .exec();

    if (!tutoria) {
      throw new NotFoundException('Tutoría no encontrada');
    }

    return tutoria;
  }

  async findByTutor(tutorId: string): Promise<TutoriaDocument[]> {
    return this.tutoriaModel
      .find({ tutor: tutorId })
      .populate('materia', 'nombre')
      .sort({ fecha: -1 })
      .exec();
  }

  async findDisponibles(materiaId?: string): Promise<TutoriaDocument[]> {
    const ahora = new Date();
    
    const query: any = {
      activa: true,
      publicada: true,
      fecha: { $gte: ahora },
      cuposDisponibles: { $gt: 0 },
    };

    if (materiaId) {
      query.materia = materiaId;
    }

    return this.tutoriaModel
      .find(query)
      .populate('tutor', 'nombre email')
      .populate('materia', 'nombre')
      .sort({ fecha: 1, horaInicio: 1 })
      .exec();
  }

  async actualizar(
    id: string, 
    updateDto: UpdateTutoriaDto, 
    userId: string, 
    userRol: string
  ): Promise<TutoriaDocument> {
    const tutoria = await this.findById(id);

    // Verificar permisos - convertir ambos a string
    const tutorId = (tutoria.tutor as any)._id?.toString() || tutoria.tutor.toString();
    const userIdStr = userId.toString();
    const esAdmin = userRol === 'Administrador' || userRol === 'admin';
    const esDueno = tutorId === userIdStr;
    
    if (!esAdmin && !esDueno) {
      throw new ForbiddenException('No tienes permiso para modificar esta tutoría');
    }

    const updated = await this.tutoriaModel
      .findByIdAndUpdate(id, updateDto, { new: true })
      .populate('tutor', 'nombre email')
      .populate('materia', 'nombre')
      .exec();

    if (!updated) {
      throw new NotFoundException('Tutoría no encontrada');
    }

    return updated;
  }

  async cambiarEstado(
    id: string, 
    estado: string, 
    userId: string, 
    userRol: string
  ): Promise<TutoriaDocument> {
    const tutoria = await this.findById(id);

    // Verificar permisos - convertir ambos a string
    const tutorId = (tutoria.tutor as any)._id?.toString() || tutoria.tutor.toString();
    const userIdStr = userId.toString();
    const esAdmin = userRol === 'Administrador' || userRol === 'admin';
    const esDueno = tutorId === userIdStr;
    
    if (!esAdmin && !esDueno) {
      throw new ForbiddenException('No tienes permiso para modificar esta tutoría');
    }

    const updated = await this.tutoriaModel
      .findByIdAndUpdate(id, { activa: estado === 'activa' }, { new: true })
      .populate('tutor', 'nombre email')
      .populate('materia', 'nombre')
      .exec();

    if (!updated) {
      throw new NotFoundException('Tutoría no encontrada');
    }

    return updated;
  }

  async togglePublicacion(
    id: string, 
    userId: string, 
    userRol: string
  ): Promise<TutoriaDocument> {
    const tutoria = await this.findById(id);

    // Verificar permisos - el tutor debe ser el dueño o ser administrador
    const tutorId = (tutoria.tutor as any)._id?.toString() || (tutoria.tutor as any).toString();
    
    // Debug logs
    console.log('=== togglePublicacion Debug ===');
    console.log('tutoria.tutor:', tutoria.tutor);
    console.log('tutorId extraído:', tutorId);
    console.log('userId recibido:', userId);
    console.log('userRol recibido:', userRol);
    console.log('tutorId === userId:', tutorId === userId);
    
    const esAdmin = userRol === 'Administrador' || userRol === 'admin';
    const esDueno = tutorId === userId;
    
    console.log('esAdmin:', esAdmin);
    console.log('esDueno:', esDueno);
    console.log('================================');
    
    if (!esAdmin && !esDueno) {
      throw new ForbiddenException('No tienes permiso para publicar/despublicar esta tutoría');
    }

    // Alternar el estado de publicación
    const updated = await this.tutoriaModel
      .findByIdAndUpdate(
        id, 
        { publicada: !tutoria.publicada }, 
        { new: true }
      )
      .populate('tutor', 'nombre email')
      .populate('materia', 'nombre')
      .exec();

    if (!updated) {
      throw new NotFoundException('Tutoría no encontrada');
    }

    return updated;
  }

  async incrementarInscritos(id: string): Promise<TutoriaDocument> {
    const tutoria = await this.findById(id);
    
    if (tutoria.cuposDisponibles <= 0) {
      throw new BadRequestException('No hay cupos disponibles');
    }

    const updated = await this.tutoriaModel
      .findByIdAndUpdate(
        id, 
        { $inc: { cuposDisponibles: -1 } }, 
        { new: true }
      )
      .populate('tutor', 'nombre email')
      .populate('materia', 'nombre')
      .exec();

    if (!updated) {
      throw new NotFoundException('Tutoría no encontrada');
    }

    return updated;
  }

  async decrementarInscritos(id: string): Promise<TutoriaDocument> {
    const tutoria = await this.findById(id);
    
    if (tutoria.cuposDisponibles >= tutoria.cuposOriginales) {
      return tutoria;
    }

    const updated = await this.tutoriaModel
      .findByIdAndUpdate(
        id, 
        { $inc: { cuposDisponibles: 1 } }, 
        { new: true }
      )
      .populate('tutor', 'nombre email')
      .populate('materia', 'nombre')
      .exec();

    if (!updated) {
      throw new NotFoundException('Tutoría no encontrada');
    }

    return updated;
  }

  async eliminar(id: string, userId: string, userRol: string): Promise<void> {
    const tutoria = await this.findById(id);

    // Verificar permisos - convertir ambos a string
    const tutorId = (tutoria.tutor as any)._id?.toString() || tutoria.tutor.toString();
    const userIdStr = userId.toString();
    const esAdmin = userRol === 'Administrador' || userRol === 'admin';
    const esDueno = tutorId === userIdStr;
    
    if (!esAdmin && !esDueno) {
      throw new ForbiddenException('No tienes permiso para eliminar esta tutoría');
    }

    await this.tutoriaModel.findByIdAndDelete(id).exec();
  }

  async contarPorEstado(): Promise<Record<string, number>> {
    const resultados = await this.tutoriaModel.aggregate([
      { $group: { _id: '$estado', count: { $sum: 1 } } },
    ]);

    const conteo: Record<string, number> = {
      programada: 0,
      en_curso: 0,
      completada: 0,
      cancelada: 0,
    };

    resultados.forEach((r) => {
      conteo[r._id] = r.count;
    });

    return conteo;
  }

  async getTutoriasPorSemana(tutorId?: string): Promise<any[]> {
    const hoy = new Date();
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - hoy.getDay());
    inicioSemana.setHours(0, 0, 0, 0);

    const finSemana = new Date(inicioSemana);
    finSemana.setDate(inicioSemana.getDate() + 7);

    const match: any = {
      fecha: { $gte: inicioSemana, $lt: finSemana },
    };

    if (tutorId) {
      match.tutor = new Types.ObjectId(tutorId);
    }

    return this.tutoriaModel
      .find(match)
      .populate('tutor', 'nombre')
      .populate('materia', 'nombre')
      .sort({ fecha: 1, horaInicio: 1 })
      .exec();
  }
}
