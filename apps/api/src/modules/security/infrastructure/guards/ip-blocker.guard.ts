/**
 * @module ip-blocker.guard
 * @description NestJS guard. canActivate() returns true when access is permitted; throws Unauthorized/Forbidden otherwise.
 */

import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';

import { MS_PER_MINUTE } from '@common/constants/app.constants';
@Injectable()
export class IpBlockerGuard implements CanActivate {
  private readonly logger = new Logger(IpBlockerGuard.name);
  private readonly blockedIps = new Map<string, { until: number; reason: string }>();

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const ip = this.extractIp(request);

    if (!ip) return true;

    const blocked = this.blockedIps.get(ip);
    if (blocked) {
      if (Date.now() < blocked.until) {
        this.logger.warn(`Bloklangan IP urinishi: ${ip} — sabab: ${blocked.reason}`);
        throw new ForbiddenException(`Bu IP manzil vaqtincha bloklangan. Sabab: ${blocked.reason}`);
      }
      this.blockedIps.delete(ip);
    }

    return true;
  }

  blockIp(ip: string, reason: string, durationMinutes = 60): void {
    const until = Date.now() + durationMinutes * MS_PER_MINUTE;
    this.blockedIps.set(ip, { until, reason });
    this.logger.warn(`IP bloklandi: ${ip} — ${durationMinutes} daqiqa — sabab: ${reason}`);
  }

  unblockIp(ip: string): void {
    this.blockedIps.delete(ip);
    this.logger.log(`IP blokdan chiqarildi: ${ip}`);
  }

  isBlocked(ip: string): boolean {
    const blocked = this.blockedIps.get(ip);
    if (!blocked) return false;
    if (Date.now() >= blocked.until) {
      this.blockedIps.delete(ip);
      return false;
    }
    return true;
  }

  getBlockedList(): Array<{ ip: string; until: Date; reason: string }> {
    const now = Date.now();
    const result = [];
    for (const [ip, { until, reason }] of this.blockedIps.entries()) {
      if (now < until) {
        result.push({ ip, until: new Date(until), reason });
      } else {
        this.blockedIps.delete(ip);
      }
    }
    return result;
  }

  private extractIp(request: Record<string, unknown>): string | null {
    const headers = request.headers as Record<string, string> | undefined;
    const connection = request.connection as { remoteAddress?: string } | undefined;
    return (
      headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
      headers?.['x-real-ip'] ||
      (request.ip as string | undefined) ||
      connection?.remoteAddress ||
      null
    );
  }
}
