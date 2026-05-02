import pino from 'pino';
import { ConfigService } from '@nestjs/config';
export const LOGGER = 'LOGGER';
export const loggerProvider = {
  provide: LOGGER,
  inject: [ConfigService],
  useFactory: (cfg: ConfigService) =>
    pino({ level: cfg.get<string>('LOG_LEVEL') ?? 'info' }),
};
