'use client';

import React, { useState, useEffect, use } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Eye, EyeOff, GraduationCap, CheckCircle2 } from 'lucide-react';
import { resetPasswordSchema, ResetPasswordFormData } from '@/lib/validations/auth';
import api from '@/lib/api/client';
import { Input, Button, Alert, Card, CardContent, CardHeader, CardTitle, LoadingScreen } from '@/components/ui';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default function ResetPasswordPage({ params }: PageProps) {
  const { token } = use(params);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onBlur',
  });

  // Verificar token al cargar
  useEffect(() => {
    const verifyToken = async () => {
      const response = await api.verifyResetToken(token);
      setIsValidToken(response.success ?? false);
    };
    verifyToken();
  }, [token]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setApiError(null);
    
    const response = await api.resetPassword(token, data.password);
    
    if (response.success) {
      setSuccess(true);
    } else {
      setApiError(response.message || 'Error al restablecer contraseña');
    }
  };

  // Loading mientras verifica token
  if (isValidToken === null) {
    return <LoadingScreen message="Verificando enlace..." />;
  }

  // Token inválido
  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Enlace inválido o expirado</h2>
            <p className="text-gray-600 mb-6">
              El enlace para restablecer tu contraseña no es válido o ha expirado. Por favor, solicita uno nuevo.
            </p>
            <Link href="/forgot-password">
              <Button className="w-full">Solicitar nuevo enlace</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Éxito
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Contraseña actualizada!</h2>
            <p className="text-gray-600 mb-6">
              Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.
            </p>
            <Link href="/login">
              <Button className="w-full">Iniciar Sesión</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Nueva Contraseña</CardTitle>
          <p className="text-gray-500 mt-2">
            Ingresa tu nueva contraseña
          </p>
        </CardHeader>

        <CardContent>
          {apiError && (
            <Alert variant="error" className="mb-4">
              {apiError}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="relative">
              <Input
                label="Nueva Contraseña"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                error={errors.password?.message}
                helperText="Mínimo 6 caracteres"
                {...register('password')}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            <div className="relative">
              <Input
                label="Confirmar Contraseña"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isSubmitting}
            >
              Restablecer Contraseña
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
