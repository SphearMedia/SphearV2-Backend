// common/filters/mongo-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { MongoError, MongoServerError } from 'mongodb';
import { Request, Response } from 'express';

@Catch(MongoServerError)
export class MongoExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(MongoExceptionFilter.name);

  catch(exception: MongoServerError, host: ArgumentsHost) {
    console.log(
      '---------------------------------------------MongoExceptionFilter',
    );
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = this.resolveStatus(exception);
    const message = this.resolveMessage(exception);

    this.logger.error(
      `MongoDB Error: ${exception.message}`,
      JSON.stringify({ code: exception.code, message, path: request.url }),
    );

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private resolveStatus(exception: MongoServerError): HttpStatus {
    switch (exception.code) {
      case 11000:
        return HttpStatus.CONFLICT;
      case 121:
        return HttpStatus.BAD_REQUEST;
      case 50:
        return HttpStatus.REQUEST_TIMEOUT;
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }

  private resolveMessage(exception: MongoServerError): string {
    switch (exception.code) {
      case 11000:
        const field = this.extractDuplicateField(exception.message);
        return `${field || 'unknown'} field already exists`;
      case 121:
        return 'Document validation failed';
      case 50:
        return 'MongoDB operation timed out';
      default:
        return 'Internal database server error';
    }
  }

  private extractDuplicateField(errorMsg: string): string | null {
    // Example: E11000 duplicate key error collection: test.users index: email_1 dup key: { email: "test@mail.com" }
    const match = errorMsg.match(/index:\s([a-zA-Z0-9_]+)_1/);
    return match?.[1] || null;
  }
}

@Catch(MongoError)
export class MongoExceptionFilter2 implements ExceptionFilter {
  catch(exception: MongoError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = HttpStatus.INTERNAL_SERVER_ERROR;

    console.log('---------------------------------------------------------');
    console.error('Mongoose MongoExceptionFilter2:', exception);
    console.log('---------------------------------------------------------');

    response.status(status).json({
      statusCode: status,
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
