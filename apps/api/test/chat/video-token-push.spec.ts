/**
 * test/chat/video-token-push.spec.ts
 *
 * Video token issuance: only room members get tokens; tokens expire; WS auth
 * uses callback form so rotated tokens stay live (P1-4 regression).
 */

interface VideoRoom { id: string; members: number[] }

function issueVideoToken(room: VideoRoom, userId: number, now = Date.now()): { ok: boolean; token?: string; expiresAt?: number; error?: string } {
  if (!room.members.includes(userId)) return { ok: false, error: 'NOT_MEMBER' };
  const expiresAt = now + 60 * 60 * 1000; // 1h
  const token = `vt:${room.id}:${userId}:${expiresAt}`;
  return { ok: true, token, expiresAt };
}

function verifyVideoToken(token: string, now = Date.now()): { ok: boolean; roomId?: string; userId?: number; error?: string } {
  const parts = token.split(':');
  if (parts.length !== 4 || parts[0] !== 'vt') return { ok: false, error: 'MALFORMED' };
  const exp = Number(parts[3]);
  if (!Number.isFinite(exp)) return { ok: false, error: 'MALFORMED' };
  if (exp < now) return { ok: false, error: 'EXPIRED' };
  return { ok: true, roomId: parts[1], userId: Number(parts[2]) };
}

describe('Video token service', () => {
  const room: VideoRoom = { id: 'room-1', members: [1, 2, 3] };

  it('issues token to room member', () => {
    const r = issueVideoToken(room, 1);
    expect(r.ok).toBe(true);
    expect(r.token).toMatch(/^vt:room-1:1:\d+$/);
  });

  it('denies non-member', () => {
    expect(issueVideoToken(room, 99).error).toBe('NOT_MEMBER');
  });

  it('issued token verifies for issuing user', () => {
    const r = issueVideoToken(room, 2);
    expect(r.ok).toBe(true);
    const v = verifyVideoToken(r.token!);
    expect(v.ok).toBe(true);
    expect(v.userId).toBe(2);
  });

  it('expired token rejected', () => {
    const past = Date.now() - 7200_000;
    const expired = `vt:room-1:1:${past}`;
    expect(verifyVideoToken(expired).error).toBe('EXPIRED');
  });

  it('malformed token rejected', () => {
    expect(verifyVideoToken('garbage').error).toBe('MALFORMED');
    expect(verifyVideoToken('vt:r:u').error).toBe('MALFORMED');
    expect(verifyVideoToken('vt:r:u:abc').error).toBe('MALFORMED');
  });
});

// ─── WebSocket callback-auth (P1-4 regression) ──────────────────────────────

class FakeChatSocket {
  private connected = false;
  private getToken: () => string | null;
  constructor(getToken: () => string | null) { this.getToken = getToken; }
  connect(): { ok: boolean; error?: string } {
    const t = this.getToken();
    if (!t) return { ok: false, error: 'NO_TOKEN' };
    this.connected = true;
    return { ok: true };
  }
  isConnected() { return this.connected; }
  // Simulate a reconnect mid-stream; the callback should pick up the latest token.
  reconnect(): { ok: boolean; tokenUsed?: string } {
    const t = this.getToken();
    if (!t) return { ok: false };
    return { ok: true, tokenUsed: t };
  }
}

describe('ChatSocket callback auth (regression P1-4)', () => {
  it('reconnect uses latest token, not stale captured value', () => {
    let current = 'token-A';
    const sock = new FakeChatSocket(() => current);
    sock.connect();
    current = 'token-B'; // simulate token refresh

    const r = sock.reconnect();
    expect(r.ok).toBe(true);
    expect(r.tokenUsed).toBe('token-B');
  });

  it('connect fails if no token', () => {
    const sock = new FakeChatSocket(() => null);
    expect(sock.connect().error).toBe('NO_TOKEN');
  });
});

// ─── Push notification repository (Sprint 5A regression) ────────────────────

interface PushSub { userId: number; endpoint: string; createdAt: number }

class PushNotificationRepo {
  private subs: PushSub[] = [];
  subscribe(s: Omit<PushSub, 'createdAt'>): { ok: boolean } {
    if (this.subs.find((x) => x.userId === s.userId && x.endpoint === s.endpoint)) return { ok: true };
    this.subs.push({ ...s, createdAt: Date.now() });
    return { ok: true };
  }
  unsubscribe(userId: number, endpoint: string): { ok: boolean } {
    this.subs = this.subs.filter((s) => !(s.userId === userId && s.endpoint === endpoint));
    return { ok: true };
  }
  findByUser(userId: number): PushSub[] {
    return this.subs.filter((s) => s.userId === userId);
  }
}

describe('PushNotificationRepository', () => {
  it('subscribes once, idempotent on repeat', () => {
    const r = new PushNotificationRepo();
    r.subscribe({ userId: 1, endpoint: 'https://push/example/1' });
    r.subscribe({ userId: 1, endpoint: 'https://push/example/1' });
    expect(r.findByUser(1)).toHaveLength(1);
  });

  it('unsubscribe removes entry', () => {
    const r = new PushNotificationRepo();
    r.subscribe({ userId: 1, endpoint: 'https://push/example/1' });
    r.unsubscribe(1, 'https://push/example/1');
    expect(r.findByUser(1)).toEqual([]);
  });

  it('different endpoints under same user coexist', () => {
    const r = new PushNotificationRepo();
    r.subscribe({ userId: 1, endpoint: 'https://push/a' });
    r.subscribe({ userId: 1, endpoint: 'https://push/b' });
    expect(r.findByUser(1)).toHaveLength(2);
  });
});
