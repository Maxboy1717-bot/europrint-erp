import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, Inject, Logger} from '@nestjs/common'; 
import { IPurchaseSvcRepository, PURCHASE_SVC_REPO } from './i-purchase-svc.repo';
import { safeCall, Result, AppError } from '@common/result';

const DB_TO_API_STATUS: Record<string, string> = {
  draft: 'draft',
  sent: 'pending',
  sent_to_vendor: 'pending',
  confirmed: 'approved',
  partially_received: 'partial',
  fully_received: 'completed',
  cancelled: 'cancelled',
};

const API_TO_DB_STATUS: Record<string, string> = {
  draft: 'draft',
  pending: 'sent',
  approved: 'confirmed',
  partial: 'partially_received',
  completed: 'fully_received',
  cancelled: 'cancelled',
};

const PO_STATUS_MACHINE: Record<string, string[]> = {
  draft: ['sent', 'cancelled'],
  sent: ['confirmed', 'cancelled'],
  confirmed: ['partially_received', 'fully_received', 'cancelled'],
  partially_received: ['fully_received'],
  fully_received: [],
  cancelled: [],
};

@Injectable()
export class PurchaseService {
  private readonly logger = new Logger(PurchaseService.name);

  constructor(@Inject(PURCHASE_SVC_REPO) private readonly purchaseSvcRepo: IPurchaseSvcRepository) {}

  toApiStatus(dbStatus: string): string { return DB_TO_API_STATUS[dbStatus] || dbStatus; }
  toDbStatus(apiStatus: string): string { return API_TO_DB_STATUS[apiStatus] || apiStatus; }

  async getOrders(query: Record<string, unknown> = {}): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    const result = await this.purchaseSvcRepo.findAll(100);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    const mapped = (result.data).map(r => {
      const row = r as Record<string, unknown>;
      return {
        ...row,
        totalAmount: Number(row['totalAmount'] || 0),
        status: this.toApiStatus(String(row['status'] ?? '')),
      };
    });
    return { data: mapped };
  
    });}

  async getOrderById(id: number){
    return safeCall(async () => {
    const findResult = await this.purchaseSvcRepo.findById(id);
    if (!findResult.ok) throw new InternalServerErrorException(findResult.error);
    if (!findResult.data) throw new NotFoundException(`PO #${id} topilmadi`);
    const row = findResult.data as Record<string, unknown>;
    const itemsResult = await this.purchaseSvcRepo.findItemsByOrderId(id);
    if (!itemsResult.ok) throw new InternalServerErrorException(itemsResult.error);
    return { ...row, status: this.toApiStatus(String(row['status'] ?? '')), items: itemsResult.data };
  
    });}

  async createOrder(dto: Record<string, unknown>){
    return safeCall(async () => {
    const result = await this.purchaseSvcRepo.create(dto);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async updateStatus(id: number, apiStatus: string){
    return safeCall(async () => {
    const findResult = await this.purchaseSvcRepo.findById(id);
    if (!findResult.ok) throw new InternalServerErrorException(findResult.error);
    if (!findResult.data) throw new NotFoundException(`PO #${id} topilmadi`);
    const row = findResult.data as Record<string, unknown>;
    const currentDb = String(row['status'] ?? '');
    const newDb = this.toDbStatus(apiStatus);
    const allowed = PO_STATUS_MACHINE[String(currentDb)] || [];
    if (!allowed.includes(newDb)) {
      throw new BadRequestException(`${currentDb} → ${newDb} mumkin emas`);
    }
    const updateResult = await this.purchaseSvcRepo.updateStatus(id, newDb);
    if (!updateResult.ok) throw new InternalServerErrorException(updateResult.error);
    return { ...(updateResult.data as Record<string, unknown>), status: this.toApiStatus(newDb) };
  
    });}
}
