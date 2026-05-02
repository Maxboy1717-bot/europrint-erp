export interface SdContactItem {
  [key: string]: unknown;
  id: number;
  fullName: string;
  position: string;
  phone: string;
  email: string;
  telegram: string;
  isPrimary: boolean;
}

export interface SdBasicData {
  [key: string]: unknown;
  status: string;
  customerCategory: string;
  creditLimit: number;
  paymentTermsDays: number;
  title: string;
  customerCode: string;
  stir: string;
  industry: string;
  address: string;
  source: string;
  discountRate: number;
  dateCreate: string;
  comments: string;
  phones: { value: string; type: string }[];
  emails: { value: string; type: string }[];
  websites: { value: string }[];
}

export interface SdOverdueBreakdown {
  days1_30: number;
  days31_60: number;
  days61_90: number;
  days90Plus: number;
}

export interface SdInvoiceItem {
  id: number;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  balance: number;
  payment_status: string;
}

export interface SdFinanceData {
  [key: string]: unknown;
  totalDebt: number;
  creditLimit: number;
  overdueDebt: number;
  availableCredit: number;
  paymentRating: string;
  paymentTermsDays: number;
  onTimePaymentRate: number;
  overdueBreakdown: SdOverdueBreakdown;
  averagePaymentDelayDays: number;
  recentInvoices: SdInvoiceItem[];
}

export interface SdLtvData {
  [key: string]: unknown;
  totalRevenueAllTime: number;
  totalMarginEstimate: number;
  marginRate: number;
  averageMonthlyRevenue: number;
  customerLifetimeMonths: number;
  ltvValue: number;
  vsAveragePercent: number;
  acquisitionCostEstimate: number;
  serviceMonthlyEstimate: number;
  netProfit: number;
}

export interface SdTrendItem {
  year: string | number;
  month: string | number;
  total: number;
  total_amount: number;
}

export interface SdGrowthData {
  [key: string]: unknown;
  lastYearTotal: number;
  thisYearTotal: number;
  projectedThisYear: number;
  growthRate: number;
  yearlyTrend: SdTrendItem[];
  riskSignals: string[];
}

export interface SdOrderItem {
  [key: string]: unknown;
  id: number;
  documentNumber: string;
  order_number: string;
  totalAmount: number;
  total_amount: number;
  status: string;
  createdAt: string;
  created_at: string;
}

export interface SdOrdersData {
  [key: string]: unknown;
  totalCount: number;
  totalAmount: number;
  averageOrderAmount: number;
  monthsAsCustomer: number;
  firstOrderDate: string;
  lastOrderDate: string;
  monthlyTrend: SdTrendItem[];
  recentOrders: SdOrderItem[];
}

export interface SdSegmentationScoreBreakdown {
  revenueScore: number;
  frequencyScore: number;
  recencyScore: number;
  paymentScore: number;
  loyaltyScore: number;
}

export interface SdSegmentationData {
  [key: string]: unknown;
  abcScore: number;
  abcCategory: string;
  scoreBreakdown: SdSegmentationScoreBreakdown;
  recommendations: string[];
  categoryLabel: string;
}

export interface SdCommunicationItem {
  [key: string]: unknown;
  id: number;
  type: string;
  direction: string;
  subject: string;
  description: string;
  outcome: string;
  createdAt: string;
  employeeName: string;
  next_action: string;
  next_action_date: string;
  interaction_date: string;
  interactionDate: string;
}

export interface SdUpcomingTask {
  [key: string]: unknown;
  id: number;
  next_action: string;
  next_action_date: string;
}

export interface SdCommunicationsData {
  [key: string]: unknown;
  recent: SdCommunicationItem[];
  upcomingTasks: SdUpcomingTask[];
  totalCount: number;
}

export interface SdCompetitorItem {
  [key: string]: unknown;
  id: number;
  name: string;
  share: number;
  winRate: number;
  reasons: string[];
  competitor_name: string;
  competitorName: string;
  product_type: string;
  estimated_share_percent: number;
  notes: string;
  win_back_potential: string;
  winBackPotential: string;
}

export interface SdCompetitorsData {
  [key: string]: unknown;
  list: SdCompetitorItem[];
  totalCompetitorShare: number;
  ourShare: number;
}

export interface SdComplaintItem {
  [key: string]: unknown;
  id: number;
  subject: string;
  status: string;
  priority: string;
  type: string;
  description: string;
  resolution: string;
  satisfaction_score: number;
  complaint_number: string;
  created_at: string;
  createdAt: string;
  resolvedAt: string;
}

export interface SdComplaintsData {
  [key: string]: unknown;
  totalCount: number;
  resolvedCount: number;
  openCount: number;
  averageResolutionDays: number;
  recent: SdComplaintItem[];
}

export interface SdDocumentItem {
  [key: string]: unknown;
  id: number;
  documentNumber: string;
  type: string;
  name: string;
  fileUrl: string;
  expiresAt: string;
  status: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
}

export interface SdContractsData {
  [key: string]: unknown;
  totalCount: number;
  contracts: SdDocumentItem[];
  expiringSoon: SdDocumentItem[];
  allDocuments: SdDocumentItem[];
}
