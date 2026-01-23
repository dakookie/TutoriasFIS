import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { Mensaje, MensajeSchema } from './schemas/mensaje.schema';
import { MensajesService } from './mensajes.service';
import { MensajesController } from './mensajes.controller';
import { MensajesGateway } from './mensajes.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Mensaje.name, schema: MensajeSchema }]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'tu_secreto_jwt_super_seguro',
    }),
  ],
  controllers: [MensajesController],
  providers: [MensajesService, MensajesGateway],
  exports: [MensajesService, MensajesGateway],
})
export class MensajesModule {}
