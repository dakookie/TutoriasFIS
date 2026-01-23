import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility para combinar clases de Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formatear fecha para mostrar
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('es-EC', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Formatear fecha corta
export function formatDateShort(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('es-EC', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// Formatear hora
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

// Capitalizar primera letra
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Obtener iniciales de nombre
export function getInitials(nombre: string, apellido?: string): string {
  const n = nombre?.charAt(0).toUpperCase() || '';
  const a = apellido?.charAt(0).toUpperCase() || '';
  return n + a;
}

// Truncar texto
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

// Validar si una fecha es hoy o futura
export function isTodayOrFuture(date: string | Date): boolean {
  const d = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d >= today;
}

// Obtener color por rol
export function getRolColor(rol: string): string {
  const colors: Record<string, string> = {
    Administrador: 'bg-red-100 text-red-800',
    Tutor: 'bg-blue-100 text-blue-800',
    Estudiante: 'bg-green-100 text-green-800',
  };
  return colors[rol] || 'bg-gray-100 text-gray-800';
}

// Obtener color por estado de solicitud
export function getEstadoSolicitudColor(estado: string): string {
  const colors: Record<string, string> = {
    pendiente: 'bg-yellow-100 text-yellow-800',
    aceptada: 'bg-green-100 text-green-800',
    rechazada: 'bg-red-100 text-red-800',
    cancelada: 'bg-gray-100 text-gray-800',
  };
  return colors[estado] || 'bg-gray-100 text-gray-800';
}
