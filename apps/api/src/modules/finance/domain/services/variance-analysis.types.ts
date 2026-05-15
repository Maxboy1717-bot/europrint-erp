/**
 * Type definitions for variance-analysis.service.
 * Extracted from main service (Rule 16: file size limit).
 */

export interface VarianceResult {
  orderId: number;
  orderNumber: string;
  productName: string;
  productId: number | null;
  plannedQty: number;
  mpv: number;
  mqv: number;
  lrv: number;
  lev: number;
  ov: number;
  totalVariance: number;
  standardTotalCost: number;
  actualTotalCost: number;
  variancePct: number;
  needsAudit: boolean;
  details: {
    mpvLabel: 'Favourable' | 'Unfavourable' | 'Neutral';
    mqvLabel: 'Favourable' | 'Unfavourable' | 'Neutral';
    lrvLabel: 'Favourable' | 'Unfavourable' | 'Neutral';
    levLabel: 'Favourable' | 'Unfavourable' | 'Neutral';
    ovLabel: 'Under-applied' | 'Over-applied' | 'Neutral';
  };
}
