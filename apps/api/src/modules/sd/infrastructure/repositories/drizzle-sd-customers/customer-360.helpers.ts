/**
 * @module drizzle-sd-customers/customer-360.helpers
 * @description Pure-function helpers for the 7-layer Customer 360 view.
 *   Extracted from `drizzle-sd-customers.repo.ts` to satisfy Rule 16.
 */

import { ABC_SCORE_WEIGHT } from '@common/constants/business.constants';

type Row = Record<string, unknown>;

export function mapSegment(status: string | null | undefined): string {
  const s = String(status ?? 'new').toLowerCase();
  if (s === 'vip') return 'vip';
  if (s === 'active') return 'regular';
  if (s === 'new') return 'new';
  if (s === 'at_risk' || s === 'potential') return 'potential';
  return 'new';
}

export function computeBehavioral(orders: Row[]) {
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((s, o) => s + Number(o.total_amount ?? 0), 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const firstOrderDate = orders.length > 0 ? orders[orders.length - 1]?.created_at : null;
  const lastOrderDate = orders.length > 0 ? orders[0]?.created_at : null;
  const daysSinceFirstOrder = firstOrderDate
    ? Math.floor((Date.now() - new Date(String(firstOrderDate)).getTime()) / 86400000) : 0;
  const daysSinceLastOrder = lastOrderDate
    ? Math.floor((Date.now() - new Date(String(lastOrderDate)).getTime()) / 86400000) : 9999;

  const yearlyMap: Record<string, { year: number; month: number; total: number; count: number }> = {};
  for (const o of orders) {
    const k = `${o.order_year}-${String(o.order_month).padStart(2, '0')}`;
    if (!yearlyMap[k]) yearlyMap[k] = { year: Number(o.order_year), month: Number(o.order_month), total: 0, count: 0 };
    yearlyMap[k].total += Number(o.total_amount ?? 0);
    yearlyMap[k].count += 1;
  }
  const yearlyTrend = Object.values(yearlyMap).sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);
  const thisYear = new Date().getFullYear();
  const lastYearTotal = yearlyTrend.filter(r => r.year === thisYear - 1).reduce((s, r) => s + r.total, 0);
  const thisYearTotal = yearlyTrend.filter(r => r.year === thisYear).reduce((s, r) => s + r.total, 0);
  const growthRate = lastYearTotal > 0 ? Math.round(((thisYearTotal - lastYearTotal) / lastYearTotal) * 100) : 0;
  const projectedThisYear = thisYearTotal > 0
    ? Math.round(thisYearTotal / (new Date().getMonth() + 1) * 12) : 0;

  return {
    totalOrders, totalRevenue, avgOrderValue, firstOrderDate, lastOrderDate,
    daysSinceFirstOrder, daysSinceLastOrder, yearlyTrend, lastYearTotal,
    thisYearTotal, growthRate, projectedThisYear,
  };
}

export function computeRfmAbc(args: {
  daysSinceLastOrder: number; totalOrders: number; totalRevenue: number;
}) {
  const { daysSinceLastOrder, totalOrders, totalRevenue } = args;
  const rfmRecency = daysSinceLastOrder <= 7 ? 5 : daysSinceLastOrder <= 30 ? 4 : daysSinceLastOrder <= 90 ? 3 : daysSinceLastOrder <= 180 ? 2 : 1;
  const rfmFrequency = totalOrders >= 20 ? 5 : totalOrders >= 10 ? 4 : totalOrders >= 5 ? 3 : totalOrders >= 2 ? 2 : 1;
  const rfmMonetary = totalRevenue >= 100_000_000 ? 5 : totalRevenue >= 50_000_000 ? 4 : totalRevenue >= 10_000_000 ? 3 : totalRevenue >= 1_000_000 ? 2 : 1;

  const revScore = rfmMonetary * 20;
  const freqScore = rfmFrequency * 20;
  const recScore = rfmRecency * 20;
  const payScore = 80;
  const loyScore = Math.min(totalOrders > 1 ? totalOrders * 8 : 20, 100);
  const abcScore = Math.round(
    revScore * ABC_SCORE_WEIGHT.revenue +
    freqScore * ABC_SCORE_WEIGHT.frequency +
    recScore * ABC_SCORE_WEIGHT.recency +
    payScore * ABC_SCORE_WEIGHT.margin +
    loyScore * ABC_SCORE_WEIGHT.longevity,
  );
  const computedSegment = abcScore >= 75 ? 'A' : abcScore >= 50 ? 'B' : abcScore >= 25 ? 'C' : 'D';
  return { rfmRecency, rfmFrequency, rfmMonetary, revScore, freqScore, recScore, payScore, loyScore, abcScore, computedSegment };
}

