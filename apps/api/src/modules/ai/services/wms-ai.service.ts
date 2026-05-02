/**
 * WMS + Logistics AI Service — Reorder point, Stock optimize, Route optimize, Delivery predict
 */
import { Injectable, Logger } from '@nestjs/common';
import { AI_MAX_TOKENS_STANDARD } from '@common/constants/app.constants';
import { isErr, safeJsonParse, Result, AppError, safeCall } from '@common/result';
import { AiRouterService } from '../application/services/ai-router.service';

export interface ReorderPointResult {
  reorderPoint: number;
  safetyStock: number;
  economicOrderQuantity: number;
  daysUntilStockout: number;
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  recommendation: string;
}

export interface StockOptimizationResult {
  recommendations: Array<{
    itemName: string;
    currentStock: number;
    recommendedStock: number;
    action: 'INCREASE' | 'DECREASE' | 'MAINTAIN';
    reason: string;
  }>;
  totalSavingsEstimate: number;
}

export interface DeliveryPrediction {
  estimatedDays: number;
  confidence: number;
  riskFactors: string[];
  onTimeProability: number;
}

@Injectable()
export class WmsAiService {
  private readonly logger = new Logger(WmsAiService.name);

  constructor(private readonly ai: AiRouterService) {}

  // ─── Qayta buyurtma nuqtasi ──────────────────────────────────────────────

  async calculateReorderPoint(
    itemName: string,
    currentStock: number,
    avgDailyUsage: number,
    leadTimeDays: number,
    historicalUsage: number[],
    userId: number,
  ): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      this.logger.log(`WMS AI: qayta buyurtma nuqtasi hisoblanmoqda: item="${itemName}"`);
      const safetyStock = Math.ceil(avgDailyUsage * leadTimeDays * 0.5);
      const reorderPoint = Math.ceil(avgDailyUsage * leadTimeDays + safetyStock);
      const daysUntilStockout = avgDailyUsage > 0 ? Math.floor(currentStock / avgDailyUsage) : 999;
      const mathFallback: ReorderPointResult = {
        reorderPoint,
        safetyStock,
        economicOrderQuantity: reorderPoint * 2,
        daysUntilStockout,
        urgency: daysUntilStockout < 3 ? 'CRITICAL' : daysUntilStockout < 7 ? 'HIGH' : 'MEDIUM',
        recommendation: `${itemName} uchun ${reorderPoint} ta chegara — hozir ${currentStock} ta bor, ${daysUntilStockout} kun yetadi`,
      };
  
      const prompt = `
  EuroPrint ombor: "${itemName}" uchun qayta buyurtma nuqtasini hisoblang.
  
  MA'LUMOTLAR:
  Joriy zaxira: ${currentStock} dona
  O'rtacha kunlik sarflanish: ${avgDailyUsage} dona
  Yetkazib berish muddati: ${leadTimeDays} kun
  Tarixiy sarflanish (so'nggi ${historicalUsage.length} kun): ${historicalUsage.join(', ')}
  
  EuroPrint bosma materiallari (qog'oz, siyoh, plyonka) uchun.
  
  JSON formatda:
  {
    "reorderPoint": <dona>,
    "safetyStock": <dona>,
    "economicOrderQuantity": <dona>,
    "daysUntilStockout": <kun>,
    "urgency": "CRITICAL|HIGH|MEDIUM|LOW",
    "recommendation": "..."
  }
  `;
  
      const aiResult = await this.ai.call({
        taskType: 'wms.reorder_point',
        prompt,
        maxTokens: AI_MAX_TOKENS_STANDARD,
        temperature: 0.2,
        userId,
      });
      if (isErr(aiResult)) {
        this.logger.warn(`AI so'rovi xato: ${aiResult.error.message}`);
        return mathFallback;
      }
  
