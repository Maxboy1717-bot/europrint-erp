import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { safeStorage } from '@/lib/safeStorage';

/**
 * API javobidan xavfsiz massiv olish.
 * { data: [], orders: [], items: [] } yoki to'g'ridan-to'g'ri [] bo'lsa ham ishlaydi.
 */
export function safeArray<T = unknown>(data: unknown, key?: string): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as T[];
  const obj = data as Record<string, unknown>;
  if (key && Array.isArray(obj[key])) return obj[key] as T[];
  for (const k of ["data", "items", "results", "orders", "list", "records"]) {
    if (Array.isArray(obj[k])) return obj[k] as T[];
  }
  return [];
}

/**
 * useQuery({ select }) uchun array koercion.
 * Massiv qaytarishi kerak bo'lgan har qanday endpoint da ishlating:
 *   const { data = [] } = useQuery({ queryKey: [...], select: selectArray<T> });
 * Bu query layer da noto'g'ri shakl (null, object, undefined) ni xavfsiz []  ga aylantiradi.
 */
export function selectArray<T = unknown>(data: unknown): T[] {
  return safeArray<T>(data);
}

/**
 * Credentials bilan fetch — barcha sahifalar uchun
 */
export class AuthError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "HttpError";
  }
}

export function getAuthHeaders(): Record<string, string> {
  const token = safeStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function setAuthToken(accessToken?: string, refreshToken?: string) {
  if (accessToken) safeStorage.setItem("access_token", accessToken);
  if (refreshToken) safeStorage.setItem("refresh_token", refreshToken);
}

export function clearAuthToken() {
  safeStorage.removeItem("access_token");
  safeStorage.removeItem("refresh_token");
}

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

let redirectScheduled = false;
function scheduleLoginRedirect() {
  if (redirectScheduled) return;
  redirectScheduled = true;
  setTimeout(() => {
    redirectScheduled = false;
    clearAuthToken();
    window.location.href = `${import.meta.env.BASE_URL}login`;
  }, 300);
}

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = safeStorage.getItem("refresh_token");
  if (!refreshToken) return false;
  try {
    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      credentials: "include",
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (data.accessToken) {
      setAuthToken(data.accessToken, data.refreshToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

async function refreshTokenOnce(): Promise<boolean> {
  if (isRefreshing && refreshPromise) return refreshPromise;
  isRefreshing = true;
  refreshPromise = tryRefreshToken().finally(() => {
    isRefreshing = false;
    refreshPromise = null;
  });
  return refreshPromise;
}

export async function fetchWithAuth(url: string): Promise<unknown> {
  let res = await fetch(url, { credentials: "include", headers: { ...getAuthHeaders() } });
  if (res.status === 401) {
    const refreshed = await refreshTokenOnce();
    if (refreshed) {
      res = await fetch(url, { credentials: "include", headers: { ...getAuthHeaders() } });
    }
  }
  if (res.status === 401) {
    scheduleLoginRedirect();
    throw new AuthError(res.status, "Autentifikatsiya kerak");
  }
  if (res.status === 403) {
    throw new AuthError(res.status, 'Ruxsat yo\'q: 403 Forbidden');
  }
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new HttpError(res.status, `HTTP xatosi ${res.status}: ${text}`);
  }
  return await res.json();
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest<T = any>(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<T> {
  const isFormData = data instanceof FormData;
  const headers: Record<string, string> = {
    ...getAuthHeaders(),
    ...(!isFormData && data ? { "Content-Type": "application/json" } : {}),
  };

  const res = await fetch(url, {
    method,
    headers,
    body: isFormData ? data : data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);

  const contentType = res.headers.get("content-type");
  if (res.status === 204 || !contentType?.includes("application/json")) {
    return undefined as unknown as T;
  }
  const json = await res.json();
  // Result<T> himoyasi: backend { isSuccess, isFailure, value, error } qaytarsa
  // avtomatik unwrap qilamiz. ResultUnwrapInterceptor ishlamagan holatda backup.
  if (
    json !== null &&
    typeof json === 'object' &&
    'isSuccess' in json &&
    'isFailure' in json
  ) {
    if ((json as Record<string, unknown>).isSuccess) {
      return (json as Record<string, unknown>).value as T;
    }
    throw new HttpError(500, String((json as Record<string, unknown>).error ?? 'Server xatosi'));
  }
  return json as T;
}

function buildUrlFromQueryKey(queryKey: readonly unknown[]): string {
  let baseUrl = "";
  const params: Record<string, string> = {};

  for (const segment of queryKey) {
    if (typeof segment === "string") {
      if (!baseUrl) {
        baseUrl = segment;
      } else {
        baseUrl = `${baseUrl}/${segment}`;
      }
    } else if (segment !== null && segment !== undefined && typeof segment === "object") {
      for (const [k, v] of Object.entries(segment as Record<string, unknown>)) {
        if (v !== undefined && v !== null && v !== "") {
          params[k] = String(v);
        }
      }
    }
  }

  const queryString = new URLSearchParams(params).toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

type UnauthorizedBehavior = "returnNull" | "throw";

export function getQueryFn<T>(options: {
  on401: UnauthorizedBehavior;
}): QueryFunction<T> {
  const { on401: unauthorizedBehavior } = options;
  return async ({ queryKey }) => {
    const url = buildUrlFromQueryKey(queryKey);
    let res = await fetch(url, {
      credentials: "include",
      headers: { ...getAuthHeaders() },
    });

    if (res.status === 401) {
      const refreshed = await refreshTokenOnce();
      if (refreshed) {
        res = await fetch(url, {
          credentials: "include",
          headers: { ...getAuthHeaders() },
        });
      }
    }

    if (res.status === 401 || res.status === 403) {
      if (unauthorizedBehavior === "returnNull") {
        scheduleLoginRedirect();
        return undefined as unknown as T;
      }
      scheduleLoginRedirect();
      throw new AuthError(res.status, res.status === 403 ? "Ruxsat yo'q" : "Autentifikatsiya kerak");
    }

    await throwIfResNotOk(res);
    const json = await res.json();
    if (json === null) return undefined as unknown as T;
    if (json && typeof json === "object" && !Array.isArray(json)) {
      const obj = json as Record<string, unknown>;
      if (obj.ok === true && "data" in obj) {
        return obj.data as T;
      }
      if ("data" in obj && Array.isArray(obj.data)) {
        return obj.data as T;
      }
    }
    return json as T;
  };
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
