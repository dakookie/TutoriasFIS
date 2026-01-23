// Re-exportar todas las validaciones
export * from './auth';
export * from './tutoria';

// Helpers de validación comunes
export const validationMessages = {
  required: 'Este campo es requerido',
  email: 'Ingresa un email válido',
  minLength: (min: number) => `Mínimo ${min} caracteres`,
  maxLength: (max: number) => `Máximo ${max} caracteres`,
  onlyNumbers: 'Solo se permiten números',
  onlyLetters: 'Solo se permiten letras',
  passwordMismatch: 'Las contraseñas no coinciden',
} as const;

// Regex patterns comunes
export const patterns = {
  onlyNumbers: /^\d+$/,
  onlyLetters: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  username: /^[a-zA-Z0-9_]+$/,
  phone: /^\d{10}$/,
  time24h: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
} as const;
