/**
 * Smoke spec for VideoTokenService (Rule 22: every service needs a unit test).
 */
import { VideoTokenService } from '../../src/modules/chat/video-token.service';

describe('VideoTokenService', () => {
  const makeConfig = (overrides: Record<string, string | undefined> = {}) => ({
    get: jest.fn((key: string) => overrides[key]),
  });

  it('class is defined', () => {
    expect(VideoTokenService).toBeDefined();
  });

  it('class name matches expected', () => {
    expect(VideoTokenService.name).toBe('VideoTokenService');
  });

  it('is constructible with a ConfigService stub', () => {
    const svc = new VideoTokenService(makeConfig() as never);
    expect(svc).toBeInstanceOf(VideoTokenService);
  });

  it('generate returns roomName/jitsiUrl/embedUrl for a non-JaaS config', () => {
    const config = makeConfig({ JITSI_URL: 'https://jitsi.example.com' });
    const svc = new VideoTokenService(config as never);
    const result = svc.generate({ id: 'u1', fullName: 'Test User', email: 'u@example.com' }, 'room-42');
    expect(result.roomName).toBe('europrint-room-42');
    expect(result.jitsiUrl).toContain('jitsi');
    expect(typeof result.embedUrl).toBe('string');
  });

  it('generate produces a null token when JaaS credentials are absent', () => {
    const svc = new VideoTokenService(makeConfig() as never);
    const result = svc.generate({ id: 'u1' }, 'room-x');
    expect(result.token).toBeNull();
  });
});