      const jsonMatch = aiResult.data.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = safeJsonParse<ReorderPointResult>(jsonMatch[0]);
        if (parsed) return parsed;
      }
  
      return mathFallback;
    });
  }

  // ─── Zaxira optimizatsiyasi ──────────────────────────────────────────────

  async optimizeStock(
    inventorySnapshot: Array<{ name: string; current: number; minRequired: number; maxCapacity: number; monthlySales: number }>,
    userId: number,
  ): Promise<StockOptimizationResult> {
    const prompt = `
EuroPrint ombor optimizatsiyasi.

JORIY ZAXIRA HOLATI:
${(Array.isArray(inventorySnapshot) ? inventorySnapshot : []).map(i =>
  `${i.name}: joriy=${i.current}, min=${i.minRequired}, max=${i.maxCapacity}, oylik_sotish=${i.monthlySales}`
).join('\n')}

Har bir mahsulot uchun tavsiya bering.
Bosma materiallari uchun: siyoh, qog'oz, plyonka eng muhim.

JSON formatda:
{
  "recommendations": [
    {
      "itemName": "...",
      "currentStock": <n>,
      "recommendedStock": <n>,
      "action": "INCREASE|DECREASE|MAINTAIN",
      "reason": "..."
    }
  ],
  "totalSavingsEstimate": <UZS>
}
`;

    const aiResult = await this.ai.call({
      taskType: 'wms.stock_optimize',
      prompt,
      maxTokens: 700,
      temperature: 0.3,
      userId,
    });
    if (isErr(aiResult)) {
      this.logger.warn(`AI so'rovi xato: ${aiResult.error.message}`);
      return { recommendations: [], totalSavingsEstimate: 0 };
    }

    const jsonMatch = aiResult.data.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = safeJsonParse<StockOptimizationResult>(jsonMatch[0]);
      if (parsed) return parsed;
    }

    return { recommendations: [], totalSavingsEstimate: 0 };
  }

  // ─── Yetkazib berish bashorati ───────────────────────────────────────────

  async predictDelivery(
    origin: string,
    destination: string,
    itemType: string,
    orderDate: string,
    historicalDeliveries: Array<{ days: number; onTime: boolean }>,
    userId: number,
  ): Promise<DeliveryPrediction> {
    const avgDays = historicalDeliveries.length > 0
      ? Math.round((Array.isArray(historicalDeliveries) ? historicalDeliveries : []).reduce((s, d) => s + d.days, 0) / historicalDeliveries.length)
      : 3;
    const onTimeRate = historicalDeliveries.length > 0
      ? Math.round((Array.isArray(historicalDeliveries) ? historicalDeliveries : []).filter(d => d.onTime).length / historicalDeliveries.length * 100)
      : 80;

    const prompt = `
EuroPrint yetkazib berish muddati bashorati.

MARSHRUT: ${origin} → ${destination}
MAHSULOT: ${itemType}
BUYURTMA SANASI: ${orderDate}

TARIX: O'rtacha ${avgDays} kun, O'z vaqtida: ${onTimeRate}%

JSON formatda:
{
  "estimatedDays": <kun>,
  "confidence": <0-100>,
  "riskFactors": ["...", "..."],
  "onTimeProability": <0-100>
}
`;

    const aiResult = await this.ai.call({
      taskType: 'logistics.delivery_predict',
      prompt,
      maxTokens: 300,
      temperature: 0.3,
      userId,
    });
    if (isErr(aiResult)) {
      this.logger.warn(`AI so'rovi xato: ${aiResult.error.message}`);
      return { estimatedDays: avgDays, confidence: 70, riskFactors: [], onTimeProability: onTimeRate };
    }

    const jsonMatch = aiResult.data.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = safeJsonParse<DeliveryPrediction>(jsonMatch[0]);
      if (parsed) return parsed;
    }

    return { estimatedDays: avgDays, confidence: 70, riskFactors: [], onTimeProability: onTimeRate };
  }

  // ─── Marshrut optimizatsiyasi ────────────────────────────────────────────

  async optimizeRoute(
    deliveries: Array<{ address: string; timeWindow?: string; priority: string }>,
    startLocation: string,
    userId: number,
  ): Promise<{ optimizedOrder: string[]; estimatedTotalTime: string; fuelSavingPercent: number }> {
    const prompt = `
EuroPrint yetkazib berish marshruti optimizatsiyasi.

BOSHLANISH NUQTASI: ${startLocation}
YETKAZISH MANZILLARI:
${(Array.isArray(deliveries) ? deliveries : []).map((d, i) => `${i + 1}. ${d.address} | Ustuvorlik: ${d.priority}${d.timeWindow ? ` | Vaqt: ${d.timeWindow}` : ''}`).join('\n')}

Toshkent shahrida. Qisqa marshrut = kamroq vaqt + yoqilg'i tejaladi.

JSON formatda:
{
  "optimizedOrder": ["1-manzil", "2-manzil", ...],
  "estimatedTotalTime": "X soat Y daqiqa",
  "fuelSavingPercent": <0-40>
}
`;

    const aiResult = await this.ai.call({
      taskType: 'logistics.route_optimize',
      prompt,
      maxTokens: AI_MAX_TOKENS_STANDARD,
      temperature: 0.3,
      userId,
    });
    if (isErr(aiResult)) {
      this.logger.warn(`AI so'rovi xato: ${aiResult.error.message}`);
      return { optimizedOrder: (Array.isArray(deliveries) ? deliveries : []).map(d => d.address), estimatedTotalTime: 'Aniqlanmadi', fuelSavingPercent: 0 };
    }

    const jsonMatch = aiResult.data.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = safeJsonParse<{ optimizedOrder: string[]; estimatedTotalTime: string; fuelSavingPercent: number }>(jsonMatch[0]);
      if (parsed) return parsed;
    }

    return { optimizedOrder: (Array.isArray(deliveries) ? deliveries : []).map(d => d.address), estimatedTotalTime: 'Aniqlanmadi', fuelSavingPercent: 0 };
  }
}
