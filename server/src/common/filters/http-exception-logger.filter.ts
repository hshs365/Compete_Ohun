import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * 모든 예외를 로그하고, 5xx인 경우 상세 정보를 남깁니다.
 * 배포 환경에서 500 원인 파악용.
 */
@Catch()
export class HttpExceptionLoggerFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionLoggerFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : exception instanceof Error
          ? exception.message
          : String(exception);

    const stack =
      exception instanceof Error ? exception.stack : undefined;
    const code = exception && typeof exception === 'object' && 'code' in exception ? (exception as any).code : undefined;

    if (status >= 500) {
      this.logger.error(
        `[${req.method}] ${req.url} ${status} - ${message}` +
          (code ? ` [code=${code}]` : '') +
          (stack ? `\n${stack}` : ''),
      );
    }

    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      res.status(status).json(typeof body === 'object' ? body : { message: body });
      return;
    }

    res.status(status).json({
      statusCode: status,
      message: status >= 500 ? 'Internal server error' : message,
    });
  }
}
