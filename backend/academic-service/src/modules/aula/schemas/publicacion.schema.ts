import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Publicacion extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Tutoria', required: true })
  tutoria: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true })
  autor: Types.ObjectId;

  @Prop({ required: true })
  nombreAutor: string;

  @Prop({ required: true })
  titulo: string;

  @Prop({ required: true })
  contenido: string;

  @Prop()
  archivo: string; // ruta del archivo adjunto si existe

  @Prop()
  tipoArchivo: string; // tipo de archivo (imagen/png, etc.)

  @Prop({ default: false })
  destacada: boolean; // anuncios importantes del tutor
}

export const PublicacionSchema = SchemaFactory.createForClass(Publicacion);
