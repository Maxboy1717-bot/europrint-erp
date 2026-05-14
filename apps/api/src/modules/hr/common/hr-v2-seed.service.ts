/**
 * @module hr-v2-seed.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { HrV2SeedRepository } from './hr-v2-seed.repository';
import { HR_FINE_MINOR, BADGE_POINTS_TOP_PERFORMER, BADGE_POINTS_DECADE_LOYALTY } from '@common/constants/app.constants';


@Injectable()
export class HrV2SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(HrV2SeedService.name);

  constructor(private readonly repo: HrV2SeedRepository) {}

  onApplicationBootstrap(): void {
    Promise.all([this.seedViolationCatalog(), this.seedBadgeCatalog(), this.seedEnpsSurvey()])
      .catch((e: unknown) => this.logger.warn(`HR v2 seed failed: ${e}`));
  }

  private async seedViolationCatalog() {
    const cnt = await this.repo.getViolationCatalogCount();
    if ((cnt.ok ? cnt.data : 0) > 0) return;

    const entries = [
      { code: 'LATE_ARRIVAL', category: 'attendance', name: "Kechikib kelish", nameRu: "Опоздание", severity: 'warning', finePercent: '5.00', fineAmount: HR_FINE_MINOR, points: 5, description: "Ish boshlanishidan 15 daqiqadan ko'proq kechikish" },
      { code: 'UNAUTH_ABSENCE', category: 'attendance', name: "Ruxsatsiz ishga kelmaslik", nameRu: "Прогул", severity: 'severe', finePercent: '25.00', fineAmount: '250000', points: 25, description: "Bir ish kunida ruxsatsiz yo'q bo'lish" },
      { code: 'EARLY_LEAVE', category: 'attendance', name: "Erta ketish", nameRu: "Ранний уход", severity: 'warning', finePercent: '5.00', fineAmount: HR_FINE_MINOR, points: 5, description: "Ish vaqti tugamay ruxsatsiz ketish" },
      { code: 'DRESS_CODE', category: 'conduct', name: "Kiyinish qoidasini buzish", nameRu: "Нарушение дресс-кода", severity: 'minor', finePercent: '0.00', fineAmount: '0', points: 2, description: "Korporativ kiyinish qoidalariga rioya qilmaslik" },
      { code: 'PHONE_POLICY', category: 'conduct', name: "Telefon qoidasini buzish", nameRu: "Нарушение телефонного регламента", severity: 'minor', finePercent: '0.00', fineAmount: '0', points: 2, description: "Ish vaqtida shaxsiy telefon bilan ko'p mashg'ul bo'lish" },
      { code: 'SAFETY_VIOLATION', category: 'safety', name: "Xavfsizlik qoidasini buzish", nameRu: "Нарушение правил безопасности", severity: 'severe', finePercent: '15.00', fineAmount: '150000', points: 20, description: "Mehnat xavfsizligi va sog'liqni saqlash qoidalarini buzish" },
      { code: 'EQUIPMENT_DAMAGE', category: 'property', name: "Uskunaga zarar etkazish", nameRu: "Повреждение оборудования", severity: 'severe', finePercent: '30.00', fineAmount: '300000', points: 30, description: "Kompaniya mulkini ehtiyotsizlik bilan shikastlash" },
      { code: 'DATA_BREACH', category: 'confidentiality', name: "Ma'lumotlar maxfiyligini buzish", nameRu: "Нарушение конфиденциальности", severity: 'critical', finePercent: '50.00', fineAmount: '500000', points: 50, description: "Kompaniya sir va mijoz ma'lumotlarini oshkor qilish" },
      { code: 'INSUBORDINATION', category: 'conduct', name: "Bo'ysunmaslik", nameRu: "Неподчинение", severity: 'severe', finePercent: '20.00', fineAmount: '200000', points: 20, description: "Rahbariyat ko'rsatmalariga bo'ysunmaslik" },
      { code: 'QUALITY_NEGLIGENCE', category: 'performance', name: "Sifatsiz ish", nameRu: "Халатность в работе", severity: 'warning', finePercent: '10.00', fineAmount: '100000', points: 10, description: "Mahsulot sifati standartlarini qayta-qayta buzish" },
    ];

    for (const e of entries) {
      await this.repo.insertViolationCatalogEntry(e);
    }
    this.logger.log('Seeded 10 violation catalog entries');
  }

  private async seedBadgeCatalog() {
    const cnt = await this.repo.getBadgeCatalogCount();
    if ((cnt.ok ? cnt.data : 0) > 0) return;

    const badges = [
      { code: 'PERFECT_ATTENDANCE', name: 'Mukammal davomat', nameRu: 'Идеальная посещаемость', icon: '🏆', desc: 'Bir oy davomida 100% davomat', criteria: 'No absences or late arrivals in calendar month', points: 100, auto: true },
      { code: 'EARLY_BIRD', name: 'Erta keluvchi', nameRu: 'Ранняя пташка', icon: '🌅', desc: '30 kun ketma-ket 15 daqiqa erta kelish', criteria: '30 consecutive days arriving 15+ min early', points: 50, auto: true },
      { code: 'TOP_PERFORMER', name: 'Eng yaxshi xodim', nameRu: 'Лучший сотрудник', icon: '⭐', desc: "Oylik KPI reytingida 1-o'rin", criteria: 'Ranked #1 in monthly KPI report', points: BADGE_POINTS_TOP_PERFORMER, auto: false },
      { code: 'TEAM_PLAYER', name: "Jamoaviy o'yinchi", nameRu: 'Командный игрок', icon: '🤝', desc: 'Hamkorlikda ajoyib natijalar', criteria: 'Nominated by manager for team collaboration', points: 75, auto: false },
      { code: 'INNOVATOR', name: 'Novator', nameRu: 'Новатор', icon: '💡', desc: 'Jarayonlarni takomillashtirish taklifi qabul qilindi', criteria: 'Process improvement suggestion approved and implemented', points: 150, auto: false },
      { code: 'MENTOR', name: 'Murabbiy', nameRu: 'Наставник', icon: '🎓', desc: "Yangi xodimga muvaffaqiyatli mentor bo'lish", criteria: 'Mentored a new employee for 3+ months', points: 100, auto: false },
      { code: 'SAFETY_CHAMPION', name: 'Xavfsizlik chempioni', nameRu: 'Чемпион безопасности', icon: '🦺', desc: '6 oy davomida nol xavfsizlik hodisasi', criteria: '6 months with zero safety violations', points: 150, auto: true },
      { code: 'QUALITY_STAR', name: 'Sifat yulduzi', nameRu: 'Звезда качества', icon: '✨', desc: "Mahsulot sifati ko'rsatkichlari oshdi", criteria: '3 consecutive months exceeding quality KPIs', points: 125, auto: true },
      { code: 'DECADE_LOYALTY', name: '10 yillik sadoqat', nameRu: '10 лет верности', icon: '💎', desc: '10 yillik xizmat', criteria: '10 years of service at EuroPrint', points: BADGE_POINTS_DECADE_LOYALTY, auto: false },
      { code: 'FIVE_YEAR_LOYALTY', name: '5 yillik sadoqat', nameRu: '5 лет верности', icon: '🥇', desc: '5 yillik xizmat', criteria: '5 years of service at EuroPrint', points: 250, auto: false },
      { code: 'CUSTOMER_HERO', name: 'Mijoz qahramoni', nameRu: 'Герой клиентов', icon: '❤️', desc: 'Mijoz shikoyati yechildi va maqtov olindi', criteria: 'Resolved customer complaint with positive feedback', points: 75, auto: false },
      { code: 'ZERO_DEFECT', name: 'Nol nuqson', nameRu: 'Ноль дефектов', icon: '🎯', desc: 'Bir oy nuqsonsiz ishlab chiqarish', criteria: 'Full month with zero production defects attributed', points: 175, auto: true },
    ];

    for (const b of badges) {
      await this.repo.insertBadgeCatalogEntry(b);
    }
    this.logger.log('Seeded 12 badge catalog entries');
  }

  private async seedEnpsSurvey() {
    const cnt = await this.repo.getEnpsSurveyCount();
    if ((cnt.ok ? cnt.data : 0) > 0) return;

    const questions = JSON.stringify([
      { id: 'q1', type: 'nps', text: "Siz EuroPrint-ni do'stlaringizga yoki tanishlaringizga ishchi joy sifatida qanchalik tavsiya qilasiz?", textRu: 'Насколько вероятно, что вы порекомендуете EuroPrint как место работы своим друзьям или знакомым?', scale: { min: 0, max: 10 }, required: true },
      { id: 'q2', type: 'text', text: "Kompaniyada qaysi narsalar sizni eng ko'p qiziqtiradi?", textRu: 'Что вам нравится в компании больше всего?', required: false },
      { id: 'q3', type: 'text', text: 'Kompaniyada qaysi sohalarda yaxshilanish mumkin?', textRu: 'В каких областях компания может улучшиться?', required: false },
      { id: 'q4', type: 'rating', text: 'Rahbariyat bilan munosabatlarni qanday baholaysiz?', textRu: 'Как вы оцениваете отношения с руководством?', scale: { min: 1, max: 5 }, required: true },
      { id: 'q5', type: 'rating', text: 'Ish sharoitlari va muhitini qanday baholaysiz?', textRu: 'Как вы оцениваете условия труда и рабочую среду?', scale: { min: 1, max: 5 }, required: true },
    ]);

    await this.repo.insertEnpsSurvey(questions);
    this.logger.log('Seeded 1 eNPS survey template');
  }
}