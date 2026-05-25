/**
 * @module video-token.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import * as crypto from 'crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface VideoTokenResult {
  token:    string | null;
  jitsiUrl: string;
  roomName: string;
  embedUrl: string;
}

export interface VideoTokenUser {
  id:       number | string;
  fullName?: string;
  email?:   string;
}

interface JitsiConfig {
  jitsiUrl:   string;
  appId:      string;
  privateKey: string;
  keyId:      string;
  isJaaS:     boolean;
}

interface UserCtx {
  id:        string;
  name:      string;
  email:     string;
  avatar:    string;
  moderator: boolean;
}

@Injectable()
export class VideoTokenService {
  constructor(private readonly config: ConfigService) {}

  generate(user: VideoTokenUser, roomId: string): VideoTokenResult {
    const cfg      = this.loadConfig();
    const roomName = `europrint-${roomId}`;
    const now      = Math.floor(Date.now() / 1000);
    const userCtx  = this.buildUserCtx(user);

    let token: string | null = null;
    if (cfg.isJaaS && cfg.privateKey && cfg.keyId) {
      token = this.signJaaS(cfg, userCtx, now);
    } else if (!cfg.isJaaS) {
      token = this.signSelfHosted(cfg, userCtx, roomName, now);
    }

    const embedUrl = this.buildEmbedUrl(cfg, roomName, token);
    return { token, jitsiUrl: cfg.jitsiUrl, roomName, embedUrl };
  }

  private loadConfig(): JitsiConfig {
    const jitsiUrl   = this.config.get<string>('JITSI_URL') || 'https://meet.jit.si';
    const appId      = this.config.get<string>('JITSI_APP_ID') || '';
    const privateKey = (this.config.get<string>('JITSI_PRIVATE_KEY') || '').replace(/\\n/g, '\n');
    const keyId      = this.config.get<string>('JITSI_KEY_ID') || '';
    const isJaaS     = jitsiUrl.includes('8x8.vc') && appId.startsWith('vpaas-magic-cookie-');
    return { jitsiUrl, appId, privateKey, keyId, isJaaS };
  }

  private buildUserCtx(user: VideoTokenUser): UserCtx {
    return {
      id:        String(user.id),
      name:      String(user.fullName ?? user.id),
      email:     String(user.email ?? ''),
      avatar:    '',
      moderator: true,
    };
  }

  private signJaaS(cfg: JitsiConfig, userCtx: UserCtx, now: number): string {
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: cfg.keyId })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({
      iss: 'chat', aud: 'jitsi', iat: now, exp: now + 3600, nbf: now - 10,
      sub: cfg.appId, room: '*',
      context: {
        user: userCtx,
        features: { livestreaming: false, recording: false, transcription: false, 'outbound-call': false },
      },
    })).toString('base64url');

    const signer = crypto.createSign('RSA-SHA256');
    signer.update(`${header}.${payload}`);
    return `${header}.${payload}.${signer.sign(cfg.privateKey, 'base64url')}`;
  }

  private signSelfHosted(cfg: JitsiConfig, userCtx: UserCtx, roomName: string, now: number): string {
    const appSecret = this.config.get<string>('JITSI_APP_SECRET') || '';
    const domain    = cfg.jitsiUrl.replace(/^https?:\/\//, '');
    const header    = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload   = Buffer.from(JSON.stringify({
      iss: cfg.appId || 'europrint_erp', sub: domain, aud: 'jitsi',
      iat: now, exp: now + 3600, nbf: now - 10, room: roomName,
      context: { user: userCtx, features: { livestreaming: false, recording: false } },
    })).toString('base64url');

    const signature = crypto.createHmac('sha256', appSecret).update(`${header}.${payload}`).digest('base64url');
    return `${header}.${payload}.${signature}`;
  }

  private buildEmbedUrl(cfg: JitsiConfig, roomName: string, token: string | null): string {
    const jwtPart = token ? `?jwt=${token}` : '';
    return cfg.isJaaS
      ? `${cfg.jitsiUrl}/${cfg.appId}/${roomName}${jwtPart}#config.prejoinPageEnabled=false`
      : `${cfg.jitsiUrl}/${roomName}${jwtPart}#config.prejoinPageEnabled=false`;
  }
}
