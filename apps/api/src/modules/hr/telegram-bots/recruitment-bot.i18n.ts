import { Logger } from '@nestjs/common';

export type Lang = 'uz' | 'ru' | 'en';
export type RecruitStep =
  | 'awaiting_lang'
  | 'awaiting_name'
  | 'awaiting_cv'
  | 'awaiting_q1'
  | 'awaiting_q2'
  | 'awaiting_q3'
  | 'awaiting_q4'
  | 'awaiting_q5';

export interface RecruitSession {
  vacancyId: number | null;
  vacancyTitle?: string;
  lang: Lang;
  step: RecruitStep;
  name?: string;
  cvFileId?: string;
  cvFileName?: string;
  answers: string[];
  attempts: number;
}

export const MAX_ATTEMPTS = 3;

export const I18N: Record<Lang, Record<string, string>> = {
  uz: {
    selectLang: '🌐 Tilni tanlang / Выберите язык / Select language:',
    welcome: '👋 <b>EuroPrint Recruitment Bot</b>ga xush kelibsiz!\n\nIsm va familiyangizni yozing:',
    uploadCv: '📄 CV yoki rezyumengizni yuklang (PDF, DOCX qabul qilinadi):',
    cvReceived: '✅ CV qabul qilindi!',
    q1: '1️⃣ Qaysi soha bo\'yicha tajribangiz bor?',
    q2: '2️⃣ Ish tajribangiz necha yil?',
    q3: '3️⃣ Kuchli tomonlaringiz va asosiy ko\'nikmalaringizni ayting:',
    q4: '4️⃣ Maosh kutganingiz qancha? (UZS yoki USD)',
    q5: '5️⃣ Qachon ish boshlashingiz mumkin?',
    submitted: '✅ <b>Arizangiz qabul qilindi!</b>\n\nHR xodimi 2 ish kuni ichida siz bilan bog\'lanadi.',
    maxAttempts: '⛔ Maksimal urinishlar soni tugadi (3/3). Keyinroq qayta urinib ko\'ring.',
    nameRequired: '⚠️ Iltimos, to\'liq ismingizni kiriting:',
    vacancy: '🏢 Vakansiya:',
  },
  ru: {
    selectLang: '🌐 Выберите язык / Tilni tanlang / Select language:',
    welcome: '👋 Добро пожаловать в <b>EuroPrint Recruitment Bot</b>!\n\nВведите ваше имя и фамилию:',
    uploadCv: '📄 Загрузите ваше CV или резюме (принимается PDF, DOCX):',
    cvReceived: '✅ CV получено!',
    q1: '1️⃣ В какой области у вас есть опыт?',
    q2: '2️⃣ Сколько лет опыта работы?',
    q3: '3️⃣ Расскажите о ваших сильных сторонах и ключевых навыках:',
    q4: '4️⃣ Какова ваша ожидаемая зарплата? (UZS или USD)',
    q5: '5️⃣ Когда вы можете приступить к работе?',
    submitted: '✅ <b>Ваша заявка принята!</b>\n\nСотрудник HR свяжется с вами в течение 2 рабочих дней.',
    maxAttempts: '⛔ Превышено максимальное количество попыток (3/3). Попробуйте позже.',
    nameRequired: '⚠️ Пожалуйста, введите полное имя:',
    vacancy: '🏢 Вакансия:',
  },
  en: {
    selectLang: '🌐 Select language / Tilni tanlang / Выберите язык:',
    welcome: '👋 Welcome to <b>EuroPrint Recruitment Bot</b>!\n\nPlease enter your full name:',
    uploadCv: '📄 Upload your CV or resume (PDF, DOCX accepted):',
    cvReceived: '✅ CV received!',
    q1: '1️⃣ What field do you have experience in?',
    q2: '2️⃣ How many years of work experience do you have?',
    q3: '3️⃣ Tell us about your strengths and key skills:',
    q4: '4️⃣ What is your expected salary? (UZS or USD)',
    q5: '5️⃣ When can you start working?',
    submitted: '✅ <b>Your application has been received!</b>\n\nAn HR specialist will contact you within 2 business days.',
    maxAttempts: '⛔ Maximum attempts reached (3/3). Please try again later.',
    nameRequired: '⚠️ Please enter your full name:',
    vacancy: '🏢 Vacancy:',
  },
};

export const helperLogger = new Logger('RecruitmentBotHelpers');
