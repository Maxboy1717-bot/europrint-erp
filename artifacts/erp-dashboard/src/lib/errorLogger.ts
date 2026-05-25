/**
 * @module errorLogger
 * @description Frontend utility / library module.
 */

const MAX_QUEUE = 20;
const errorQueue: Array<{
  message: string;
  stack?: string;
  context?: string;
  url: string;
  timestamp: string;
}> = [];

let isFlushing = false;

async function flushErrors() {
  if (isFlushing || errorQueue.length === 0) return;
  isFlushing = true;
  const batch = errorQueue.splice(0, 5);
  try {
    // NOTE: Error logger uses raw fetch (no apiRequest) to avoid recursive
    // error loops if apiRequest itself throws (e.g., 401 refresh fails).
    // No auth header — errors are logged anonymously by design.
    await fetch("/api/client-errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ errors: batch }),
    });
  } catch (err) {
    // Development da console.error ko'rsatiladi — silent fail emas
    if (import.meta.env.DEV) {
      console.error('[errorLogger] flush failed:', err);
    }
  } finally {
    isFlushing = false;
    if (errorQueue.length > 0) {
      setTimeout(flushErrors, 2000);
    }
  }
}

export function logClientError(
  error: unknown,
  context?: string
) {
  const message =
    error instanceof Error ? error.message : String(error);
  const stack =
    error instanceof Error ? error.stack : undefined;

  if (errorQueue.length < MAX_QUEUE) {
    errorQueue.push({
      message,
      stack,
      context,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    });
    setTimeout(flushErrors, 500);
  }
}
