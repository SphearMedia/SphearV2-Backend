import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './exceptions/global-exception.filter';
import { HttpExceptionFilter } from './exceptions/http-exception.filter';
import { MongoExceptionFilter } from './exceptions/mongo-exception.filter';
import { MongooseValidationFilter } from './exceptions/mongoose-validation.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(
    new GlobalExceptionFilter(),
    new HttpExceptionFilter(),
    new MongoExceptionFilter(),
    new MongooseValidationFilter(),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
