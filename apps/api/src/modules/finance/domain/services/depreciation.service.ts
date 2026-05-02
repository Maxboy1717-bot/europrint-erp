import { Ok, Err, Result, AppError } from '@common/result';

export type DepreciationMethod = 'SL' | 'DB' | 'SYD' | 'UOP';

export interface DepreciationParams {
  cost: number;
  salvage: number;
  usefulLifeYears: number;
  method: DepreciationMethod;
  unitsProduced?: number;
  totalUnits?: number;
  period?: number;
  bookValue?: number;
}

export interface DepreciationScheduleLine {
  period: number;
  depreciation: number;
  bookValue: number;
  accumulated: number;
}

export class DepreciationService {
  validateParams(params: DepreciationParams): Result<void, AppError> {
    if (params.usefulLifeYears <= 0)
      return Err({ code: 'VALIDATION', message: 'Foydali xizmat muddati 0 dan katta bo\'lishi kerak' });
    if (params.cost < params.salvage)
      return Err({ code: 'VALIDATION', message: 'Xarid narxi qoldiq qiymatdan katta bo\'lishi kerak' });
    if (params.cost < 0)
      return Err({ code: 'VALIDATION', message: 'Xarid narxi manfiy bo\'lishi mumkin emas' });
    return Ok(undefined);
  }

  straightLine(cost: number, salvage: number, yearsLife: number): number {
    if (yearsLife <= 0) return 0;
    return (cost - salvage) / yearsLife / 12;
  }

  doubleDeclining(bookValue: number, yearsLife: number): number {
    if (yearsLife <= 0) return 0;
    return bookValue * (2 / yearsLife) / 12;
  }

  sumOfYearsDigits(cost: number, salvage: number, yearsLife: number, monthPeriod: number): number {
    if (yearsLife <= 0) return 0;
    const n = yearsLife;
    const syD = (n * (n + 1)) / 2;
    const yearIndex = Math.ceil(monthPeriod / 12);
    const remaining = n - yearIndex + 1;
    if (remaining <= 0) return 0;
    return (cost - salvage) * remaining / syD / 12;
  }

  unitsOfProduction(cost: number, salvage: number, unitsProduced: number, totalUnits: number): number {
    if (totalUnits <= 0) return 0;
    return (cost - salvage) * (unitsProduced / totalUnits);
  }

  buildSchedule(params: DepreciationParams): DepreciationScheduleLine[] {
    const { cost, salvage, usefulLifeYears, method } = params;
    const months = usefulLifeYears * 12;
    const schedule: DepreciationScheduleLine[] = [];
    let bv = cost;
    let accumulated = 0;

    for (let t = 1; t <= months; t++) {
      let dep = 0;
      if (method === 'SL') {
        dep = this.straightLine(cost, salvage, usefulLifeYears);
      } else if (method === 'DB') {
        dep = Math.min(this.doubleDeclining(bv, usefulLifeYears), bv - salvage);
        if (dep < 0) dep = 0;
      } else if (method === 'SYD') {
        dep = this.sumOfYearsDigits(cost, salvage, usefulLifeYears, t);
      } else if (method === 'UOP') {
        const units = params.unitsProduced ?? 0;
        const total = params.totalUnits ?? 1;
        dep = this.unitsOfProduction(cost, salvage, units / months, total);
      }
      dep = Math.min(dep, bv - salvage);
      if (dep < 0) dep = 0;
      bv = bv - dep;
      accumulated += dep;
      schedule.push({ period: t, depreciation: +dep.toFixed(4), bookValue: +bv.toFixed(4), accumulated: +accumulated.toFixed(4) });
      if (bv <= salvage + 0.0001) break;
    }

    return schedule;
  }

  annualDepreciation(params: DepreciationParams): number {
    const schedule = this.buildSchedule(params);
    const firstYear = schedule.slice(0, 12);
    return (Array.isArray(firstYear) ? firstYear : []).reduce((s, l) => s + l.depreciation, 0);
  }
}
