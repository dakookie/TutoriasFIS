import { z } from 'zod';

// ==================== ESQUEMAS DE VALIDACIÓN ====================

// Schema base para validación en formularios (input es string)
const tutoriaBaseSchema = z.object({
  materia: z
    .string()
    .min(1, 'La materia es requerida'),
  fecha: z
    .string()
    .min(1, 'La fecha es requerida')
    .refine((val) => {
      const fecha = new Date(val);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      return fecha >= hoy;
    }, 'La fecha no puede ser en el pasado'),
  horaInicio: z
    .string()
    .min(1, 'La hora de inicio es requerida')
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)'),
  horaFin: z
    .string()
    .min(1, 'La hora de fin es requerida')
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)'),
  cuposOriginales: z
    .string()
    .min(1, 'Los cupos son requeridos')
    .regex(/^\d+$/, 'Solo números permitidos')
    .refine((val) => parseInt(val) >= 1, 'Mínimo 1 cupo')
    .refine((val) => parseInt(val) <= 50, 'Máximo 50 cupos'),
  modalidadAula: z
    .enum(['Presencial', 'Virtual', ''])
    .optional()
    .transform((val) => val === '' ? undefined : val),
  nombreAula: z
    .string()
    .max(100, 'Máximo 100 caracteres')
    .optional()
    .or(z.literal('')),
  enlaceAula: z
    .string()
    .optional()
    .refine((val) => !val || val === '' || /^https?:\/\/.+/.test(val), 'URL inválida'),
});

// Schema con refinamiento de horas
export const tutoriaSchema = tutoriaBaseSchema.refine((data) => {
  if (!data.horaInicio || !data.horaFin) return true;
  return data.horaInicio < data.horaFin;
}, {
  message: 'La hora de fin debe ser posterior a la hora de inicio',
  path: ['horaFin'],
});

// Configuración de Aula
export const aulaConfigSchema = z.object({
  modalidadAula: z
    .enum(['Presencial', 'Virtual'], { 
      message: 'Selecciona una modalidad' 
    }),
  nombreAula: z
    .string()
    .min(1, 'El nombre/ubicación es requerido')
    .max(100, 'Máximo 100 caracteres'),
  enlaceAula: z
    .string()
    .url('URL inválida')
    .optional()
    .or(z.literal('')),
});

// ==================== TIPOS INFERIDOS ====================

// Tipo para el formulario (input)
export type TutoriaFormData = z.input<typeof tutoriaSchema>;
export type AulaConfigFormData = z.infer<typeof aulaConfigSchema>;
