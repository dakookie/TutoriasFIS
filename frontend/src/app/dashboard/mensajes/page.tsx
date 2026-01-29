'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MessageSquare, Send, User, Clock } from 'lucide-react';
import io, { Socket } from 'socket.io-client';

interface Mensaje {
  _id: string;
  tutoria: string;
  contenido: string;
  emisor: string;
  emisorNombre: string;
  emisorRol: string;
  receptor: string;
  receptorNombre: string;
  leido: boolean;
  createdAt: string;
}

interface Conversacion {
  tutoriaId: string;
  tutoriaTitulo: string;
  materiaNombre?: string;
  ultimoMensaje?: {
    contenido: string;
    createdAt: string;
  };
  noLeidos: number;
}

export default function MensajesPage() {
  const { user, isLoading } = useAuth();
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
  const [conversacionActiva, setConversacionActiva] = useState<string | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [cargando, setCargando] = useState(true);
  const mensajesEndRef = useRef<HTMLDivElement>(null);
  const conversacionActivaRef = useRef<string | null>(null);

  // Mantener ref actualizada
  useEffect(() => {
    conversacionActivaRef.current = conversacionActiva;
  }, [conversacionActiva]);

  // Conectar al WebSocket
  useEffect(() => {
    if (!user) return;

    const newSocket = io('http://localhost:4003/chat', {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('Conectado al chat WebSocket');
    });

    newSocket.on('chat:nuevo-mensaje', (mensaje: Mensaje) => {
      console.log('Nuevo mensaje recibido:', mensaje);
      console.log('Conversación activa (ref):', conversacionActivaRef.current);
      console.log('Tutoria del mensaje:', mensaje.tutoria);
      console.log('Tipo tutoria mensaje:', typeof mensaje.tutoria, 'Longitud:', mensaje.tutoria?.length);
      console.log('Tipo conversación activa:', typeof conversacionActivaRef.current, 'Longitud:', conversacionActivaRef.current?.length);
      
      // Usar ref para obtener el valor actualizado
      const tutoriaActual = conversacionActivaRef.current;
      
      console.log('Comparando:', {
        mensajeTutoria: mensaje.tutoria?.toString(),
        tutoriaActual: tutoriaActual?.toString(),
        sonIguales: mensaje.tutoria?.toString() === tutoriaActual?.toString()
      });
      
      // Actualizar mensajes si es de la conversación activa
      if (tutoriaActual && mensaje.tutoria?.toString() === tutoriaActual?.toString()) {
        console.log('✅ Agregando mensaje a la conversación activa');
        setMensajes(prev => [...prev, mensaje]);
      } else {
        console.log('❌ Mensaje no es de la conversación activa');
      }
      
      // Actualizar lista de conversaciones
      cargarConversaciones();
    });

    newSocket.on('chat:mensajes-previos', (data: { mensajes: Mensaje[] }) => {
      console.log('Mensajes previos recibidos:', data.mensajes);
      setMensajes(data.mensajes || []);
    });

    newSocket.on('mensajes:no-leidos', (data: { total: number }) => {
      console.log('Mensajes no leídos:', data.total);
    });

    newSocket.on('chat:error', (error: { message: string }) => {
      console.error('Error en chat:', error.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  // Cargar conversaciones
  const cargarConversaciones = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/mensajes/conversaciones', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setConversaciones(data.data || []);
      }
    } catch (error) {
      console.error('Error al cargar conversaciones:', error);
    } finally {
      setCargando(false);
    }
  };

  // Cargar conversaciones al iniciar
  useEffect(() => {
    if (user) {
      cargarConversaciones();
    }
  }, [user]);

  // Scroll automático al final
  useEffect(() => {
    mensajesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  // Seleccionar conversación
  const seleccionarConversacion = async (tutoriaId: string) => {
    console.log('📍 Seleccionando conversación:', tutoriaId, 'Tipo:', typeof tutoriaId, 'Longitud:', tutoriaId?.length);
    setConversacionActiva(tutoriaId);
    setMensajes([]);

    // Unirse a la sala de la tutoría
    if (socket) {
      socket.emit('chat:unirse-tutoria', { tutoriaId });
    }

    // Cargar mensajes desde el API REST
    try {
      const response = await fetch(`http://localhost:4000/api/mensajes/tutoria/${tutoriaId}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setMensajes(data.data || []);
      }
    } catch (error) {
      console.error('Error al cargar mensajes:', error);
    }
  };

  // Enviar mensaje
  const enviarMensaje = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nuevoMensaje.trim() || !conversacionActiva || !socket) return;

    const mensajeData = {
      tutoriaId: conversacionActiva,
      contenido: nuevoMensaje.trim(),
    };

    socket.emit('chat:enviar-mensaje', mensajeData);
    setNuevoMensaje('');
  };

  if (isLoading || cargando) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Debes iniciar sesión para ver los mensajes</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Lista de conversaciones */}
      <div className="w-1/3 border-r border-gray-200 overflow-y-auto bg-white">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <MessageSquare className="h-6 w-6 mr-2 text-blue-600" />
            Conversaciones
          </h2>
        </div>
        
        {conversaciones.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p>No tienes conversaciones activas</p>
            <p className="text-sm mt-2">Las conversaciones aparecen cuando tienes tutorías activas</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {conversaciones.map((conv) => (
              <div
                key={conv.tutoriaId}
                onClick={() => seleccionarConversacion(conv.tutoriaId)}
                className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                  conversacionActiva === conv.tutoriaId ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-blue-700 truncate">{conv.tutoriaTitulo}</h3>
                    <p className="text-xs text-gray-500 truncate mt-0.5">Tutoría de {conv.materiaNombre || 'Materia'}</p>
                  </div>
                  {conv.noLeidos > 0 && (
                    <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full ml-2 flex-shrink-0">
                      {conv.noLeidos}
                    </span>
                  )}
                </div>
                {conv.ultimoMensaje && (
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <p className="truncate flex-1">{conv.ultimoMensaje.contenido}</p>
                    <span className="text-xs ml-2">
                      {new Date(conv.ultimoMensaje.createdAt).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short'
                      })}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Panel de chat */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {conversacionActiva ? (
          <>
            {/* Header del chat */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 shadow-md">
              <h3 className="font-bold text-white text-lg">
                {conversaciones.find(c => c.tutoriaId === conversacionActiva)?.tutoriaTitulo || 'Chat'}
              </h3>
              <p className="text-blue-100 text-sm mt-1">
                {conversaciones.find(c => c.tutoriaId === conversacionActiva)?.materiaNombre && 
                  `Tutoría de ${conversaciones.find(c => c.tutoriaId === conversacionActiva)?.materiaNombre}`}
              </p>
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ backgroundImage: 'linear-gradient(to bottom, #eff6ff 0%, #f8fafc 100%)' }}>
              {mensajes.map((mensaje) => {
                const esPropio = mensaje.emisor === user.userId;
                return (
                  <div
                    key={mensaje._id}
                    className={`flex ${esPropio ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 shadow-sm ${
                        esPropio
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-800'
                      }`}
                    >
                      <div className="flex items-center mb-1">
                        <User className="h-4 w-4 mr-1" />
                        <span className="text-xs font-semibold">
                          {mensaje.emisorNombre} ({mensaje.emisorRol})
                        </span>
                      </div>
                      <p className="text-sm">{mensaje.contenido}</p>
                      <div className="flex items-center justify-end mt-1">
                        <Clock className="h-3 w-3 mr-1 opacity-70" />
                        <span className="text-xs opacity-70">
                          {new Date(mensaje.createdAt).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={mensajesEndRef} />
            </div>

            {/* Input de mensaje */}
            <form onSubmit={enviarMensaje} className="bg-white p-4 border-t border-gray-200 shadow-lg">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nuevoMensaje}
                  onChange={(e) => setNuevoMensaje(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                  maxLength={1000}
                />
                <button
                  type="submit"
                  disabled={!nuevoMensaje.trim()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 shadow-md flex items-center"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <MessageSquare className="h-24 w-24 mx-auto mb-4 opacity-20" />
              <p className="text-lg">Selecciona una conversación para comenzar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
