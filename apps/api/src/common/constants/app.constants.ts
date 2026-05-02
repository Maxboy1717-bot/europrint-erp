// ─── Vaqt konstantalari ───────────────────────────────────────────────────────
export const MS_PER_SECOND = 1_000;
export const SECONDS_PER_MINUTE = 60;
export const MINUTES_PER_HOUR = 60;
export const HOURS_PER_DAY = 24;

export const MS_PER_MINUTE = MS_PER_SECOND * SECONDS_PER_MINUTE;
export const MS_PER_HOUR = MS_PER_MINUTE * MINUTES_PER_HOUR;
export const MS_PER_DAY = MS_PER_HOUR * HOURS_PER_DAY;

export const SECONDS_PER_HOUR = SECONDS_PER_MINUTE * MINUTES_PER_HOUR;
export const SECONDS_PER_DAY = SECONDS_PER_HOUR * HOURS_PER_DAY;
export const SECONDS_PER_YEAR = 365 * SECONDS_PER_DAY;

// ─── Fayl o'lchamlari ─────────────────────────────────────────────────────────
export const ONE_KB = 1_024;
export const ONE_MB = ONE_KB * ONE_KB;
export const ONE_GB = ONE_MB * ONE_KB;
export const MAX_FILE_SIZE_MB = 50;
export const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * ONE_MB;

// ─── Matn uzunligi chegaralari ────────────────────────────────────────────────
export const MAX_SHORT_LABEL = 100; // qisqa yorliq, maks belgi soni
export const MAX_TITLE_LENGTH = 255; // sarlavha/nom maydonlari, maks belgi soni
export const MAX_NAME_LENGTH = 200; // standart ism/nom maydoni, maks belgi soni
export const MAX_SHORT_TEXT = 500;  // qisqa matn maydoni, maks belgi soni

// ─── Foiz/Ball chegaralari ────────────────────────────────────────────────────
export const MAX_SCORE_VALUE = 100; // foiz yoki ball chegarasi (0..100)
export const MAX_NOTES_LENGTH = 1_000;
export const MAX_DESCRIPTION_LENGTH = 2_000;
export const MAX_LONG_TEXT = 5_000;

// ─── Sahifalash ───────────────────────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_QUERY_LIMIT = 200;       // standart so'rov chegarasi
export const MAX_LARGE_QUERY_LIMIT = 500; // katta so'rov chegarasi (compatibility API)
export const MAX_EXPORT_LIMIT = 1_000;

// ─── Kesh (cache) ─────────────────────────────────────────────────────────────
export const CACHE_TTL_SHORT = 300;
export const CACHE_TTL_STANDARD = SECONDS_PER_HOUR;
export const CACHE_TTL_DAY = SECONDS_PER_DAY;

// ─── JWT / Auth ───────────────────────────────────────────────────────────────
export const JWT_ACCESS_TTL_MS = MS_PER_HOUR;
export const JWT_REFRESH_TTL_MS = 7 * MS_PER_DAY;
export const JWT_EXPIRY_SECONDS = SECONDS_PER_DAY;

// ─── Throttle / Rate limit ────────────────────────────────────────────────────
export const THROTTLE_DEFAULT_LIMIT = 100;
export const THROTTLE_DEFAULT_TTL_MS = MS_PER_MINUTE;
export const THROTTLE_STRICT_TTL_MS = 30 * MS_PER_SECOND;

// ─── Server / Tarmoq ──────────────────────────────────────────────────────────
export const DEFAULT_PORT = 8_080;
export const POSTGRES_DEFAULT_PORT = 5_432;
export const REDIS_DEFAULT_PORT = 6_379;
export const PRINTER_DEFAULT_PORT = 9_100;

// ─── Domain ───────────────────────────────────────────────────────────────────
export const DEFAULT_BARCODE = '0000000000000'; // standart shtrix-kod (nol)
export const AI_SHORT_MAX_TOKENS = 500;          // qisqa AI javob uchun token chegarasi

// ─── Taymautlar ───────────────────────────────────────────────────────────────
export const DEFAULT_TIMEOUT_MS = 5_000;
export const RETRY_DELAY_MS = 2_000;
export const POLL_INTERVAL_MS = 3_000;
export const LONG_TIMEOUT_MS = 30_000;
export const QUERY_TIMEOUT_MS = 60_000;

// ─── AI / LLM ─────────────────────────────────────────────────────────────────
export const AI_DEFAULT_MAX_TOKENS = 1_024;
export const AI_TOKENS_PER_UNIT = 1_000;
export const CLAUDE_DEFAULT_MODEL = 'claude-3-5-haiku-20241022';

