'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, EyeOff } from 'lucide-react';
import { loginSchema, LoginFormData } from '@/lib/validations/auth';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  });

  const onSubmit = async (data: LoginFormData) => {
    setApiError(null);
    setApiSuccess(null);
    
    const result = await login(data.email, data.password);
    
    if (result.success) {
      router.push('/dashboard');
    } else {
      setApiError(result.message || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="min-h-screen flex relative bg-white">
      {/* Left Side Image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gray-100 overflow-hidden">
        <Image
          src="/images/bg.png"
          alt="Estudiantes aprendiendo"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-blue-900/20 mix-blend-multiply pointer-events-none" />
      </div>

      {/* Right Side Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-left w-full mb-8">
            {/* Logo */}
            <div className="h-28 w-auto mb-6 flex items-center justify-center">
              <Image
                src="/images/logo-FIS-sin-fondo.png"
                alt="Tutorías FIS"
                width={200}
                height={112}
                className="h-full w-auto"
                priority
              />
            </div>

            <h1 className="text-4xl font-bold text-[#007AA2] mb-2">
              Iniciar Sesión
            </h1>
            <p className="text-gray-600 text-sm">
              ¡Bienvenido de nuevo! Por favor ingresa a tu cuenta.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-extrabold text-gray-700 mb-1"
              >
                Correo Electrónico
              </label>
              <input
                id="email"
                type="text"
                placeholder="Ingresa tu correo electrónico"
                className={`w-full px-4 py-3 border rounded-lg outline-none transition ${
                  errors.email
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                }`}
                {...register('email')}
                autoComplete="username"
              />
              {errors.email && (
                <span className="text-red-600 text-xs mt-1 block">
                  {errors.email.message}
                </span>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label
                  htmlFor="password"
                  className="block text-sm font-extrabold text-gray-700"
                >
                  Contraseña
                </label>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Ingresa tu contraseña"
                  className={`w-full px-4 py-3 pr-12 border rounded-lg outline-none transition ${
                    errors.password
                      ? 'border-red-500 focus:ring-2 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  {...register('password')}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute inset-y-0 right-0 flex items-center pr-3 focus:outline-none ${
                    showPassword ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <span className="text-red-600 text-xs mt-1 block">
                  {errors.password.message}
                </span>
              )}
            </div>

            <div className="flex items-center justify-end">
              <Link
                href="/forgot-password"
                className="text-sm text-gray-600 hover:text-blue-800"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#000DFF] hover:bg-[#0000cc] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Iniciando sesión...
                </span>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>

          {/* Mensajes de estado */}
          {apiError && (
            <div className="mensaje error mt-4" style={{ display: 'block' }}>
              {apiError}
            </div>
          )}
          {apiSuccess && (
            <div className="mensaje success mt-4" style={{ display: 'block' }}>
              {apiSuccess}
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ¿No tienes una cuenta?{' '}
              <Link
                href="/registro"
                className="font-medium text-[#007AA2] hover:text-[#005f7a]"
              >
                Regístrate
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
