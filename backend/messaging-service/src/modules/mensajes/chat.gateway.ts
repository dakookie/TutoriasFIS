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
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.cookie
          ?.split(';')
          .find((c) => c.trim().startsWith('token='))
          ?.split('=')[1];

      if (!token) {
        // console.log('❌ Cliente sin token'); // Comentado para reducir ruido si hay reconexiones
        client.disconnect();
        return;
      }

      const secret = this.configService.get<string>('JWT_SECRET') || 'defaultsecret';
      const payload = this.jwtService.verify(token, { secret });

      if (!payload || !payload.userId) {
        client.disconnect();
        return;
      }

      client.data.user = payload;
      // Guardar el token original por si se necesita para llamadas a otros microservicios
      client.data.jwtToken = token; 
      
      this.connectedUsers.set(client.id, payload.userId);

      // Unir a sala personal (para notificaciones globales)
      if (payload.rol === 'Tutor') {
        client.join(`tutor-${payload.userId}`);
      } else if (payload.rol === 'Estudiante') {
        client.join(`estudiante-${payload.userId}`);
      }

      console.log(`✅ Socket: Usuario conectado ${payload.userId} (${payload.rol})`);

    } catch (error) {
      // console.error('Error conexión socket:', error.message);
      client.disconnect();
    }
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    const userId = this.connectedUsers.get(client.id);
    if (userId) {
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

      // Emitir a los destinatarios
      for (const mensaje of mensajes) {
        const mensajeData = {
          _id: mensaje._id.toString(),
          tutoria: mensaje.tutoria.toString(),
          emisor: mensaje.emisor.toString(),
          emisorNombre: mensaje.emisorNombre,
          emisorRol: mensaje.emisorRol,
          receptor: mensaje.receptor.toString(),
          receptorNombre: mensaje.receptorNombre,
          contenido: mensaje.contenido,
          createdAt: (mensaje as any).createdAt,
        };

        // -----------------------------------------------------
        // 🔥 CORRECCIÓN CLAVE AQUÍ ABAJO 🔥
        // -----------------------------------------------------
        
        // 1. Emitir a la SALA DE LA TUTORÍA (Para que aparezca en el chat abierto en tiempo real)
        // Esto asegura que tanto el tutor como el estudiante vean el mensaje si tienen el chat abierto
        this.server.to(`tutoria-${mensajeData.tutoria}`).emit('chat:nuevo-mensaje', mensajeData);

        // 2. Notificar al receptor en su sala personal (Para alertas/notificaciones fuera del chat)
        const receptorId = mensaje.receptor.toString();
        const salaReceptor = mensaje.emisorRol === 'Tutor' ? `estudiante-${receptorId}` : `tutor-${receptorId}`;
        
        // Emitimos solo si no está en la sala de tutoría (opcional, pero enviar doble no daña si el frontend lo filtra)
        this.server.to(salaReceptor).emit('chat:notificacion', mensajeData); 

        console.log(`📤 Mensaje enviado en tutoria-${mensajeData.tutoria}`);
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
      if (!user) return;

      // 1. Unirse a la sala específica de esta tutoría
      const roomName = `tutoria-${data.tutoriaId}`;
      client.join(roomName);
      console.log(`🔌 ${user.nombre} se unió a la sala: ${roomName}`);

      // 2. Enviar mensajes previos (Historial)
      const mensajes = await this.mensajesService.obtenerMensajesPorTutoria(
        data.tutoriaId,
        user.userId,
        client.data.jwtToken,
      );

      client.emit('chat:mensajes-previos', { mensajes });

    } catch (error) {
      console.error('Error unirse tutoría:', error);
    }
  }

  @SubscribeMessage('chat:salir-tutoria')
  handleSalirTutoria(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tutoriaId: string },
  ) {
    client.leave(`tutoria-${data.tutoriaId}`);
  }
}