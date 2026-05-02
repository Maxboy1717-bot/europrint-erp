/**
 * POS — Auth Service
 * Validates credentials and issues a POS-specific JWT.
 * Follows service → repository → Result<T, AppError> pattern.
 * ERP-independent: does not call the main auth module.
 */
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Ok, Err, Result, AppErr } from '@common/result';
import { PosAuthRepository } from '../repositories/pos-auth.repository';

const POS_ALLOWED_ROLES = new Set([
  'pos', 'pos_manager', 'warehouse_manager', 'warehouse_staff',
  'warehouse_viewer', 'qc_inspector', 'finance_head', 'admin', 'super_admin',
]);

export interface PosAuthPayload {
  token:    string;
  userId:   number;
  role:     string;
  username: string;
}

@Injectable()
export class PosAuthService {
  private readonly logger = new Logger(PosAuthService.name);

  constructor(
    private readonly repo:       PosAuthRepository,
    private readonly jwtService: JwtService,
  ) {}

  async login(username: string, password: string): Promise<Result<PosAuthPayload>> {
    const userResult = await this.repo.findByUsername(username);
    if (!userResult.ok) {
      this.logger.warn(`POS login rejected — user not found/inactive: ${username}`);
      return Err(AppErr('UNAUTHORIZED', 'Login yoki parol noto\u02bcg\u02bcri'));
    }

    const user = userResult.data;
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      this.logger.warn(`POS login rejected — wrong password: ${username}`);
      return Err(AppErr('UNAUTHORIZED', 'Login yoki parol noto\u02bcg\u02bcri'));
    }

    const role = (user.role ?? '').toLowerCase();
    if (!POS_ALLOWED_ROLES.has(role) && !role.startsWith('pos')) {
      this.logger.warn(`POS login rejected — role not allowed: ${username} role=${role}`);
      return Err(AppErr('FORBIDDEN', 'Bu foydalanuvchi POS Monitor ga kirish huquqiga ega emas'));
    }

    const token = this.jwtService.sign({ sub: user.id, username: user.username, role: user.role });
    this.logger.log(`POS login success: ${username} role=${role}`);
    return Ok({ token, userId: user.id, role: user.role, username: user.username });
  }
}
