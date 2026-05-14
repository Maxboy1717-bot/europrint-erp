/**
 * @module logger.util
 * @description Source module. See exports for details.
 */

import pino, { Logger } from 'pino'

let loggerInstance: Logger

export function initializeLogger(): Logger {
  const isDevelopment = process.env.NODE_ENV !== 'production'

  loggerInstance = pino({
    level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
    transport: isDevelopment
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            singleLine: false,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
    timestamp: pino.stdTimeFunctions.isoTime,
  })

  return loggerInstance
}

export function getLogger(name?: string): Logger {
  if (!loggerInstance) {
    initializeLogger()
  }

  return name ? loggerInstance.child({ module: name }) : loggerInstance
}
