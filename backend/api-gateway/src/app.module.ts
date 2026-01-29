import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProxyModule } from './proxy/proxy.module';
import { MetricsController } from './common/controllers/metrics.controller';
import { MetricsMiddleware } from './common/middleware/metrics.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ProxyModule,
  ],
  controllers: [MetricsController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MetricsMiddleware).forRoutes('*');
  }
}
