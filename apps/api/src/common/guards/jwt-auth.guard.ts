import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = request.headers?.authorization?.split(' ')[1];

    if (!token) {
      throw new UnauthorizedException('Token topilmadi');
    }

    try {
      const decoded = this.jwtService.verify(token) as Record<string, unknown>;
      // Payload validation — har bir token kamida `sub`/`id`/`userId` dan birini saqlashi shart.
      const userId = decoded['sub'] ?? decoded['id'] ?? decoded['userId'];
      if (!userId) {
        throw new UnauthorizedException('Token payload yaroqsiz: foydalanuvchi identifikatori yo\'q');
      }
      // Muddat tugagani — additional sanity check (jwtService.verify also checks this)
      const exp = decoded['exp'] as number | undefined;
      if (exp && exp * 1000 < Date.now()) {
        throw new UnauthorizedException('Token muddati tugagan');
      }
      request.user = { ...decoded, id: userId };
      return true;
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Token yaroqsiz yoki muddati tugagan');
    }
  }
}
