import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Mensaje } from './schemas/mensaje.schema';
import { EnviarMensajeDto } from './dto/mensaje.dto';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class MensajesService {
  private readonly academicServiceUrl: string;

  constructor(
    @InjectModel(Mensaje.name) private mensajeModel: Model<Mensaje>,
    private configService: ConfigService,
  ) {
    this.academicServiceUrl = this.configService.get<string>('ACADEMIC_SERVICE_URL') || 'http://localhost:4002';
  }

  async enviarMensaje(
    dto: EnviarMensajeDto,
    emisorId: string,
    emisorNombre: string,
    emisorRol: string,
    jwtToken?: string,
  ): Promise<Mensaje[]> {
    // Obtener información de la tutoría desde academic-service
    const headers = jwtToken ? { Cookie: `token=${jwtToken}` } : {};
    const tutoriaResponse = await axios.get(`${this.academicServiceUrl}/tutorias/${dto.tutoriaId}`, { headers });

    const tutoria = tutoriaResponse.data.tutoria;
    if (!tutoria) {
      throw new NotFoundException('Tutoría no encontrada');
    }

    // Obtener solicitudes aceptadas
    const solicitudesResponse = await axios.get(`${this.academicServiceUrl}/solicitudes/tutoria/${dto.tutoriaId}`, { headers });

    const solicitudes = solicitudesResponse.data.solicitudes.filter(
      (s: any) => s.estado === 'Aceptada'
    );

    const mensajesGuardados: Mensaje[] = [];

    if (emisorRol === 'Tutor') {
      // El tutor envía a todos los estudiantes aceptados
      for (const solicitud of solicitudes) {
        const mensaje = new this.mensajeModel({
          tutoria: dto.tutoriaId,
          emisor: emisorId,
          emisorNombre,
          emisorRol,
          receptor: solicitud.estudiante,
          receptorNombre: solicitud.estudianteNombre,
          contenido: dto.contenido.trim(),
        });
        const saved = await mensaje.save();
        mensajesGuardados.push(saved);
      }
    } else {
      // El estudiante envía al tutor
      const mensajeAlTutor = new this.mensajeModel({
        tutoria: dto.tutoriaId,
        emisor: emisorId,
        emisorNombre,
        emisorRol,
        receptor: tutoria.tutor,
        receptorNombre: tutoria.tutorNombre,
        contenido: dto.contenido.trim(),
      });
      const saved = await mensajeAlTutor.save();
      mensajesGuardados.push(saved);

      // También enviar a otros estudiantes para chat grupal
      for (const solicitud of solicitudes) {
        if (solicitud.estudiante.toString() !== emisorId) {
          const mensaje = new this.mensajeModel({
            tutoria: dto.tutoriaId,
            emisor: emisorId,
            emisorNombre,
            emisorRol,
            receptor: solicitud.estudiante,
            receptorNombre: solicitud.estudianteNombre,
            contenido: dto.contenido.trim(),
          });
          const savedMsg = await mensaje.save();
          mensajesGuardados.push(savedMsg);
        }
      }
    }

    return mensajesGuardados;
  }

  async obtenerMensajesPorTutoria(tutoriaId: string, userId: string, jwtToken?: string): Promise<Mensaje[]> {
    // Verificar acceso a la tutoría
    const headers = jwtToken ? { Cookie: `token=${jwtToken}` } : {};
    const tutoriaResponse = await axios.get(`${this.academicServiceUrl}/tutorias/${tutoriaId}`, { headers });

    const tutoria = tutoriaResponse.data.tutoria;
    if (!tutoria) {
      throw new NotFoundException('Tutoría no encontrada');
    }

    const esTutor = tutoria.tutor.toString() === userId;

    if (!esTutor) {
      // Verificar si es estudiante aceptado
      const solicitudesResponse = await axios.get(`${this.academicServiceUrl}/solicitudes/tutoria/${tutoriaId}`, { headers });

      const solicitud = solicitudesResponse.data.solicitudes.find(
        (s: any) => s.estudiante.toString() === userId && s.estado === 'Aceptada'
      );

      if (!solicitud) {
        throw new ForbiddenException('No tienes permiso para ver estos mensajes');
      }
    }

    // Obtener mensajes
    const mensajes = await this.mensajeModel
      .find({ tutoria: tutoriaId })
      .sort({ createdAt: 1 })
      .limit(100)
      .lean();

    // Marcar como leídos los recibidos por este usuario
    await this.mensajeModel.updateMany(
      {
        tutoria: tutoriaId,
        receptor: userId,
        leido: false,
      },
      {
        leido: true,
        fechaLectura: new Date(),
      }
    );

    return mensajes;
  }

  async obtenerConversaciones(userId: string, userRol: string, jwtToken?: string) {
    let tutoriaIds: string[] = [];
    const headers = jwtToken ? { Cookie: `token=${jwtToken}` } : {};

    if (userRol === 'Tutor') {
      // Obtener tutorías donde es tutor
      const tutoriasResponse = await axios.get(`${this.academicServiceUrl}/tutorias/tutor/${userId}`, { headers });
      tutoriaIds = tutoriasResponse.data.tutorias.map((t: any) => t._id);
    } else {
      // Obtener tutorías donde es estudiante aceptado
      const solicitudesResponse = await axios.get(`${this.academicServiceUrl}/solicitudes/estudiante`, { headers });
      
      tutoriaIds = solicitudesResponse.data.solicitudes
        .filter((s: any) => s.estado === 'Aceptada')
        .map((s: any) => typeof s.tutoria === 'string' ? s.tutoria : s.tutoria._id);
    }

    // Obtener último mensaje y contador de no leídos por tutoría
    const conversaciones = [];
    for (const tutoriaId of tutoriaIds) {
      // Obtener información de la tutoría
      const tutoriaResponse = await axios.get(`${this.academicServiceUrl}/tutorias/${tutoriaId}`, { headers });
      const tutoria = tutoriaResponse.data.tutoria;

      if (!tutoria) continue;

      const ultimoMensaje = await this.mensajeModel
        .findOne({ tutoria: tutoriaId })
        .sort({ createdAt: -1 })
        .lean();

      const noLeidos = await this.mensajeModel.countDocuments({
        tutoria: tutoriaId,
        receptor: userId,
        leido: false,
      });

      conversaciones.push({
        tutoriaId,
        tutoriaTitulo: tutoria.titulo,
        materiaNombre: tutoria.materiaNombre,
        ultimoMensaje,
        noLeidos,
      });
    }

    return conversaciones;
  }

  async contarNoLeidos(userId: string): Promise<number> {
    return await this.mensajeModel.countDocuments({
      receptor: userId,
      leido: false,
    });
  }
}
