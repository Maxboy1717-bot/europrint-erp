import pino from 'pino';

export const LOGGER = 'PINO_LOGGER';

export const loggerProvider = {
  provide: LOGGER,
  useValue: pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  }),
};
