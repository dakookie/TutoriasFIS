import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MensajeDocument = Mensaje & Document;

@Schema({ timestamps: true })
export class Mensaje {
  @Prop({ type: Types.ObjectId, ref: 'Tutoria', required: true })
  tutoria: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true })
  emisor: Types.ObjectId;

  @Prop({ required: true })
  emisorNombre: string;

  @Prop({ enum: ['Tutor', 'Estudiante'], required: true })
  emisorRol: string;

  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true })
  receptor: Types.ObjectId;

  @Prop({ required: true })
  receptorNombre: string;

  @Prop({ required: true, trim: true, maxlength: 1000 })
  contenido: string;

  @Prop({ default: false })
  leido: boolean;

  @Prop({ default: null })
  fechaLectura?: Date;
}

export const MensajeSchema = SchemaFactory.createForClass(Mensaje);

// Índices para mejorar rendimiento
MensajeSchema.index({ tutoria: 1, emisor: 1, receptor: 1 });
MensajeSchema.index({ receptor: 1, leido: 1 });
