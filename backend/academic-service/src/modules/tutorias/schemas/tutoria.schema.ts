import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Tutoria extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Materia', required: true })
  materia: Types.ObjectId;

  @Prop({ required: true })
  materiaNombre: string;

  @Prop({ required: true, type: Date })
  fecha: Date;

  @Prop({ required: true })
  horaInicio: string;

  @Prop({ required: true })
  horaFin: string;

  @Prop({ required: true, min: 1 })
  cuposOriginales: number;

  @Prop({ required: true, min: 0 })
  cuposDisponibles: number;

  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true })
  tutor: Types.ObjectId;

  @Prop({ required: true })
  tutorNombre: string;

  @Prop({ default: true })
  activa: boolean;

  @Prop({ default: false })
  publicada: boolean;

  @Prop({ enum: ['Presencial', 'Virtual'], default: null })
  modalidadAula: string;

  @Prop({ default: null })
  nombreAula: string;

  @Prop({ default: null })
  enlaceReunion: string;

  @Prop({ default: false })
  aulaConfigurada: boolean;
}

export const TutoriaSchema = SchemaFactory.createForClass(Tutoria);

TutoriaSchema.index({ materia: 1, fecha: 1 });
