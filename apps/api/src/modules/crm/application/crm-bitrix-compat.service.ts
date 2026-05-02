import { Injectable, NotFoundException } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { CrmBitrixCompatRepository } from './crm-bitrix-compat.repository';

@Injectable()
export class CrmBitrixCompatService {
  constructor(private readonly repo: CrmBitrixCompatRepository) {}

  async listProposals(lim: number, off: number): Promise<Result<object, AppError>> {
    return this.repo.listProposals(lim, off);
  }

  async listInvoices(lim: number, off: number) {
    return this.repo.listInvoices(lim, off);
  }

  async listRobots(lim: number, off: number) {
    return this.repo.listRobots(lim, off);
  }

  async getRobot(id: number) {
    return safeCall(async () => {
      const robotResult = await this.repo.getRobot(id);

      if (!robotResult.ok) throw new Error(robotResult.error.message);
      if (!robotResult.data) throw new NotFoundException(`Robot #${id} topilmadi`);

      return robotResult.data;
    });
  }

  async createRobot(body: Record<string, unknown>) {
    return this.repo.createRobot(body);
  }

  async updateRobot(id: number, body: Record<string, unknown>) {
    return this.repo.updateRobot(id, body);
  }

  async toggleRobot(id: number) {
    return this.repo.toggleRobot(id);
  }

  async deleteRobot(id: number) {
    return safeCall(async () => {
      await this.repo.deleteRobot(id);
      return { deleted: true };
    });
  }
}
