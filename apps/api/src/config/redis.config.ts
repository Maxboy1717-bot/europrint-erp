import { REDIS_DEFAULT_PORT, RETRY_DELAY_MS } from '@common/constants/app.constants';
import { registerAs } from '@nestjs/config'

export default registerAs('redis', () => {
  const mode = process.env.REDIS_MODE || 'standard'

  if (mode === 'upstash') {
    return {
      mode: 'upstash',
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    }
  }

  return {
    mode: 'standard',
    url: process.env.REDIS_URL || 'redis://localhost:' + String(REDIS_DEFAULT_PORT),
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || String(REDIS_DEFAULT_PORT)),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    retryStrategy: (times: number) => Math.min(times * 50, RETRY_DELAY_MS),
  }
})