// ─── HR — belgilar va jarima ballari ──────────────────────────────────────────
export const BADGE_POINTS_TOP_PERFORMER = 200;
export const BADGE_POINTS_DECADE_LOYALTY = 500;
export const HR_FINE_MINOR = '50000';

// ─── Auth / OTP ───────────────────────────────────────────────────────────────
export const OTP_MIN = 100_000; // 6 xonali OTP minimal qiymati
export const OTP_MAX_EXCLUSIVE = 1_000_000; // 6 xonali OTP eksklyuziv maksimum

// ─── Biznes domeniga oid chegaralar ───────────────────────────────────────────
export const CRM_LARGE_DEAL_THRESHOLD = 1_000_000; // UZS — yirik bitim chegarasi
export const FINANCE_RANDOM_REF_RANGE = 1_000_000; // vaqtincha ref ID oralig'i

// ─── Foizlar va koeffitsientlar ───────────────────────────────────────────────
export const PERCENT_MULTIPLIER = 100;
export const DECIMAL_PLACES = 2;

// ─── AI — token chegaralari ───────────────────────────────────────────────────
export const AI_MAX_TOKENS_STANDARD = 400;  // standart qisqa AI javob tokenlari
export const AI_MAX_TOKENS_MEDIUM = 1_200;  // o'rtacha AI javob tokenlari
export const AI_DAILY_LIMIT_HIGH = 2_000;   // kunlik so'rovlar chegarasi (yuqori)

// ─── Foiz hisoblash ──────────────────────────────────────────────────────────
export const PERCENT_BASIS = 10_000;        // 10000/100 → foiz ikki kasr bilan
export const ROUND_2DP_FACTOR = 100;        // Math.round(x * 100) / 100 → 2 kasr
export const ROUND_3DP_FACTOR = 1_000;      // Math.round(x * 1000) / 1000 → 3 kasr

// ─── Moliya: Fiskal yillar ───────────────────────────────────────────────────
export const FISCAL_YEAR_MIN = 2_000;       // moliya yil oralig'i, minimum
export const FISCAL_YEAR_MAX = 2_100;       // moliya yil oralig'i, maksimum
export const BUDGET_YEAR_MIN = 2_020;       // byudjet yil oralig'i, minimum
export const BUDGET_YEAR_MAX = 2_030;       // byudjet yil oralig'i, maksimum

// ─── Moliya: Valyuta kurslari (so'm) ─────────────────────────────────────────
export const RATE_USD_UZS = 12_700;         // 1 USD → UZS (taxminiy kurs)
export const RATE_EUR_UZS = 13_800;         // 1 EUR → UZS (taxminiy kurs)
export const RATE_CNY_UZS = 1_750;          // 1 CNY → UZS (taxminiy kurs)

// ─── Biznes: Miqdor chegaralari ──────────────────────────────────────────────
export const PO_MAX_AMOUNT_UZS = 50_000_000;          // Buyurtma max summasi
export const HR_SALARY_MEDIUM_UZS = 3_000_000;        // O'rtacha maosh chegarasi
export const DELIVERY_FREE_THRESHOLD_UZS = 500_000;   // Bepul yetkazib berish
export const DELIVERY_FEE_UZS = 25_000;               // Standart yetkazib berish
export const SENSOR_MAX_FETCH = 9_999;                // IoT sensor so'rovi limiti
export const QUOTATION_BASE_NUMBER = 100_000;         // SD taklifnoma bazaviy raqam
export const SIDECAR_PORT = 1_106;                    // Replit object storage port
export const MM_TO_PT_RATIO = 2.83_46;               // Millimetr → PostScript nuqta

// ─── Admin chegaralari ───────────────────────────────────────────────────────
export const MAX_USERS_DEFAULT = 400;       // standart foydalanuvchilar soni limiti

// ─── Kanban standartlari ─────────────────────────────────────────────────────
export const KANBAN_BATCH_FETCH = 1_000; // status bo'yicha kanban kartalar limiti
export const KANBAN_FLOWS_LIMIT = 100;   // oqimlar ro'yxati sahifalash limiti

// ─── Rekrutment standartlari ─────────────────────────────────────────────────
export const RECRUITMENT_LIST_LIMIT = 50; // rekrutment o'zakcha ro'yxat limiti

// ─── Tarmoq / HTTP ───────────────────────────────────────────────────────────
export const TELEGRAM_TIMEOUT_MS = 10_000; // Telegram HTTP so'rovi taymaut

// ─── Ma'lumotlar bazasi ─────────────────────────────────────────────────────
export const DB_POOL_MAX_CONNECTIONS = 10; // DB ulanish havzasi maksimal hajmi
