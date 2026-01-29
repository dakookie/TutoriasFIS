import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Solicitud extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Tutoria', required: true })
  tutoria: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true })
  estudiante: Types.ObjectId;

  @Prop({ required: true })
  estudianteNombre: string;

  @Prop({ enum: ['Pendiente', 'Aceptada', 'Rechazada'], default: 'Pendiente' })
  estado: string;

  @Prop()
  materia: string;

  @Prop({ type: Date })
  fecha: Date;

  @Prop()
  horaInicio: string;

  @Prop()
  horaFin: string;

  @Prop()
  tutor: string;
}

export const SolicitudSchema = SchemaFactory.createForClass(Solicitud);

SolicitudSchema.index({ tutoria: 1, estudiante: 1 }, { unique: true });
