import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Respuesta extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true })
  estudiante: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Tutoria', required: true })
  tutoria: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Pregunta', required: true })
  pregunta: Types.ObjectId;

  @Prop({ required: true, min: 1, max: 5 })
  calificacion: number;

  @Prop()
  comentario: string;
}

export const RespuestaSchema = SchemaFactory.createForClass(Respuesta);

// Índice único: Un estudiante solo puede responder una vez por cada pregunta de una tutoría
RespuestaSchema.index({ tutoria: 1, estudiante: 1, pregunta: 1 }, { unique: true });
