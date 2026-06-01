/**
 * @module vite.config
 * @description Configuration loader. Wraps env vars via @nestjs/config ConfigService.
 */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { VitePWA } from "vite-plugin-pwa";
import http from "http";
import { sentryVitePlugin } from "@sentry/vite-plugin";

const rawPort = process.env.PORT;
const port = rawPort && !Number.isNaN(Number(rawPort)) && Number(rawPort) > 0
  ? Number(rawPort)
  : 20806;

const basePath = process.env.BASE_PATH || "/erp-dashboard/";
const basePrefix = basePath.replace(/\/$/, "");

// Backend NestJS port — apps/api/.env'da PORT=3030. Env var berilmasa shu default ishlatiladi.
// 127.0.0.1 (NOT localhost): the API binds IPv4 (app.listen(port,'0.0.0.0')); `localhost`
// resolves to IPv6 ::1 first, which the IPv4-only backend doesn't serve → proxy 500/503.
const apiUrl = process.env.API_URL ?? "http://127.0.0.1:3030";
const nestApiUrl = process.env.NEST_API_URL ?? "http://127.0.0.1:3030";

function posAuthDirectPlugin(nestUrl: string, prefix: string) {
  // nestUrl'dan host/port chiqarib olish — hard-coded 8080 emas
  const parsedUrl = new URL(nestUrl);
  const targetHost = parsedUrl.hostname || "localhost";
  const targetPort = parsedUrl.port ? Number(parsedUrl.port) : 80;

  return {
    name: "pos-auth-direct",
    configureServer(server: { middlewares: { use: (fn: (req: http.IncomingMessage, res: http.ServerResponse, next: () => void) => void) => void } }) {
      server.middlewares.use((req: http.IncomingMessage, res: http.ServerResponse, next: () => void) => {
        const isPosLogin = req.method === "POST" && (
          req.url === `${prefix}/api/pos/auth/login` ||
          req.url === `/api/pos/auth/login`
        );
        if (isPosLogin) {
          const chunks: Buffer[] = [];
          req.on("data", (chunk: Buffer) => chunks.push(chunk));
          req.on("end", () => {
            const body = Buffer.concat(chunks);
            let username = "?";
            try { username = (JSON.parse(body.toString()) as { username?: string }).username ?? "?"; } catch { /* noop */ }
            process.stdout.write(`[pos-auth-direct] intercepted login for user="${username}" url=${req.url ?? ""} bodyLen=${body.length} → ${targetHost}:${targetPort}\n`);
            const forwarded = req.headers["x-forwarded-for"] ?? req.socket?.remoteAddress ?? "";
            const nestReq = http.request(
              { host: targetHost, port: targetPort, path: "/api/pos/auth/login", method: "POST",
                headers: { "content-type": "application/json", "content-length": body.length, "x-forwarded-for": forwarded } },
              (nestRes) => {
                const parts: Buffer[] = [];
                nestRes.on("data", (c: Buffer) => parts.push(c));
                nestRes.on("end", () => {
                  const data = Buffer.concat(parts);
                  process.stdout.write(`[pos-auth-direct] NestJS responded ${nestRes.statusCode ?? "?"} for user="${username}"\n`);
                  const origin = req.headers["origin"] as string | undefined;
                  res.writeHead(nestRes.statusCode ?? 200, {
                    "content-type": "application/json",
                    "access-control-allow-origin": origin ?? "*",
                    "access-control-allow-credentials": "true",
                  });
                  res.end(data);
                });
              }
            );
            nestReq.on("error", (err) => {
              process.stderr.write(`[pos-auth-direct] NestJS connection error: ${err.message}\n`);
              res.writeHead(502, { "content-type": "application/json" });
              res.end(JSON.stringify({ error: "API service unavailable" }));
            });
            nestReq.write(body);
            nestReq.end();
          });
        } else {
          next();
        }
      });
    },
  };
}

// Sentry source-map upload is enabled ONLY when SENTRY_AUTH_TOKEN is set.
// Without the token, the plugin would throw at build time — keep it optional
// so local builds and CI without Sentry secrets continue to work.
const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN?.trim();
const sentryOrg = process.env.SENTRY_ORG?.trim() || "europrint";
const sentryProject = process.env.SENTRY_PROJECT?.trim() || "erp-dashboard";
const sentryRelease = process.env.SENTRY_RELEASE?.trim();

