import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MensajesController } from './mensajes.controller';
import { MensajesService } from './mensajes.service';
import { ChatGateway } from './chat.gateway';
import { Mensaje, MensajeSchema } from './schemas/mensaje.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Mensaje.name, schema: MensajeSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'defaultsecret',
        signOptions: { expiresIn: 604800 },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [MensajesController],
  providers: [MensajesService, ChatGateway],
  exports: [MensajesService],
})
export class MensajesModule {}
