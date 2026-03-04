import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/** Multer 에러 코드 (파일 크기 초과 시) */
const MULTER_LIMIT_FILE_SIZE = 'LIMIT_FILE_SIZE';
const OCR_DOCUMENT_MAX_MB = 10;

/**
 * 모든 예외를 로그하고, 5xx인 경우 상세 정보를 남깁니다.
 * Multer LIMIT_FILE_SIZE → 400 BadRequest (용량 초과 안내).
 */
@Catch()
export class HttpExceptionLoggerFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionLoggerFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    // Multer 파일 크기 초과 → NCP OCR 가이드에 맞춰 400 + 안내 메시지
    const multerCode = exception && typeof exception === 'object' && 'code' in exception ? (exception as { code?: string }).code : undefined;
    if (multerCode === MULTER_LIMIT_FILE_SIZE) {
      const message = `이미지 용량이 ${OCR_DOCUMENT_MAX_MB}MB를 초과합니다. ${OCR_DOCUMENT_MAX_MB}MB 이하로 압축하거나 리사이징 후 다시 올려주세요.`;
      res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message,
        error: 'Bad Request',
      });
      return;
    }

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
