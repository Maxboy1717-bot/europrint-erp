/**
 * @module main
 * @description React entry point. Initialises Sentry (graceful degradation if
 * VITE_SENTRY_DSN is missing), then mounts the app inside a Sentry error
 * boundary so unhandled render errors are reported instead of crashing silently.
 */

import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App";
import "./index.css";
import { installFetchInterceptor } from "./lib/fetchInterceptor";

const sentryDsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
const sentryEnvironment =
  (import.meta.env.VITE_SENTRY_ENVIRONMENT as string | undefined) ??
  (import.meta.env.MODE as string | undefined) ??
  "development";
const sentryRelease = import.meta.env.VITE_SENTRY_RELEASE as string | undefined;
const isProduction = import.meta.env.PROD === true;

if (sentryDsn && sentryDsn.length > 0 && isProduction) {
  Sentry.init({
    dsn: sentryDsn,
    environment: sentryEnvironment,
    release: sentryRelease,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        // Mask all input fields and text content to avoid leaking PII.
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: isProduction ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    // Drop expected auth/not-found responses so they don't burn Sentry quota.
    beforeSend(event) {
      const status = (event.contexts?.response as { status_code?: number } | undefined)
        ?.status_code;
      if (typeof status === "number" && [401, 403, 404].includes(status)) {
        return null;
      }
      return event;
    },
  });
} else {
  // eslint-disable-next-line no-console
  console.warn(
    "[sentry] VITE_SENTRY_DSN not set — frontend error monitoring is DISABLED.",
  );
}

installFetchInterceptor();

function SentryFallback({ error, resetError }: { error: unknown; resetError: () => void }) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    <div
      role="alert"
      style={{
        padding: "32px",
        maxWidth: "600px",
        margin: "80px auto",
        fontFamily: "system-ui, -apple-system, sans-serif",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "24px", marginBottom: "12px" }}>
        Kutilmagan xatolik yuz berdi
      </h1>
      <p style={{ color: "var(--ep-muted)", marginBottom: "20px" }}>{message}</p>
      <button
        type="button"
        onClick={resetError}
        style={{
          padding: "10px 20px",
          background: "var(--ep-blue)",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        Qaytadan urinish
      </button>
    </div>
  );
}

// Dev self-heal: a service worker left over from an earlier PRODUCTION build can keep serving a
// stale/broken app shell in dev and intercept /api calls — so the app "won't load" even after a
// hard refresh (Ctrl+Shift+R does not bypass a controlling SW). In DEV, proactively unregister any
// existing SW and drop its caches on startup, then reload once so the fresh Vite build takes over.
if (import.meta.env.DEV && typeof navigator !== "undefined" && "serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    if (regs.length === 0) return;
    Promise.all(regs.map((r) => r.unregister()))
      .then(() => (typeof caches !== "undefined" ? caches.keys().then((ks) => Promise.all(ks.map((k) => caches.delete(k)))) : undefined))
      .then(() => window.location.reload())
      .catch(() => {});
  }).catch(() => {});
}

createRoot(document.getElementById("root")!).render(
  <Sentry.ErrorBoundary fallback={SentryFallback} showDialog={false}>
    <App />
  </Sentry.ErrorBoundary>,
);
