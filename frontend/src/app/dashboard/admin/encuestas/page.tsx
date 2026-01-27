'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api/client';
import { ChevronLeft, Book, Plus, ClipboardList } from 'lucide-react';

interface Materia {
  _id: string;
  nombre: string;
  codigo?: string;
}

interface Pregunta {
  _id: string;
  pregunta: string;
  materia: string;
  materiaNombre: string;
  activa: boolean;
  createdAt: string;
}

export default function EncuestasAdminPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Estados del formulario
  const [selectedMateria, setSelectedMateria] = useState('');
  const [nuevaPregunta, setNuevaPregunta] = useState('');
  const [filtroMateria, setFiltroMateria] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchMaterias = async () => {
    const response = await api.getMaterias();
    if (response.success && Array.isArray(response.data)) {
      setMaterias(response.data);
    }
  };

  const fetchPreguntas = async (materiaId?: string) => {
    try {
      let response;
      if (materiaId) {
        // Pasar el ID directamente - el endpoint detecta si es ID o nombre
        response = await api.getPreguntasPorMateria(materiaId);
      } else {
        response = await api.getPreguntas();
      }
      
      if (response.success) {
        // response.data ya contiene el array de preguntas (normalizado por el client)
        const preguntasData = Array.isArray(response.data) ? response.data : [];
        setPreguntas(preguntasData);
      }
    } catch (err) {
      console.error('Error al cargar preguntas:', err);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    
    if (user?.rol !== 'Administrador') {
      router.replace('/dashboard');
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      await fetchMaterias();
      await fetchPreguntas();
      setIsLoading(false);
    };
    
    loadData();
  }, [user, authLoading, router]);

  // Recargar preguntas cuando cambia el filtro
  useEffect(() => {
    if (!isLoading && materias.length > 0) {
      fetchPreguntas(filtroMateria || undefined);
    }
  }, [filtroMateria, materias]);

  const handleGuardarPregunta = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nuevaPregunta.trim() || !selectedMateria) {
      setError('Por favor, completa todos los campos');
      return;
    }

    setSaving(true);
    setError(null);
    
    try {
      const response = await api.crearPregunta({
        pregunta: nuevaPregunta.trim(),
        materia: selectedMateria,
      });
      
      if (response.success) {
        setSuccessMessage('Pregunta guardada exitosamente');
        setNuevaPregunta('');
        // Recargar preguntas
        await fetchPreguntas(filtroMateria || selectedMateria);
        
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(response.error || 'Error al guardar pregunta');
      }
    } catch (err) {
      setError('Error al guardar pregunta');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const limpiarFiltro = () => {
    setFiltroMateria('');
  };

  // Agrupar preguntas por materia
  const preguntasPorMateria: Record<string, Pregunta[]> = {};
  preguntas.forEach(pregunta => {
    const materiaNombre = pregunta.materiaNombre || 'Sin materia';
    if (!preguntasPorMateria[materiaNombre]) {
      preguntasPorMateria[materiaNombre] = [];
    }
    preguntasPorMateria[materiaNombre].push(pregunta);
  });

  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/dashboard/admin')}
          className="text-blue-600 hover:text-blue-800 flex items-center mb-4 transition"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Volver al Dashboard
        </button>
        
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <ClipboardList className="w-8 h-8 mr-3 text-green-600" />
          Formularios de Calificación
        </h1>
        <p className="text-gray-600 mt-2">
          Gestiona las preguntas de los formularios de calificación de tutorías
        </p>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}

      {/* Formulario para crear pregunta */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Plus className="w-5 h-5 mr-2 text-blue-600" />
          Crear Nueva Pregunta
        </h3>
        <form onSubmit={handleGuardarPregunta}>
          <div className="mb-4">
            <label htmlFor="materia-encuesta" className="block text-sm font-medium text-gray-700 mb-2">
              Selecciona una Materia:
            </label>
            <select
              id="materia-encuesta"
              value={selectedMateria}
              onChange={(e) => setSelectedMateria(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Seleccionar materia</option>
              {materias.map((materia) => (
                <option key={materia._id} value={materia._id}>
                  {materia.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label htmlFor="pregunta-encuesta" className="block text-sm font-medium text-gray-700 mb-2">
              Pregunta para escala de Likert:
            </label>
            <textarea
              id="pregunta-encuesta"
              rows={3}
              value={nuevaPregunta}
              onChange={(e) => setNuevaPregunta(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Escribe la pregunta de la encuesta"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded font-medium transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Guardando...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Guardar Pregunta
              </>
            )}
          </button>
        </form>
      </div>

      {/* Lista de preguntas */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Book className="w-5 h-5 mr-2 text-green-600" />
          Preguntas de la Materia Seleccionada
        </h3>
        
        {/* Filtro de materias */}
        <div className="mb-4">
          <label htmlFor="filtro-materia" className="block text-sm font-medium text-gray-700 mb-2">
            Filtrar preguntas por materia:
          </label>
          <div className="flex gap-2">
            <select
              id="filtro-materia"
              value={filtroMateria}
              onChange={(e) => setFiltroMateria(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todas las materias</option>
              {materias.map((materia) => (
                <option key={materia._id} value={materia._id}>
                  {materia.nombre}
                </option>
              ))}
            </select>
            <button
              onClick={limpiarFiltro}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded font-medium transition"
            >
              Limpiar filtro
            </button>
          </div>
        </div>

        {/* Contenedor de preguntas con scroll */}
        <div className="max-h-[600px] overflow-y-auto pr-2">
          {Object.keys(preguntasPorMateria).length === 0 ? (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded text-center">
              {filtroMateria
                ? 'No hay preguntas guardadas para esta materia'
                : 'No hay preguntas guardadas aún'}
            </div>
          ) : (
            Object.keys(preguntasPorMateria).sort().map((materiaNombre) => (
              <div key={materiaNombre} className="mb-6 border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3">
                  <h4 className="text-white font-semibold flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    {materiaNombre}
                    <span className="ml-2 bg-white text-blue-600 px-2 py-1 rounded-full text-xs font-bold">
                      {preguntasPorMateria[materiaNombre].length} {preguntasPorMateria[materiaNombre].length === 1 ? 'pregunta' : 'preguntas'}
                    </span>
                  </h4>
                </div>
                <div className="bg-white">
                  {preguntasPorMateria[materiaNombre].map((pregunta, index) => (
                    <div
                      key={pregunta._id}
                      className={`px-4 py-3 ${index > 0 ? 'border-t border-gray-200' : ''} hover:bg-gray-50 transition-colors`}
                    >
                      <div className="flex items-start">
                        <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm mr-3">
                          {index + 1}
                        </span>
                        <p className="text-gray-800 flex-1 pt-1">{pregunta.pregunta}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
