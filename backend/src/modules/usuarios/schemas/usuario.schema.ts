import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as bcrypt from 'bcryptjs';

export type UsuarioDocument = Usuario & Document;

export enum Rol {
  ADMINISTRADOR = 'Administrador',
  TUTOR = 'Tutor',
  ESTUDIANTE = 'Estudiante',
}

@Schema({ timestamps: true })
export class Usuario {
  @Prop({ required: true, trim: true })
  nombre: string;

  @Prop({ required: true, trim: true })
  apellido: string;

  @Prop({ unique: true, sparse: true, trim: true })
  username?: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, minlength: 6 })
  password: string;

  @Prop({ required: true, enum: Rol })
  rol: Rol;

  @Prop([String])
  materias: string[];

  @Prop({ default: false })
  activo: boolean;

  @Prop({ default: null })
  pdf?: string;

  @Prop({ default: null })
  resetPasswordToken?: string;

  @Prop({ default: null })
  resetPasswordExpires?: Date;

  // Método para comparar contraseñas
  compararPassword: (passwordIngresada: string) => Promise<boolean>;
}

export const UsuarioSchema = SchemaFactory.createForClass(Usuario);

// Hook pre-save para hashear contraseña
UsuarioSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Método para comparar contraseñas
UsuarioSchema.methods.compararPassword = async function (
  passwordIngresada: string,
): Promise<boolean> {
  return bcrypt.compare(passwordIngresada, this.password);
};
