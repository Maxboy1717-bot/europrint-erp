/**
 * @module global-exception.filter
 * @description NestJS exception filter. Converts thrown errors to HTTP responses.
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { ZodError } from 'zod'
import { I18nContext } from 'nestjs-i18n'
import { FastifyReply, FastifyRequest } from 'fastify'

type LogLevel = 'CRITICAL' | 'ERROR' | 'WARNING' | 'INFO'

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const reply = ctx.getResponse<FastifyReply>()
    const request = ctx.getRequest<FastifyRequest>()
    // GlobalExceptionFilter is instantiated manually via app.useGlobalFilters(new ...())
    // (main-bootstrap.ts) rather than through Nest DI, so I18nService cannot be
    // constructor-injected here. I18nContext.current() reads the request-scoped
    // context nestjs-i18n's own middleware attaches via AsyncLocalStorage instead.
    const i18n = I18nContext.current(host)

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let message = i18n?.t('errors.internalServerError') ?? 'Internal server error'
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
      message = i18n?.t('validation.validationFailed') ?? 'Validation error'
      code = 'VALIDATION_ERROR'
      logLevel = 'WARNING'
    } else if (exception instanceof Error) {
      message = exception.message
      logLevel = 'CRITICAL'
    }

    this.logException(logLevel, message, code, status, request.url)

    // Graceful fallback (TORLI): faqat stats/dashboard tipidagi endpointlar uchun
    // 5xx server xatosida bo'sh javob qaytariladi — UI buzilmaydi.
    //
    // MUHIM: Bu fallback faqat AGREGAT/STATS endpointlar uchun ishlaydi
    // (dashboard widgetlari, KPI kartalar). Oddiy data endpointlari (orders, employees,
    // invoices va boshqalar) uchun haqiqiy xato qaytariladi — UI "Yuklashda xato"
    // xabarini ko'rsata olishi uchun. 404 va 422 ham haqiqiy xato sifatida qaytadi
    // (avval ular ham maskirovka qilingan edi — bu xato edi).
    //
    // ⚠ 501 NOT_IMPLEMENTED ALOHIDA: bu intent — endpoint atayin stub. Frontend
    // bu javobni "Tez orada amalga oshiriladi" sifatida ko'rsatishi kerak,
    // 503 "server uzilgan" maskasiga aylantirilmaydi.
    if (
      request.method === 'GET' &&
      status >= HttpStatus.INTERNAL_SERVER_ERROR &&  // faqat 5xx — 4xx haqiqiy
      status !== HttpStatus.NOT_IMPLEMENTED          // 501 — stub javobi, maskirovka qilinmaydi
    ) {
      const url = request.url || ''
      // Strict regex: faqat aniq stats/dashboard endpointlar
      const isStatsLike = /\/(stats|summary|dashboard|kpi|metrics|overview|live|monitor|health|aggregate)(\/|\?|$)/i.test(url)
      if (isStatsLike) {
        reply.status(HttpStatus.OK).send({})
        return
      }
      // Boshqa GET endpointlar uchun 503 qaytaramiz (haqiqiy xato).
      // Development muhitida `debug` maydoni real xato matni — production da yashirin.
      reply.status(HttpStatus.SERVICE_UNAVAILABLE).send({
        success: false,
        error: i18n?.t('errors.serverTemporarilyUnavailable') ?? 'Server temporarily unavailable',
        code: 'SERVICE_UNAVAILABLE',
        debug: process.env['NODE_ENV'] !== 'production' ? message : undefined,
        timestamp: new Date().toISOString(),
      })
      return
    }

    reply.status(status).send({
      success: false,
      error: message,
      code,
      timestamp: new Date().toISOString(),
    })
  }


  private getLogLevel(status: number): LogLevel {
    // 501 NOT_IMPLEMENTED — intent, stub javobi, kritik xato emas
    if (status === HttpStatus.NOT_IMPLEMENTED) return 'INFO'
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
      [HttpStatus.NOT_IMPLEMENTED]: 'NOT_IMPLEMENTED',
      [HttpStatus.SERVICE_UNAVAILABLE]: 'SERVICE_UNAVAILABLE',
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
