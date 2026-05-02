import { Result } from './shared/domain/result';

declare global {
  interface Result<T = void> {
    readonly isSuccess: boolean;
    readonly value?: T;
    readonly error?: string;
  }

  interface DomainEvent {
    readonly aggregateId: number;
    readonly aggregateName: string;
    readonly eventName: string;
    readonly timestamp: Date;
    readonly data?: Record<string, any>;
  }

  interface AuthenticatedUser {
    id: number;
    email: string;
    roles: string[];
    role?: string;
    sub?: number;
    userId?: number;
    employeeId?: number;
    username?: string;
  }

  type ERP_EVENTS = {
    DEAL_WON: 'deal.won';
    ORDER_CREATED: 'order.created';
    ORDER_STATUS_CHANGED: 'order.status.changed';
    ADVANCE_CHECK_FAILED: 'advance.check.failed';
    PAYMENT_FULL: 'payment.full';
    DESIGN_AND_LAB_COMPLETED: 'design.lab.completed';
  };

  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export {};
