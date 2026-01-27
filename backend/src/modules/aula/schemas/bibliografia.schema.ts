import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BibliografiaDocument = Bibliografia & Document;

@Schema({ timestamps: true })
export class Bibliografia {
  @Prop({ type: Types.ObjectId, ref: 'Tutoria', required: true })
  tutoria: Types.ObjectId;

  @Prop({ required: true, trim: true })
  titulo: string;

  @Prop({ trim: true, default: '' })
  descripcion?: string;

  @Prop({ required: true })
  archivo: string; // Base64 del archivo

  @Prop({ enum: ['pdf', 'docx', 'xlsx', 'ppt', 'pptx'], required: true })
  tipoArchivo: string;

  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true })
  tutor: Types.ObjectId;

  @Prop({ required: true })
  tutorNombre: string;
}

export const BibliografiaSchema = SchemaFactory.createForClass(Bibliografia);

// Índice para búsquedas por tutoría
BibliografiaSchema.index({ tutoria: 1, createdAt: -1 });
