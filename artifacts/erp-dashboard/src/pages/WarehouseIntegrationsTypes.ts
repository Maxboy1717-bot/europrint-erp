/**
 * @module WarehouseIntegrationsTypes
 * @description Interfaces, types, and constants for WarehouseIntegrations.
 */

// ─── Domain interfaces ────────────────────────────────────────────────────────

export interface IntegrationSummary {
  pp: { ordersNeedingMaterials: number; label: { uz: string; ru: string } };
  mm: { pendingDeliveries: number; lowStockAlerts: number; label: { uz: string; ru: string } };
  fi: { recentTransactions: number; label: { uz: string; ru: string } };
}

export interface PendingDelivery {
  id: string;
  poNumber: string;
  vendorName: string;
  orderDate: string;
  deliveryDate: string;
  status: string;
  totalAmount: number;
  itemCount: number;
}

export interface ReorderSuggestion {
  id: string;
  kod: string;
  xomAshyo: string;
  currentStock: number;
  minStock: number;
  suggestedQuantity: number;
  estimatedCost: number;
  severity: "critical" | "high" | "medium";
  unitOfMeasure: string;
}

export interface StockValuation {
  totalValue: number;
  totalItems: number;
  valuationMethod: string;
  valuationDate: string;
  byCategory: Record<string, { totalValue: number; itemCount: number }>;
}

export type Lang = "uz" | "ru";

// ─── Translation constants ────────────────────────────────────────────────────

export const translations = {
  uz: {
    title: "Ombor Integratsiyalari",
    subtitle: "PP, MM va FI modullari bilan bog'lanish",
    languageToggle: "Tilni almashtirish",
    refresh: "Yangilash",
    pp: {
      title: "PP - Ishlab Chiqarish",
      description: "Buyurtmalar uchun materiallar boshqaruvi",
      ordersNeedingMaterials: "Material talab qiluvchi buyurtmalar",
      reserveMaterials: "Materiallarni zaxiralash",
      issueMaterials: "Ishlab chiqarishga berish",
      receiveGoods: "Tayyor mahsulot qabul qilish",
      noOrders: "Hozircha material talab qiluvchi buyurtmalar yo'q",
      viewDetails: "Batafsil ko'rish",
    },
    mm: {
      title: "MM - Taminot",
      description: "Xarid buyurtmalari va qayta buyurtma",
      pendingDeliveries: "Kutilayotgan yetkazib berishlar",
      reorderSuggestions: "Qayta buyurtma tavsiyalari",
      lowStockAlerts: "Kam qoldiq ogohlantirishlari",
      receiveFromPO: "POdan qabul qilish",
      createPO: "Yangi PO yaratish",
      noPending: "Kutilayotgan yetkazib berishlar yo'q",
      noSuggestions: "Qayta buyurtma tavsiyalari yo'q",
      critical: "Kritik",
      high: "Yuqori",
      medium: "O'rtacha",
    },
    fi: {
      title: "FI - Moliya",
      description: "Ombor qiymati va buxgalteriya",
      stockValuation: "Zaxira baholash",
      totalValue: "Jami qiymat",
      postMovements: "GL ga kiritish",
      inventoryVariance: "Inventarizatsiya farqlari",
      recentPostings: "So'nggi GL yozuvlari",
      postAll: "Hammasini kiritish",
      valuationMethod: "Baholash usuli",
      weightedAvg: "O'rtacha og'irlik",
      fifo: "FIFO",
    },
    status: {
      success: "Muvaffaqiyatli",
      error: "Xatolik",
      pending: "Kutilmoqda",
      ordered: "Buyurtma qilingan",
      approved: "Tasdiqlangan",
      received: "Qabul qilingan",
    },
  },
  ru: {
    title: "Интеграции Склада",
    subtitle: "Связь с модулями PP, MM и FI",
    languageToggle: "Переключить язык",
    refresh: "Обновить",
    pp: {
      title: "PP - Производство",
      description: "Управление материалами для заказов",
      ordersNeedingMaterials: "Заказы, требующие материалы",
      reserveMaterials: "Резервировать материалы",
      issueMaterials: "Выдать в производство",
      receiveGoods: "Принять готовую продукцию",
      noOrders: "Нет заказов, требующих материалы",
      viewDetails: "Подробнее",
    },
    mm: {
      title: "MM - Закупки",
      description: "Заказы на закупку и повторные заказы",
      pendingDeliveries: "Ожидающие поставки",
      reorderSuggestions: "Рекомендации по заказу",
      lowStockAlerts: "Предупреждения о низком запасе",
      receiveFromPO: "Принять из заказа",
      createPO: "Создать новый заказ",
      noPending: "Нет ожидающих поставок",
      noSuggestions: "Нет рекомендаций по заказу",
      critical: "Критический",
      high: "Высокий",
      medium: "Средний",
    },
    fi: {
      title: "FI - Финансы",
      description: "Оценка склада и бухгалтерия",
      stockValuation: "Оценка запасов",
      totalValue: "Общая стоимость",
      postMovements: "Провести в ГК",
      inventoryVariance: "Расхождения инвентаризации",
      recentPostings: "Последние проводки",
      postAll: "Провести все",
      valuationMethod: "Метод оценки",
      weightedAvg: "Средневзвешенный",
      fifo: "FIFO",
    },
    status: {
      success: "Успешно",
      error: "Ошибка",
      pending: "Ожидание",
      ordered: "Заказано",
      approved: "Одобрено",
      received: "Получено",
    },
  },
} as const;

export type Translations = typeof translations;
export type TranslationSet = Translations["uz"];

// ─── Color helpers ────────────────────────────────────────────────────────────

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case "critical": return "bg-red-500/20 text-red-400 border-red-500/40";
    case "high": return "bg-orange-500/20 text-orange-400 border-orange-500/40";
    case "medium": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/40";
    default: return "bg-gray-500/20 text-muted-foreground border-gray-500/40";
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "ordered":
    case "approved": return "bg-blue-500/20 text-blue-400 border-blue-500/40";
    case "received": return "bg-green-500/20 text-green-400 border-green-500/40";
    case "partial": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/40";
    default: return "bg-gray-500/20 text-muted-foreground border-gray-500/40";
  }
}
