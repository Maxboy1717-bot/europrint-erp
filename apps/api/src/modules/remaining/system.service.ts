/**
 * @module system.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as os from 'os';
import { Ok, Result, safeCall } from '@common/result';
import { SystemRepository } from './system.repository';

import { SECONDS_PER_HOUR, SECONDS_PER_DAY, MS_PER_SECOND, ONE_KB } from '@common/constants/app.constants';
const startTime = Date.now();

function formatUptime(sec: number): string {
  const d = Math.floor(sec / SECONDS_PER_DAY);
  const h = Math.floor((sec % SECONDS_PER_DAY) / SECONDS_PER_HOUR);
  const m = Math.floor((sec % SECONDS_PER_HOUR) / 60);
  const s = sec % 60;
  if (d > 0) return `${d}k ${h}s ${m}d`;
  if (h > 0) return `${h}s ${m}d`;
  return `${m}d ${s}s`;
}

@Injectable()
export class SystemService {
  private readonly logger = new Logger(SystemService.name);

  constructor(private readonly repo: SystemRepository) {}

  async getHealth() {
    return safeCall(async () => {
      const uptimeSec = Math.floor((Date.now() - startTime) / MS_PER_SECOND);
      const mem = process.memoryUsage();
      const freeMemPct = Math.round((os.freemem() / os.totalmem()) * 100);
      const cpuLoad = os.loadavg();
      let dbStatus = 'ok';
      let dbLatencyMs = 0;
      try {
        const pingR = await this.repo.ping();
        dbLatencyMs = (pingR.ok ? pingR.data as number : 0);
      } catch {
        dbStatus = 'error';
      }
      return {
        status: 'running',
        uptime: { seconds: uptimeSec, formatted: formatUptime(uptimeSec) },
        memory: {
          heapUsedMB: Math.round(mem.heapUsed / ONE_KB / ONE_KB),
          heapTotalMB: Math.round(mem.heapTotal / ONE_KB / ONE_KB),
          rssMB: Math.round(mem.rss / ONE_KB / ONE_KB),
          freeSystemPct: freeMemPct,
        },
        cpu: { load1: cpuLoad[0].toFixed(2), load5: cpuLoad[1].toFixed(2), cores: os.cpus().length },
        database: { status: dbStatus, latencyMs: dbLatencyMs },
        nodeVersion: process.version,
        env: process.env['NODE_ENV'] || 'development',
      };
    });
  }

  async getDbStats() {
    return this.repo.getDbStats();
  }

  getCronJobs(): Result<object[]> {
    return Ok([
      { name: 'Papka deadline eslatma', schedule: 'Har kuni 09:00', module: 'PP', status: 'active' },
      { name: 'Birthday greetings', schedule: 'Har kuni 00:00', module: 'HR', status: 'active' },
      { name: 'Haftalik KPI hisobot', schedule: 'Dushanba 09:00', module: 'HR', status: 'active' },
      { name: 'Maosh eslatma', schedule: "Har oyning 25-si", module: 'FI', status: 'active' },
      { name: 'Debitor aging', schedule: 'Har kuni 09:00', module: 'FI', status: 'active' },
      { name: 'Haftalik aging report', schedule: 'Dushanba 09:00', module: 'FI', status: 'active' },
      { name: "SD muddati o'tgan", schedule: 'Har kuni 09:00', module: 'SD', status: 'active' },
      { name: 'Direktor kunlik hisobot', schedule: 'Har kuni 07:00', module: 'DIR', status: 'active' },
      { name: 'Shift handover', schedule: '14:00 va 22:00', module: 'PP', status: 'active' },
      { name: 'Kunlik reja hisobot', schedule: '18:00', module: 'PP', status: 'active' },
      { name: "Byudjet 90% alert", schedule: 'Dushanba 09:00', module: 'FI', status: 'active' },
      { name: 'Sertifikat muddati', schedule: 'Har kuni 09:00', module: 'HR', status: 'active' },
      { name: 'Litsenziya muddati', schedule: 'Har kuni 09:00', module: 'HR', status: 'active' },
      { name: 'Sensor anomaly', schedule: 'Har 15 daqiqa', module: 'IoT', status: 'active' },
      { name: 'WMS min-stock', schedule: '08:00 va 14:00', module: 'WMS', status: 'active' },
      { name: 'LMS kurs deadline', schedule: 'Har kuni 08:00', module: 'LMS', status: 'active' },
      { name: 'Churn monitoring', schedule: 'Dushanba 08:00', module: 'CRM', status: 'active' },
    ]);
  }

  getIntegrations(): Result<object[]> {
    return Ok([
      { name: 'Telegram Bot', key: 'telegram', status: process.env['TELEGRAM_BOT_TOKEN'] ? 'connected' : 'disconnected', type: 'notification' },
      { name: 'OpenAI (GPT)', key: 'openai', status: process.env['AI_INTEGRATIONS_OPENAI_API_KEY'] ? 'connected' : 'disconnected', type: 'ai' },
      { name: 'Gemini AI', key: 'gemini', status: process.env['AI_INTEGRATIONS_GEMINI_API_KEY'] ? 'connected' : 'disconnected', type: 'ai' },
      { name: 'PostgreSQL (Neon)', key: 'postgres', status: 'connected', type: 'database' },
      { name: 'CRM Webhook', key: 'crm_webhook', status: process.env['CRM_WEBHOOK_SECRET'] ? 'connected' : 'warning', type: 'integration' },
      { name: 'Face Recognition', key: 'face_ai', status: process.env['FACE_ENCRYPTION_KEY'] ? 'connected' : 'disconnected', type: 'ai' },
      { name: 'Redis Cache', key: 'redis', status: process.env['REDIS_URL'] ? 'connected' : 'in_memory', type: 'cache' },
      { name: 'JWT Auth', key: 'jwt', status: process.env['JWT_SECRET'] ? 'connected' : 'default_key', type: 'security' },
      { name: 'Admin Auth', key: 'admin_auth', status: (process.env['ADMIN_USERNAME'] && process.env['ADMIN_PASSWORD']) ? 'connected' : 'default', type: 'security' },
    ]);
  }

  async getSettings() {
    return safeCall(async () => {
      const found = await this.repo.getSettings();
      if (!found) throw new NotFoundException('Record not found');
      return found;
    });
  }

  async updateSettings(body: Record<string, unknown>) {
    return safeCall(async () => {
      const id = await this.repo.getSettingsId();
      if (id !== null) {
        return this.repo.updateSettings(id, body);
      }
      return this.repo.createSettings(body);
    });
  }
}
