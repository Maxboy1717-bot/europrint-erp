export interface NotificationTemplate {
  key: string;
  template_uz: string;
  template_ru?: string;
  channels: ('TELEGRAM' | 'EMAIL' | 'SMS')[];
}

export const NOTIFICATION_TEMPLATES = {
  VACANCY_NEW: {
    key: 'VACANCY_NEW',
    template_uz: '📢 Yangi vakansiya: <b>{title}</b>\nBo\'lim: {department}\nMaosh: {salary}\nMurojaat qilish uchun: {url}',
    template_ru: '📢 Новая вакансия: <b>{title}</b>\nОтдел: {department}\nЗарплата: {salary}\nПодать заявку: {url}',
    channels: ['TELEGRAM', 'EMAIL'],
  },
  AI_INTERVIEW_LINK: {
    key: 'AI_INTERVIEW_LINK',
    template_uz: '🤖 <b>AI Suhbat havolasi</b>\n\nHurmatli {name}, siz vakansiyaga murojaat qildingiz: <b>{vacancy_title}</b>\n\nAI suhbatni boshlash uchun havola:\n{link}\n\nHavola muddati: {expires_at}',
    template_ru: '🤖 <b>Ссылка на AI-интервью</b>\n\nУважаемый(-ая) {name}, вы подали заявку на вакансию: <b>{vacancy_title}</b>\n\nСсылка для прохождения AI-интервью:\n{link}\n\nСрок действия: {expires_at}',
    channels: ['TELEGRAM', 'EMAIL', 'SMS'],
  },
  INTERVIEW_RESULT_PASS: {
    key: 'INTERVIEW_RESULT_PASS',
    template_uz: '✅ <b>Tabriklaymiz, {name}!</b>\n\nSiz suhbatdan muvaffaqiyatli o\'tdingiz.\nVakansiya: <b>{vacancy_title}</b>\n\nKeyingi bosqich haqida tez orada xabar beramiz.',
    template_ru: '✅ <b>Поздравляем, {name}!</b>\n\nВы успешно прошли собеседование.\nВакансия: <b>{vacancy_title}</b>\n\nО следующем этапе сообщим в ближайшее время.',
    channels: ['TELEGRAM', 'EMAIL'],
  },
  INTERVIEW_RESULT_FAIL: {
    key: 'INTERVIEW_RESULT_FAIL',
    template_uz: '❌ <b>Suhbat natijasi</b>\n\nHurmatli {name}, afsuski siz ushbu safar vakansiya talablariga to\'liq javob bera olmadingiz.\nVakansiya: <b>{vacancy_title}</b>\n\nBoshqa imkoniyatlar uchun kuzatib boring: {url}',
    template_ru: '❌ <b>Результат собеседования</b>\n\nУважаемый(-ая) {name}, к сожалению, вы не прошли отбор на данную вакансию.\nВакансия: <b>{vacancy_title}</b>\n\nСледите за другими возможностями: {url}',
    channels: ['TELEGRAM', 'EMAIL'],
  },
  OFFER_SENT: {
    key: 'OFFER_SENT',
    template_uz: '📋 <b>Ish taklifi yuborildi</b>\n\nHurmatli {name}, sizga EuroPrint\'dan ish taklifi yuborildi!\nLavozim: <b>{position}</b>\nMaosh: {salary}\n\nTaklif bilan tanishish: {url}',
    template_ru: '📋 <b>Предложение о работе отправлено</b>\n\nУважаемый(-ая) {name}, вам отправлено предложение о работе от EuroPrint!\nДолжность: <b>{position}</b>\nЗарплата: {salary}\n\nОзнакомиться: {url}',
    channels: ['TELEGRAM', 'EMAIL', 'SMS'],
  },
  OFFER_ACCEPTED: {
    key: 'OFFER_ACCEPTED',
    template_uz: '🎉 <b>Ish taklifi qabul qilindi!</b>\n\nHurmatli {name}, EuroPrint jamoasiga xush kelibsiz!\nBoshlanish sanasi: <b>{start_date}</b>\nOnboarding haqida tez orada bog\'lanamiz.',
    template_ru: '🎉 <b>Предложение принято!</b>\n\nДобро пожаловать в команду EuroPrint, {name}!\nДата начала: <b>{start_date}</b>\nСвяжемся по поводу онбординга.',
    channels: ['TELEGRAM', 'EMAIL'],
  },
  ONBOARDING_START: {
    key: 'ONBOARDING_START',
    template_uz: '🚀 <b>Xush kelibsiz, {name}!</b>\n\nBugun sizning birinchi ish kuningiz.\nOnboarding rejangiz: {url}\nMentoringiz: <b>{mentor_name}</b>',
    template_ru: '🚀 <b>Добро пожаловать, {name}!</b>\n\nСегодня ваш первый рабочий день.\nВаш план онбординга: {url}\nВаш ментор: <b>{mentor_name}</b>',
    channels: ['TELEGRAM', 'EMAIL'],
  },
  CHECKLIST_INCOMPLETE: {
    key: 'CHECKLIST_INCOMPLETE',
    template_uz: '⚠️ <b>Onboarding chek-listi to\'liq emas</b>\n\nHurmatli {name}, quyidagi vazifalar hali bajarilmagan:\n{incomplete_items}\n\nDeadline: <b>{deadline}</b>\nBajarish uchun: {url}',
    template_ru: '⚠️ <b>Чеклист онбординга не завершён</b>\n\nУважаемый(-ая) {name}, следующие задачи ещё не выполнены:\n{incomplete_items}\n\nДедлайн: <b>{deadline}</b>\nВыполнить: {url}',
    channels: ['TELEGRAM', 'EMAIL'],
  },
  LATE_ARRIVAL_REASON: {
    key: 'LATE_ARRIVAL_REASON',
    template_uz: '⏰ <b>Kechikish qayd etildi</b>\n\nSiz {late_minutes} daqiqa kech keldingiz.\nKelish vaqti: {arrival_time}\nSana: {date}\n\n❓ Iltimos, kechikish sababini yozing (kamida 30 ta belgi). Sizda 30 daqiqa vaqt bor.',
    channels: ['TELEGRAM'],
  },
  ABSENCE_DAY1: {
    key: 'ABSENCE_DAY1',
    template_uz: '❓ <b>Siz bugun kelmadingiz</b>\n\nSana: {date}\n\nNega kelmadingiz?\n[Kasal] [Boshqa sabab] [Esdan chiqdi]\n\nIltimos, sababni bildiring yoki HR bilan bog\'laning: {hr_phone}',
    channels: ['TELEGRAM', 'SMS'],
  },
  ABSENCE_DAY2: {
    key: 'ABSENCE_DAY2',
    template_uz: '⚠️ <b>Ikkinchi kun yo\'qlik</b>\n\nHurmatli {name}, siz ketma-ket 2 kun ishga kelmadingiz ({date1}, {date2}).\n\nBu oxirgi ogohlantirish — HR bilan bog\'laning: {hr_phone}\nYoki ERP orqali: {url}',
    channels: ['TELEGRAM', 'SMS'],
  },
  ABSENCE_BLOCKED: {
    key: 'ABSENCE_BLOCKED',
    template_uz: '⛔ <b>Siz bloklangansiz</b>\n\n3 va undan ortiq kun ishga kelmadingiz.\nERP kirishingiz vaqtincha bloklandi.\n\nHR bo\'limi bilan bog\'laning: {hr_phone}',
    channels: ['TELEGRAM', 'SMS'],
  },
  DAILY_REPORT_REQUEST: {
    key: 'DAILY_REPORT_REQUEST',
    template_uz: '📊 <b>Kunlik hisobot eslatmasi</b>\n\nHurmatli {name}, bugungi hisobotingizni topshiring!\nSana: <b>{date}</b>\nDeadline: soat 20:00\n\nTopshirish uchun: /hisobot',
    channels: ['TELEGRAM'],
  },
  DAILY_REPORT_REMINDER: {
    key: 'DAILY_REPORT_REMINDER',
    template_uz: '⏰ <b>Hisobot yaqinlashmoqda!</b>\n\nHurmatli {name}, kunlik hisobotni topshirishga 1 soat qoldi.\nSana: {date}\nDeadline: 20:00\n\nTopshirish uchun: /hisobot',
    channels: ['TELEGRAM'],
  },
  DAILY_REPORT_MISSED: {
    key: 'DAILY_REPORT_MISSED',
    template_uz: '❌ <b>Kunlik hisobot topshirilmadi</b>\n\nHurmatli {name}, {date} kuni hisobot topshirilmadi.\nAvtomatik "yo\'q" belgisi qo\'yildi.\n\nBatafsil: {url}',
    channels: ['TELEGRAM', 'EMAIL'],
  },
  APPROVAL_PENDING: {
    key: 'APPROVAL_PENDING',
    template_uz: '📄 <b>Tasdiqlash kutilmoqda</b>\n\nHujjat: <b>{document_title}</b>\nYuboruvchi: {submitter_name}\nYuborilgan vaqt: {submitted_at}\n\nKo\'rish uchun: {url}',
    channels: ['TELEGRAM', 'EMAIL'],
  },
  APPROVAL_REMINDER_1: {
    key: 'APPROVAL_REMINDER_1',
    template_uz: '🔔 <b>Tasdiqlash eslatmasi (1-marta)</b>\n\nHujjat hali tasdiqlanmagan: <b>{document_title}</b>\nKutilgan vaqt: {waiting_time}\n\nTasdiqlash uchun: {url}',
    channels: ['TELEGRAM'],
  },
  APPROVAL_REMINDER_2: {
    key: 'APPROVAL_REMINDER_2',
    template_uz: '⚠️ <b>Tasdiqlash eslatmasi (2-marta)</b>\n\nHujjat hali tasdiqlanmagan: <b>{document_title}</b>\nKutilgan vaqt: {waiting_time}\n\nIltimos, darhol ko\'rib chiqing: {url}',
    channels: ['TELEGRAM', 'EMAIL'],
  },
  APPROVAL_ESCALATED: {
    key: 'APPROVAL_ESCALATED',
    template_uz: '🚨 <b>Eskalatsiya — Tasdiqlash kechikdi</b>\n\nHujjat: <b>{document_title}</b>\nMas\'ul: {approver_name}\nKutilgan vaqt: {waiting_time}\n\nRahbariyatga eskalatsiya qilindi.',
    channels: ['TELEGRAM', 'EMAIL'],
  },
  DOC_SIGNED: {
    key: 'DOC_SIGNED',
    template_uz: '✅ <b>Hujjat imzolandi</b>\n\nHujjat: <b>{document_title}</b>\nImzolagan: {signer_name}\nSana: {signed_at}\n\nKo\'rish uchun: {url}',
    channels: ['TELEGRAM', 'EMAIL'],
  },
  DOC_REJECTED: {
    key: 'DOC_REJECTED',
    template_uz: '❌ <b>Hujjat rad etildi</b>\n\nHujjat: <b>{document_title}</b>\nRad etgan: {approver_name}\nSabab: {rejection_reason}\n\nQayta ko\'rish uchun: {url}',
    channels: ['TELEGRAM', 'EMAIL'],
  },
  PHYSICAL_SIGN_REQUEST: {
    key: 'PHYSICAL_SIGN_REQUEST',
    template_uz: '✍️ <b>Jismoniy imzo talab qilinadi</b>\n\nHujjat: <b>{document_title}</b>\nImzolash joyi: {location}\nMuddati: {deadline}\n\nHR bilan bog\'laning: {hr_phone}',
    channels: ['TELEGRAM', 'SMS'],
  },
  PROBATION_7DAYS: {
    key: 'PROBATION_7DAYS',
    template_uz: '📅 <b>Sinov muddat tugashiga 7 kun qoldi</b>\n\nHurmatli {name}, sinov muddatingiz {probation_end_date} da tugaydi.\n\nBaholash natijalaringiz: {url}',
    channels: ['TELEGRAM', 'EMAIL'],
  },
  PROBATION_3DAYS: {
    key: 'PROBATION_3DAYS',
    template_uz: '⏳ <b>Sinov muddat tugashiga 3 kun qoldi</b>\n\nHurmatli {name}, sinov muddatingiz {probation_end_date} da tugaydi.\n\nHR bilan uchrashuv rejalashtirilgan: {meeting_date}\nBatafsil: {url}',
    channels: ['TELEGRAM', 'EMAIL'],
  },
  PROBATION_1DAY: {
    key: 'PROBATION_1DAY',
    template_uz: '🔔 <b>Ertaga sinov muddat tugaydi</b>\n\nHurmatli {name}, sinov muddatingiz ertaga — {probation_end_date} da tugaydi.\n\nHR bilan bog\'laning: {hr_phone}',
    channels: ['TELEGRAM', 'SMS'],
  },
  CONTRACT_EXPIRING: {
    key: 'CONTRACT_EXPIRING',
    template_uz: '📋 <b>Shartnoma muddati tugamoqda</b>\n\nHurmatli {name}, shartnomangiz {expiry_date} da tugaydi (30 kun qoldi).\n\nUzaytirish uchun HR bilan bog\'laning: {hr_phone}',
    channels: ['TELEGRAM', 'EMAIL'],
  },
  BIRTHDAY_SELF: {
    key: 'BIRTHDAY_SELF',
    template_uz: '🎂 <b>Tug\'ilgan kuningiz bilan!</b>\n\nHurmatli {name}, bugun sizning tug\'ilgan kuningiz!\n\nEuroPrint jamoasi sizni chin dildan tabrikLaydi! 🎉\nSog\'liq, baxt va katta muvaffaqiyatlar tilaymiz!',
    channels: ['TELEGRAM'],
  },
  BIRTHDAY_TEAM: {
    key: 'BIRTHDAY_TEAM',
    template_uz: '🎂 <b>Bugun tug\'ilgan kun!</b>\n\nJamoamiz a\'zosi <b>{name}</b> ({department}) bugun tug\'ilgan kunini nishonlayapti!\n\nUlarga tabriklaringizni yuboring! 🎉',
    channels: ['TELEGRAM'],
  },
  WORK_ANNIVERSARY: {
    key: 'WORK_ANNIVERSARY',
    template_uz: '🏆 <b>Ish yilligi!</b>\n\nHurmatli {name}, bugun siz EuroPrint\'da <b>{years} yil</b> ishlayapsiz!\n\nFidokorona mehnatiz uchun katta rahmat! Sizga yanada katta muvaffaqiyatlar tilaymiz! 🎊',
    channels: ['TELEGRAM'],
  },
  REWARD_GIVEN: {
    key: 'REWARD_GIVEN',
    template_uz: '🏅 <b>Mukofot berildi!</b>\n\nHurmatli {name}, sizga mukofot berildi:\n<b>{reward_title}</b>\nSumma/tur: {reward_value}\nSabab: {reason}\n\nTabriklaymiz! 🎉',
    channels: ['TELEGRAM', 'EMAIL'],
  },
  PENALTY_ASSIGNED: {
    key: 'PENALTY_ASSIGNED',
    template_uz: '⚠️ <b>Jarima tayinlandi</b>\n\nHurmatli {name}, sizga jarima tayinlandi:\nTuri: {penalty_type}\nSumma: {amount}\nSabab: {reason}\n\nShikoyat qilish muddati: {appeal_deadline}\nBatafsil: {url}',
    channels: ['TELEGRAM', 'EMAIL'],
  },
  PENALTY_APPEAL_RESULT: {
    key: 'PENALTY_APPEAL_RESULT',
    template_uz: '📋 <b>Jarima shikoyati natijasi</b>\n\nHurmatli {name}, jarima shikoyatingiz ko\'rib chiqildi.\nNatija: <b>{result}</b>\n{result_comment}\n\nBatafsil: {url}',
    channels: ['TELEGRAM', 'EMAIL'],
  },
  EVAL_360_REQUEST: {
    key: 'EVAL_360_REQUEST',
    template_uz: '📊 <b>360° Baholash so\'rovi</b>\n\nSiz <b>{employee_name}</b>ni baholashingiz so\'ralmoqda.\nDeadline: {deadline}\n\nBaholash uchun: {url}',
    channels: ['TELEGRAM', 'EMAIL'],
  },
  DAILY_RATING_REQUEST: {
    key: 'DAILY_RATING_REQUEST',
    template_uz: '⭐ <b>Kunlik reyting so\'rovi</b>\n\nBugungi ish kuni qanday bo\'ldi? 1-5 ball bering:\n{rating_url}\n\nFikringiz muhim!',
    channels: ['TELEGRAM'],
  },
  TRAINING_MANDATORY: {
    key: 'TRAINING_MANDATORY',
    template_uz: '📚 <b>Yangi majburiy kurs tayinlandi</b>\n\nHurmatli {name}, sizga yangi majburiy kurs tayinlandi:\n<b>{course_title}</b>\nDeadline: {deadline}\n\nBoshlash uchun: {url}',
    channels: ['TELEGRAM', 'EMAIL'],
  },
  TRAINING_DEADLINE: {
    key: 'TRAINING_DEADLINE',
    template_uz: '⏰ <b>Kurs deadlinе yaqinlashmoqda</b>\n\nHurmatli {name}, kurs muddati {days_left} kun qoldi:\n<b>{course_title}</b>\nDeadline: {deadline}\nTugallanganlik: {progress}%\n\nDavom ettirish: {url}',
    channels: ['TELEGRAM'],
  },
  EMERGENCY_FIRE: {
    key: 'EMERGENCY_FIRE',
    template_uz: '🔥 <b>FAVQULODDA HOLAT — YONGʼIN!</b>\n\nJoy: {location}\nVaqt: {incident_time}\n\n⚠️ DARHOL evakuatsiya qiling!\nYong\'in xizmatiga qo\'ng\'iroq qiling: 101\n\nKo\'rsatmalar uchun: {url}',
    channels: ['TELEGRAM', 'SMS'],
  },
  EMERGENCY_MEDICAL: {
    key: 'EMERGENCY_MEDICAL',
    template_uz: '🚑 <b>FAVQULODDA HOLAT — TIBBIY YORDAM!</b>\n\nJoy: {location}\nVaqt: {incident_time}\nTafsilot: {description}\n\n⚠️ Tez yordam: 103\nMas\'ul: {responsible_person}\n\nKo\'rsatmalar: {url}',
    channels: ['TELEGRAM', 'SMS'],
  },
  COMPLAINT_NEW: {
    key: 'COMPLAINT_NEW',
    template_uz: '📩 <b>Yangi shikoyat keldi</b>\n\nShikoyat #: {complaint_id}\nTuri: {complaint_type}\nHolati: Ko\'rib chiqilmoqda\n\nKo\'rish uchun: {url}',
    channels: ['TELEGRAM', 'EMAIL'],
  },
  BOOMERANG_OFFER: {
    key: 'BOOMERANG_OFFER',
    template_uz: '🔄 <b>Qayta ish taklifi!</b>\n\nHurmatli {name}, EuroPrint\'da sizga mos yangi vakansiya paydo bo\'ldi:\n<b>{vacancy_title}</b>\nBo\'lim: {department}\nMaosh: {salary}\n\nMurojaat qilish: {url}\n\nTaklif {expires_at} gacha amal qiladi.',
    channels: ['TELEGRAM', 'SMS'],
  },
  ENPS_SURVEY: {
    key: 'ENPS_SURVEY',
    template_uz: '📋 <b>eNPS So\'rovnomasi</b>\n\nHurmatli {name}, bir daqiqangizni oling — sizning fikringiz muhim!\n\nSo\'rovnoma: {url}\n\nDeadline: {deadline}',
    channels: ['TELEGRAM', 'EMAIL'],
  },
  POLICY_UPDATED: {
    key: 'POLICY_UPDATED',
    template_uz: '📜 <b>Korporativ qoida yangilandi</b>\n\nQoida: <b>{policy_title}</b>\nO\'zgartirish sanasi: {updated_at}\n\nYangi versiya bilan tanishish: {url}\n\nO\'qib, tasdiqlang (deadline: {deadline}).',
    channels: ['TELEGRAM', 'EMAIL'],
  },
  MENTORSHIP_ASSIGNED: {
    key: 'MENTORSHIP_ASSIGNED',
    template_uz: '🤝 <b>Mentorlik tayinlandi</b>\n\nHurmatli {name}, sizga mentor tayinlandi:\n<b>{mentor_name}</b> — {mentor_position}\n\nBirinchi uchrashuv: {first_meeting}\nBatafsil: {url}',
    channels: ['TELEGRAM', 'EMAIL'],
  },
  CAREER_OPPORTUNITY: {
    key: 'CAREER_OPPORTUNITY',
    template_uz: '🚀 <b>Martaba imkoniyati!</b>\n\nHurmatli {name}, sizga mos ichki imkoniyat:\n<b>{opportunity_title}</b>\nBo\'lim: {department}\n\nMurojaat qilish muddati: {deadline}\nBatafsil: {url}',
    channels: ['TELEGRAM', 'EMAIL'],
  },
} as const satisfies Record<string, NotificationTemplate>;

export type NotificationTemplateKey = keyof typeof NOTIFICATION_TEMPLATES;

export function renderTemplate(
  template: string,
  params: Record<string, string>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => params[key] ?? `{${key}}`);
}
