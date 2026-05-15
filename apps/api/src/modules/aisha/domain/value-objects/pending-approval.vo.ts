/**
 * @module pending-approval.vo
 * @description High-stake action awaiting voice "yes" (or PIN for critical).
 * Auto-expires after 5 minutes. Use `approve()` / `reject()` / `expire()`
 * which return a fresh VO instance — never mutate the underlying props.
 */

import { Result, Ok, Err, AppErr } from '@common/result';

export type StakeLevel = 'medium' | 'high' | 'critical';
export type ApprovalState = 'pending' | 'approved' | 'rejected' | 'expired';

const TTL_MS = 5 * 60 * 1000;

export interface PendingApprovalProps {
  toolCallId:    string;
  stakeLevel:    StakeLevel;
  requiresPIN:   boolean;
  createdAtMs:   number;
  state:         ApprovalState;
}

export class PendingApproval {
  private constructor(public readonly props: Readonly<PendingApprovalProps>) {}

  static create(input: { toolCallId: string; stakeLevel: StakeLevel; nowMs?: number }): Result<PendingApproval> {
    if (!input.toolCallId) {
      return Err(AppErr('VALIDATION', 'PendingApproval: toolCallId majburiy'));
    }
    if (!['medium', 'high', 'critical'].includes(input.stakeLevel)) {
      return Err(AppErr('VALIDATION', `PendingApproval: noma'lum stakeLevel "${input.stakeLevel}"`));
    }
    const requiresPIN = input.stakeLevel === 'critical';
    return Ok(new PendingApproval({
      toolCallId:  input.toolCallId,
      stakeLevel:  input.stakeLevel,
      requiresPIN,
      createdAtMs: input.nowMs ?? Date.now(),
      state:       'pending',
    }));
  }

  isExpired(nowMs: number = Date.now()): boolean {
    return (nowMs - this.props.createdAtMs) > TTL_MS;
  }

  approve(nowMs: number = Date.now()): Result<PendingApproval> {
    if (this.props.state !== 'pending') {
      return Err(AppErr('INVALID_STATUS', `PendingApproval: state="${this.props.state}" — approve qilib bo'lmaydi`));
    }
    if (this.isExpired(nowMs)) {
      return Err(AppErr('CONFLICT', 'PendingApproval: 5 daqiqa o\'tdi'));
    }
    return Ok(new PendingApproval({ ...this.props, state: 'approved' }));
  }

  reject(): Result<PendingApproval> {
    if (this.props.state !== 'pending') {
      return Err(AppErr('INVALID_STATUS', `PendingApproval: state="${this.props.state}" — reject qilib bo'lmaydi`));
    }
    return Ok(new PendingApproval({ ...this.props, state: 'rejected' }));
  }

  expire(): PendingApproval {
    return new PendingApproval({ ...this.props, state: 'expired' });
  }
}
