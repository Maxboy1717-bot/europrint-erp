/**
 * @module onboarding-defaults
 * @description Default 6-week HR Manager onboarding plan. Extracted from
 * onboarding.service.ts per Rule 16 (≤ 300 lines) — the constant alone was ~80
 * lines so moving it here lets the service file stay focused on business logic.
 */

import type { CreateOnboardingPlanDto } from './dto/onboarding.dto';

// HR CAPITAL: 6 haftalik standart onboarding (HR Manager uchun namuna)
export const DEFAULT_HR_MANAGER_ONBOARDING: CreateOnboardingPlanDto['weeklyPlan'] = [
  {
    week: 1,
    title: 'Asoslar: Kurs + Bozor tadqiqoti',
    goals: ['HR CAPITAL kursi 1-sessiya o\'rganish', 'Kompaniya ichki qoidalari'],
    tasks: [
      { day: 1, title: 'HR CAPITAL 1-sessiya', type: 'COURSE', durationHours: 4, isRequired: true },
      { day: 2, title: 'Kompaniya tuzilmasi + RBAC tushunish', type: 'SHADOWING', durationHours: 3, isRequired: true },
      { day: 3, title: 'HR CAPITAL 2-sessiya', type: 'COURSE', durationHours: 4, isRequired: true },
      { day: 4, title: 'hh.uz bozor tadqiqoti — 5 ta raqobatchi vakansiya', type: 'TASK', isRequired: true },
      { day: 5, title: 'HR bo\'limi jarayonlari bilan tanishish', type: 'SHADOWING', durationHours: 4, isRequired: true },
    ],
    weeklyCheckpoint: 'HR CAPITAL 1-2 sessiyalar imtihoni (80%+ ball)',
  },
  {
    week: 2,
    title: 'Amaliy bilim: Kurs davomi',
    goals: ['HR CAPITAL 3-4 sessiya', 'Tool Test o\'rganish'],
    tasks: [
      { day: 1, title: 'HR CAPITAL 3-sessiya (HR tekshiruvi)', type: 'COURSE', durationHours: 4, isRequired: true },
      { day: 2, title: 'Tool Test A-J o\'rganish + amaliyot', type: 'TASK', durationHours: 3, isRequired: true },
      { day: 3, title: 'HR CAPITAL 4-sessiya', type: 'COURSE', durationHours: 4, isRequired: true },
      { day: 4, title: 'Mavjud kandidatlar bilan Tool Test o\'tkazish (nazorat ostida)', type: 'TASK', isRequired: true },
      { day: 5, title: 'Hafta yakunlash + rahbar bilan 1:1', type: 'MEETING', durationHours: 1, isRequired: true },
    ],
    weeklyCheckpoint: 'Kamida 3 ta kandidat bilan Tool Test o\'tkazildi',
  },
  {
    week: 3,
    title: 'Yakunlash: 5-sessiya + Mustaqil ish boshlash',
    goals: ['HR CAPITAL 5-sessiya', 'Birinchi mustaqil vakansiya'],
    tasks: [
      { day: 1, title: 'HR CAPITAL 5-sessiya (Lavozim tavsifi)', type: 'COURSE', durationHours: 4, isRequired: true },
      { day: 2, title: 'Birinchi mustaqil vakansiya e\'loni (nazorat ostida)', type: 'TASK', isRequired: true },
      { day: 3, title: 'Onboarding reja tuzish (bitta lavozim uchun)', type: 'TASK', durationHours: 3, isRequired: true },
      { day: 4, title: 'HR CAPITAL kursi yakuniy testi', type: 'TEST', isRequired: true },
      { day: 5, title: '3 hafta yakunlash + 60-kun maqsadlar belgilash', type: 'MEETING', isRequired: true },
    ],
    weeklyCheckpoint: 'HR CAPITAL kursi 80%+ ball bilan yakunlandi',
  },
  {
    week: 4,
    title: 'Faol rekruting: Vakansiya e\'lonlari',
    goals: ['Kamida 2 ta vakansiya faollashtirildi', '20+ nomzod jalb qilindi'],
    tasks: [
      { day: 1, title: 'hh.uz, OLX.uz vakansiyalar joylashtirish', type: 'TASK', isRequired: true },
      { day: 2, title: 'Telegram kanallar + Instagram rekruting', type: 'TASK', isRequired: true },
      { day: 3, title: 'Nomzodlar oqimini kuzatish + Kanban boshqaruv', type: 'TASK', isRequired: true },
      { day: 4, title: 'Tez suhbatlar (Screening calls)', type: 'TASK', durationHours: 4, isRequired: true },
      { day: 5, title: 'Haftalik statistika hisoboti', type: 'TASK', isRequired: true },
    ],
    weeklyCheckpoint: '≥ 20 yangi nomzod, ≥ 10 tez suhbat',
  },
  {
    week: 5,
    title: 'Intervyular: Produktivlik baholash',
    goals: ['Produktivlik intervyulari o\'tkazish', 'Flagman nomzodlarni aniqlash'],
    tasks: [
      { day: 1, title: 'Kuniga ≥ 3 ta produktivlik intervyu', type: 'TASK', durationHours: 5, isRequired: true },
      { day: 2, title: 'Tool Test + natijalarni solishtirish', type: 'TASK', isRequired: true },
      { day: 3, title: 'Navedenie spravok (Reference check)', type: 'TASK', isRequired: true },
      { day: 4, title: 'Taklif yuborish (top nomzodlar)', type: 'TASK', isRequired: true },
      { day: 5, title: 'Haftalik statistika + KPI ball hisoblash', type: 'TASK', isRequired: true },
    ],
    weeklyCheckpoint: '≥ 2 ta Flagman nomzod aniqlandi',
  },
  {
    week: 6,
    title: 'Yakunlash: Probation baholash',
    goals: ['6 hafta yakunlash', 'Mustaqil ishlashga tayyor'],
    tasks: [
      { day: 1, title: 'Birinchi yollangan xodim onboarding boshlash', type: 'TASK', isRequired: true },
      { day: 2, title: 'Barcha jarayonlar hujjatlashtirish', type: 'TASK', isRequired: true },
      { day: 3, title: 'Keyingi 3 oy uchun rekruting reja tuzish', type: 'TASK', isRequired: true },
      { day: 4, title: 'Rahbar bilan 90-kun KPI muhokamasi', type: 'MEETING', durationHours: 2, isRequired: true },
      { day: 5, title: 'Probation yakuniy bahosi', type: 'TEST', isRequired: true },
    ],
    weeklyCheckpoint: 'Probation muvaffaqiyatli yakunlandi (≥ 70 ball)',
  },
];
