import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosRequestConfig } from 'axios';

@Injectable()
export class ProxyService {
  private readonly identityServiceUrl: string;
  private readonly academicServiceUrl: string;
  private readonly messagingServiceUrl: string;

  constructor(private configService: ConfigService) {
    this.identityServiceUrl = this.configService.get<string>('IDENTITY_SERVICE_URL') || 'http://localhost:4001';
    this.academicServiceUrl = this.configService.get<string>('ACADEMIC_SERVICE_URL') || 'http://localhost:4002';
    this.messagingServiceUrl = this.configService.get<string>('MESSAGING_SERVICE_URL') || 'http://localhost:4003';
  }

  /**
   * Enruta la petición al microservicio correcto
   */
  async forwardRequest(
    path: string,
    method: string,
    body: any,
    headers: any,
    query: any,
    user?: any,
  ): Promise<any> {
    const targetUrl = this.getTargetUrl(path);
    
    if (!targetUrl) {
      throw new HttpException('Servicio no encontrado', HttpStatus.NOT_FOUND);
    }

    // Remover prefijo /api de la ruta para enviar al microservicio
    const cleanPath = path.startsWith('/api') ? path.substring(4) : path;

    try {
      const config: AxiosRequestConfig = {
        method: method as any,
        url: `${targetUrl}${cleanPath}`,
        headers: {
          ...headers,
          host: undefined, // Eliminar host del frontend
        },
        params: query,
        data: body,
        validateStatus: () => true, // Aceptar cualquier status para reenviarlo
        maxBodyLength: 50 * 1024 * 1024, // 50MB
        maxContentLength: 50 * 1024 * 1024, // 50MB
      };

      // Agregar información del usuario como headers custom para messaging service
      if (user && cleanPath.startsWith('/mensajes')) {
        config.headers['x-user-id'] = user.userId;
        config.headers['x-user-rol'] = user.rol;
        config.headers['x-user-nombre'] = user.nombre;
        config.headers['x-user-apellido'] = user.apellido;
        // Pasar también el token JWT para que messaging pueda hacer llamadas a academic
        if (headers.cookie) {
          config.headers['x-jwt-token'] = headers.cookie.replace('token=', '');
        }
      }

      console.log(`[Proxy] Forwarding to: ${config.url}`);
      const response = await axios(config);
      console.log(`[Proxy] Response status: ${response.status}`);
      if (cleanPath.includes('/logout')) {
        console.log(`[Proxy] Logout response data:`, response.data);
      }
      return {
        status: response.status,
        data: response.data,
        headers: response.headers,
      };
    } catch (error) {
      console.error('[Proxy] Error:', error.message);
      console.error('[Proxy] Error response:', error.response?.data);
      console.error('[Proxy] Error status:', error.response?.status);
      console.error('[Proxy] Error config:', error.config?.url);
      throw new HttpException(
        error.response?.data || 'Error al comunicarse con el servicio',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Determina a qué microservicio enviar la petición
   */
  private getTargetUrl(path: string): string | null {
    // Remover prefijo /api si existe
    const cleanPath = path.startsWith('/api') ? path.substring(4) : path;

    // Identity Service: Auth y Usuarios
    if (cleanPath.startsWith('/auth') || cleanPath.startsWith('/usuarios')) {
      return this.identityServiceUrl;
    }

    // Academic Service: Materias, Tutorías, Solicitudes, Encuestas, Aula
    if (
      cleanPath.startsWith('/materias') ||
      cleanPath.startsWith('/tutorias') ||
      cleanPath.startsWith('/solicitudes') ||
      cleanPath.startsWith('/encuestas') ||
      cleanPath.startsWith('/aula')
    ) {
      return this.academicServiceUrl;
    }

    // Messaging Service: Mensajes y Chat
    if (cleanPath.startsWith('/mensajes') || cleanPath.startsWith('/chat')) {
      return this.messagingServiceUrl;
    }

    return null;
  }
}
