import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RespuestaDocument = Respuesta & Document;

@Schema({ timestamps: true })
export class Respuesta {
  @Prop({ type: Types.ObjectId, ref: 'Tutoria', required: true })
  tutoria: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true })
  estudiante: Types.ObjectId;

  @Prop({ type: Map, of: Number, required: true })
  respuestas: Map<string, number>; // preguntaId: calificacion (1-5)
}

export const RespuestaSchema = SchemaFactory.createForClass(Respuesta);

// Índice compuesto para evitar respuestas duplicadas
RespuestaSchema.index({ tutoria: 1, estudiante: 1 }, { unique: true });
