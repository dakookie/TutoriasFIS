import { All, Controller, Req, Res, Next } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ProxyService } from './proxy.service';

@Controller()
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  @All('*')
  async proxyRequest(
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    const { method, path, body, headers, query } = req;

    // Excluir rutas de métricas - dejar pasar al siguiente handler
    if (path === '/metrics' || path === '/health') {
      return next();
    }

    // Log para debugging
    console.log(`[API Gateway] ${method} ${path}`);

    // Extraer usuario del request (si tiene cookies)
    let user: any = null;
    if (req.cookies?.token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.decode(req.cookies.token);
        user = decoded;
      } catch (err) {
        // Token inválido, continuar sin usuario
      }
    }

    try {
      const result = await this.proxyService.forwardRequest(
        path,
        method,
        body,
        headers,
        query,
        user,
      );

      // Reenviar headers importantes (como Set-Cookie)
      if (result.headers['set-cookie']) {
        res.setHeader('set-cookie', result.headers['set-cookie']);
      }

      return res.status(result.status).json(result.data);
    } catch (error) {
      console.error(`[API Gateway] Error: ${error.message}`);
      return res.status(error.status || 500).json({
        success: false,
        message: error.message,
      });
    }
  }
}
