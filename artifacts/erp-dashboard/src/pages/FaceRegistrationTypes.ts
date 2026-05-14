/** @module FaceRegistrationTypes @description Shared TypeScript interfaces, type aliases, and UI translation constants for the FaceRegistration feature. No JSX. */

// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------

export interface Employee {
  id: string;
  fullName: string;
  employeeId: string;
  departmentId: string;
  profileImageUrl: string | null;
}

export interface FaceEmbedding {
  id: string;
  employeeId: string;
  employeeName: string;
  imageUrl: string | null;
  isActive: boolean;
  confidence: number;
  createdAt: string;
}

export interface RegisterFacePayload {
  employeeId: string;
  embedding: number[];
  imageUrl: string;
  confidence: number;
  images?: string[];
}

// ---------------------------------------------------------------------------
// Liveness status
// ---------------------------------------------------------------------------

export type LivenessStatus = 'idle' | 'challenging' | 'passed' | 'failed';

// ---------------------------------------------------------------------------
// Translation map
// ---------------------------------------------------------------------------

export interface FaceRegTranslations {
  title: string;
  subtitle: string;
  selectEmployee: string;
  searchPlaceholder: string;
  registeredFaces: string;
  startCamera: string;
  stopCamera: string;
  captureFace: string;
  registerFace: string;
  noEmployeeSelected: string;
  faceDetected: string;
  noFaceDetected: string;
  confidence: string;
  loading: string;
  delete: string;
  success: string;
  error: string;
  faceRegistered: string;
  faceDeleted: string;
  modelsLoading: string;
  modelsReady: string;
  noFaces: string;
  livenessCheck: string;
  blinkChallenge: string;
  livenessRequired: string;
  livenessPassed: string;
  livenessFailed: string;
  tryAgain: string;
  blinkDetected: string;
  blinkCount: string;
  timeLeft: string;
  startLiveness: string;
  nowCapture: string;
}

export const TRANSLATIONS: Record<'uz' | 'ru', FaceRegTranslations> = {
  uz: {
    title: "Yuz Ro'yxatdan O'tkazish",
    subtitle: "Xodimlar yuzini AI bazasiga qo'shish",
    selectEmployee: "Xodimni Tanlang",
    searchPlaceholder: "Ism yoki ID bo'yicha qidirish...",
    registeredFaces: "Ro'yxatdan O'tgan Yuzlar",
    startCamera: "Kamerani Yoqish",
    stopCamera: "Kamerani O'chirish",
    captureFace: "Yuzni Olish",
    registerFace: "Yuzni Ro'yxatdan O'tkazish",
    noEmployeeSelected: "Avval xodimni tanlang",
    faceDetected: "Yuz aniqlandi",
    noFaceDetected: "Yuz topilmadi",
    confidence: "Ishonchlilik",
    loading: "Yuklanmoqda...",
    delete: "O'chirish",
    success: "Muvaffaqiyatli",
    error: "Xatolik",
    faceRegistered: "Yuz muvaffaqiyatli ro'yxatdan o'tkazildi",
    faceDeleted: "Yuz o'chirildi",
    modelsLoading: "AI modellar yuklanmoqda...",
    modelsReady: "AI tayyor",
    noFaces: "Hali yuz ro'yxatdan o'tmagan",
    livenessCheck: "Jonli tekshiruv",
    blinkChallenge: "Ko'zingizni yuming",
    livenessRequired: "Avval jonli tekshiruvdan o'ting",
    livenessPassed: "Jonli tekshiruv muvaffaqiyatli",
    livenessFailed: "Jonli tekshiruv muvaffaqiyatsiz",
    tryAgain: "Qaytadan urinib ko'ring",
    blinkDetected: "Ko'z yumish aniqlandi",
    blinkCount: "Ko'z yumish",
    timeLeft: "Vaqt qoldi",
    startLiveness: "Tekshiruvni boshlash",
    nowCapture: "Endi yuzni olishingiz mumkin",
  },
  ru: {
    title: "Регистрация Лица",
    subtitle: "Добавление лиц сотрудников в базу AI",
    selectEmployee: "Выберите Сотрудника",
    searchPlaceholder: "Поиск по имени или ID...",
    registeredFaces: "Зарегистрированные Лица",
    startCamera: "Включить Камеру",
    stopCamera: "Выключить Камеру",
    captureFace: "Захватить Лицо",
    registerFace: "Зарегистрировать Лицо",
    noEmployeeSelected: "Сначала выберите сотрудника",
    faceDetected: "Лицо обнаружено",
    noFaceDetected: "Лицо не найдено",
    confidence: "Уверенность",
    loading: "Загрузка...",
    delete: "Удалить",
    success: "Успешно",
    error: "Ошибка",
    faceRegistered: "Лицо успешно зарегистрировано",
    faceDeleted: "Лицо удалено",
    modelsLoading: "Загрузка AI моделей...",
    modelsReady: "AI готов",
    noFaces: "Пока нет зарегистрированных лиц",
    livenessCheck: "Проверка живости",
    blinkChallenge: "Моргните глазами",
    livenessRequired: "Сначала пройдите проверку живости",
    livenessPassed: "Проверка живости пройдена",
    livenessFailed: "Проверка живости не пройдена",
    tryAgain: "Попробуйте снова",
    blinkDetected: "Моргание обнаружено",
    blinkCount: "Морганий",
    timeLeft: "Осталось",
    startLiveness: "Начать проверку",
    nowCapture: "Теперь вы можете захватить лицо",
  },
};
