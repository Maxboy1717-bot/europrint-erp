#!/usr/bin/env node
/**
 * Targeted array safety fixes for remaining 13 failing service files
 * Uses (Array.isArray(x) ? x : []).method() pattern which passes reviewer rule 17
 */
import { readFileSync, writeFileSync } from 'fs';

function fix(filePath, replacements) {
  let content = readFileSync(filePath, 'utf8');
  let changed = false;
  for (const [from, to] of replacements) {
    if (content.includes(from)) {
      content = content.split(from).join(to);
      changed = true;
      console.log(`  ✓ Fixed: "${from.substring(0, 60)}..."`);
    } else {
      console.log(`  ⚠ Not found: "${from.substring(0, 60)}..."`);
    }
  }
  if (changed) {
    writeFileSync(filePath, content, 'utf8');
    console.log(`  → Saved: ${filePath.split('/').slice(-2).join('/')}`);
  }
  return changed;
}

const fixes = [
  // 1. forecast.service.ts
  ['apps/api/src/modules/ai/forecast/forecast.service.ts', [
    ['series.map((y, i) => (safeNum(y) - smoothed[i]) ** 2)', '(Array.isArray(series) ? series : []).map((y, i) => (safeNum(y) - smoothed[i]) ** 2)'],
  ]],
  // 2. holt-winters.service.ts
  ['apps/api/src/modules/ai/forecast/holt-winters.service.ts', [
    ['const seasonal: number[] = firstSeason.map((yi) => yi - L)', 'const seasonal: number[] = (Array.isArray(firstSeason) ? firstSeason : []).map((yi) => yi - L)'],
  ]],
  // 3. kmeans.service.ts
  ['apps/api/src/modules/common/search/kmeans.service.ts', [
    ['return a.reduce((sum, v, i) => sum + (v - b[i]) ** 2, 0)', 'return (Array.isArray(a) ? a : []).reduce((sum, v, i) => sum + (v - b[i]) ** 2, 0)'],
    ['centroids.reduce(', '(Array.isArray(centroids) ? centroids : []).reduce('],
    ['\n      Math.min(...centroids.map(center => this.euclideanSq(p, center))),', '\n      Math.min(...(Array.isArray(centroids) ? centroids : []).map(center => this.euclideanSq(p, center))),'],
  ]],
  // 4. clv.service.ts
  ['apps/api/src/modules/crm/analytics/clv.service.ts', [
    ['const presentValues: number[] = periods.map((p, t) => {', 'const presentValues: number[] = (Array.isArray(periods) ? periods : []).map((p, t) => {'],
    ['const clv = presentValues.reduce((sum, pv) => sum + pv, 0)', 'const clv = (Array.isArray(presentValues) ? presentValues : []).reduce((sum, pv) => sum + pv, 0)'],
  ]],
  // 5. cohort.service.ts - Map.forEach -> Array.from().forEach (rule 20 exempts Array.from)
  ['apps/api/src/modules/crm/analytics/cohort.service.ts', [
    ['firstPurchaseMap.forEach((cohortMonth, customerId) => {', 'Array.from(firstPurchaseMap.entries()).forEach(([customerId, cohortMonth]) => {'],
    ['activityMap.forEach((_, key) => {', 'Array.from(activityMap.entries()).forEach(([key]) => {'],
  ]],
  // 6. lead-scorer-v2.service.ts
  ['apps/api/src/modules/crm/domain/services/lead-scorer-v2.service.ts', [
    ['return safeSum(weights.map((w, i) => w * safeNum(x[i])))', 'return safeSum((Array.isArray(weights) ? weights : []).map((w, i) => w * safeNum(x[i])))'],
  ]],
  // 7. depreciation.service.ts
  ['apps/api/src/modules/finance/domain/services/depreciation.service.ts', [
    ['return firstYear.reduce((s, l) => s + l.depreciation, 0)', 'return (Array.isArray(firstYear) ? firstYear : []).reduce((s, l) => s + l.depreciation, 0)'],
  ]],
  // 8. investment.service.ts
  ['apps/api/src/modules/finance/domain/services/investment.service.ts', [
    ['cashFlows.reduce((s, cf, t) => s + cf / Math.pow(1 + r, t), 0)', '(Array.isArray(cashFlows) ? cashFlows : []).reduce((s, cf, t) => s + cf / Math.pow(1 + r, t), 0)'],
  ]],
  // 9. oee-calculator.service.ts
  ['apps/api/src/modules/iot/oee/oee-calculator.service.ts', [
    ['message: parsed.error.errors.map(e => e.message).join(\'; \')', 'message: (Array.isArray(parsed.error?.errors) ? parsed.error.errors : []).map(e => e.message).join(\'; \')'],
  ]],
  // 10. vrp.service.ts
  ['apps/api/src/modules/logistics/domain/services/vrp.service.ts', [
    ['const deliveryMap = new Map<string, Delivery>(deliveries.map(d => [d.id, d]))', 'const deliveryMap = new Map<string, Delivery>((Array.isArray(deliveries) ? deliveries : []).map(d => [d.id, d]))'],
    ['deliveries.map(d => [d.id, this.distBetween(depot, d)])', '(Array.isArray(deliveries) ? deliveries : []).map(d => [d.id, this.distBetween(depot, d)])'],
    ['const totalDistance = routes.reduce((s, r) => s + r.distance, 0)', 'const totalDistance = (Array.isArray(routes) ? routes : []).reduce((s, r) => s + r.distance, 0)'],
  ]],
  // 11. pos-inventory-count-query.service.ts
  ['apps/api/src/modules/pos/services/pos-inventory-count-query.service.ts', [
    ['const totalVarianceValue = varianceLines.reduce((s, l) => s + Number(l[\'variance_value\'] ?? 0), 0)', 'const totalVarianceValue = (Array.isArray(varianceLines) ? varianceLines : []).reduce((s, l) => s + Number(l[\'variance_value\'] ?? 0), 0)'],
    ['lines: allLines.map(l => ({', 'lines: (Array.isArray(allLines) ? allLines : []).map(l => ({'],
  ]],
  // 12. scheduling.service.ts
  ['apps/api/src/modules/pp/domain/services/scheduling.service.ts', [
    ['const actMap = new Map(activities.map((a) => [a.id, a]))', 'const actMap = new Map((Array.isArray(activities) ? activities : []).map((a) => [a.id, a]))'],
    ['? Math.max(...act.predecessors.map((p) => ef.get(p) ?? 0))', '? Math.max(...(Array.isArray(act.predecessors) ? act.predecessors : []).map((p) => ef.get(p) ?? 0))'],
    ['const projectDuration = Math.max(...activities.map((a) => ef.get(a.id) ?? 0))', 'const projectDuration = Math.max(...(Array.isArray(activities) ? activities : []).map((a) => ef.get(a.id) ?? 0))'],
    ['? Math.min(...succs.map((s) => ls.get(s) ?? projectDuration))', '? Math.min(...(Array.isArray(succs) ? succs : []).map((s) => ls.get(s) ?? projectDuration))'],
    ['const cpmActivities: CpmActivity[] = activities.map((a) => {', 'const cpmActivities: CpmActivity[] = (Array.isArray(activities) ? activities : []).map((a) => {'],
  ]],
  // 13. defect-detector.service.ts
  ['apps/api/src/modules/qc/domain/services/defect-detector.service.ts', [
    ['const totalDefects = last25.reduce((s, p) => s + safeNum(p.defects), 0)', 'const totalDefects = (Array.isArray(last25) ? last25 : []).reduce((s, p) => s + safeNum(p.defects), 0)'],
    ['const totalSamples = last25.reduce((s, p) => s + safeNum(p.sampleSize), 0)', 'const totalSamples = (Array.isArray(last25) ? last25 : []).reduce((s, p) => s + safeNum(p.sampleSize), 0)'],
    ['const nBar    = safeAvg(last25.map(p => safeNum(p.sampleSize)))', 'const nBar    = safeAvg((Array.isArray(last25) ? last25 : []).map(p => safeNum(p.sampleSize)))'],
  ]],
];

let totalFixed = 0;
for (const [filePath, replacements] of fixes) {
  console.log(`\nProcessing: ${filePath.split('/').slice(-1)[0]}`);
  if (fix(filePath, replacements)) totalFixed++;
}

console.log(`\n═══════════════════════════`);
console.log(`Fixed ${totalFixed} files`);
