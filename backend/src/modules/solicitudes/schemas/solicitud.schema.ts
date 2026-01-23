import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SolicitudDocument = Solicitud & Document;

export enum EstadoSolicitud {
  PENDIENTE = 'Pendiente',
  ACEPTADA = 'Aceptada',
  RECHAZADA = 'Rechazada',
}

@Schema({ timestamps: true })
export class Solicitud {
  @Prop({ type: Types.ObjectId, ref: 'Tutoria', required: true })
  tutoria: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true })
  estudiante: Types.ObjectId;

  @Prop({ required: true })
  estudianteNombre: string;

  @Prop({ enum: EstadoSolicitud, default: EstadoSolicitud.PENDIENTE })
  estado: EstadoSolicitud;

  // Datos desnormalizados para consultas rápidas
  @Prop()
  materia?: string;

  @Prop()
  fecha?: Date;

  @Prop()
  horaInicio?: string;

  @Prop()
  horaFin?: string;

  @Prop()
  tutor?: string;
}

export const SolicitudSchema = SchemaFactory.createForClass(Solicitud);

// Índice compuesto para evitar solicitudes duplicadas
SolicitudSchema.index({ tutoria: 1, estudiante: 1 }, { unique: true });
