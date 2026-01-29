import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MateriaDocument = Materia & Document;

@Schema({ timestamps: true })
export class Materia {
  @Prop({ required: true, unique: true, trim: true })
  nombre: string;

  @Prop({ required: true, unique: true, trim: true, uppercase: true })
  codigo: string;

  @Prop({ required: true, min: 1, max: 10 })
  semestre: number;

  @Prop({ default: true })
  activa: boolean;
}

export const MateriaSchema = SchemaFactory.createForClass(Materia);

MateriaSchema.index({ nombre: 1 });
MateriaSchema.index({ semestre: 1 });
