import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Bibliografia extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Tutoria', required: true })
  tutoria: Types.ObjectId;

  @Prop({ required: true })
  titulo: string;

  @Prop()
  descripcion: string;

  @Prop({ required: true })
  tipo: string; // 'pdf', 'link', 'video', etc.

  @Prop()
  url: string;

  @Prop()
  archivo: string; // ruta del archivo si se subió

  @Prop({ type: Types.ObjectId, ref: 'Usuario' })
  creadoPor: Types.ObjectId;

  @Prop()
  nombreCreador: string;
}

export const BibliografiaSchema = SchemaFactory.createForClass(Bibliografia);
