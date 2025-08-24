import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
  Logger,
  HttpStatus,
} from '@nestjs/common';
import { Error } from 'mongoose';
import { Request, Response } from 'express';

@Catch(Error.ValidationError)
export class MongooseValidationFilter implements ExceptionFilter {
  catch(exception: Error.ValidationError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    console.log('---------------------------------------------------------');
    console.error('Mongoose Validation Error:', exception);
    console.log('---------------------------------------------------------');

    response.status(HttpStatus.BAD_REQUEST).json({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'Validation failed',
      errors: exception.errors,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
