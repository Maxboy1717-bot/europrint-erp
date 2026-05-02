export const AI_AUTO_CONFIDENCE_THRESHOLD = 0.85;
export const AI_VISION_PASS_THRESHOLD     = 2.0;
export const AI_VISION_SCRAP_THRESHOLD    = 5.0;
export const AI_PAYMENT_AUTO_THRESHOLD    = 0.90;

export const OEE_CRITICAL_THRESHOLD       = 0.65;
export const OEE_WARNING_THRESHOLD        = 0.75;

export const Z_THRESHOLD                  = 3.0;
export const Z_AUTO_STOP_THRESHOLD        = 5.0;
export const Z_ROLLING_WINDOW             = 20;

export const VRP_MAX_ITERATIONS           = 1000;
export const EARTH_RADIUS_M               = 6_371_000;
export const DEFAULT_SPEED_KMH            = 40;

export const RISK_W1 = 0.30;
export const RISK_W2 = 0.40;
export const RISK_W3 = 0.20;
export const RISK_W4 = 0.10;

export const RISK_AUTO_THRESHOLD          = 0.7;

export const NEW_TIER_DISCOUNT            = 0;
export const REGULAR_TIER_DISCOUNT        = 0.05;
export const VIP_TIER_DISCOUNT            = 0.10;

export const PEAK_SEASON_MULT             = 1.15;
export const NORMAL_SEASON_MULT           = 1.00;
export const LOW_SEASON_MULT              = 0.90;

export const PRICE_LOW_MARGIN             = 1.05;
export const PRICE_MID_MARGIN             = 1.15;
export const PRICE_HIGH_MARGIN            = 1.25;

export const MIN_DPI                      = 300;
export const REQUIRED_BLEED_MM            = 3;
export const MAX_TAC_OFFSET               = 320;
export const MAX_TAC_FLEXO                = 280;
export const COMPLETENESS_THRESHOLD       = 0.9;

export const HITL_PRICE_HARD_UZS         = 100_000_000;
export const HITL_PRICE_SOFT_UZS         =  50_000_000;
export const HITL_CREDIT_HARD            = 0.20;
export const HITL_CREDIT_SOFT            = 0.10;

export const PLANNER_MOLD_LEAD_DAYS      = 14;
export const PLANNER_MATERIAL_LEAD_DAYS  = 7;

export const AI_GEMINI_MODEL              = 'gemini-2.0-flash-001';

export const AGENT_CODES = {
  SALES_COPILOT:      'sales_copilot',
  PREPRESS_ASSISTANT: 'prepress_assistant',
  PLANNER:            'planner',
  MES_MONITOR:        'mes_monitor',
  VISION_QC:          'vision_qc',
  ROUTER:             'router',
} as const;
