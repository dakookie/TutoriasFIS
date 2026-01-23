'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, EyeOff, Upload, X } from 'lucide-react';
import { 
  registroEstudianteSchema, 
  registroTutorSchema, 
  RegistroEstudianteFormData, 
  RegistroTutorFormData 
} from '@/lib/validations/auth';
import api from '@/lib/api/client';

type RegistroFormData = RegistroEstudianteFormData | RegistroTutorFormData;

interface Materia {
  _id: string;
  nombre: string;
  codigo: string;
  semestre: number;
}

export default function RegistroPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rol, setRol] = useState<'Estudiante' | 'Tutor'>('Estudiante');
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [materiasSeleccionadas, setMateriasSeleccionadas] = useState<string[]>([]);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);

  // Schema dinámico según el rol
  const currentSchema = rol === 'Estudiante' ? registroEstudianteSchema : registroTutorSchema;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<RegistroFormData>({
    resolver: zodResolver(currentSchema),
    mode: 'onBlur',
    defaultValues: {
      rol: rol,
    },
  });

  // Cargar materias cuando el rol es Tutor
  useEffect(() => {
    if (rol === 'Tutor') {
      const fetchMaterias = async () => {
        const response = await api.getMaterias();
        if (response.success && Array.isArray(response.data)) {
          setMaterias(response.data);
        }
      };
      fetchMaterias();
    }
  }, [rol]);

  // Actualizar el valor del rol en el formulario
  useEffect(() => {
    setValue('rol', rol);
    setMateriasSeleccionadas([]);
    setPdfBase64(null);
    setPdfFileName(null);
    setApiError(null);
  }, [rol, setValue]);

  const handleMateriaToggle = (materiaId: string) => {
    setMateriasSeleccionadas((prev) => {
      const newSelection = prev.includes(materiaId)
        ? prev.filter((id) => id !== materiaId)
        : [...prev, materiaId];
      
      if (rol === 'Tutor') {
        setValue('materias' as keyof RegistroFormData, newSelection as never);
      }
      return newSelection;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setApiError('Solo se permiten archivos PDF');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setApiError('El archivo no debe superar los 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setPdfBase64(base64);
      setPdfFileName(file.name);
      if (rol === 'Tutor') {
        setValue('pdf' as keyof RegistroFormData, base64 as never);
      }
    };
    reader.readAsDataURL(file);
  };

  const removePdf = () => {
    setPdfBase64(null);
    setPdfFileName(null);
    if (rol === 'Tutor') {
      setValue('pdf' as keyof RegistroFormData, '' as never);
    }
  };

  const onSubmit = async (data: RegistroFormData) => {
    setApiError(null);

    const submitData = {
      ...data,
      username: data.username || undefined,
      materias: rol === 'Tutor' ? materiasSeleccionadas : undefined,
      pdf: rol === 'Tutor' ? pdfBase64 || undefined : undefined,
    };

    // Eliminar confirmPassword antes de enviar
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmPassword, ...dataToSend } = submitData;

    const response = await api.registro(dataToSend);

    if (response.success) {
      setSuccess(true);
      reset();
      setMateriasSeleccionadas([]);
      setPdfBase64(null);
      setPdfFileName(null);
    } else {
      setApiError(response.message || 'Error al registrar');
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Registro Exitoso!</h2>
          <p className="text-gray-600 mb-6">
            Tu solicitud ha sido enviada. Un administrador revisará tu información y te notificará cuando tu cuenta sea activada.
          </p>
          <Link href="/login" className="w-full inline-flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#000DFF] hover:bg-[#0000cc] transition-colors">
            Volver al Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex relative bg-white">
      {/* Left Side Image - Fixed */}
      <div className="hidden lg:flex lg:w-1/2 fixed left-0 top-0 h-screen bg-gray-100 overflow-hidden">
        <Image
          src="/images/bg.png"
          alt="Estudiantes aprendiendo"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-blue-900/20 mix-blend-multiply pointer-events-none" />
      </div>

      {/* Right Side Form - Scrollable */}
      <div className="w-full lg:w-1/2 lg:ml-[50%] flex items-center justify-center p-4 lg:p-6 overflow-y-auto min-h-screen">
        <div className="w-full max-w-md py-4">
          <div className="text-left w-full mb-4">
            {/* Logo */}
            <div className="h-20 w-auto mb-3 flex items-center justify-center">
              <Image
                src="/images/logo-FIS-sin-fondo.png"
                alt="Tutorías FIS"
                width={180}
                height={80}
                className="h-full w-auto"
                priority
              />
            </div>

            <h1 className="text-2xl lg:text-3xl font-bold text-[#007AA2] mb-1">
              Crear Cuenta
            </h1>
            <p className="text-gray-600 text-xs lg:text-sm">
              Regístrate para comenzar a usar la plataforma.
            </p>
          </div>

          {apiError && (
            <div className="mensaje error mb-4" style={{ display: 'block' }}>
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label htmlFor="nombre" className="block text-xs lg:text-sm font-extrabold text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  id="nombre"
                  type="text"
                  placeholder="Tu nombre"
                  className={`w-full px-4 py-2.5 border rounded-lg outline-none transition text-sm ${
                    errors.nombre
                      ? 'border-red-500 focus:ring-2 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  {...register('nombre')}
                />
                {errors.nombre && (
                  <span className="text-red-600 text-xs mt-1 block">{errors.nombre.message}</span>
                )}
              </div>

              <div>
                <label htmlFor="apellido" className="block text-xs lg:text-sm font-extrabold text-gray-700 mb-1">
                  Apellido *
                </label>
                <input
                  id="apellido"
                  type="text"
                  placeholder="Tu apellido"
                  className={`w-full px-4 py-2.5 border rounded-lg outline-none transition text-sm ${
                    errors.apellido
                      ? 'border-red-500 focus:ring-2 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  {...register('apellido')}
                />
                {errors.apellido && (
                  <span className="text-red-600 text-xs mt-1 block">{errors.apellido.message}</span>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-xs lg:text-sm font-extrabold text-gray-700 mb-1">
                Correo Institucional *
              </label>
              <input
                id="email"
                type="email"
                placeholder="ejemplo@epn.edu.ec"
                className={`w-full px-4 py-2.5 border rounded-lg outline-none transition text-sm ${
                  errors.email
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                }`}
                {...register('email')}
              />
              {errors.email && (
                <span className="text-red-600 text-xs mt-1 block">{errors.email.message}</span>
              )}
            </div>

            <div>
              <label htmlFor="rol" className="block text-xs lg:text-sm font-extrabold text-gray-700 mb-1">
                Rol *
              </label>
              <select
                id="rol"
                value={rol}
                onChange={(e) => setRol(e.target.value as 'Estudiante' | 'Tutor')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white text-sm"
              >
                <option value="">Selecciona un rol</option>
                <option value="Estudiante">Estudiante</option>
                <option value="Tutor">Tutor</option>
              </select>
            </div>

            {/* Campo de materias (solo para tutores) */}
            {rol === 'Tutor' && (
              <div>
                <label className="block text-xs lg:text-sm font-extrabold text-gray-700 mb-1">
                  Materias que enseñas (Selecciona al menos una) *
                </label>
                <div className="w-full border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto bg-white">
                  {materias.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-2">Cargando materias...</p>
                  ) : (
                    materias.map((materia) => (
                      <label
                        key={materia._id}
                        className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={materiasSeleccionadas.includes(materia._id)}
                          onChange={() => handleMateriaToggle(materia._id)}
                          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {materia.nombre} ({materia.codigo})
                        </span>
                      </label>
                    ))
                  )}
                </div>
                {(errors as { materias?: { message?: string } }).materias && (
                  <span className="text-red-600 text-xs mt-1 block">
                    {(errors as { materias?: { message?: string } }).materias?.message}
                  </span>
                )}
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-xs lg:text-sm font-extrabold text-gray-700 mb-1">
                Nombre de Usuario *
              </label>
              <input
                id="username"
                type="text"
                placeholder="Crea un nombre de usuario"
                className={`w-full px-4 py-2.5 border rounded-lg outline-none transition text-sm ${
                  errors.username
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                }`}
                {...register('username')}
              />
              {errors.username && (
                <span className="text-red-600 text-xs mt-1 block">{errors.username.message}</span>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-xs lg:text-sm font-extrabold text-gray-700 mb-1">
                Contraseña *
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  className={`w-full px-4 py-2.5 pr-12 border rounded-lg outline-none transition text-sm ${
                    errors.password
                      ? 'border-red-500 focus:ring-2 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute inset-y-0 right-0 flex items-center pr-3 focus:outline-none ${
                    showPassword ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <span className="text-red-600 text-xs mt-1 block">{errors.password.message}</span>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs lg:text-sm font-extrabold text-gray-700 mb-1">
                Confirmar Contraseña *
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Repite tu contraseña"
                  className={`w-full px-4 py-2.5 pr-12 border rounded-lg outline-none transition text-sm ${
                    errors.confirmPassword
                      ? 'border-red-500 focus:ring-2 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  {...register('confirmPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={`absolute inset-y-0 right-0 flex items-center pr-3 focus:outline-none ${
                    showConfirmPassword ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <span className="text-red-600 text-xs mt-1 block">{errors.confirmPassword.message}</span>
              )}
            </div>

            {/* Campo de archivo (se muestra según el rol) */}
            {rol === 'Tutor' && (
              <div>
                <label className="block text-xs lg:text-sm font-extrabold text-gray-700 mb-1">
                  Documento PDF (Certificado o Comprobante)
                </label>
                {pdfFileName ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <span className="text-sm text-green-700 truncate flex items-center">
                      <span className="text-xl mr-2">📄</span>
                      {pdfFileName}
                    </span>
                    <button type="button" onClick={removePdf} className="text-red-500 hover:text-red-700">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ) : (
                  <label className="file-upload-label text-gray-600 cursor-pointer">
                    <span className="text-xl mr-2">📄</span>
                    <span className="text-xs lg:text-sm font-medium">Seleccionar archivo PDF</span>
                    <input type="file" className="hidden" accept=".pdf" onChange={handleFileChange} />
                  </label>
                )}
              </div>
            )}

            <input type="hidden" {...register('rol')} value={rol} />

            <div className="pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#000DFF] hover:bg-[#0000cc] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Registrando...
                  </span>
                ) : (
                  'Registrar'
                )}
              </button>
            </div>

            <div className="mt-3 text-center">
              <p className="text-xs lg:text-sm text-gray-600">
                ¿Ya tienes una cuenta?{' '}
                <Link href="/login" className="font-medium text-[#007AA2] hover:text-[#005f7a]">
                  Inicia sesión aquí
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
