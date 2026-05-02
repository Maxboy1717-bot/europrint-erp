import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { ThrottlerRequest } from '@nestjs/throttler';

@Injectable()
export class FastifyThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, unknown>): Promise<string> {
    const headers = req.headers as Record<string, string | string[] | undefined> | undefined;
    const forwarded = headers?.['x-forwarded-for'];
    const ip = Array.isArray(forwarded)
      ? forwarded[0]
      : (forwarded as string | undefined)?.split(',')[0]?.trim();
    return ip ?? (req.ip as string | undefined) ?? 'unknown';
  }

  protected async handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
    const { context, throttler } = requestProps;
    const req = context.switchToHttp().getRequest<Record<string, unknown>>();
    const url = String(req.url ?? req.routerPath ?? '');
    const isAuthRoute = /^\/?(?:api\/)?auth(?:\/|$)/.test(url);

    if (throttler.name === 'auth' && !isAuthRoute) {
      return true;
    }
    if (throttler.name === 'default' && isAuthRoute) {
      return true;
    }

    return super.handleRequest(requestProps);
  }
}
