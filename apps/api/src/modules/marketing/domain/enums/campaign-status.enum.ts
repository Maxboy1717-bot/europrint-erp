/**
 * @module campaign-status.enum
 * @description Source module. See exports for details.
 */

export enum CampaignStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum CampaignType {
  EMAIL = 'email',
  SMS = 'sms',
  SOCIAL = 'social',
  TELEGRAM = 'telegram',
  PROMOTION = 'promotion',
}