export default defineConfig({
  base: basePath,
  // sourcemap must be enabled for Sentry to symbolicate stack traces.
  // Hidden source-maps are uploaded to Sentry but not served to the browser.
  build: {
    sourcemap: sentryAuthToken ? "hidden" : false,
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  plugins: [
    posAuthDirectPlugin(nestApiUrl, basePrefix),
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    ...(sentryAuthToken
      ? [
          sentryVitePlugin({
            authToken: sentryAuthToken,
            org: sentryOrg,
            project: sentryProject,
            release: sentryRelease ? { name: sentryRelease } : undefined,
            // Only upload during real production builds (not dev server).
            disable: process.env.NODE_ENV !== "production",
          }),
        ]
      : []),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      base: basePath,
      scope: basePath,
      workbox: {
        globPatterns: ["**/*.{css,html,ico,png,svg,woff,woff2}"],
        navigateFallback: null,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          // JS/CSS assets — NetworkFirst so deploy updates instantly, falls back to cache
          {
            urlPattern: /\/erp-dashboard\/assets\/.*\.(js|css)$/,
            handler: "NetworkFirst",
            options: {
              cacheName: "erp-assets-cache",
              networkTimeoutSeconds: 8,
              expiration: {
                maxEntries: 300,
                maxAgeSeconds: 7 * 24 * 60 * 60,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Auth endpoints must NEVER be cached or intercepted
          {
            urlPattern: /\/api\/auth\//,
            handler: "NetworkOnly",
          },
          {
            urlPattern: /\/api\/pos\/products/,
            handler: "NetworkFirst",
            options: {
              cacheName: "pos-products-cache",
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 24 * 60 * 60,
              },
            },
          },
          {
            urlPattern: /\/api\/pos\/sales\/daily/,
            handler: "NetworkFirst",
            options: {
              cacheName: "pos-daily-cache",
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60,
              },
            },
          },
          {
            urlPattern: /\/api\/mes\/tasks/,
            handler: "NetworkFirst",
            options: {
              cacheName: "mes-tasks-cache",
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 4 * 60 * 60,
              },
            },
          },
          {
            urlPattern: /\/api\/employees/,
            handler: "NetworkFirst",
            options: {
              cacheName: "employees-cache",
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 8 * 60 * 60,
              },
            },
          },
          {
            urlPattern: /\/api\/sales-orders/,
            handler: "NetworkFirst",
            options: {
              cacheName: "sales-orders-cache",
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 2 * 60 * 60,
              },
            },
          },
          {
            urlPattern: /\/api\/ai-agents/,
            handler: "NetworkOnly",
          },
          // Background Sync for write methods — POST/PUT operations are queued
          // offline and replayed automatically when the connection is restored.
          {
            urlPattern: ({ request }: { request: Request }) =>
              (request.method === "POST" || request.method === "PUT") &&
              /\/api\/pos\/sales/.test(request.url),
            handler: "NetworkOnly",
            options: {
              backgroundSync: {
                name: "pos-sales-sync-queue",
                options: { maxRetentionTime: 24 * 60 },
              },
            },
          },
          {
            urlPattern: ({ request }: { request: Request }) =>
              (request.method === "POST" || request.method === "PUT") &&
              /\/api\/mes\/tasks/.test(request.url),
            handler: "NetworkOnly",
            options: {
              backgroundSync: {
                name: "mes-tasks-sync-queue",
                options: { maxRetentionTime: 8 * 60 },
              },
            },
          },
          {
            urlPattern: ({ request }: { request: Request }) =>
              request.method === "POST" &&
              /\/api\/hr\/daily-report/.test(request.url),
            handler: "NetworkOnly",
            options: {
              backgroundSync: {
                name: "hr-report-sync-queue",
                options: { maxRetentionTime: 24 * 60 },
              },
            },
          },
        ],
      },
      manifest: {
        name: "EuroPrint ERP — POS Kassa",
        short_name: "ERP POS",
        description: "EuroPrint ERP tizimi — POS Kassa oflayn rejimida",
        start_url: basePath,
        scope: basePath,
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#2563eb",
        lang: "uz",
        icons: [
          {
            src: `${basePrefix}/icon-192.png`,
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: `${basePrefix}/icon-512.png`,
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@shared/schema": path.resolve(import.meta.dirname, "src/shared-schema.ts"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    proxy: {
      [`${basePrefix}/api`]: {
        target: nestApiUrl,
        rewrite: (path: string) => path.replace(basePrefix, ""),
        changeOrigin: true,
        ws: true,
      },
      "/api": {
        target: nestApiUrl,
        changeOrigin: true,
        ws: true,
      },
      // Fayl yuklash/ko'rish: /storage/... → nestjs /api/storage/...
      "/storage": {
        target: nestApiUrl,
        changeOrigin: true,
        rewrite: (path: string) => `/api${path}`,
      },
      "/socket.io": {
        target: nestApiUrl,
        changeOrigin: true,
        ws: true,
      },
      [`${basePrefix}/socket.io`]: {
        target: nestApiUrl,
        rewrite: (path: string) => path.replace(basePrefix, ""),
        changeOrigin: true,
        ws: true,
      },
    },
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
