/**
 * @module utils
 * @description Frontend utility / library module.
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { getAuthHeaders } from './queryClient';

export { getAuthHeaders };

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function nanoid(length = 12): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    result += chars[array[i] % chars.length];
  }
  return result;
}

export interface FetchResult {
  data: Record<string, unknown>;
  ok: true;
  status: number;
}

export async function fetchApi(url: string, options: RequestInit = {}): Promise<FetchResult> {
  const fullUrl = url.startsWith("http") ? url : `/api${url.startsWith("/") ? url : `/${url}`}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
    ...(options.headers as Record<string, string> || {}),
  };
  const res = await fetch(fullUrl, { ...options, headers, credentials: "include" });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status}: ${text}`);
  }
  const data = await res.json().catch(() => null);
  return { data, ok: true, status: res.status };
}
