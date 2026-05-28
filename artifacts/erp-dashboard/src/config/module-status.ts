/**
 * @module module-status
 * @description Modul holati registri.
 *
 * Har yangi sessiyada yangilanadi:
 *  - 'live'    → Real DB ↔ UI, 503 yo'q, asosiy funksiyalar ishlaydi
 *  - 'partial' → Qisman ishlaydi, ba'zi route'lar broken yoki stub
 *  - 'stub'    → Hali real implementatsiya yo'q, StubPage ko'rsatadi
 *
 * Sidebar badge (ModuleSidebar.tsx) bu ma'lumotdan foydalanadi.
 */

export type ModuleStatus = 'live' | 'partial' | 'stub';

export interface ModuleInfo {
  code: string;
  name: string;
  nameRu: string;
  status: ModuleStatus;
  lastVerified: string; // ISO date
  notes?: string;
  brokenRoutes?: string[];
}

/** Versiya — CHANGELOG.md bilan sinxron bo'lishi kerak */
export const APP_VERSION = '2.0.1';
/** Oxirgi deploy sanasi */
export const LAST_UPDATED = '2026-05-28';

export const MODULE_STATUS: ModuleInfo[] = [
  {
    code: 'tz01',
    name: 'Savdo va CRM',
    nameRu: 'Продажи и CRM',
    status: 'live',
    lastVerified: '2026-05-28',
  },
  {
    code: 'tz02',
    name: 'Marketing',
    nameRu: 'Маркетинг',
    status: 'partial',
    lastVerified: '2026-05-21',
    notes: 'Asosiy sahifalar ishlaydi; AI marketing kampaniya endpoints stub',
  },
  {
    code: 'tz03',
    name: 'HR',
    nameRu: 'Управление персоналом',
    status: 'live',
    lastVerified: '2026-05-28',
    notes: 'P0-P3 QA sprint tugadi — barcha asosiy sahifalar 503-siz ishlaydi',
  },
  {
    code: 'tz04',
    name: 'Moliya',
    nameRu: 'Финансы',
    status: 'partial',
    lastVerified: '2026-05-27',
    notes: 'GL, AR/AP ishlaydi; loans module (#FX-4) stub',
    brokenRoutes: ['finance/loans'],
  },
  {
    code: 'tz05',
    name: 'Tahlil',
    nameRu: 'Аналитика',
    status: 'live',
    lastVerified: '2026-05-27',
  },
  {
    code: 'tz06',
    name: 'Admin',
    nameRu: 'Администрирование',
    status: 'live',
    lastVerified: '2026-05-27',
  },
  {
    code: 'tz07',
    name: 'Integratsiya',
    nameRu: 'Интеграция',
    status: 'partial',
    lastVerified: '2026-05-21',
    notes: 'API endpoint katalogi ishlaydi; webhook real-time partial',
  },
  {
    code: 'tz08',
    name: 'Ombor (WMS)',
    nameRu: 'Склад',
    status: 'live',
    lastVerified: '2026-05-27',
  },
  {
    code: 'tz09',
    name: 'Ishlab Chiqarish',
    nameRu: 'Производство',
    status: 'live',
    lastVerified: '2026-05-27',
  },
  {
    code: 'tz10',
    name: 'Dizayn',
    nameRu: 'Дизайн',
    status: 'partial',
    lastVerified: '2026-05-21',
    notes: 'Asosiy routes ishlaydi; CAD integration stub',
  },
  {
    code: 'tz11',
    name: 'Texnik Xizmat (MRO)',
    nameRu: 'Обслуживание',
    status: 'partial',
    lastVerified: '2026-05-21',
  },
  {
    code: 'tz12',
    name: 'IoT',
    nameRu: 'IoT',
    status: 'partial',
    lastVerified: '2026-05-21',
    notes: 'Dashboard ko\'rinadi; real sensor data qisman',
  },
  {
    code: 'tz13',
    name: "Ta'lim (LMS)",
    nameRu: 'Обучение',
    status: 'live',
    lastVerified: '2026-05-27',
  },
  {
    code: 'tz14',
    name: 'Kamera',
    nameRu: 'Камера',
    status: 'partial',
    lastVerified: '2026-05-21',
    notes: 'Dashboard va stream ishlaydi; AI detection partial',
  },
];

/** Modul kodidan holat olish helper */
export function getModuleStatus(code: string): ModuleStatus {
  return MODULE_STATUS.find((m) => m.code === code)?.status ?? 'stub';
}

/** Badge rangi (Tailwind class) */
export const STATUS_COLOR: Record<ModuleStatus, string> = {
  live:    'bg-green-500',
  partial: 'bg-yellow-400',
  stub:    'bg-gray-400',
};

/** Badge tooltip matni */
export const STATUS_LABEL: Record<ModuleStatus, string> = {
  live:    'Ishlaydi',
  partial: 'Qisman ishlaydi',
  stub:    'Hali tayyor emas',
};
