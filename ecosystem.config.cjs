/**
 * PM2 ecosystem config for EuroPrint ERP production deployment.
 *
 * Usage:
 *   pm2 start ecosystem.config.cjs --env production
 *   pm2 reload ecosystem.config.cjs --env production   # zero-downtime
 *   pm2 logs europrint-api
 *   pm2 status
 *   pm2 monit
 *
 * Auto-start on boot:
 *   pm2 startup
 *   pm2 save
 */

module.exports = {
  apps: [
    {
      name: 'europrint-api',
      cwd: __dirname,
      script: 'apps/api/dist/main.js',
      // ── Process management ───────────────────────────────────────────────
      instances: process.env.PM2_INSTANCES || 'max',  // cluster mode by default
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,                                    // never watch in prod
      max_memory_restart: '1G',                        // restart if RSS > 1 GB
      // ── Restart strategy ─────────────────────────────────────────────────
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '60s',
      // ── Logging ──────────────────────────────────────────────────────────
      out_file: '/var/log/europrint/api-out.log',
      error_file: '/var/log/europrint/api-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // ── Graceful shutdown ────────────────────────────────────────────────
      kill_timeout: 30000,                             // give 30s for SIGTERM
      listen_timeout: 60000,                           // cold start can be slow
      wait_ready: false,
      // ── Environment ──────────────────────────────────────────────────────
      env: {
        NODE_ENV: 'production',
        // Real values come from /etc/europrint.env loaded by pm2-env or
        // set in the system environment before `pm2 start`.
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],

  /**
   * Optional deploy section (pm2 deploy ecosystem.config.cjs production).
   * Replace placeholders with your actual values before use.
   */
  deploy: {
    production: {
      user: 'deploy',
      host: ['europrint-erp-prod-01.internal'],
      ref: 'origin/main',
      repo: 'git@github.com:Maxboy1717-bot/europrint-erp.git',
      path: '/srv/europrint',
      'pre-deploy-local': '',
      'post-deploy':
        'pnpm install --frozen-lockfile && ' +
        'pnpm --filter @workspace/db run build && ' +
        'pnpm --filter @europrint/api run build && ' +
        'pnpm --filter @workspace/erp-dashboard run build && ' +
        'pnpm --filter @europrint/lib-db run migrate && ' +
        'pm2 reload ecosystem.config.cjs --env production',
      'pre-setup': '',
    },
  },
};
