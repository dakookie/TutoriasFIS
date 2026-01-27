'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { ArrowLeft, GraduationCap, Mail } from 'lucide-react';
import { forgotPasswordSchema, ForgotPasswordFormData } from '@/lib/validations/auth';
import api from '@/lib/api/client';
import { Input, Button, Alert, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

export default function ForgotPasswordPage() {
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onBlur',
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setApiError(null);
    
    const response = await api.forgotPassword(data.email);
    
    if (response.success) {
      setSuccess(true);
      // En desarrollo, el backend devuelve el token directamente
      const token = (response as any).resetToken || (response.data as any)?.resetToken;
      if (token) {
        setDevToken(token);
      }
    } else {
      setApiError(response.message || 'Error al procesar la solicitud');
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Revisa tu correo</h2>
            <p className="text-gray-600 mb-4">
              Si existe una cuenta con ese email, recibirás un enlace para restablecer tu contraseña.
            </p>
            
            {/* Token de desarrollo - Solo visible en modo desarrollo */}
            {devToken && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
                <p className="text-yellow-800 font-semibold text-sm mb-2">
                  ⚠️ MODO DESARROLLO
                </p>
                <p className="text-yellow-700 text-xs mb-2">
                  Token de reseteo:
                </p>
                <code className="block bg-yellow-100 p-2 rounded text-xs break-all mb-3">
                  {devToken}
                </code>
                <Link 
                  href={`/reset-password/${devToken}`}
                  className="inline-block w-full text-center bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Hacer clic aquí para resetear contraseña
                </Link>
              </div>
            )}

            <Link href="/login">
              <Button variant="outline" className="w-full">
                Volver al Login
              </Button>
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
          <Link href="/login" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver al login
          </Link>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl">¿Olvidaste tu contraseña?</CardTitle>
          <p className="text-gray-500 mt-2">
            Ingresa tu email y te enviaremos un enlace para restablecerla
          </p>
        </CardHeader>

        <CardContent>
          {apiError && (
            <Alert variant="error" className="mb-4">
              {apiError}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="correo@ejemplo.com"
              error={errors.email?.message}
              {...register('email')}
              autoComplete="email"
              required
            />

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isSubmitting}
            >
              Enviar enlace
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
