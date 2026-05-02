export interface LeadScoreResult {
  score: number;
  grade: 'HOT' | 'WARM' | 'COLD';
  reasoning: string;
  suggestedActions: string[];
  estimatedDealValue?: number;
}

export interface DealProbabilityResult {
  probability: number;
  expectedCloseDate: string;
  riskFactors: string[];
  successFactors: string[];
  recommendation: string;
}

export interface ChurnRiskResult {
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  riskScore: number;
  mainReasons: string[];
  retentionActions: string[];
}
