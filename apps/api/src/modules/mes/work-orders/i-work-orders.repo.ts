import { Result } from '@common/result';

export type WorkOrderRow = Record<string, unknown>;

export interface IWorkOrdersRepository {
  findAll(limit: number, offset: number): Promise<Result<{ data: WorkOrderRow[]; count: number }>>;
  findById(id: number): Promise<Result<WorkOrderRow | null>>;
  findSessionsByOrderId(orderId: number): Promise<Result<WorkOrderRow[]>>;
  findCrewsByOrderId(orderId: number): Promise<Result<WorkOrderRow[]>>;
  create(dto: Record<string, unknown>): Promise<Result<WorkOrderRow>>;
  updateStatus(id: number, status: string): Promise<Result<WorkOrderRow>>;
}

export const WORK_ORDERS_REPO = 'IWorkOrdersRepository';
