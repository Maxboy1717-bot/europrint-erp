/**
 * @module apiBase
 * @description Frontend utility / library module.
 */

export function getApiBase(): string {
  return "/api";
}

export function getNestApiBase(): string {
  return "/api" + "/hr-v2";
}

export function getChatApiBase(): string {
  return "/api/chat";
}

// Thread / forward / poll-create still live ONLY under the `/api/hr-v2/chat` controllers
// (chat-advanced*.controller.ts) — a prior migration repointed getChatApiBase() to `/api/chat`
// but did NOT alias these 3 routes, so calling them via getChatApiBase() 404s. Use this base for
// exactly those endpoints until the BE migration aliases them (aliasing risks a Fastify
// duplicate-route boot-crash, so the safe fix is FE-side).
export function getChatAdvancedApiBase(): string {
  return "/api/hr-v2/chat";
}
