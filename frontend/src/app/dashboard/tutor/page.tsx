'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingScreen } from '@/components/ui';

export default function TutorDashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  React.useEffect(() => {
    if (authLoading) return;
    
    if (user?.rol !== 'Tutor') {
      router.replace('/dashboard');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return <LoadingScreen />;
  }

  return (
    <div>
      <h1 className="text-4xl font-bold text-center text-gray-800 mb-3">
        Bienvenido, Tutor
      </h1>
      <p className="text-center text-gray-600 mb-12">
        Desde aquí puedes registrar nuevas tutorías o responder solicitudes.
      </p>

      {/* Cards Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {/* Card: Registrar nueva Tutoría */}
        <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300 border border-gray-100 flex flex-col">
          <div className="flex flex-col items-center text-center flex-grow">
            <div className="bg-blue-100 rounded-full p-6 mb-6">
              <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-blue-600 mb-3">
              Registrar nueva Tutoría
            </h2>
            <p className="text-gray-600 mb-6">
              Crea nuevas tutorías y publica tus servicios para ayudar a los estudiantes.
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard/tutor/tutorias/nueva')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition w-full mt-auto"
          >
            Crear Tutoría
          </button>
        </div>

        {/* Card: Ver Tutorías Creadas */}
        <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300 border border-gray-100 flex flex-col">
          <div className="flex flex-col items-center text-center flex-grow">
            <div className="bg-blue-100 rounded-full p-6 mb-6">
              <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-blue-600 mb-3">
              Ver Tutorías Creadas
            </h2>
            <p className="text-gray-600 mb-6">
              Administra las tutorías que ya has registrado.
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard/tutor/tutorias')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition w-full mt-auto"
          >
            Ver Tutorías
          </button>
        </div>
      </div>
    </div>
  );
}
