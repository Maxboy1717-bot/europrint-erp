import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { ZodError } from 'zod'
import { FastifyReply, FastifyRequest } from 'fastify'

type LogLevel = 'CRITICAL' | 'ERROR' | 'WARNING' | 'INFO'

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const reply = ctx.getResponse<FastifyReply>()
    const request = ctx.getRequest<FastifyRequest>()

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let message = 'Internal server error'
    let code = 'INTERNAL_ERROR'
    let logLevel: LogLevel = 'ERROR'

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const exceptionResponse = exception.getResponse()

      if (typeof exceptionResponse === 'object') {
        const objResponse = exceptionResponse
        message = ((objResponse as {message?: string}).message as string) || exception.message
      } else {
        message = exception.message
      }

      logLevel = this.getLogLevel(status)
      code = this.getErrorCode(status)
    } else if (exception instanceof ZodError) {
      status = HttpStatus.UNPROCESSABLE_ENTITY
      message = 'Validation error'
      code = 'VALIDATION_ERROR'
      logLevel = 'WARNING'
    } else if (exception instanceof Error) {
      message = exception.message
      logLevel = 'CRITICAL'
    }

    this.logException(logLevel, message, code, status, request.url)

    reply.status(status).send({
      success: false,
      error: message,
      code,
      timestamp: new Date().toISOString(),
    })
  }

  private getLogLevel(status: number): LogLevel {
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) return 'CRITICAL'
    if (status >= HttpStatus.BAD_REQUEST) return 'WARNING'
    return 'INFO'
  }

  private getErrorCode(status: number): string {
    const codeMap: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
      [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
      [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
      [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
      [HttpStatus.CONFLICT]: 'CONFLICT',
      [HttpStatus.UNPROCESSABLE_ENTITY]: 'VALIDATION_ERROR',
      [HttpStatus.TOO_MANY_REQUESTS]: 'TOO_MANY_REQUESTS',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_SERVER_ERROR',
    }
    return codeMap[status] || 'UNKNOWN_ERROR'
  }

  private logException(
    level: LogLevel,
    message: string,
    code: string,
    status: number,
    path: string,
  ): void {
    const msg = `[${level}] ${code} (${status}) on ${path}: ${message}`
    switch (level) {
      case 'CRITICAL':
      case 'ERROR':
        this.logger.error(msg)
        break
      case 'WARNING':
        this.logger.warn(msg)
        break
      case 'INFO':
        this.logger.log(msg)
        break
    }
  }
}