export function computePredictive(args: {
  totalOrders: number; daysSinceLastOrder: number; totalRevenue: number;
  daysSinceFirstOrder: number; rfmFrequency: number; rfmMonetary: number; rfmRecency: number;
}) {
  const { totalOrders, daysSinceLastOrder, totalRevenue, daysSinceFirstOrder, rfmFrequency, rfmMonetary, rfmRecency } = args;
  const churnRisk = totalOrders === 0 ? 0
    : daysSinceLastOrder > 180 ? 85 : daysSinceLastOrder > 90 ? 65
    : daysSinceLastOrder > 45 ? 40 : daysSinceLastOrder > 14 ? 20 : 5;
  const avgMonthlyRevenue = totalRevenue / Math.max(1, daysSinceFirstOrder / 30);
  const ltvForecast = Math.round(avgMonthlyRevenue * 24);
  const upsellProbability = Math.min(100, Math.round(
    (rfmFrequency * 10) + (rfmMonetary * 8) + (rfmRecency * 5) + (totalOrders > 5 ? 15 : 0)
  ));
  return { churnRisk, avgMonthlyRevenue, ltvForecast, upsellProbability };
}

const POS_WORDS = ['yaxshi','rahmat','ajoyib','rozi','mamnun','excellent','good','great','хорошо','отлично','satisfied','happy','sifatli','tez','professional'];
const NEG_WORDS = ['yomon','shikoyat','muammo','kechikish','bad','problem','issue','complaint','плохо','проблема','dissatisfied','angry','sekin','sifatsiz','qaytarish'];

export function computeSentiment(interactionsRows: Row[], npsRows: Row[]) {
  let sentTotal = 0, sentCount = 0;
  for (const iRow of interactionsRows) {
    const text = String((iRow.notes ?? '') + ' ' + (iRow.subject ?? '') + ' ' + (iRow.outcome ?? '')).toLowerCase();
    if (iRow.sentiment_score !== null && iRow.sentiment_score !== undefined) {
      sentTotal += Number(iRow.sentiment_score); sentCount++;
    } else {
      let s = 0;
      for (const w of POS_WORDS) if (text.includes(w)) s++;
      for (const w of NEG_WORDS) if (text.includes(w)) s--;
      if (s !== 0) { sentTotal += Math.max(-1, Math.min(1, s)); sentCount++; }
    }
  }
  const avgNps = npsRows.length > 0 ? npsRows.reduce((s, n) => s + Number(n.score ?? 0), 0) / npsRows.length : null;
  if (avgNps !== null) {
    sentTotal += (avgNps - 5) / 5; sentCount++;
  }
  const sentimentScore = sentCount > 0 ? Math.max(-1, Math.min(1, sentTotal / sentCount)) : 0;
  const sentimentLabel = sentimentScore > 0.2 ? 'positive' : sentimentScore < -0.2 ? 'negative' : 'neutral';
  const ratedInteractions = interactionsRows.filter(i => i.satisfaction_rating);
  const avgSatisfaction = ratedInteractions.length > 0
    ? ratedInteractions.reduce((s, i) => s + Number(i.satisfaction_rating), 0) / ratedInteractions.length : null;
  const npsPromoters = npsRows.filter(n => Number(n.score) >= 9).length;
  const npsDetractors = npsRows.filter(n => Number(n.score) <= 6).length;
  const npsScore = npsRows.length > 0
    ? Math.round(((npsPromoters - npsDetractors) / npsRows.length) * 100) : null;
  return { sentimentScore, sentimentLabel, sentCount, avgSatisfaction, npsPromoters, npsDetractors, npsScore, avgNps };
}

export function computeRecommendations(args: {
  totalOrders: number; churnRisk: number; rfmRecency: number; rfmFrequency: number;
  abcScore: number; sentimentScore: number; upsellProbability: number; npsScore: number | null;
}): string[] {
  const { totalOrders, churnRisk, rfmRecency, rfmFrequency, abcScore, sentimentScore, upsellProbability, npsScore } = args;
  const r: string[] = [];
  if (totalOrders === 0)         r.push("📋 Hali buyurtma berilmagan — taklif yuboring");
  if (churnRisk > 60)            r.push("⚠️ Churn xavfi yuqori — zudlik bilan muloqot o'rnatish kerak");
  if (rfmRecency <= 2 && totalOrders > 0) r.push("📞 60+ kun faoliyatsiz — qayta faollashtiring");
  if (rfmFrequency >= 4)         r.push("🌟 Tez-tez buyurtma beruvchi — maxsus chegirma taklif eting");
  if (abcScore >= 75)            r.push("💎 A-kategoriya mijoz — VIP xizmat ta'minlang");
  if (sentimentScore < -0.2)     r.push("😟 Salbiy munosabat aniqlandi — shikoyatlarni ko'rib chiqing");
  if (upsellProbability >= 60)   r.push("🚀 Upsell imkoniyati yuqori — yangi mahsulot taklif qiling");
  if (npsScore !== null && npsScore < 0) r.push("📊 NPS manfiy — mijoz qoniqmasligi aniqlandi");
  if (r.length === 0)            r.push("✅ Mijoz ko'rsatkichlari yaxshi — hozirgi aloqani davom ettiring");
  return r;
}
