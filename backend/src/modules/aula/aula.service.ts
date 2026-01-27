import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Publicacion, PublicacionDocument } from './schemas/publicacion.schema';
import { Bibliografia, BibliografiaDocument } from './schemas/bibliografia.schema';
import { Tutoria, TutoriaDocument } from '../tutorias/schemas/tutoria.schema';
import { Solicitud, SolicitudDocument } from '../solicitudes/schemas/solicitud.schema';
import {
  ConfigurarAulaDto,
  CreatePublicacionDto,
  UpdatePublicacionDto,
  CreateBibliografiaDto,
  UpdateBibliografiaDto,
} from './dto/aula.dto';

@Injectable()
export class AulaService {
  constructor(
    @InjectModel(Publicacion.name) private publicacionModel: Model<PublicacionDocument>,
    @InjectModel(Bibliografia.name) private bibliografiaModel: Model<BibliografiaDocument>,
    @InjectModel(Tutoria.name) private tutoriaModel: Model<TutoriaDocument>,
    @InjectModel(Solicitud.name) private solicitudModel: Model<SolicitudDocument>,
  ) {}

  // Verificar acceso al aula
  async verificarAcceso(tutoriaId: string, userId: string, userRol: string): Promise<{ tutoria: TutoriaDocument; esTutor: boolean; esEstudiante: boolean }> {
    const tutoria = await this.tutoriaModel
      .findById(tutoriaId)
      .populate('tutor', 'nombre apellido email')
      .populate('materia', 'nombre')
      .exec();

    if (!tutoria) {
      throw new NotFoundException('Tutoría no encontrada');
    }

    const esTutor = tutoria.tutor._id.toString() === userId.toString();
    let esEstudiante = false;

    if (userRol === 'Estudiante') {
      const solicitud = await this.solicitudModel.findOne({
        tutoria: tutoriaId,
        estudiante: userId,
        estado: 'Aceptada',
      });
      esEstudiante = !!solicitud;
    }

    if (!esTutor && !esEstudiante) {
      throw new ForbiddenException('No tienes acceso a esta aula');
    }

    return { tutoria, esTutor, esEstudiante };
  }

  // Obtener información del aula
  async getAulaInfo(tutoriaId: string, userId: string, userRol: string) {
    const { tutoria, esTutor, esEstudiante } = await this.verificarAcceso(tutoriaId, userId, userRol);
    return { tutoria, esTutor, esEstudiante };
  }

  // Configurar aula (primera vez)
  async configurarAula(tutoriaId: string, dto: ConfigurarAulaDto, userId: string) {
    const tutoria = await this.tutoriaModel.findById(tutoriaId);

    if (!tutoria) {
      throw new NotFoundException('Tutoría no encontrada');
    }

    if (tutoria.tutor.toString() !== userId.toString()) {
      throw new ForbiddenException('No tienes permiso para configurar esta aula');
    }

    if (tutoria.aulaConfigurada) {
      throw new BadRequestException('El aula ya está configurada');
    }

    // Validar según modalidad
    if (dto.modalidadAula === 'Presencial' && !dto.nombreAula) {
      throw new BadRequestException('El nombre del aula es requerido para modalidad presencial');
    }

    if (dto.modalidadAula === 'Virtual' && !dto.enlaceReunion) {
      throw new BadRequestException('El enlace de reunión es requerido para modalidad virtual');
    }

    tutoria.modalidadAula = dto.modalidadAula;
    tutoria.nombreAula = dto.modalidadAula === 'Presencial' ? dto.nombreAula : undefined;
    tutoria.enlaceAula = dto.modalidadAula === 'Virtual' ? dto.enlaceReunion : undefined;
    tutoria.aulaConfigurada = true;

    await tutoria.save();
    return tutoria;
  }

  // Editar configuración del aula
  async editarConfiguracion(tutoriaId: string, dto: ConfigurarAulaDto, userId: string) {
    const tutoria = await this.tutoriaModel.findById(tutoriaId);

    if (!tutoria) {
      throw new NotFoundException('Tutoría no encontrada');
    }

    if (tutoria.tutor.toString() !== userId.toString()) {
      throw new ForbiddenException('No tienes permiso para editar esta aula');
    }

    // Validar según modalidad
    if (dto.modalidadAula === 'Presencial' && !dto.nombreAula) {
      throw new BadRequestException('El nombre del aula es requerido para modalidad presencial');
    }

    if (dto.modalidadAula === 'Virtual' && !dto.enlaceReunion) {
      throw new BadRequestException('El enlace de reunión es requerido para modalidad virtual');
    }

    tutoria.modalidadAula = dto.modalidadAula;
    tutoria.nombreAula = dto.modalidadAula === 'Presencial' ? dto.nombreAula : undefined;
    tutoria.enlaceAula = dto.modalidadAula === 'Virtual' ? dto.enlaceReunion : undefined;
    tutoria.aulaConfigurada = true;

    await tutoria.save();
    return tutoria;
  }

  // ========== PUBLICACIONES ==========

