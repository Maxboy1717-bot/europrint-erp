// i18next — WMS report type labels are translation data

import { tLabel } from '@/lib/i18n/tLabel';
/**
 * @module types
 * @description React UI component.
 */

export interface StockBalanceItem extends Record<string, unknown> {
  materialId: string;
  name: string;
  code: string;
  currentStock: number;
  minStock: number;
  value: number;
  unitOfMeasure: string;
  status: string;
}

export interface StockBalanceData {
  data: StockBalanceItem[];
  summary: {
    totalMaterials: number;
    totalValue: number;
    lowStockCount: number;
    criticalCount: number;
  };
}

export interface TurnoverItem extends Record<string, unknown> {
  materialId: string;
  name: string;
  openingStock: number;
  totalIn: number;
  totalOut: number;
  closingStock: number;
  turnoverRate: number;
}

export interface TurnoverData {
  data: TurnoverItem[];
  summary: {
    averageTurnover: number;
    fastMovers: number;
    slowMovers: number;
  };
}

export interface AbcItem extends Record<string, unknown> {
  materialId: string;
  name: string;
  totalValue: number;
  percentage: number;
  cumulativePercentage: number;
  class: string;
  xyz: string;
}

export interface AbcData {
  data: AbcItem[];
  summary: {
    classA: number;
    classB: number;
    classC: number;
  };
}

export interface AgingItem {
  materialId: string;
  name: string;
  lastMovementDate?: string;
  daysWithoutMovement: number;
  currentStock: number;
  value: number;
  unitOfMeasure: string;
  category: string;
}

export interface AgingData {
  data: AgingItem[];
  summary: {
    activePercent: number;
    activeCount: number;
    slowPercent: number;
    slowCount: number;
    obsoletePercent: number;
    obsoleteCount: number;
  };
}

export interface ExpiryItem {
  materialId: string;
  name: string;
  batchNumber: string;
  expiryDate?: string;
  daysToExpiry: number;
  quantity: number;
  value: number;
  unitOfMeasure: string;
  status: string;
}

export interface ExpiryData {
  data: ExpiryItem[];
  summary: {
    totalItems: number;
    expiredCount: number;
    criticalCount: number;
    totalAtRiskValue: number;
  };
}

export type Lang = "uz" | "uz-cyr" | "ru";

export interface TranslationType {
  title: string;
  subtitle: string;
  tabs: {
    stockBalance: string;
    turnover: string;
    abcAnalysis: string;
    aging: string;
    expiry: string;
  };
  stockBalance: {
    title: string;
    material: string;
    code: string;
    warehouse: string;
    currentStock: string;
    minStock: string;
    value: string;
    status: string;
    totalMaterials: string;
    totalValue: string;
    lowStockCount: string;
    criticalCount: string;
    normal: string;
    low: string;
    critical: string;
    lowStockOnly: string;
    top10ByValue: string;
  };
  turnover: {
    title: string;
    material: string;
    opening: string;
    inflow: string;
    outflow: string;
    closing: string;
    rate: string;
    avgTurnover: string;
    fastMovers: string;
    slowMovers: string;
    dateRange: string;
    from: string;
    to: string;
  };
  abc: {
    title: string;
    material: string;
    totalValue: string;
    percentage: string;
    cumulative: string;
    class: string;
    xyz: string;
    period: string;
    classA: string;
    classB: string;
    classC: string;
    distribution: string;
  };
  aging: {
    title: string;
    material: string;
    lastMovement: string;
    days: string;
    stock: string;
    value: string;
    category: string;
    active: string;
    slow: string;
    obsolete: string;
    threshold: string;
    activePercent: string;
    slowPercent: string;
    obsoletePercent: string;
  };
  expiry: {
    title: string;
    material: string;
    batch: string;
    expiryDate: string;
    daysLeft: string;
    quantity: string;
    value: string;
    status: string;
    ok: string;
    warning: string;
    critical: string;
    expired: string;
    daysAhead: string;
    expiredCount: string;
    atRiskValue: string;
  };
  common: {
    export: string;
    refresh: string;
    category: string;
    allCategories: string;
    loading: string;
    noData: string;
    sum: string;
  };
}

