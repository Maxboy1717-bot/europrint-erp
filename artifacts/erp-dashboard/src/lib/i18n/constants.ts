export const SUPPORTED_LANGUAGES = ['uz', 'ru'] as const;

export const DEFAULT_LANGUAGE = 'uz' as const;

/**
 * Yagona localStorage kaliti — barcha app (ERP + Public) bir xil kalit ishlatadi.
 * Eski: 'app_language' (ERP) va 'europrint-lang' (Public) — birlashtirildi.
 */
export const LANGUAGE_STORAGE_KEY = 'europrint_language' as const;

export const LANGUAGE_LABELS: Record<
  (typeof SUPPORTED_LANGUAGES)[number],
  { label: string; shortCode: string; flag: string }
> = {
  uz: { label: "O'zbekcha", shortCode: 'UZ', flag: '🇺🇿' },
  ru: { label: 'Русский',   shortCode: 'RU', flag: '🇷🇺' },
};

/**
 * Barcha 30 ta tarjima modullari (16 asl + 14 yangi).
 * wms — Warehouse Management System (MaterialBalance.tsx uchun)
 * public — EuroPrint jamoat veb-sayti uchun
 * sd, mes, kanban, director, security, notifications,
 * iot, admin, mro, design, logistics, pos, ai — yangi modullar
 * coordination — ШВБ koordinatsiya tizimi (ЗВС, 5 kengash, Доклад/Распоряжение)
 */
export const TRANSLATION_MODULES = [
  'common',
  'auth',
  'dashboard',
  'hr',
  'finance',
  'production',
  'warehouse',
  'wms',
  'crm',
  'lms',
  'settings',
  'errors',
  'validation',
  'marketing',
  'navigation',
  'public',
  'sd',
  'mes',
  'kanban',
  'director',
  'security',
  'notifications',
  'iot',
  'admin',
  'mro',
  'design',
  'logistics',
  'pos',
  'ai',
  'coordination',
  'print',
] as const;
