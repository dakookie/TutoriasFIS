import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
// 1. Importar el decorador Public
import { Public } from './common/decorators/public.decorator'; 

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // 2. Añadir el decorador aquí para saltar la seguridad
  @Public() 
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}