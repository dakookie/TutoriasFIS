import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Bibliografia } from './schemas/bibliografia.schema';
import { Publicacion } from './schemas/publicacion.schema';
import { Tutoria } from '../tutorias/schemas/tutoria.schema';
import { Solicitud } from '../solicitudes/schemas/solicitud.schema';
import { CrearBibliografiaDto, CrearPublicacionDto } from './dto/aula.dto';

@Injectable()
export class AulaService {
  constructor(
    @InjectModel(Bibliografia.name) private bibliografiaModel: Model<Bibliografia>,
    @InjectModel(Publicacion.name) private publicacionModel: Model<Publicacion>,
    @InjectModel(Tutoria.name) private tutoriaModel: Model<Tutoria>,
    @InjectModel(Solicitud.name) private solicitudModel: Model<Solicitud>,
  ) {}

  // Bibliografías
  async crearBibliografia(
    dto: CrearBibliografiaDto,
    usuarioId: string,
    nombreCreador: string,
  ): Promise<Bibliografia> {
    // Normalizar tipo desde tipoArchivo si viene del frontend
    const tipo = dto.tipo || dto.tipoArchivo || 'Documento';
    
    const bibliografia = new this.bibliografiaModel({
      tutoria: dto.tutoria,
      titulo: dto.titulo,
      descripcion: dto.descripcion,
      tipo,
      url: dto.url,
      archivo: dto.archivo,
      creadoPor: usuarioId,
      nombreCreador,
    });
    return bibliografia.save();
  }

  async findBibliografiasByTutoria(tutoriaId: string): Promise<Bibliografia[]> {
    return this.bibliografiaModel
      .find({ tutoria: tutoriaId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async deleteBibliografia(id: string): Promise<void> {
    const result = await this.bibliografiaModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      throw new NotFoundException('Bibliografía no encontrada');
    }
  }

  // Publicaciones
  async crearPublicacion(
    dto: CrearPublicacionDto,
    autorId: string,
    nombreAutor: string,
  ): Promise<Publicacion> {
    // Normalizar archivo desde imagen si viene del frontend
    const archivo = dto.archivo || dto.imagen;
    
    const publicacion = new this.publicacionModel({
      tutoria: dto.tutoria,
      titulo: dto.titulo,
      contenido: dto.contenido,
      archivo,
      tipoArchivo: dto.tipoImagen,
      destacada: dto.destacada || false,
      autor: autorId,
      nombreAutor,
    });
    return publicacion.save();
  }

  async findPublicacionesByTutoria(tutoriaId: string): Promise<Publicacion[]> {
    return this.publicacionModel
      .find({ tutoria: tutoriaId })
      .sort({ destacada: -1, createdAt: -1 })
      .exec();
  }

  async deletePublicacion(id: string): Promise<void> {
    const result = await this.publicacionModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      throw new NotFoundException('Publicación no encontrada');
    }
  }

  async findAulaData(tutoriaId: string, userId: string, userRol: string) {
    // Verificar que la tutoría existe
    const tutoria = await this.tutoriaModel.findById(tutoriaId);
    
    if (!tutoria) {
      throw new NotFoundException('Tutoría no encontrada');
    }

    // Verificar permisos: el tutor de la tutoría o estudiantes con solicitud aceptada
    const esTutor = tutoria.tutor.toString() === userId;
    
    let esEstudiante = false;
    let motivoRechazo = '';
    
    if (userRol === 'Estudiante') {
      const solicitud = await this.solicitudModel.findOne({
        tutoria: tutoriaId,
        estudiante: userId,
        estado: 'Aceptada'
      });
      esEstudiante = !!solicitud;
      
      if (!esEstudiante) {
        // Verificar si tiene solicitud pero no aceptada
        const solicitudExistente = await this.solicitudModel.findOne({
          tutoria: tutoriaId,
          estudiante: userId
        });
        if (solicitudExistente) {
          motivoRechazo = `Tu solicitud está en estado: ${solicitudExistente.estado}`;
        } else {
          motivoRechazo = 'No tienes una solicitud para esta tutoría';
        }
      }
    } else if (userRol === 'Administrador') {
      motivoRechazo = 'Los administradores no pueden acceder a las aulas virtuales';
    }

    if (!esTutor && !esEstudiante) {
      throw new ForbiddenException(motivoRechazo || 'No tienes acceso a esta aula');
    }

    const [bibliografias, publicaciones] = await Promise.all([
      this.findBibliografiasByTutoria(tutoriaId),
      this.findPublicacionesByTutoria(tutoriaId),
    ]);

    return {
      tutoria,
      esTutor,
      esEstudiante,
      bibliografias,
      publicaciones,
    };
  }
}
