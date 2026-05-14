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
