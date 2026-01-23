import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Mensaje, MensajeDocument } from './schemas/mensaje.schema';
import { CreateMensajeDto } from './dto/mensaje.dto';

@Injectable()
export class MensajesService {
  constructor(
    @InjectModel(Mensaje.name) private mensajeModel: Model<MensajeDocument>,
  ) {}

  async crear(createDto: CreateMensajeDto, emisorId: string): Promise<MensajeDocument> {
    const mensaje = new this.mensajeModel({
      ...createDto,
      emisor: emisorId,
    });

    const saved = await mensaje.save();
    return this.findById(saved._id.toString());
  }

  async findById(id: string): Promise<MensajeDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de mensaje inválido');
    }

    const mensaje = await this.mensajeModel
      .findById(id)
      .populate('emisor', 'nombre email')
      .populate('receptor', 'nombre email')
      .exec();

    if (!mensaje) {
      throw new NotFoundException('Mensaje no encontrado');
    }

    return mensaje;
  }

  async getConversacion(userId1: string, userId2: string): Promise<MensajeDocument[]> {
    return this.mensajeModel
      .find({
        $or: [
          { emisor: userId1, receptor: userId2 },
          { emisor: userId2, receptor: userId1 },
        ],
      })
      .populate('emisor', 'nombre email')
      .populate('receptor', 'nombre email')
      .sort({ createdAt: 1 })
      .exec();
  }

  async getMensajesTutoria(tutoriaId: string): Promise<MensajeDocument[]> {
    return this.mensajeModel
      .find({ tutoria: tutoriaId })
      .populate('emisor', 'nombre email')
      .populate('receptor', 'nombre email')
      .sort({ createdAt: 1 })
      .exec();
  }

  async getChatsUsuario(userId: string): Promise<any[]> {
    // Obtener conversaciones únicas del usuario
    const mensajes = await this.mensajeModel.aggregate([
      {
        $match: {
          $or: [
            { emisor: new Types.ObjectId(userId) },
            { receptor: new Types.ObjectId(userId) },
          ],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$emisor', new Types.ObjectId(userId)] },
              '$receptor',
              '$emisor',
            ],
          },
          ultimoMensaje: { $first: '$$ROOT' },
          noLeidos: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receptor', new Types.ObjectId(userId)] },
                    { $eq: ['$leido', false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: 'usuarios',
          localField: '_id',
          foreignField: '_id',
          as: 'usuario',
        },
      },
      {
        $unwind: '$usuario',
      },
      {
        $project: {
          usuario: {
            _id: 1,
            nombre: 1,
            email: 1,
          },
          ultimoMensaje: {
            contenido: 1,
            createdAt: 1,
          },
          noLeidos: 1,
        },
      },
      {
        $sort: { 'ultimoMensaje.createdAt': -1 },
      },
    ]);

    return mensajes;
  }

  async marcarComoLeido(id: string, userId: string): Promise<MensajeDocument> {
    const mensaje = await this.findById(id);

    const receptorId = (mensaje.receptor as any)._id?.toString() || 
                      mensaje.receptor.toString();

    if (receptorId !== userId) {
      throw new ForbiddenException('No puedes marcar como leído un mensaje que no te pertenece');
    }

    const updated = await this.mensajeModel
      .findByIdAndUpdate(id, { leido: true }, { new: true })
      .populate('emisor', 'nombre email')
      .populate('receptor', 'nombre email')
      .exec();

    if (!updated) {
      throw new NotFoundException('Mensaje no encontrado');
    }

    return updated;
  }

  async marcarConversacionLeida(otroUsuarioId: string, userId: string): Promise<number> {
    const resultado = await this.mensajeModel.updateMany(
      {
        emisor: otroUsuarioId,
        receptor: userId,
        leido: false,
      },
      { leido: true },
    );

    return resultado.modifiedCount;
  }

  async contarNoLeidos(userId: string): Promise<number> {
    return this.mensajeModel.countDocuments({
      receptor: userId,
      leido: false,
    });
  }

  async eliminar(id: string, userId: string): Promise<void> {
    const mensaje = await this.findById(id);

    const emisorId = (mensaje.emisor as any)._id?.toString() || 
                    mensaje.emisor.toString();

    if (emisorId !== userId) {
      throw new ForbiddenException('Solo puedes eliminar tus propios mensajes');
    }

    await this.mensajeModel.findByIdAndDelete(id).exec();
  }
}
