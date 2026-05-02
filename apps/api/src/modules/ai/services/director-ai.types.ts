export interface KpiExplanation {
  kpiName: string;
  currentValue: number | string;
  targetValue: number | string;
  status: 'ABOVE_TARGET' | 'ON_TARGET' | 'BELOW_TARGET' | 'CRITICAL';
  explanation: string;
  rootCauses: string[];
  quickWins: string[];
}

export interface RiskAssessment {
  overallRiskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  risks: Array<{
    area: string;
    riskDescription: string;
    probability: number;
    impact: number;
    mitigationActions: string[];
  }>;
  priorityActions: string[];
}

export interface StrategicRecommendations {
  shortTerm: string[];
  mediumTerm: string[];
  longTerm: string[];
  topPriority: string;
  estimatedROI: string;
}

export interface ExecutiveSummary {
  date: string;
  headline: string;
  keyMetrics: Array<{ name: string; value: string; trend: 'UP' | 'DOWN' | 'STABLE' }>;
  alerts: string[];
  recommendations: string[];
  overallHealth: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
}
