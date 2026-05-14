/**
 * @module PlanningBoardTypes
 * @description Shared types, interfaces, and constants for PlanningBoard.
 * No JSX — pure TypeScript.
 */

// Re-export shared planning domain types so consumers only need one import.
export type {
  PlanningOperation,
  PapkaOrder,
  PapkaOrdersResponse,
  Equipment,
  WorkCenter,
  ProductionPlanRow,
  ProductionFactRow,
  ScheduleEntry,
  MRPRun,
  MRPResult,
  PurchaseRequisition,
  Product,
  PlanningTranslations,
} from "./planning/planning-types";

// ---------------------------------------------------------------------------
// Local filter / form state shapes
// ---------------------------------------------------------------------------

export interface PlanningFilters {
  papkaNo: string;
  status: string;
  startDate: string;
  endDate: string;
}

export interface PlanningRunForm {
  runName: string;
  planningHorizon: number;
  includeSafetyStock: boolean;
  description: string;
}

// ---------------------------------------------------------------------------
// Translation builder
// ---------------------------------------------------------------------------

export function buildTranslations(lang: "uz" | "ru") {
  return {
    title: lang === "uz" ? "Ishlab chiqarishni rejalashtirish" : "Планирование производства",
    subtitle: lang === "uz" ? "Barcha PP funksiyalari bitta joyda" : "Все функции PP в одном месте",
    operationsTab: lang === "uz" ? "Operatsiyalar" : "Операции",
    scheduleTab: lang === "uz" ? "Jadval" : "График",
    plansTab: lang === "uz" ? "Rejalar" : "Планы",
    factsTab: lang === "uz" ? "Hisobotlar" : "Отчёты",
    planVsFactTab: lang === "uz" ? "Plan vs Fact" : "План vs Факт",
    mrpTab: lang === "uz" ? "MRP" : "MRP",
    addOperation: lang === "uz" ? "Operatsiya qo'shish" : "Добавить операцию",
    filters: lang === "uz" ? "Filtrlar" : "Фильтры",
    papkaNo: lang === "uz" ? "Papka №" : "Папка №",
    status: lang === "uz" ? "Holat" : "Статус",
    dateRange: lang === "uz" ? "Sana oralig'i" : "Диапазон дат",
    all: lang === "uz" ? "Barchasi" : "Все",
    planned: lang === "uz" ? "Rejalashtirilgan" : "Запланировано",
    inProgress: lang === "uz" ? "Jarayonda" : "В процессе",
    completed: lang === "uz" ? "Yakunlangan" : "Завершено",
    cancelled: lang === "uz" ? "Bekor qilingan" : "Отменено",
    operationNo: lang === "uz" ? "Operatsiya kodi" : "Код операции",
    workCenter: lang === "uz" ? "Dastgoh" : "Станок",
    plannedQty: lang === "uz" ? "Reja miqdori" : "План кол-во",
    plannedStart: lang === "uz" ? "Boshlanish" : "Начало",
    plannedEnd: lang === "uz" ? "Tugash" : "Конец",
    actions: lang === "uz" ? "Amallar" : "Действия",
    edit: lang === "uz" ? "Tahrirlash" : "Редактировать",
    save: lang === "uz" ? "Saqlash" : "Сохранить",
    cancel: lang === "uz" ? "Bekor qilish" : "Отмена",
    createTitle: lang === "uz" ? "Yangi operatsiya" : "Новая операция",
    editTitle: lang === "uz" ? "Operatsiyani tahrirlash" : "Редактировать операцию",
    createPlan: lang === "uz" ? "Reja yaratish" : "Создать план",
    addFact: lang === "uz" ? "Hisobot kiritish" : "Добавить отчёт",
    newMRPRun: lang === "uz" ? "Yangi MRP Run" : "Новый MRP Run",
    exportExcel: lang === "uz" ? "Excel export" : "Экспорт Excel",
    loading: lang === "uz" ? "Yuklanmoqda..." : "Загрузка...",
    noData: lang === "uz" ? "Ma'lumot topilmadi" : "Данные не найдены",
    totalRuns: lang === "uz" ? "Jami Run'lar" : "Всего Run",
    purchaseReqs: lang === "uz" ? "Xarid talablari" : "Заявки на закупку",
    materialReqs: lang === "uz" ? "Material talablari" : "Потребности материалов",
    calculate: lang === "uz" ? "Hisoblash" : "Рассчитать",
    results: lang === "uz" ? "Natijalar" : "Результаты",
  } as const;
}

export type PlanningTranslationMap = ReturnType<typeof buildTranslations>;

// ---------------------------------------------------------------------------
// CSV export helper (pure utility, no JSX)
// ---------------------------------------------------------------------------

export function exportOperationsCSV(
  operationsData: { operations?: Record<string, unknown>[]; items?: Record<string, unknown>[] } | undefined
) {
  const ops = operationsData?.operations || operationsData || [];
  const rows = (Array.isArray(ops) ? ops : []).map((o) =>
    [
      o["operationCode"],
      o["operationName"],
      o["plannedDate"],
      o["plannedStartTime"],
      o["plannedEndTime"],
      o["plannedQuantity"],
      o["status"],
    ].join(",")
  );
  const csv = ["Code,Name,Date,Start,End,Quantity,Status", ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "planning-operations.csv";
  a.click();
  URL.revokeObjectURL(url);
}