  async crearPublicacion(tutoriaId: string, dto: CreatePublicacionDto, userId: string, userName: string) {
    const tutoria = await this.tutoriaModel.findById(tutoriaId);

    if (!tutoria) {
      throw new NotFoundException('Tutoría no encontrada');
    }

    if (tutoria.tutor.toString() !== userId.toString()) {
      throw new ForbiddenException('No tienes permiso para publicar en esta tutoría');
    }

    // Validar imagen si se proporciona
    if (dto.imagen && dto.tipoImagen) {
      const tiposPermitidos = ['png', 'jpg', 'jpeg', 'gif'];
      if (!tiposPermitidos.includes(dto.tipoImagen.toLowerCase())) {
        throw new BadRequestException('Solo se permiten imágenes (PNG, JPG, JPEG, GIF)');
      }
    }

    const publicacion = new this.publicacionModel({
      tutoria: tutoriaId,
      titulo: dto.titulo.trim(),
      contenido: dto.contenido.trim(),
      imagen: dto.imagen || null,
      tipoImagen: dto.tipoImagen ? dto.tipoImagen.toLowerCase() : null,
      tutor: userId,
      tutorNombre: userName,
    });

    await publicacion.save();
    return publicacion;
  }

  async getPublicaciones(tutoriaId: string) {
    return this.publicacionModel
      .find({ tutoria: tutoriaId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async editarPublicacion(tutoriaId: string, publicacionId: string, dto: UpdatePublicacionDto, userId: string) {
    const publicacion = await this.publicacionModel.findById(publicacionId);

    if (!publicacion) {
      throw new NotFoundException('Publicación no encontrada');
    }

    if (publicacion.tutoria.toString() !== tutoriaId) {
      throw new BadRequestException('La publicación no pertenece a esta tutoría');
    }

    if (publicacion.tutor.toString() !== userId.toString()) {
      throw new ForbiddenException('No tienes permiso para editar esta publicación');
    }

    publicacion.titulo = dto.titulo.trim();
    publicacion.contenido = dto.contenido.trim();

    if (dto.imagen && dto.tipoImagen) {
      publicacion.imagen = dto.imagen;
      publicacion.tipoImagen = dto.tipoImagen.toLowerCase();
    }

    await publicacion.save();
    return publicacion;
  }

  async eliminarPublicacion(tutoriaId: string, publicacionId: string, userId: string) {
    const publicacion = await this.publicacionModel.findById(publicacionId);

    if (!publicacion) {
      throw new NotFoundException('Publicación no encontrada');
    }

    if (publicacion.tutoria.toString() !== tutoriaId) {
      throw new BadRequestException('La publicación no pertenece a esta tutoría');
    }

    if (publicacion.tutor.toString() !== userId.toString()) {
      throw new ForbiddenException('No tienes permiso para eliminar esta publicación');
    }

    await this.publicacionModel.findByIdAndDelete(publicacionId);
    return { message: 'Publicación eliminada exitosamente' };
  }

  // ========== BIBLIOGRAFÍAS ==========

  async crearBibliografia(tutoriaId: string, dto: CreateBibliografiaDto, userId: string, userName: string) {
    const tutoria = await this.tutoriaModel.findById(tutoriaId);

    if (!tutoria) {
      throw new NotFoundException('Tutoría no encontrada');
    }

    if (tutoria.tutor.toString() !== userId.toString()) {
      throw new ForbiddenException('No tienes permiso para subir bibliografía en esta tutoría');
    }

    // Validar tipo de archivo
    const tiposPermitidos = ['pdf', 'docx', 'xlsx', 'ppt', 'pptx'];
    if (!tiposPermitidos.includes(dto.tipoArchivo.toLowerCase())) {
      throw new BadRequestException('Solo se permiten documentos: PDF, DOCX, XLSX, PPT, PPTX');
    }

    const bibliografia = new this.bibliografiaModel({
      tutoria: tutoriaId,
      titulo: dto.titulo.trim(),
      descripcion: dto.descripcion || '',
      archivo: dto.archivo,
      tipoArchivo: dto.tipoArchivo.toLowerCase(),
      tutor: userId,
      tutorNombre: userName,
    });

    await bibliografia.save();
    return bibliografia;
  }

  async getBibliografias(tutoriaId: string) {
    return this.bibliografiaModel
      .find({ tutoria: tutoriaId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async editarBibliografia(tutoriaId: string, bibliografiaId: string, dto: UpdateBibliografiaDto, userId: string) {
    const bibliografia = await this.bibliografiaModel.findById(bibliografiaId);

    if (!bibliografia) {
      throw new NotFoundException('Bibliografía no encontrada');
    }

    if (bibliografia.tutoria.toString() !== tutoriaId) {
      throw new BadRequestException('La bibliografía no pertenece a esta tutoría');
    }

    if (bibliografia.tutor.toString() !== userId.toString()) {
      throw new ForbiddenException('No tienes permiso para editar esta bibliografía');
    }

    bibliografia.titulo = dto.titulo.trim();
    await bibliografia.save();
    return bibliografia;
  }

  async eliminarBibliografia(tutoriaId: string, bibliografiaId: string, userId: string) {
    const bibliografia = await this.bibliografiaModel.findById(bibliografiaId);

    if (!bibliografia) {
      throw new NotFoundException('Bibliografía no encontrada');
    }

    if (bibliografia.tutoria.toString() !== tutoriaId) {
      throw new BadRequestException('La bibliografía no pertenece a esta tutoría');
    }

    if (bibliografia.tutor.toString() !== userId.toString()) {
      throw new ForbiddenException('No tienes permiso para eliminar esta bibliografía');
    }

    await this.bibliografiaModel.findByIdAndDelete(bibliografiaId);
    return { message: 'Bibliografía eliminada exitosamente' };
  }
}
