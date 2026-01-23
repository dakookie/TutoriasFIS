import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { MensajesService } from './mensajes.service';

interface UsuarioConectado {
  odlSocketId: string;
  odlUserId: string;
  odlNombre: string;
}

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  },
  namespace: '/chat',
})
export class MensajesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private usuariosConectados: Map<string, UsuarioConectado> = new Map();

  constructor(
    private jwtService: JwtService,
    private mensajesService: MensajesService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Extraer token del handshake
      const token = client.handshake.auth?.token || 
                   client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      
      // Guardar usuario conectado
      this.usuariosConectados.set(client.id, {
        odlSocketId: client.id,
        odlUserId: payload.id,
        odlNombre: payload.nombre,
      });

      // Unirse a sala personal
      client.join(`user_${payload.id}`);

      // Notificar a otros usuarios
      this.server.emit('usuario-conectado', {
        userId: payload.id,
        nombre: payload.nombre,
      });

      console.log(`Usuario conectado: ${payload.nombre} (${payload.id})`);
    } catch (error) {
      console.error('Error en conexión WebSocket:', error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const usuario = this.usuariosConectados.get(client.id);
    
    if (usuario) {
      this.server.emit('usuario-desconectado', {
        userId: usuario.odlUserId,
        nombre: usuario.odlNombre,
      });

      this.usuariosConectados.delete(client.id);
      console.log(`Usuario desconectado: ${usuario.odlNombre}`);
    }
  }

  @SubscribeMessage('enviar-mensaje')
  async handleEnviarMensaje(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { receptorId: string; contenido: string; tutoriaId?: string },
  ) {
    const usuario = this.usuariosConectados.get(client.id);
    
    if (!usuario) {
      return { ok: false, error: 'Usuario no autenticado' };
    }

    try {
      const mensaje = await this.mensajesService.crear(
        {
          receptor: data.receptorId,
          contenido: data.contenido,
          tutoria: data.tutoriaId,
        },
        usuario.odlUserId,
      );

      // Enviar al receptor
      this.server.to(`user_${data.receptorId}`).emit('nuevo-mensaje', mensaje);

      // Confirmar al emisor
      return { ok: true, mensaje };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  @SubscribeMessage('unirse-tutoria')
  handleUnirseATutoria(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tutoriaId: string },
  ) {
    client.join(`tutoria_${data.tutoriaId}`);
    return { ok: true };
  }

  @SubscribeMessage('salir-tutoria')
  handleSalirDeTutoria(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tutoriaId: string },
  ) {
    client.leave(`tutoria_${data.tutoriaId}`);
    return { ok: true };
  }

  @SubscribeMessage('mensaje-tutoria')
  async handleMensajeTutoria(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tutoriaId: string; contenido: string; receptorId: string },
  ) {
    const usuario = this.usuariosConectados.get(client.id);
    
    if (!usuario) {
      return { ok: false, error: 'Usuario no autenticado' };
    }

    try {
      const mensaje = await this.mensajesService.crear(
        {
          receptor: data.receptorId,
          contenido: data.contenido,
          tutoria: data.tutoriaId,
        },
        usuario.odlUserId,
      );

      // Enviar a todos en la sala de tutoría
      this.server.to(`tutoria_${data.tutoriaId}`).emit('mensaje-tutoria', mensaje);

      return { ok: true, mensaje };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { receptorId: string; isTyping: boolean },
  ) {
    const usuario = this.usuariosConectados.get(client.id);
    
    if (usuario) {
      this.server.to(`user_${data.receptorId}`).emit('usuario-typing', {
        userId: usuario.odlUserId,
        nombre: usuario.odlNombre,
        isTyping: data.isTyping,
      });
    }
  }

  @SubscribeMessage('marcar-leido')
  async handleMarcarLeido(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { mensajeId: string },
  ) {
    const usuario = this.usuariosConectados.get(client.id);
    
    if (!usuario) {
      return { ok: false, error: 'Usuario no autenticado' };
    }

    try {
      await this.mensajesService.marcarComoLeido(data.mensajeId, usuario.odlUserId);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  // Método para obtener usuarios conectados (útil para admin)
  getUsuariosConectados(): UsuarioConectado[] {
    return Array.from(this.usuariosConectados.values());
  }
}
