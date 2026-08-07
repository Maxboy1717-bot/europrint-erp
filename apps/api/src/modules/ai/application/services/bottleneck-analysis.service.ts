/**
 * @module bottleneck-analysis.service
 * @description Ishlab chiqarish to'siqlari (bottleneck) tahlili — TOC reytingi.
 *
 * NIMA UCHUN BU SERVIS PAYDO BO'LDI
 *   Audit 2026-08-07: `GET /api/ai/bottleneck/analysis` **soxta javob** qaytarardi —
 *   `return { bottlenecks: [], analyzedAt: new Date().toISOString() }`. Endpoint hech qachon
 *   bazaga bormasdi, lekin `analyzedAt` sanasi bilan "tahlil qilindi, to'siq topilmadi" degan
 *   taassurot berardi. Bu Qoida 10 (soxta javob) va Q-40 ("ishlaydi ≠ to'g'ri") ning aniq
 *   buzilishi: direktor panelida "hamma narsa joyida" ko'rinardi, holbuki hech narsa
 *   o'lchanmagan edi.
 *
 *   Ayni paytda haqiqiy TOC hisobi (`SchedulingCapacityService`, PP domeni) va uning ma'lumot
 *   manbai (`fetchWorkCenterLoads`) kodda allaqachon bor edi.
 *
 * NIMA UCHUN LLM EMAS
 *   ρ = λ/μ — determenistik hisob. LLM bu yerda shovqin va xarajat qo'shardi, aniqlik emas.
 *   Shu sababli bu endpoint AI-kalitga BOG'LIQ EMAS va kalit yo'q bo'lganda ham ishlaydi
 *   (`production-agent.service.ts` dagi bir xil mulohaza).
 *
 * BO'SH NATIJANI QANDAY TALQIN QILISH KERAK
 *   `dataAvailable: false` — kutayotgan operatsiya umuman topilmadi (yoki so'rov yiqildi), ya'ni
 *   "o'lchash uchun ma'lumot yo'q". Bu "to'siq yo'q" bilan BIR XIL EMAS — aynan shu farqni eski
 *   stub yashirardi.
 * @layer Service (AI — determenistik)
 */

import { Injectable, Logger } from '@nestjs/common';
import { Result, Ok } from '@common/result';
import { fetchWorkCenterLoads } from '@common/database/queries-work-center-load';
import { SchedulingCapacityService } from '../../../pp/domain/services/scheduling-capacity.service';

/** ρ shu qiymatdan oshsa markaz "haddan tashqari yuklangan" deb belgilanadi (1.0 = to'liq band). */
const SEVERITY_CRITICAL = 1;
/** ρ shu qiymatdan oshsa "xavf ostida". */
const SEVERITY_WARNING = 0.8;

export interface BottleneckRow {
  workCenterId: string;
  workCenterName: string;
  /** ρ = kutayotgan soat / kunlik soat — kunlardagi zaxira. */
  utilization: number;
  pendingOps: number;
  pendingHours: number;
  severity: 'critical' | 'warning' | 'ok';
}

export interface BottleneckAnalysis {
  /** false = o'lchash uchun ma'lumot yo'q (≠ "to'siq yo'q"). */
  dataAvailable: boolean;
  /** ρ bo'yicha kamayish tartibida. */
  bottlenecks: BottleneckRow[];
  /** Eng yuklangan markaz id'si; ma'lumot bo'lmasa null. */
  primaryBottleneck: string | null;
  /** 1/ρ — to'siq belgilaydigan o'tkazuvchanlik indeksi. */
  throughputIndex: number | null;
  analyzedAt: string;
}

@Injectable()
export class BottleneckAnalysisService {
  private readonly logger = new Logger(BottleneckAnalysisService.name);

  // TOC hisobi toza funksiya (DI bog'liqligi yo'q) — `production-agent.service.ts` va
  // `scheduling.service.ts` bilan bir xil naqshda to'g'ridan-to'g'ri instansiya qilinadi.
  private readonly capacity = new SchedulingCapacityService();

  async analyze(nowIso: string): Promise<Result<BottleneckAnalysis>> {
    const loads = await fetchWorkCenterLoads();

    if (loads.length === 0) {
      this.logger.log('Bottleneck tahlili: kutayotgan operatsiya topilmadi — o\'lchash uchun ma\'lumot yo\'q');
      return Ok({
        dataAvailable: false,
        bottlenecks: [],
        primaryBottleneck: null,
        throughputIndex: null,
        analyzedAt: nowIso,
      });
    }

    const toc = this.capacity.detectBottleneck(loads);
    if (!toc.ok) {
      // Domen xatosi (masalan serviceRate <= 0) — yutilmaydi, lekin endpoint yiqilmaydi.
      this.logger.warn(`Bottleneck TOC hisobi bajarilmadi: ${toc.error.message}`);
      return Ok({
        dataAvailable: false,
        bottlenecks: [],
        primaryBottleneck: null,
        throughputIndex: null,
        analyzedAt: nowIso,
      });
    }

    const byId = new Map(loads.map((l) => [l.workCenterId, l]));
    const bottlenecks: BottleneckRow[] = toc.data.allWorkCenters.map((wc) => {
      const load = byId.get(wc.workCenterId);
      return {
        workCenterId: wc.workCenterId,
        workCenterName: load?.workCenterName ?? wc.workCenterId,
        utilization: Math.round(wc.utilization * 100) / 100,
        pendingOps: load?.pendingOps ?? 0,
        pendingHours: load?.arrivalRate ?? 0,
        severity:
          wc.utilization > SEVERITY_CRITICAL ? 'critical'
            : wc.utilization > SEVERITY_WARNING ? 'warning'
              : 'ok',
      };
    });

    return Ok({
      dataAvailable: true,
      bottlenecks,
      primaryBottleneck: toc.data.bottleneck,
      throughputIndex: Math.round(toc.data.throughputIndex * 100) / 100,
      analyzedAt: nowIso,
    });
  }
}
