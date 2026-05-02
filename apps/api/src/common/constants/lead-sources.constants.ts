/**
 * Lead manbalari (sd_leads.source ustuni uchun lug'at).
 * ARCHITECTURE.md §10 Trigger 21/22 va §29.1 Lead manbalari.
 *
 * Magic string'larni almashtirish uchun.
 */
export const LEAD_SOURCE = {
  PHONE: 'phone',
  TELEGRAM: 'telegram',
  WEBSITE: 'website',
  MOBILE: 'mobile',
  INSTAGRAM: 'instagram',
  EXHIBITION: 'exhibition',
  REFERRAL: 'referral',
  WEBSITE_ORDER: 'website',     // ARCHITECTURE.md: source='website_order' lekin enum 'website' qabul qiladi
  WEBSITE_CONTACT: 'website',   // ARCHITECTURE.md: source='website_contact' lekin enum 'website' qabul qiladi
  CHATBOT: 'website',           // saytdagi AI chatbot
  OTHER: 'other',
} as const;

export type LeadSource = (typeof LEAD_SOURCE)[keyof typeof LEAD_SOURCE];

/**
 * Lead status'lari — sd_leads.status ustuni uchun.
 */
export const LEAD_STATUS = {
  NEW: 'new',
  WORKING: 'working',
  QUOTED: 'quoted',
  NEGOTIATING: 'negotiating',
  WON: 'won',
  LOST: 'lost',
  FROZEN: 'frozen',
} as const;

export type LeadStatus = (typeof LEAD_STATUS)[keyof typeof LEAD_STATUS];

/**
 * Sub-source kalitlari — `sd_leads` jadvalida `source` enum cheklangan
 * (phone/telegram/website/...) shuning uchun aniqroq turi
 * `lostReason` yoki kelajakda qo'shiladigan `sub_source` ustunda saqlanadi.
 */
export const LEAD_SUB_SOURCE = {
  WEBSITE_ORDER: 'website_order',
  WEBSITE_CONTACT: 'website_contact',
  WEBSITE_FORM: 'website_form',
  CHATBOT: 'chatbot',
} as const;

export type LeadSubSource = (typeof LEAD_SUB_SOURCE)[keyof typeof LEAD_SUB_SOURCE];
