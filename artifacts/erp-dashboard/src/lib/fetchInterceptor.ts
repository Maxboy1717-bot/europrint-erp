/**
 * @module fetchInterceptor
 * @description Frontend utility / library module.
 */

import { getAuthHeaders } from "./queryClient";

const _originalFetch = window.fetch.bind(window);

/**
 * Patches the global fetch so that any request to /api/* automatically gets
 * the Authorization header injected from localStorage. This fixes all bare
 * fetch() calls that forgot to include getAuthHeaders().
 *
 * Only applies to same-origin /api/ paths to avoid leaking tokens to 3rd parties.
 */
export function installFetchInterceptor() {
  window.fetch = function patchedFetch(input, init) {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;

    const isApiCall =
      typeof url === "string" &&
      (url.startsWith("/api/") || url.startsWith(window.location.origin + "/api/"));

    if (isApiCall) {
      const authHeaders = getAuthHeaders();
      if (Object.keys(authHeaders).length > 0) {
        init = {
          ...init,
          headers: {
            ...authHeaders,
            ...(init?.headers as Record<string, string> | undefined),
          },
        };
      }
    }

    return _originalFetch(input, init);
  };
}
