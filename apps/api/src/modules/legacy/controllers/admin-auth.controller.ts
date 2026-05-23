/**
 * @module admin-auth.controller
 * @description Legacy admin JWT refresh endpoint.
 * Uses JWT_REFRESH_SECRET (not the access-token secret) to verify the refresh token.
 */

import { Controller, Post, Body, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LegacyService } from '../services/legacy.service';

@Controller('admin/auth')
export class AdminAuthController {
  constructor(
    private readonly legacySvc: LegacyService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  @Post('refresh')
  async refreshToken(@Body() body: { refreshToken: string }) {
    const refreshSecret = this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');
    const payload = this.jwtService.verify(body.refreshToken, { secret: refreshSecret }) as {
      id: number;
      username?: string;
      role?: string;
      name?: string;
    };
    const admin = await this.legacySvc.findAdminById(payload.id);
    if (!admin) throw new InternalServerErrorException('Admin topilmadi');

    const adminRow = admin as { id: number; username: string; role?: string; name?: string };
    const claims = {
      id: adminRow.id,
      username: adminRow.username,
      role: adminRow.role ?? 'admin',
      name: adminRow.name ?? adminRow.username,
    };
    const accessToken = this.jwtService.sign(claims, { expiresIn: '24h' });
    return { accessToken };
  }
}
