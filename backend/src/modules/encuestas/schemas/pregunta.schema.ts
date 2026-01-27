import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PreguntaDocument = Pregunta & Document;

@Schema({ timestamps: true })
export class Pregunta {
  @Prop({ required: true })
  pregunta: string;

  @Prop({ type: Types.ObjectId, ref: 'Materia', required: true })
  materia: Types.ObjectId;

  @Prop({ required: true })
  materiaNombre: string;

  @Prop({ default: true })
  activa: boolean;
}

export const PreguntaSchema = SchemaFactory.createForClass(Pregunta);

// Índice para búsquedas por materia
PreguntaSchema.index({ materia: 1, activa: 1 });
