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

@Injectable()
export class VideoTokenService {
  constructor(private readonly config: ConfigService) {}

  generate(user: VideoTokenUser, roomId: string): VideoTokenResult {
    const jitsiUrl   = this.config.get<string>('JITSI_URL') || 'https://meet.jit.si';
    const appId      = this.config.get<string>('JITSI_APP_ID') || '';
    const privateKey = (this.config.get<string>('JITSI_PRIVATE_KEY') || '').replace(/\\n/g, '\n');
    const keyId      = this.config.get<string>('JITSI_KEY_ID') || '';

    const isJaaS    = jitsiUrl.includes('8x8.vc') && appId.startsWith('vpaas-magic-cookie-');
    const roomName  = `europrint-${roomId}`;
    const now       = Math.floor(Date.now() / 1000);
    const userCtx   = {
      id:        String(user.id),
      name:      String(user.fullName ?? user.id),
      email:     String(user.email ?? ''),
      avatar:    '',
      moderator: true,
    };

    let token: string | null = null;

    if (isJaaS && privateKey && keyId) {
      // RS256 — JaaS requires asymmetric key
      const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: keyId })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({
        iss: 'chat', aud: 'jitsi', iat: now, exp: now + 3600, nbf: now - 10,
        sub: appId, room: '*',
        context: {
          user: userCtx,
          features: { livestreaming: false, recording: false, transcription: false, 'outbound-call': false },
        },
      })).toString('base64url');

      const signer = crypto.createSign('RSA-SHA256');
      signer.update(`${header}.${payload}`);
      token = `${header}.${payload}.${signer.sign(privateKey, 'base64url')}`;

    } else if (!isJaaS) {
      // HS256 — self-hosted Jitsi
      const appSecret = this.config.get<string>('JITSI_APP_SECRET') || '';
      const domain    = jitsiUrl.replace(/^https?:\/\//, '');
      const header    = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
      const payload   = Buffer.from(JSON.stringify({
        iss: appId || 'europrint_erp', sub: domain, aud: 'jitsi',
        iat: now, exp: now + 3600, nbf: now - 10, room: roomName,
        context: {
          user: userCtx,
          features: { livestreaming: false, recording: false },
        },
      })).toString('base64url');

      const signature = crypto.createHmac('sha256', appSecret).update(`${header}.${payload}`).digest('base64url');
      token = `${header}.${payload}.${signature}`;
    }

    const embedUrl = isJaaS
      ? `${jitsiUrl}/${appId}/${roomName}${token ? `?jwt=${token}` : ''}#config.prejoinPageEnabled=false`
      : `${jitsiUrl}/${roomName}${token ? `?jwt=${token}` : ''}#config.prejoinPageEnabled=false`;

    return { token, jitsiUrl, roomName, embedUrl };
  }
}
