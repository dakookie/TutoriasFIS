import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Mensaje extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Tutoria', required: true })
  tutoria: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true })
  emisor: Types.ObjectId;

  @Prop({ required: true })
  emisorNombre: string;

  @Prop({ required: true, enum: ['Tutor', 'Estudiante', 'Administrador'] })
  emisorRol: string;

  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true })
  receptor: Types.ObjectId;

  @Prop({ required: true })
  receptorNombre: string;

  @Prop({ required: true, trim: true, maxlength: 1000 })
  contenido: string;

  @Prop({ default: false })
  leido: boolean;

  @Prop({ type: Date, default: null })
  fechaLectura: Date;
}

export const MensajeSchema = SchemaFactory.createForClass(Mensaje);

// Índices
MensajeSchema.index({ tutoria: 1, createdAt: -1 });
MensajeSchema.index({ receptor: 1, leido: 1 });
MensajeSchema.index({ emisor: 1, receptor: 1 });
