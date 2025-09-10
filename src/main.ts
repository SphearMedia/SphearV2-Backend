import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './exceptions/global-exception.filter';
import { HttpExceptionFilter } from './exceptions/http-exception.filter';
import { MongoExceptionFilter } from './exceptions/mongo-exception.filter';
import { MongooseValidationFilter } from './exceptions/mongoose-validation.filter';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(
    new GlobalExceptionFilter(),
    new HttpExceptionFilter(),
    new MongoExceptionFilter(),
    new MongooseValidationFilter(),
  );
  app.use('/payment/webhook', bodyParser.raw({ type: 'application/json' }));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
