export interface WeeklySummary {
  revenue: number;
  expenses: number;
  netProfit: number;
  revenueChange: number;
  expensesChange: number;
  profitChange: number;
  cashFlow: {
    inflows: number;
    outflows: number;
    netCashFlow: number;
  };
  arMovement: {
    opening: number;
    collected: number;
    newInvoices: number;
    closing: number;
  };
  apMovement: {
    opening: number;
    paid: number;
    newBills: number;
    closing: number;
  };
  dailyRevenue: Array<{ day: string; revenue: number; expenses: number }>;
}

export interface MonthlySummary {
  profitLoss: {
    revenue: number;
    costOfGoodsSold: number;
    grossProfit: number;
    operatingExpenses: number;
    operatingIncome: number;
    otherIncome: number;
    otherExpenses: number;
    netProfit: number;
    grossMargin: number;
    operatingMargin: number;
    netMargin: number;
  };
  cashFlowStatement: {
    operatingActivities: number;
    investingActivities: number;
    financingActivities: number;
    netChange: number;
    openingBalance: number;
    closingBalance: number;
  };
  balanceOverview: {
    totalAssets: number;
    currentAssets: number;
    fixedAssets: number;
    totalLiabilities: number;
    currentLiabilities: number;
    longTermLiabilities: number;
    equity: number;
  };
  monthlyTrend: Array<{ month: string; revenue: number; expenses: number; profit: number }>;
}

export interface KPIDashboard {
  liquidity: {
    currentRatio: number;
    quickRatio: number;
    cashRatio: number;
  };
  profitability: {
    grossProfitMargin: number;
    operatingProfitMargin: number;
    netProfitMargin: number;
    returnOnAssets: number;
    returnOnEquity: number;
  };
  efficiency: {
    assetTurnover: number;
    inventoryTurnover: number;
    receivablesTurnover: number;
    payablesTurnover: number;
  };
  leverage: {
    debtToEquity: number;
    debtToAssets: number;
    interestCoverage: number;
  };
  kpiTrend: Array<{ month: string; currentRatio: number; grossMargin: number; roa: number }>;
}

export interface ProductionEfficiency {
  orderStats: {
    totalOrders: number;
    completedOrders: number;
    inProgressOrders: number;
    pendingOrders: number;
    completionRate: number;
    onTimeDeliveryRate: number;
  };
  efficiencyMetrics: {
    averageCycleTime: number;
    machineUtilization: number;
    laborEfficiency: number;
    qualityRate: number;
    overallEquipmentEfficiency: number;
  };
  costAnalysis: {
    totalRevenue: number;
    totalProductionCost: number;
    materialCost: number;
    laborCost: number;
    overheadCost: number;
    profitMargin: number;
  };
  productionTrend: Array<{ month: string; produced: number; cost: number; revenue: number }>;
}
