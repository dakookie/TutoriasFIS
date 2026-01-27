import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TutoriaDocument = Tutoria & Document;

export enum ModalidadAula {
  PRESENCIAL = 'Presencial',
  VIRTUAL = 'Virtual',
}

@Schema({ timestamps: true })
export class Tutoria {
  @Prop({ type: Types.ObjectId, ref: 'Materia', required: true })
  materia: Types.ObjectId;

  @Prop({ required: true })
  materiaNombre: string;

  @Prop({ required: true })
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

  @Prop({ enum: ModalidadAula, default: null })
  modalidadAula?: ModalidadAula;

  @Prop({ default: null })
  nombreAula?: string;

  @Prop({ default: null })
  enlaceAula?: string;

  @Prop({ default: null })
  infoAdicionalAula?: string;

  @Prop({ default: false })
  aulaConfigurada: boolean;

  @Prop({ default: false })
  encuestaEnviada: boolean;
}

export const TutoriaSchema = SchemaFactory.createForClass(Tutoria);

// Índice para búsquedas por tutor y fecha
TutoriaSchema.index({ tutor: 1, fecha: 1 });
TutoriaSchema.index({ materia: 1, activa: 1, publicada: 1 });
