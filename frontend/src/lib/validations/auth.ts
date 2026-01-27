import { z } from 'zod';

// ==================== ESQUEMAS DE VALIDACIÓN ====================

// Login
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El email o usuario es requerido')
    .max(100, 'Máximo 100 caracteres'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(6, 'Mínimo 6 caracteres')
    .max(50, 'Máximo 50 caracteres'),
});

// Registro Base
const registroBaseSchema = z.object({
  nombre: z
    .string()
    .min(1, 'El nombre es requerido')
    .min(2, 'Mínimo 2 caracteres')
    .max(50, 'Máximo 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Solo letras permitidas'),
  apellido: z
    .string()
    .min(1, 'El apellido es requerido')
    .min(2, 'Mínimo 2 caracteres')
    .max(50, 'Máximo 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Solo letras permitidas'),
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Formato de email inválido')
    .max(100, 'Máximo 100 caracteres'),
  username: z
    .string()
    .min(3, 'Mínimo 3 caracteres')
    .max(30, 'Máximo 30 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'Solo letras, números y guión bajo')
    .optional()
    .or(z.literal('')),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(6, 'Mínimo 6 caracteres')
    .max(50, 'Máximo 50 caracteres'),
  confirmPassword: z
    .string()
    .min(1, 'Confirma tu contraseña'),
});

// Registro Estudiante
export const registroEstudianteSchema = registroBaseSchema
  .extend({
    rol: z.literal('Estudiante'),
    carnetEstudiantil: z
      .string()
      .optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

// Registro Tutor
export const registroTutorSchema = registroBaseSchema
  .extend({
    rol: z.literal('Tutor'),
    materias: z
      .array(z.string())
      .min(1, 'Selecciona al menos una materia'),
    pdf: z
      .string()
      .optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

// Forgot Password
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Formato de email inválido'),
});

// Reset Password
export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, 'La contraseña es requerida')
      .min(6, 'Mínimo 6 caracteres')
      .max(50, 'Máximo 50 caracteres'),
    confirmPassword: z
      .string()
      .min(1, 'Confirma tu contraseña'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

// ==================== TIPOS INFERIDOS ====================

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegistroEstudianteFormData = z.infer<typeof registroEstudianteSchema>;
export type RegistroTutorFormData = z.infer<typeof registroTutorSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
