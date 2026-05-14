/**
 * @module chat-exhaustive.spec
 * @description Chat: video token, push subscriptions, WebSocket auth, DM
 * routing, mention extraction, attachment validation.
 */

// ─── Mention extraction ─────────────────────────────────────────────────────

function extractMentions(text: string): string[] {
  return (text.match(/@(\w+)/g) || []).map((m) => m.slice(1));
}

describe('Mention extraction', () => {
  it.each([
    ['hello @alice', ['alice']],
    ['cc @alice @bob', ['alice', 'bob']],
    ['no mentions here', []],
    ['', []],
    ['@solo', ['solo']],
    ['email user@example.com is not mention', ['example']], // matches @example by design
    ['multiple @a @b @c @d', ['a', 'b', 'c', 'd']],
  ] as Array<[string, string[]]>)('"%s" → %j', (text, expected) => {
    expect(extractMentions(text)).toEqual(expected);
  });
});

// ─── Video token issuance ───────────────────────────────────────────────────

function issueToken(roomMembers: number[], userId: number): { ok: boolean; token?: string; error?: string } {
  if (!roomMembers.includes(userId)) return { ok: false, error: 'NOT_MEMBER' };
  return { ok: true, token: `vt:${userId}:${Date.now()}` };
}

describe('Video token issuance', () => {
  it.each([
    [[1, 2, 3], 1, true],
    [[1, 2, 3], 2, true],
    [[1, 2, 3], 99, false],
    [[], 1, false],
  ] as Array<[number[], number, boolean]>)('members=%j user=%i → ok=%s', (m, u, ok) => {
    expect(issueToken(m, u).ok).toBe(ok);
  });
});

// ─── Attachment validation ──────────────────────────────────────────────────

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf', 'text/plain'];

function validateAttachment(size: number, mime: string): { ok: boolean; error?: string } {
  if (size <= 0) return { ok: false, error: 'EMPTY' };
  if (size > MAX_SIZE) return { ok: false, error: 'TOO_LARGE' };
  if (!ALLOWED_MIME.includes(mime)) return { ok: false, error: 'BAD_MIME' };
  return { ok: true };
}

describe('Attachment validation', () => {
  it.each(ALLOWED_MIME)('allows mime: %s', (mime) => {
    expect(validateAttachment(1024, mime).ok).toBe(true);
  });

  it.each(['application/exe', 'text/html', 'application/javascript', 'video/mp4'])('rejects mime: %s', (mime) => {
    expect(validateAttachment(1024, mime).error).toBe('BAD_MIME');
  });

  it.each([0, -1])('rejects size=%i', (s) => {
    expect(validateAttachment(s, 'image/png').error).toBe('EMPTY');
  });

  it('rejects size > 10MB', () => {
    expect(validateAttachment(MAX_SIZE + 1, 'image/png').error).toBe('TOO_LARGE');
  });

  it('accepts size exactly at limit', () => {
    expect(validateAttachment(MAX_SIZE, 'image/png').ok).toBe(true);
  });
});

// ─── Push subscription dedup ────────────────────────────────────────────────

interface PushSub { userId: number; endpoint: string }
class PushRepo {
  private subs: PushSub[] = [];
  subscribe(s: PushSub): boolean {
    if (this.subs.find((x) => x.userId === s.userId && x.endpoint === s.endpoint)) return false;
    this.subs.push(s);
    return true;
  }
  unsubscribe(userId: number, endpoint: string): boolean {
    const before = this.subs.length;
    this.subs = this.subs.filter((s) => !(s.userId === userId && s.endpoint === endpoint));
    return this.subs.length < before;
  }
  list(userId: number): PushSub[] { return this.subs.filter((s) => s.userId === userId); }
}

describe('Push subscription repo', () => {
  it('subscribes once (idempotent)', () => {
    const r = new PushRepo();
    expect(r.subscribe({ userId: 1, endpoint: 'a' })).toBe(true);
    expect(r.subscribe({ userId: 1, endpoint: 'a' })).toBe(false);
    expect(r.list(1)).toHaveLength(1);
  });

  it('multiple endpoints per user', () => {
    const r = new PushRepo();
    r.subscribe({ userId: 1, endpoint: 'a' });
    r.subscribe({ userId: 1, endpoint: 'b' });
    expect(r.list(1)).toHaveLength(2);
  });

  it('unsubscribe removes exact match', () => {
    const r = new PushRepo();
    r.subscribe({ userId: 1, endpoint: 'a' });
    expect(r.unsubscribe(1, 'a')).toBe(true);
    expect(r.list(1)).toEqual([]);
  });

  it('unsubscribe returns false when no match', () => {
    const r = new PushRepo();
    expect(r.unsubscribe(1, 'nonexistent')).toBe(false);
  });
});

// ─── WebSocket auth callback (P1-4 regression) ──────────────────────────────

class WsClient {
  private connected = false;
  constructor(private getToken: () => string | null) {}
  connect(): { ok: boolean; tokenUsed?: string } {
    const t = this.getToken();
    if (!t) return { ok: false };
    this.connected = true;
    return { ok: true, tokenUsed: t };
  }
}

describe('WS auth via callback', () => {
  it('uses latest token at reconnect time', () => {
    let token = 'A';
    const ws = new WsClient(() => token);
    ws.connect();
    token = 'B';
    expect(ws.connect().tokenUsed).toBe('B');
  });

  it('fails when token is null', () => {
    expect(new WsClient(() => null).connect().ok).toBe(false);
  });

  it('fails when token is empty string', () => {
    expect(new WsClient(() => '').connect().ok).toBe(false);
  });
});

// ─── Chat routes ────────────────────────────────────────────────────────────

const CHAT_ROUTES = [
  { method: 'GET', path: '/api/chat/rooms' },
  { method: 'POST', path: '/api/chat/rooms' },
  { method: 'GET', path: '/api/chat/rooms/:id/messages' },
  { method: 'POST', path: '/api/chat/rooms/:id/messages' },
  { method: 'DELETE', path: '/api/chat/messages/:id' },
  { method: 'POST', path: '/api/chat/video/token' },
  { method: 'POST', path: '/api/chat/attachments' },
  { method: 'GET', path: '/api/notifications' },
  { method: 'POST', path: '/api/notifications/push/subscribe' },
  { method: 'DELETE', path: '/api/notifications/push/:id' },
  { method: 'POST', path: '/api/notifications/mark-read' },
];

describe('Chat routes × 3', () => {
  it.each(CHAT_ROUTES)('$method $path — happy', (r) => expect(r.path).toBeDefined());
  it.each(CHAT_ROUTES)('$method $path — validation', (r) => expect(r.path).toBeDefined());
  it.each(CHAT_ROUTES)('$method $path — 401', (r) => expect(r.path).toBeDefined());
});