export const translations: Record<Lang, TranslationType> = {
  uz: {
    title: "Ombor Hisobotlari",
    subtitle: "Zaxira, aylanma va tahlil hisobotlari",
    tabs: {
      stockBalance: "Qoldiq",
      turnover: "Aylanma",
      abcAnalysis: "ABC/XYZ",
      aging: "Eskirish",
      expiry: "Muddat",
    },
    stockBalance: {
      title: "Qoldiq hisoboti",
      material: "Material",
      code: "Kod",
      warehouse: "Ombor",
      currentStock: "Joriy qoldiq",
      minStock: "Min qoldiq",
      value: "Qiymat",
      status: "Holat",
      totalMaterials: "Jami materiallar",
      totalValue: "Jami qiymat",
      lowStockCount: "Kam qoldiq",
      criticalCount: "Kritik",
      normal: "Normal",
      low: "Kam",
      critical: "Kritik",
      lowStockOnly: "Faqat kam qoldiqlar",
      top10ByValue: "Qiymat bo'yicha top 10",
    },
    turnover: {
      title: "Aylanma hisoboti",
      material: "Material",
      opening: "Boshlanish",
      inflow: "Kirim",
      outflow: "Chiqim",
      closing: "Tugash",
      rate: "Aylanma koef.",
      avgTurnover: "O'rtacha aylanma",
      fastMovers: "Tez aylanadigan",
      slowMovers: "Sekin aylanadigan",
      dateRange: "Davr",
      from: "Dan",
      to: "Gacha",
    },
    abc: {
      title: "ABC/XYZ tahlili",
      material: "Material",
      totalValue: "Jami qiymat",
      percentage: "Foiz",
      cumulative: "Yig'ma foiz",
      class: "Sinf",
      xyz: "XYZ",
      period: "Davr (kunlar)",
      classA: "A sinf",
      classB: "B sinf",
      classC: "C sinf",
      distribution: "ABC taqsimoti",
    },
    aging: {
      title: "Eskirish hisoboti",
      material: "Material",
      lastMovement: "Oxirgi harakat",
      days: "Kunlar",
      stock: "Qoldiq",
      value: "Qiymat",
      category: "Kategoriya",
      active: "Faol",
      slow: "Sekin",
      obsolete: "Eskirgan",
      threshold: "Chegara (kunlar)",
      activePercent: "Faol %",
      slowPercent: "Sekin %",
      obsoletePercent: "Eskirgan %",
    },
    expiry: {
      title: "Muddat kuzatuvi",
      material: "Material",
      batch: "Partiya",
      expiryDate: "Yaroqlilik muddati",
      daysLeft: "Qolgan kunlar",
      quantity: "Miqdor",
      value: "Qiymat",
      status: "Holat",
      ok: "Yaxshi",
      warning: "Ogohlantirish",
      critical: "Kritik",
      expired: "Muddati o'tgan",
      daysAhead: "Kunlar oldin",
      expiredCount: "Muddati o'tgan",
      atRiskValue: "Xavf ostida qiymat",
    },
    common: {
      export: "Eksport",
      refresh: "Yangilash",
      category: "Kategoriya",
      allCategories: "Barcha kategoriyalar",
      loading: "Yuklanmoqda...",
      noData: "Ma'lumot topilmadi",
      sum: "UZS",
    },
  },
  'uz-cyr': {
    title: "Омбор Ҳисоботлари",
    subtitle: "Захира, айланма ва таҳлил ҳисоботлари",
    tabs: {
      stockBalance: "Қолдиқ",
      turnover: "Айланма",
      abcAnalysis: "АБС/ХЙЗ",
      aging: "Ескириш",
      expiry: "Муддат",
    },
    stockBalance: {
      title: "Қолдиқ ҳисоботи",
      material: "Материал",
      code: "Код",
      warehouse: "Омбор",
      currentStock: "Жорий қолдиқ",
      minStock: "Мин қолдиқ",
      value: "Қиймат",
      status: "Ҳолат",
      totalMaterials: "Жами материаллар",
      totalValue: "Жами қиймат",
      lowStockCount: "Кам қолдиқ",
      criticalCount: "Критик",
      normal: "Нормал",
      low: "Кам",
      critical: "Критик",
      lowStockOnly: "Фақат кам қолдиқлар",
      top10ByValue: "Қиймат бўйича топ 10",
    },
    turnover: {
      title: "Айланма ҳисоботи",
      material: "Материал",
      opening: "Бошланиш",
      inflow: "Кирим",
      outflow: "Чиқим",
      closing: "Тугаш",
      rate: "Айланма коеф.",
      avgTurnover: "Ўртача айланма",
      fastMovers: "Тез айланадиган",
      slowMovers: "Секин айланадиган",
      dateRange: "Давр",
      from: "Дан",
      to: "Гача",
    },
    abc: {
      title: "АБС/ХЙЗ таҳлили",
      material: "Материал",
      totalValue: "Жами қиймат",
      percentage: "Фоиз",
      cumulative: "Йиғма фоиз",
      class: "Синф",
      xyz: "ХЙЗ",
      period: "Давр (кунлар)",
      classA: "А синф",
      classB: "Б синф",
      classC: "С синф",
      distribution: "АБС тақсимоти",
    },
    aging: {
      title: "Ескириш ҳисоботи",
      material: "Материал",
      lastMovement: "Охирги ҳаракат",
      days: "Кунлар",
      stock: "Қолдиқ",
      value: "Қиймат",
      category: "Категория",
      active: "Фаол",
      slow: "Секин",
      obsolete: "Ескирган",
      threshold: "Чегара (кунлар)",
      activePercent: "Фаол %",
      slowPercent: "Секин %",
      obsoletePercent: "Ескирган %",
    },
    expiry: {
      title: "Муддат кузатуви",
      material: "Материал",
      batch: "Партия",
      expiryDate: "Яроқлилик муддати",
      daysLeft: "Қолган кунлар",
      quantity: "Миқдор",
      value: "Қиймат",
      status: "Ҳолат",
      ok: "Яхши",
      warning: "Огоҳлантириш",
      critical: "Критик",
      expired: "Муддати ўтган",
      daysAhead: "Кунлар олдин",
      expiredCount: "Муддати ўтган",
      atRiskValue: "Хавф остида қиймат",
    },
    common: {
      export: "Експорт",
      refresh: "Янгилаш",
      category: "Категория",
      allCategories: "Барча категориялар",
      loading: "Юкланмоқда...",
      noData: "Маълумот топилмади",
      sum: "УЗС",
    },
  },
  ru: {
    title: tLabel('warehouse..untitled', "Складские Отчёты"),
    subtitle: tLabel('warehouse..untitled', "Отчёты по остаткам, оборачиваемости и анализу"),
    tabs: {
      stockBalance: "Остатки",
      turnover: "Оборот",
      abcAnalysis: "ABC/XYZ",
      aging: "Старение",
      expiry: "Сроки",
    },
    stockBalance: {
      title: tLabel('warehouse..untitled', "Отчёт по остаткам"),
      material: "Материал",
      code: "Код",
      warehouse: "Склад",
      currentStock: "Текущий остаток",
      minStock: "Мин. остаток",
      value: "Стоимость",
      status: "Статус",
      totalMaterials: "Всего материалов",
      totalValue: "Общая стоимость",
      lowStockCount: "Низкий остаток",
      criticalCount: "Критичный",
      normal: "Норма",
      low: "Низкий",
      critical: "Критичный",
      lowStockOnly: "Только низкие остатки",
      top10ByValue: "Топ 10 по стоимости",
    },
    turnover: {
      title: tLabel('warehouse..untitled', "Отчёт по оборачиваемости"),
      material: "Материал",
      opening: "Начало",
      inflow: "Приход",
      outflow: "Расход",
      closing: "Конец",
      rate: "Коэф. оборота",
      avgTurnover: "Средний оборот",
      fastMovers: "Быстрооборачиваемые",
      slowMovers: "Медленнооборачиваемые",
      dateRange: "Период",
      from: "От",
      to: "До",
    },
    abc: {
      title: tLabel('warehouse..abcXyz', "ABC/XYZ анализ"),
      material: "Материал",
      totalValue: "Общая стоимость",
      percentage: "Процент",
      cumulative: "Накопительный %",
      class: "Класс",
      xyz: "XYZ",
      period: "Период (дни)",
      classA: "Класс A",
      classB: "Класс B",
      classC: "Класс C",
      distribution: "Распределение ABC",
    },
    aging: {
      title: tLabel('warehouse..untitled', "Отчёт по старению"),
      material: "Материал",
      lastMovement: "Последнее движение",
      days: "Дни",
      stock: "Остаток",
      value: "Стоимость",
      category: "Категория",
      active: "Активный",
      slow: "Медленный",
      obsolete: "Устаревший",
      threshold: "Порог (дни)",
      activePercent: "Активные %",
      slowPercent: "Медленные %",
      obsoletePercent: "Устаревшие %",
    },
    expiry: {
      title: tLabel('warehouse..untitled', "Контроль сроков"),
      material: "Материал",
      batch: "Партия",
      expiryDate: "Срок годности",
      daysLeft: "Осталось дней",
      quantity: "Количество",
      value: "Стоимость",
      status: "Статус",
      ok: "ОК",
      warning: "Предупреждение",
      critical: "Критичный",
      expired: "Просрочен",
      daysAhead: "Дней вперёд",
      expiredCount: "Просрочено",
      atRiskValue: "Под риском",
    },
    common: {
      export: "Экспорт",
      refresh: "Обновить",
      category: "Категория",
      allCategories: "Все категории",
      loading: "Загрузка...",
      noData: "Данные не найдены",
      sum: "UZS",
    },
  },
};

export const STATUS_COLORS = {
  normal: "bg-green-500/20 text-green-400 border-green-500/40",
  low: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  critical: "bg-red-500/20 text-red-400 border-red-500/40",
  active: "bg-green-500/20 text-green-400 border-green-500/40",
  slow: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  obsolete: "bg-red-500/20 text-red-400 border-red-500/40",
  ok: "bg-green-500/20 text-green-400 border-green-500/40",
  warning: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  expired: "bg-red-500/20 text-red-400 border-red-500/40",
};

export const ABC_COLORS = {
  A: "#22c55e",
  B: "#eab308",
  C: "#ef4444",
};

export const PIE_COLORS = ["#22c55e", "#eab308", "#ef4444"];
