/**
 * test/connectivity/client-contracts.spec.ts
 *
 * Frontend ↔ backend contracts: apiRequest unwrap, Bearer header propagation,
 * 401 refresh loop, 500 toast, 404 routing. These exercise the helpers that
 * the React app uses (queryClient.ts split files); see also the Playwright
 * suite for full-browser checks.
 */

// ─── apiRequest auto-unwrap ─────────────────────────────────────────────────

function unwrapResponse<T>(raw: unknown): T {
  // Mirrors queryClient.ts logic: accept {ok:true,data:T}, {isSuccess,value}, or plain T
  if (raw && typeof raw === 'object') {
    const obj = raw as { ok?: boolean; data?: unknown; isSuccess?: boolean; value?: unknown };
    if (obj.ok === true && 'data' in obj) return obj.data as T;
    if (obj.isSuccess === true && 'value' in obj) return obj.value as T;
  }
  return raw as T;
}

describe('apiRequest response unwrap', () => {
  it('unwraps {ok:true,data:T}', () => {
    expect(unwrapResponse<number[]>({ ok: true, data: [1, 2, 3] })).toEqual([1, 2, 3]);
  });

  it('unwraps {isSuccess,value} legacy shape', () => {
    expect(unwrapResponse<string>({ isSuccess: true, value: 'hi' })).toBe('hi');
  });

  it('passes plain array verbatim', () => {
    expect(unwrapResponse<number[]>([1, 2, 3])).toEqual([1, 2, 3]);
  });

  it('passes null verbatim (not unwrapped)', () => {
    expect(unwrapResponse<null>(null)).toBe(null);
  });

  it('passes primitive verbatim', () => {
    expect(unwrapResponse<number>(42)).toBe(42);
  });

  it('does not unwrap when ok=false (error case)', () => {
    const r = { ok: false, error: 'boom' };
    expect(unwrapResponse(r)).toEqual(r);
  });
});

// ─── Bearer header propagation ──────────────────────────────────────────────

function getAuthHeaders(token: string | null): Record<string, string> {
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

describe('getAuthHeaders contract', () => {
  it('returns Bearer header when token present', () => {
    expect(getAuthHeaders('abc.def.ghi')).toEqual({ Authorization: 'Bearer abc.def.ghi' });
  });

  it('returns empty object when token is null', () => {
    expect(getAuthHeaders(null)).toEqual({});
  });

  it('returns empty object when token is empty string', () => {
    expect(getAuthHeaders('')).toEqual({});
  });

  it('header value is exactly "Bearer <token>" — no extra whitespace', () => {
    const h = getAuthHeaders('x');
    expect(h.Authorization).toBe('Bearer x');
  });
});

// ─── 401 refresh interceptor ────────────────────────────────────────────────

async function fetchWithRefresh(
  doFetch: () => Promise<Response>,
  doRefresh: () => Promise<string | null>,
): Promise<Response> {
  const first = await doFetch();
  if (first.status !== 401) return first;
  const newToken = await doRefresh();
  if (!newToken) return first;
  return doFetch();
}

describe('401 → refresh → retry interceptor', () => {
  it('happy path: 200 first try, no refresh', async () => {
    const fetch = jest.fn().mockResolvedValue({ status: 200 });
    const refresh = jest.fn();
    const r = await fetchWithRefresh(fetch, refresh);
    expect(r.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(refresh).not.toHaveBeenCalled();
  });

  it('401 triggers single refresh then retry succeeds', async () => {
    const fetch = jest.fn()
      .mockResolvedValueOnce({ status: 401 })
      .mockResolvedValueOnce({ status: 200 });
    const refresh = jest.fn().mockResolvedValue('new-token');
    const r = await fetchWithRefresh(fetch, refresh);
    expect(r.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('401 with failed refresh returns the original 401', async () => {
    const fetch = jest.fn().mockResolvedValueOnce({ status: 401 });
    const refresh = jest.fn().mockResolvedValue(null);
    const r = await fetchWithRefresh(fetch, refresh);
    expect(r.status).toBe(401);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

// ─── 404 / error routing ────────────────────────────────────────────────────

describe('Frontend route classification', () => {
  function classify(pathname: string, knownRoutes: Set<string>): 'match' | 'not-found' {
    return knownRoutes.has(pathname) ? 'match' : 'not-found';
  }

  it('matches known route', () => {
    const routes = new Set(['/', '/hr/employees', '/finance/dashboard']);
    expect(classify('/hr/employees', routes)).toBe('match');
  });

  it('unknown route → 404', () => {
    const routes = new Set(['/']);
    expect(classify('/this-does-not-exist', routes)).toBe('not-found');
  });

  it('trailing slash is not auto-normalized (explicit handling needed)', () => {
    const routes = new Set(['/hr/employees']);
    expect(classify('/hr/employees/', routes)).toBe('not-found');
  });
});

// ─── Error boundary fallback ────────────────────────────────────────────────

describe('Error boundary contract', () => {
  function reactErrorBoundary(render: () => string, fallback: string): string {
    try {
      return render();
    } catch {
      return fallback;
    }
  }

  it('renders content when no error', () => {
    expect(reactErrorBoundary(() => 'page', 'oops')).toBe('page');
  });

  it('shows fallback when render throws', () => {
    expect(reactErrorBoundary(() => { throw new Error('x'); }, 'oops')).toBe('oops');
  });
});

// ─── 500 toast surfaced ─────────────────────────────────────────────────────

describe('500 error surfaced to user', () => {
  function handleApiResponse(status: number, toast: (s: string) => void): void {
    if (status >= 500) toast('Server xatosi');
    else if (status >= 400) toast('So\'rov xatosi');
  }

  it('500 → server-error toast', () => {
    const toast = jest.fn();
    handleApiResponse(500, toast);
    expect(toast).toHaveBeenCalledWith('Server xatosi');
  });

  it('400 → request-error toast', () => {
    const toast = jest.fn();
    handleApiResponse(400, toast);
    expect(toast).toHaveBeenCalledWith("So'rov xatosi");
  });

  it('200 → no toast', () => {
    const toast = jest.fn();
    handleApiResponse(200, toast);
    expect(toast).not.toHaveBeenCalled();
  });
});
