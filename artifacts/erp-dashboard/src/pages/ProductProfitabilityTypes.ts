/**
 * @module ProductProfitabilityTypes
 * @description TypeScript interfaces, types, and pure utility functions for
 * the ProductProfitability page. No JSX.
 */

export interface OrderCosting {
  id: string;
  salesOrderId: string | null;
  productionOrderId: string | null;
  materialCost: number;
  laborCost: number;
  overheadCost: number;
  energyCost: number;
  wasteCost: number;
  totalCost: number;
  sellingPrice: number;
  grossProfit: number | null;
  profitMargin: number | null;
  status: string;
  calculatedBy: string | null;
  calculatedAt: string | null;
  createdAt: string;
}

export interface ProfitableChartItem {
  name: string;
  profit: number;
  margin: number;
}

export interface LossChartItem {
  name: string;
  loss: number;
  margin: number;
}

export interface DistributionItem {
  name: string;
  value: number;
  color: string;
}

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export function formatPercent(value: number | null): string {
  if (value === null) return "—";
  return value.toFixed(1) + "%";
}

export function buildProfitableChartData(topProfitable: OrderCosting[]): ProfitableChartItem[] {
  return (Array.isArray(topProfitable) ? topProfitable : []).slice(0, 10).map((item, index) => ({
    name: item.salesOrderId || `Mahsulot ${index + 1}`,
    profit: item.grossProfit || 0,
    margin: item.profitMargin || 0,
  }));
}

export function buildLossChartData(topLoss: OrderCosting[]): LossChartItem[] {
  return (Array.isArray(topLoss) ? topLoss : []).slice(0, 10).map((item, index) => ({
    name: item.salesOrderId || `Mahsulot ${index + 1}`,
    loss: Math.abs(item.grossProfit || 0),
    margin: item.profitMargin || 0,
  }));
}

export function buildDistributionData(allCostings: OrderCosting[]): DistributionItem[] {
  const brackets = {
    ">30%": 0,
    "15-30%": 0,
    "0-15%": 0,
    "-15-0%": 0,
    "<-15%": 0,
  };

  (Array.isArray(allCostings) ? allCostings : []).forEach((c) => {
    const margin = c.profitMargin || 0;
    if (margin > 30) brackets[">30%"]++;
    else if (margin >= 15) brackets["15-30%"]++;
    else if (margin >= 0) brackets["0-15%"]++;
    else if (margin >= -15) brackets["-15-0%"]++;
    else brackets["<-15%"]++;
  });

  return [
    { name: ">30%", value: brackets[">30%"], color: "#22c55e" },
    { name: "15-30%", value: brackets["15-30%"], color: "#84cc16" },
    { name: "0-15%", value: brackets["0-15%"], color: "#eab308" },
    { name: "-15-0%", value: brackets["-15-0%"], color: "#f97316" },
    { name: "<-15%", value: brackets["<-15%"], color: "#ef4444" },
  ];
}
