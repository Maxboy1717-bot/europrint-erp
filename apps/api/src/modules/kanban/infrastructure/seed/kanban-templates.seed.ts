/**
 * EuroPrint Kanban — 4 ta standart shablon seed.
 *
 * Ishga tushirish:
 *   npx tsx src/modules/kanban/infrastructure/seed/kanban-templates.seed.ts
 */

import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { db } from '../../../../shared/db';
import { kanbanTemplates } from '../../../../shared/db/schema-kanban';

const DEFAULT_TEMPLATES = [
  {
    name:           'Bosim bosib chiqarish tartibi',
    description:    'Offset va raqamli bosish uchun standart ish tartibi',
    priority:       'normal',
    checklistItems: [
      'Fayl tayyorlash (PDF/X-4)',
      'Rang profili tekshirish (CMYK)',
      'Imposition qilish',
      'Tasdiqlash uchun yuborish',
      'Bosishga ruxsat olish',
      'Bosish',
      'Keyin ishlash (varaq kesish, buklash)',
      'Sifat nazorati',
      'Mijozga yetkazish',
    ],
    columnsConfig: [
      { name: 'Yangi buyurtma',    color: '#A0AEC0', sortOrder: 0 },
      { name: 'Fayl tayyorlash',   color: '#5B9BD5', sortOrder: 1 },
      { name: 'Bosish jarayoni',   color: '#F5C96A', sortOrder: 2 },
      { name: 'Keyin ishlash',     color: '#A78BFA', sortOrder: 3 },
      { name: 'Bajarildi',         color: '#6DC5A0', sortOrder: 4 },
    ],
  },
  {
    name:           'Dizayn loyihasi',
    description:    'Grafik dizayn va brending loyihalari uchun shablon',
    priority:       'high',
    checklistItems: [
      'Brifing olish',
      'Konsepsiya ishlab chiqish',
      'Eskiz (rough sketch)',
      'Birinchi variant taqdim etish',
      'Mijoz fikr-mulohazalari',
      'Tuzatishlar kiritish',
      'Yakuniy tasdiqlash',
      'Tayyor fayllarga arxivlash',
    ],
    columnsConfig: [
      { name: 'Kiruvchi savat',    color: '#A0AEC0', sortOrder: 0 },
      { name: 'Rejada',            color: '#5B9BD5', sortOrder: 1 },
      { name: 'Dizayn jarayoni',   color: '#F5C96A', sortOrder: 2 },
      { name: "Ko'rib chiqish",    color: '#A78BFA', sortOrder: 3 },
      { name: 'Tasdiqlangan',      color: '#6DC5A0', sortOrder: 4 },
      { name: 'Bekor',             color: '#F08080', sortOrder: 5 },
    ],
  },
  {
    name:           'Mijoz buyurtmasini qayta ishlash',
    description:    'CRM + bosib chiqarish integratsiyasi uchun buyurtma jarayoni',
    priority:       'urgent',
    checklistItems: [
      'Buyurtma qabul qilish',
      'Narx hisoblash (kalkulyatsiya)',
      'Shartnoma tuzish',
      'Avans to\'lovi tasdiqlash',
      'Texnik ТЗ tayyorlash',
      'Ishlab chiqarishga topshirish',
      'Sifat nazorati',
      'Qadoqlash va yetkazish',
      'Yakuniy to\'lov',
      'Hisobot yopish',
    ],
    columnsConfig: [
      { name: 'Yangi buyurtma',    color: '#A0AEC0', sortOrder: 0 },
      { name: 'Narxlash',          color: '#5B9BD5', sortOrder: 1 },
      { name: 'Shartnoma',         color: '#F5C96A', sortOrder: 2 },
      { name: 'Ishlab chiqarish',  color: '#A78BFA', sortOrder: 3 },
      { name: 'Yetkazish',         color: '#6DC5A0', sortOrder: 4 },
      { name: 'Yakunlandi',        color: '#48BB78', sortOrder: 5 },
    ],
  },
  {
    name:           'HR onboarding',
    description:    'Yangi xodimni ishga qabul qilish va moslashtirish jarayoni',
    priority:       'normal',
    checklistItems: [
      'Hujjatlarni qabul qilish',
      'Shartnomalarga imzo',
      'IT jihozlarini tayyorlash',
      'Tizimga kirish huquqlari berish',
      'Mentorni belgilash',
      'Birinchi hafta dasturini tuzish',
      '1 oylik moslashuv reytingi',
      'Probatsion davr tugash xulosasi',
    ],
    columnsConfig: [
      { name: 'Nomzod',              color: '#A0AEC0', sortOrder: 0 },
      { name: 'Hujjatlar',           color: '#5B9BD5', sortOrder: 1 },
      { name: 'Onboarding',          color: '#F5C96A', sortOrder: 2 },
      { name: 'Probatsion davr',     color: '#A78BFA', sortOrder: 3 },
      { name: 'Qabul qilindi',       color: '#6DC5A0', sortOrder: 4 },
    ],
  },
];

const seedLogger = { log: (m: string) => process.stdout.write(m + '\n'), error: (m: string) => process.stderr.write(m + '\n') };

async function seed() {
  seedLogger.log('Kanban shablonlari seed boshlanmoqda...');

  for (const tpl of DEFAULT_TEMPLATES) {
    // Allaqachon mavjudligini tekshirish
    const existing = await db.select({ id: kanbanTemplates.id })
      .from(kanbanTemplates)
      .limit(1);
    void existing; // just to not have an unused variable

    try {
      await db.insert(kanbanTemplates).values({
        name:           tpl.name,
        description:    tpl.description,
        priority:       tpl.priority,
        checklistItems: tpl.checklistItems,
        columnsConfig:  tpl.columnsConfig,
        createdById:    null,
      }).onConflictDoNothing();
      seedLogger.log(`  OK: "${tpl.name}" qo'shildi`);
    } catch (err) {
      seedLogger.error(`  ERR: "${tpl.name}" xato: ${String(err)}`);
    }
  }

  seedLogger.log('Seed tugadi');
  process.exit(0);
}

seed().catch(err => {
  process.stderr.write(`Seed xato: ${String(err)}\n`);
  process.exit(1);
});
