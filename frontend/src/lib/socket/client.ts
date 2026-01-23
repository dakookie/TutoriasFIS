// Cliente WebSocket para chat en tiempo real con el backend NestJS
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface MensajeRecibido {
  _id: string;
  emisor: {
    _id: string;
    nombre: string;
    email: string;
  };
  receptor: {
    _id: string;
    nombre: string;
    email: string;
  };
  contenido: string;
  leido: boolean;
  createdAt: string;
}

interface UsuarioConectado {
  userId: string;
  nombre: string;
}

interface TypingEvent {
  userId: string;
  nombre: string;
  isTyping: boolean;
}

type MessageCallback = (mensaje: MensajeRecibido) => void;
type UserCallback = (usuario: UsuarioConectado) => void;
type TypingCallback = (evento: TypingEvent) => void;

class SocketClient {
  private socket: Socket | null = null;
  private token: string | null = null;
  private messageCallbacks: Set<MessageCallback> = new Set();
  private userConnectedCallbacks: Set<UserCallback> = new Set();
  private userDisconnectedCallbacks: Set<UserCallback> = new Set();
  private typingCallbacks: Set<TypingCallback> = new Set();

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      this.token = token;

      this.socket = io(`${SOCKET_URL}/chat`, {
        auth: { token },
        withCredentials: true,
        transports: ['websocket', 'polling'],
      });

      this.socket.on('connect', () => {
        console.log('Socket conectado');
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Error de conexión socket:', error);
        reject(error);
      });

      this.socket.on('nuevo-mensaje', (mensaje: MensajeRecibido) => {
        this.messageCallbacks.forEach(cb => cb(mensaje));
      });

      this.socket.on('mensaje-tutoria', (mensaje: MensajeRecibido) => {
        this.messageCallbacks.forEach(cb => cb(mensaje));
      });

      this.socket.on('usuario-conectado', (usuario: UsuarioConectado) => {
        this.userConnectedCallbacks.forEach(cb => cb(usuario));
      });

      this.socket.on('usuario-desconectado', (usuario: UsuarioConectado) => {
        this.userDisconnectedCallbacks.forEach(cb => cb(usuario));
      });

      this.socket.on('usuario-typing', (evento: TypingEvent) => {
        this.typingCallbacks.forEach(cb => cb(evento));
      });

      this.socket.on('disconnect', () => {
        console.log('Socket desconectado');
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.token = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // Enviar mensaje privado
  sendMessage(receptorId: string, contenido: string): Promise<{ ok: boolean; mensaje?: MensajeRecibido; error?: string }> {
    return new Promise((resolve) => {
      if (!this.socket?.connected) {
        resolve({ ok: false, error: 'Socket no conectado' });
        return;
      }

      this.socket.emit('enviar-mensaje', { receptorId, contenido }, (response: { ok: boolean; mensaje?: MensajeRecibido; error?: string }) => {
        resolve(response);
      });
    });
  }

  // Unirse a sala de tutoría
  joinTutoria(tutoriaId: string): Promise<{ ok: boolean }> {
    return new Promise((resolve) => {
      if (!this.socket?.connected) {
        resolve({ ok: false });
        return;
      }

      this.socket.emit('unirse-tutoria', { tutoriaId }, (response: { ok: boolean }) => {
        resolve(response);
      });
    });
  }

  // Salir de sala de tutoría
  leaveTutoria(tutoriaId: string): Promise<{ ok: boolean }> {
    return new Promise((resolve) => {
      if (!this.socket?.connected) {
        resolve({ ok: false });
        return;
      }

      this.socket.emit('salir-tutoria', { tutoriaId }, (response: { ok: boolean }) => {
        resolve(response);
      });
    });
  }

  // Enviar mensaje en sala de tutoría
  sendTutoriaMessage(tutoriaId: string, receptorId: string, contenido: string): Promise<{ ok: boolean; mensaje?: MensajeRecibido; error?: string }> {
    return new Promise((resolve) => {
      if (!this.socket?.connected) {
        resolve({ ok: false, error: 'Socket no conectado' });
        return;
      }

      this.socket.emit('mensaje-tutoria', { tutoriaId, receptorId, contenido }, (response: { ok: boolean; mensaje?: MensajeRecibido; error?: string }) => {
        resolve(response);
      });
    });
  }

  // Indicar que está escribiendo
  sendTyping(receptorId: string, isTyping: boolean): void {
    if (this.socket?.connected) {
      this.socket.emit('typing', { receptorId, isTyping });
    }
  }

  // Marcar mensaje como leído
  markAsRead(mensajeId: string): Promise<{ ok: boolean }> {
    return new Promise((resolve) => {
      if (!this.socket?.connected) {
        resolve({ ok: false });
        return;
      }

      this.socket.emit('marcar-leido', { mensajeId }, (response: { ok: boolean }) => {
        resolve(response);
      });
    });
  }

  // Suscribirse a nuevos mensajes
  onMessage(callback: MessageCallback): () => void {
    this.messageCallbacks.add(callback);
    return () => this.messageCallbacks.delete(callback);
  }

  // Suscribirse a usuarios conectados
  onUserConnected(callback: UserCallback): () => void {
    this.userConnectedCallbacks.add(callback);
    return () => this.userConnectedCallbacks.delete(callback);
  }

  // Suscribirse a usuarios desconectados
  onUserDisconnected(callback: UserCallback): () => void {
    this.userDisconnectedCallbacks.add(callback);
    return () => this.userDisconnectedCallbacks.delete(callback);
  }

  // Suscribirse a eventos de typing
  onTyping(callback: TypingCallback): () => void {
    this.typingCallbacks.add(callback);
    return () => this.typingCallbacks.delete(callback);
  }
}

// Instancia singleton
export const socketClient = new SocketClient();

export default socketClient;
