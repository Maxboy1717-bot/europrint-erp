import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { safeNum } from '@common/math';
import { Injectable, Logger } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { WasteRepository } from './waste.repository';

import { MS_PER_DAY } from '@common/constants/app.constants';
@Injectable()
export class WasteService {
  private readonly logger = new Logger(WasteService.name);

  constructor(private readonly repo: WasteRepository) {}

  async getRecords(q: Record<string, string>): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const dateFrom  = q['dateFrom']  ?? null;
      const dateTo    = q['dateTo']    ?? null;
      const wasteType = q['wasteType'] ?? null;
      const machineId = q['machineId'] ?? null;
      const operatorId = q['operatorId'] ?? null;
      return this.repo.getRecords(dateFrom, dateTo, wasteType, machineId, operatorId);
    });
  }

  async createRecord(body: Record<string, unknown>) {
    return safeCall(async () => {
      const qty = safeNum(body['quantity'] ?? 0);
      const costPer = safeNum(body['costPerUnit'] ?? 0);
      const totalCost = qty * costPer;
      return this.repo.createRecord(body, qty, costPer, totalCost);
    });
  }

  async updateRecord(id: string, body: Record<string, unknown>) {
    return safeCall(async () => {
      const dto: { recycledQuantity?: number; notes?: string; correctionAction?: string } = {};
      if (body['recycledQuantity'] !== undefined) dto.recycledQuantity = safeNum(body['recycledQuantity']);
      if (body['notes']            !== undefined) dto.notes            = String(body['notes'] ?? '');
      if (body['correctionAction'] !== undefined) dto.correctionAction = String(body['correctionAction'] ?? '');
      return this.repo.updateRecord(id, dto);
    });
  }

  async getDashboard() {
    return safeCall(async () => {
      const today   = _time.now().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * MS_PER_DAY).toISOString().split('T')[0];
      const monthAgo = new Date(Date.now() - 30 * MS_PER_DAY).toISOString().split('T')[0];
      const dashR = await this.repo.getDashboardStats(today, weekAgo, monthAgo);
      const dashData = (dashR.ok ? dashR.data : {}) as { todayR: unknown; weekR: unknown; monthR: unknown; byType: unknown; topCauses: unknown; recyclable: unknown; byMachine: unknown };
      const { todayR, weekR, monthR, byType, topCauses, recyclable, byMachine } = dashData;
      return { today: todayR, week: weekR, month: monthR, byType, topCauses, recyclable, byMachine };
    });
  }

  async getTrends(q: Record<string, string>) {
    return safeCall(async () => {
      const rawPeriod = q['period'] ?? 'day';
      const groupBy: 'day' | 'week' | 'month' =
        rawPeriod === 'weekly' || rawPeriod === 'week' ? 'week' :
        rawPeriod === 'monthly' || rawPeriod === 'month' ? 'month' : 'day';
      const daysNum  = parseInt(q['days'] ?? '30', 10) || 30;
      const dateFrom = new Date(Date.now() - daysNum * MS_PER_DAY).toISOString().split('T')[0];
      return this.repo.getTrends(groupBy, dateFrom);
    });
  }

  async getTargets() {
    return safeCall(async () => this.repo.getTargets());
  }

  async createTarget(body: Record<string, unknown>) {
    return safeCall(async () => this.repo.createTarget(body));
  }

  async getAnalysis() {
    return safeCall(async () => {
      const monthAgo = new Date(Date.now() - 30 * MS_PER_DAY).toISOString().split('T')[0];
      const analysisR = await this.repo.getAnalysisData(monthAgo);
      const analysisData = (analysisR.ok ? analysisR.data : {}) as { byType: Record<string, unknown>[]; byMaterial: Record<string, unknown>[]; topCauses: Record<string, unknown>[] };
      const { byType, byMaterial, topCauses } = analysisData;
      const recommendations: string[] = [];
      if (byType.length > 0) {
        const typeLabels: Record<string, string> = {
          setup: 'Sozlash chiqindisi', trim: 'Kesish chiqindisi', defect: 'Nuqsonli mahsulot',
          overrun: 'Ortiqcha ishlab chiqarish', material_defect: 'Material nuqsoni', other: 'Boshqa',
        };
        const top = byType[0];
        const label = typeLabels[String(top['waste_type'])] || String(top['waste_type']);
        recommendations.push(`Eng ko'p chiqindi turi: ${label} (${Number(top['total_quantity']).toFixed(1)} kg). Bu turni kamaytirish usullarini ko'rib chiqing.`);
      }
      if (topCauses.length > 0) {
        recommendations.push(`Asosiy sabab: "${topCauses[0]['cause']}" (${topCauses[0]['record_count']} marta). Ildiz sababni bartaraf etish zarur.`);
      }
      recommendations.push(
        "Qayta ishlash mumkin bo'lgan chiqindilarni ajratib, qayta ishlash dasturini kengaytiring.",
        'Har bir smena boshida dastgohlarni tekshirish orqali sozlash chiqindilarini kamaytirish mumkin.',
        "Operatorlar uchun muntazam treninglar o'tkazing - bu nuqsonli mahsulot miqdorini kamaytiradi.",
      );
      return { byType, byMaterial, topCauses, recommendations, period: { from: monthAgo, to: _time.now().toISOString().split('T')[0] } };
    });
  }
}
