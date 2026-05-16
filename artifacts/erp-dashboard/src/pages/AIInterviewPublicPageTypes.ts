
import { tLabel } from '@/lib/i18n/tLabel';
/**
 * @module AIInterviewPublicPageTypes
 * @description Types, interfaces, and constants for AIInterviewPublicPage.
 */

export type InterviewStage =
  | "VALIDATING"
  | "EXPIRED"
  | "INVALID"
  | "CAMERA_CHECK"
  | "LANG_SELECT"
  | "READY"
  | "INTERVIEWING"
  | "COMPLETED"
  | "CANCELLED";

export type Language = "uz" | "ru" | "en";

export interface SessionInfo {
  id: number;
  token: string;
  candidate_name: string | null;
  candidate_language: string;
  status: string;
  expires_at: string;
  valid?: boolean;
  expired?: boolean;
  error?: string;
}

export interface TranscriptEntry {
  role: "ai" | "user";
  text: string;
  ts: number;
  score?: number;
  feedback?: string;
}

export interface Question {
  id: number;
  question: string;
  maxScore: number;
}

export const LABELS: Record<Language, Record<string, string>> = {
  uz: {
    title: "EuroPrint AI Intervyu",
    checkDevices: "Qurilmalarni tekshirish",
    camera: "Kamera",
    mic: "Mikrofon",
    proceed: "Tayyor — Davom etish",
    startInterview: "Intervyuni Boshlash",
    ready: "AI Intervyu — Tayyormisiz?",
    question: "Savol",
    typeAnswer: "Javobingizni yozing...",
    nextBtn: "Keyingi",
    finishBtn: "Yakunlash",
    submitBtn: "Javoblarni Yuborish",
    submitBtnWait: "Yuborilmoqda...",
    micOn: "Ovozdan foydalanish",
    micOff: "Mikrofon o'chir",
    camOn: "Kamera yoqiq",
    camOff: "Kamera o'chiq",
    chat: "Suhbat",
    aiTyping: "AI yozmoqda...",
    offline: "Offline",
    connected: "Ulangan",
    completed: "Intervyu yakunlandi!",
    completedDesc: "Javoblaringiz muvaffaqiyatli qabul qilindi.",
    hrContact: "HR jamoasi siz bilan tez orada bog'lanadi.",
    expired: "Muddat o'tgan",
    expiredDesc: "Ushbu intervyu havolasining muddati tugagan.",
    invalid: "Havola topilmadi",
    invalidDesc: "Intervyu havolasi noto'g'ri yoki mavjud emas.",
    cancelled: "Intervyu bekor qilindi",
    cancelledDesc: "Kamera 3 marta rad etildi.",
    hrEmail: "HR bilan bog'laning: hr@europrint.uz",
    newHrLink: "Iltimos, HR'dan yangi havola so'rang.",
    chars: "belgi",
    questions: "ta savol",
    minutes: "15–20 daqiqa",
    voiceText: "Ovoz va matn",
    secure: "Xavfsiz ulanish",
    tip1: "Qulay joyda o'tiring",
    tip2: "Shovqin kamaytiring",
    tip3: "Har savolga to'liq javob bering",
    tip4: "Internevyu boshlangach to'xtamaslik kerak",
    selectLang: "Tilni tanlang",
  },
  ru: {
    title: tLabel('common.AIInterviewPublicPage.europrintAi', "EuroPrint AI Интервью"),
    checkDevices: "Проверить устройства",
    camera: "Камера",
    mic: "Микрофон",
    proceed: "Готов — Продолжить",
    startInterview: "Начать Интервью",
    ready: "AI Интервью — Готовы?",
    question: "Вопрос",
    typeAnswer: "Напишите ваш ответ...",
    nextBtn: "Далее",
    finishBtn: "Завершить",
    submitBtn: "Отправить ответы",
    submitBtnWait: "Отправляется...",
    micOn: "Использовать голос",
    micOff: "Выключить микрофон",
    camOn: "Камера включена",
    camOff: "Камера выключена",
    chat: "Беседа",
    aiTyping: "AI печатает...",
    offline: "Offline",
    connected: "Подключено",
    completed: "Интервью завершено!",
    completedDesc: "Ваши ответы успешно получены.",
    hrContact: "Команда HR свяжется с вами в ближайшее время.",
    expired: "Срок истёк",
    expiredDesc: "Срок действия ссылки на интервью истёк.",
    invalid: "Ссылка не найдена",
    invalidDesc: "Ссылка на интервью неверна или не существует.",
    cancelled: "Интервью отменено",
    cancelledDesc: "Камера была отклонена 3 раза.",
    hrEmail: "Свяжитесь с HR: hr@europrint.uz",
    newHrLink: "Пожалуйста, запросите новую ссылку у HR.",
    chars: "символов",
    questions: "вопросов",
    minutes: "15–20 минут",
    voiceText: "Голос и текст",
    secure: "Безопасное соединение",
    tip1: "Сядьте удобно",
    tip2: "Уменьшите шум",
    tip3: "Полностью отвечайте на каждый вопрос",
    tip4: "Не прерывайте интервью после начала",
    selectLang: "Выберите язык",
  },
  en: {
    title: "EuroPrint AI Interview",
    checkDevices: "Check Devices",
    camera: "Camera",
    mic: "Microphone",
    proceed: "Ready — Continue",
    startInterview: "Start Interview",
    ready: "AI Interview — Are you ready?",
    question: "Question",
    typeAnswer: "Write your answer...",
    nextBtn: "Next",
    finishBtn: "Finish",
    submitBtn: "Submit Answers",
    submitBtnWait: "Submitting...",
    micOn: "Use voice",
    micOff: "Mute microphone",
    camOn: "Camera on",
    camOff: "Camera off",
    chat: "Conversation",
    aiTyping: "AI is typing...",
    offline: "Offline",
    connected: "Connected",
    completed: "Interview Completed!",
    completedDesc: "Your answers have been successfully received.",
    hrContact: "The HR team will contact you soon.",
    expired: "Link Expired",
    expiredDesc: "This interview link has expired.",
    invalid: "Link Not Found",
    invalidDesc: "The interview link is invalid or does not exist.",
    cancelled: "Interview Cancelled",
    cancelledDesc: "Camera was rejected 3 times.",
    hrEmail: "Contact HR: hr@europrint.uz",
    newHrLink: "Please request a new link from HR.",
    chars: "chars",
    questions: "questions",
    minutes: "15–20 minutes",
    voiceText: "Voice and text",
    secure: "Secure connection",
    tip1: "Sit in a comfortable place",
    tip2: "Reduce background noise",
    tip3: "Give complete answers to each question",
    tip4: "Do not stop once the interview begins",
    selectLang: "Select language",
  },
};
