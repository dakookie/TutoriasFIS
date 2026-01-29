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
import { MensajesService } from './mensajes.service';
import { EnviarMensajeDto } from './dto/mensaje.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>(); // socketId -> userId

  constructor(
    private mensajesService: MensajesService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async handleConnection(@ConnectedSocket() client: Socket) {
    try {
      // Extraer token desde cookies o query params
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.cookie
          ?.split(';')
          .find(c => c.trim().startsWith('token='))
          ?.split('=')[1];

      if (!token) {
        console.log('❌ Cliente sin token');
        client.disconnect();
        return;
      }

      // Verificar JWT
      const secret = this.configService.get<string>('JWT_SECRET') || 'defaultsecret';
      const payload = this.jwtService.verify(token, { secret });

      if (!payload || !payload.userId) {
        console.log('❌ Token inválido');
        client.disconnect();
        return;
      }

      // Guardar información del usuario y token en el socket
      client.data.user = payload;
      const cookieHeader = client.handshake.headers?.cookie || '';
      // Extraer solo el token del cookie header
      const jwtToken = cookieHeader.replace(/^.*token=/, '').replace(/;.*$/, '');
      client.data.jwtToken = jwtToken;
      client.data.token = token;
      this.connectedUsers.set(client.id, payload.userId);

      // Unir a sala específica según rol
      if (payload.rol === 'Tutor') {
        client.join(`tutor-${payload.userId}`);
      } else if (payload.rol === 'Estudiante') {
        client.join(`estudiante-${payload.userId}`);
      }

      console.log(`✅ Usuario conectado: ${payload.nombre} ${payload.apellido} (${payload.rol})`);

      // Emitir confirmación
      client.emit('connected', {
        userId: payload.userId,
        nombre: payload.nombre,
        apellido: payload.apellido,
        rol: payload.rol,
      });

      // Enviar contador de mensajes no leídos
      const noLeidos = await this.mensajesService.contarNoLeidos(payload.userId);
      client.emit('mensajes:no-leidos', { cantidad: noLeidos });

    } catch (error) {
      console.error('Error en handleConnection:', error.message);
      client.disconnect();
    }
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    const userId = this.connectedUsers.get(client.id);
    if (userId) {
      console.log(`❌ Usuario desconectado: ${userId}`);
      this.connectedUsers.delete(client.id);
    }
  }

  @SubscribeMessage('chat:enviar-mensaje')
  async handleEnviarMensaje(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: EnviarMensajeDto,
  ) {
    try {
      const user = client.data.user;

      if (!user || !user.userId) {
        client.emit('chat:error', { message: 'Usuario no autenticado' });
        return;
      }

      const mensajes = await this.mensajesService.enviarMensaje(
        data,
        user.userId,
        `${user.nombre} ${user.apellido}`,
        user.rol,
        client.data.jwtToken,
      );

      // Emitir a todos los receptores
      for (const mensaje of mensajes) {
        const mensajeData = {
          _id: mensaje._id,
          tutoria: mensaje.tutoria,
          emisor: mensaje.emisor,
          emisorNombre: mensaje.emisorNombre,
          emisorRol: mensaje.emisorRol,
          receptor: mensaje.receptor,
          receptorNombre: mensaje.receptorNombre,
          contenido: mensaje.contenido,
          createdAt: (mensaje as any).createdAt,
        };

        // Emitir al emisor
        client.emit('chat:nuevo-mensaje', mensajeData);

        // Emitir al receptor según su rol
        const receptorId = mensaje.receptor.toString();
        if (mensaje.emisorRol === 'Tutor') {
          this.server.to(`estudiante-${receptorId}`).emit('chat:nuevo-mensaje', mensajeData);
        } else {
          this.server.to(`tutor-${receptorId}`).emit('chat:nuevo-mensaje', mensajeData);
          // También emitir a otros estudiantes
          this.server.to(`estudiante-${receptorId}`).emit('chat:nuevo-mensaje', mensajeData);
        }
      }

    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      client.emit('chat:error', { message: error.message || 'Error al enviar mensaje' });
    }
  }

  @SubscribeMessage('chat:unirse-tutoria')
  async handleUnirseTutoria(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tutoriaId: string },
  ) {
    try {
      const user = client.data.user;

      if (!user || !user.userId) {
        client.emit('chat:error', { message: 'Usuario no autenticado' });
        return;
      }

      // Unirse a sala de tutoría
      client.join(`tutoria-${data.tutoriaId}`);
      console.log(`Usuario ${user.nombre} se unió a tutoria-${data.tutoriaId}`);

      // Enviar mensajes previos
      const mensajes = await this.mensajesService.obtenerMensajesPorTutoria(
        data.tutoriaId,
        user.userId,
        client.data.jwtToken,
      );

      client.emit('chat:mensajes-previos', { mensajes });

    } catch (error) {
      console.error('Error al unirse a tutoría:', error);
      client.emit('chat:error', { message: error.message || 'Error al unirse a tutoría' });
    }
  }

  @SubscribeMessage('chat:salir-tutoria')
  handleSalirTutoria(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tutoriaId: string },
  ) {
    client.leave(`tutoria-${data.tutoriaId}`);
    console.log(`Usuario salió de tutoria-${data.tutoriaId}`);
  }
}
