import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PublicacionDocument = Publicacion & Document;

@Schema({ timestamps: true })
export class Publicacion {
  @Prop({ type: Types.ObjectId, ref: 'Tutoria', required: true })
  tutoria: Types.ObjectId;

  @Prop({ required: true, trim: true })
  titulo: string;

  @Prop({ required: true })
  contenido: string;

  @Prop({ default: null })
  imagen?: string; // Base64

  @Prop({ enum: ['png', 'jpg', 'jpeg', 'gif', null], default: null })
  tipoImagen?: string;

  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true })
  tutor: Types.ObjectId;

  @Prop({ required: true })
  tutorNombre: string;
}

export const PublicacionSchema = SchemaFactory.createForClass(Publicacion);

// Índice para búsquedas por tutoría
PublicacionSchema.index({ tutoria: 1, createdAt: -1 });
