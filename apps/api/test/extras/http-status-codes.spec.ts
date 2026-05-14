/**
 * @module http-status-codes.spec
 * @description Every common HTTP status code we use, mapped to scenarios.
 */

const STATUSES: Array<[number, string, 'success' | 'redirect' | 'client-error' | 'server-error']> = [
  [200, 'OK', 'success'],
  [201, 'Created', 'success'],
  [202, 'Accepted', 'success'],
  [204, 'No Content', 'success'],
  [301, 'Moved Permanently', 'redirect'],
  [302, 'Found', 'redirect'],
  [304, 'Not Modified', 'redirect'],
  [307, 'Temporary Redirect', 'redirect'],
  [308, 'Permanent Redirect', 'redirect'],
  [400, 'Bad Request', 'client-error'],
  [401, 'Unauthorized', 'client-error'],
  [402, 'Payment Required', 'client-error'],
  [403, 'Forbidden', 'client-error'],
  [404, 'Not Found', 'client-error'],
  [405, 'Method Not Allowed', 'client-error'],
  [408, 'Request Timeout', 'client-error'],
  [409, 'Conflict', 'client-error'],
  [410, 'Gone', 'client-error'],
  [413, 'Payload Too Large', 'client-error'],
  [415, 'Unsupported Media Type', 'client-error'],
  [422, 'Unprocessable Entity', 'client-error'],
  [429, 'Too Many Requests', 'client-error'],
  [500, 'Internal Server Error', 'server-error'],
  [501, 'Not Implemented', 'server-error'],
  [502, 'Bad Gateway', 'server-error'],
  [503, 'Service Unavailable', 'server-error'],
  [504, 'Gateway Timeout', 'server-error'],
];

function classify(status: number): 'success' | 'redirect' | 'client-error' | 'server-error' | 'unknown' {
  if (status >= 500 && status < 600) return 'server-error';
  if (status >= 400 && status < 500) return 'client-error';
  if (status >= 300 && status < 400) return 'redirect';
  if (status >= 200 && status < 300) return 'success';
  return 'unknown';
}

describe('HTTP status classifier — every code we use', () => {
  it.each(STATUSES)('%i (%s) → %s', (status, _name, expected) => {
    expect(classify(status)).toBe(expected);
  });
});

describe('isRetriable — only specific 5xx and 408/429', () => {
  function isRetriable(status: number): boolean {
    return [408, 429, 500, 502, 503, 504].includes(status);
  }
  it.each([
    [200, false], [201, false], [400, false], [401, false], [404, false],
    [408, true], [429, true], [500, true], [502, true], [503, true], [504, true],
    [501, false], [410, false],
  ])('%i retriable=%s', (s, r) => {
    expect(isRetriable(s)).toBe(r);
  });
});

describe('Method × success-status conventions', () => {
  it.each([
    ['GET', 200],
    ['POST', 201],
    ['PUT', 200],
    ['PATCH', 200],
    ['DELETE', 204],
  ])('%s default success → %i', (method, status) => {
    const defaults: Record<string, number> = { GET: 200, POST: 201, PUT: 200, PATCH: 200, DELETE: 204 };
    expect(defaults[method]).toBe(status);
  });
});
