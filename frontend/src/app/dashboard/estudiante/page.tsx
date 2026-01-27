'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingScreen } from '@/components/ui';

export default function EstudianteDashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  React.useEffect(() => {
    if (authLoading) return;
    
    if (user?.rol !== 'Estudiante') {
      router.replace('/dashboard');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return <LoadingScreen />;
  }

  return (
    <div>
      <h1 className="text-4xl font-bold text-center text-gray-800 mb-3">
        Bienvenido, Estudiante
      </h1>
      <p className="text-center text-gray-600 mb-12">
        Hola {user?.nombre}, desde aquí puedes consultar tutorías disponibles y revisar tus solicitudes.
      </p>

      {/* Cards Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {/* Card: Consultar Tutorías */}
        <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300 border border-gray-100 flex flex-col">
          <div className="flex flex-col items-center text-center flex-grow">
            <div className="bg-blue-100 rounded-full p-6 mb-6">
              <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-blue-600 mb-3">
              Consultar Tutorías
            </h2>
            <p className="text-gray-600 mb-6">
              Explora las tutorías disponibles y solicita aquellas que te interesen.
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard/estudiante/tutorias')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition w-full mt-auto"
          >
            Ver Tutorías
          </button>
        </div>

        {/* Card: Ver Solicitudes */}
        <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300 border border-gray-100 flex flex-col">
          <div className="flex flex-col items-center text-center flex-grow">
            <div className="bg-green-100 rounded-full p-6 mb-6">
              <svg className="w-16 h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-green-600 mb-3">
              Mis Solicitudes
            </h2>
            <p className="text-gray-600 mb-6">
              Revisa el estado de las solicitudes que has enviado.
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard/estudiante/solicitudes')}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition w-full mt-auto"
          >
            Ver Solicitudes
          </button>
        </div>
      </div>
    </div>
  );
}
