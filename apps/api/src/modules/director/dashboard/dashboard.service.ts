import { Injectable, InternalServerErrorException, Inject, Logger} from '@nestjs/common'; 
import { IDashboardSvcRepository, DASHBOARD_SVC_REPO } from './i-dashboard-svc.repo';
import { safeCall, Result, AppError } from '@common/result';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(@Inject(DASHBOARD_SVC_REPO) private readonly dashboardSvcRepo: IDashboardSvcRepository) {}

  async getSummary(): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    const [usersResult, ordersResult, approvalsResult] = await Promise.all([
      this.dashboardSvcRepo.countUsers(),
      this.dashboardSvcRepo.countOrders(),
      this.dashboardSvcRepo.countPendingApprovals(),
    ]);
    if (!usersResult.ok) throw new InternalServerErrorException(usersResult.error);
    if (!ordersResult.ok) throw new InternalServerErrorException(ordersResult.error);
    if (!approvalsResult.ok) throw new InternalServerErrorException(approvalsResult.error);
    return {
      users: usersResult.data,
      orders: ordersResult.data,
      pendingApprovals: approvalsResult.data,
    };
  
    });}
}
