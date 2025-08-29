// app-redis.module.ts
import { Global, Module } from '@nestjs/common';
import { RedisModule as NestRedisModule } from '@liaoliaots/nestjs-redis';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    ConfigModule, // ensure ConfigModule.forRoot({ isGlobal: true }) in AppModule
    NestRedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        readyLog: true,
        config: {
          host: config.get('REDIS_HOST', '127.0.0.1'),
          port: parseInt(config.get('REDIS_PORT', '6379'), 10),
        },
      }),
    }),
  ],
  exports: [NestRedisModule],
})
export class AppRedisModule {}
