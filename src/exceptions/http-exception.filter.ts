import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    console.log('---------------------------------------------------------');
    console.error('HttpExceptionFilter Error:', exception);
    console.log('---------------------------------------------------------');

    return response.status(status).json({
      statusCode: status,
      message: exception.message,
      // timestamp: new Date().toISOString(),
      // path: request.url,
    });
  }
}
