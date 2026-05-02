import { ProductionOrder } from '../aggregates/production-order.aggregate';
import { Bom } from '../aggregates/bom.aggregate';
import { Routing } from '../aggregates/routing.aggregate';
import { Result, Ok, Err } from '@common/result';

export interface IPpRepository {
  savePo(po: ProductionOrder): Promise<Result<number>>;
  getPo(id: number): Promise<Result<ProductionOrder>>;
  getAllPoByStatus(status: string): Promise<Result<ProductionOrder[]>>;

  saveBom(bom: Bom): Promise<Result<number>>;
  getBom(id: number): Promise<Result<Bom>>;
  getBomByProductId(productId: number): Promise<Result<Bom>>;

  saveRouting(routing: Routing): Promise<Result<number>>;
  getRouting(id: number): Promise<Result<Routing>>;
  getRoutingByProductId(productId: number): Promise<Result<Routing>>;

  unlockPlanning(orderId: number): Promise<Result<void>>;
  getProductionPlan(startDate: Date, endDate: Date): Promise<Result<object[]>>;
  getMachineLoad(workCenterId: number): Promise<Result<object[]>>;
}
