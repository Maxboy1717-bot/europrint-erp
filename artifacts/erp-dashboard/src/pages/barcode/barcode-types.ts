/**
 * @module barcode-types
 * @description React page component. Route-level UI.
 */

import { z } from "zod";

import { tLabel } from '@/lib/i18n/tLabel';
export interface BatchData {
  id: string;
  batchNumber: string;
  materialCardId: string | null;
  warehouseId: string | null;
  quantity: number;
  remainingQuantity: number;
  unitCost: number | null;
  productionDate: string | null;
  expiryDate: string | null;
  supplierId: string | null;
  supplierBatchNumber: string | null;
  goodsReceiptId: string | null;
  qcStatus: string | null;
  barcode: string | null;
  status: string | null;
  notes: string | null;
  createdAt: string;
  materialName?: string | null;
  materialCode?: string | null;
  warehouseName?: string | null;
}

export interface MaterialCard {
  id: string;
  kod: string;
  xomAshyo: string;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
}

export interface ScanResult {
  entityType: string;
  entityData: Record<string, unknown>;
  barcode: string;
  action?: string;
  suggestedActions: Record<string, { uz: string; ru: string; enabled: boolean }>;
  message: { uz: string; ru: string };
}

export interface BatchStats {
  activeBatches: number;
  expiringBatches: number;
  totalQuantity: number;
  totalValue: number;
}

export interface PrintData {
  type: string;
  id: string;
  batchNumber?: string;
  materialName: string;
  materialCode: string;
  warehouseName?: string;
  quantity?: number;
  remainingQuantity?: number;
  unitOfMeasure?: string;
  productionDate?: string;
  expiryDate?: string;
  barcode: string;
  barcodeDisplay: string;
  qrCode?: string;
  printedAt: string;
  labels: {
    uz: Record<string, string>;
    ru: Record<string, string>;
  };
}

export const translations = {
  uz: {
    title: "Shtrix-kod Tizimi",
    subtitle: tLabel('common.barcode-.partiyalarShtrixKodYaratishVa', "Partiyalar, shtrix-kod yaratish va skaner"),
    batches: "Partiyalar",
    generate: "Shtrix-kod yaratish",
    scanner: "Skaner",
    search: "Qidirish...",
    add: "Qo'shish",
    edit: "Tahrirlash",
    view: "Ko'rish",
    save: "Saqlash",
    cancel: "Bekor qilish",
    copy: "Nusxalash",
    print: "Chop etish",
    generate_btn: "Yaratish",
    scan: "Skanerlash",
    batchNumber: "Partiya №",
    material: "Material",
    warehouse: "Ombor",
    quantity: "Miqdor",
    remaining: "Qoldiq",
    productionDate: "Ishlab chiqarilgan",
    expiryDate: "Yaroqlilik muddati",
    qcStatus: "QC holati",
    status: "Status",
    actions: "Amallar",
    createBatch: "Partiya yaratish",
    editBatch: "Partiyani tahrirlash",
    batchDetails: "Partiya tafsilotlari",
    entityType: "Element turi",
    selectEntity: "Elementni tanlang",
    barcodeGenerated: "Yaratilgan shtrix-kod",
    scanInput: "Shtrix-kodni kiriting yoki skanerlang",
    actionType: "Amal turi",
    receive: "Qabul",
    issue: "Chiqim",
    move: "Ko'chirish",
    count: "Inventar",
    lookupResult: "Natija",
    notFound: "Topilmadi",
    types: {
      batch: "Partiya",
      material: "Material",
      bin: "Bin",
      kit: "Kit"
    },
    statuses: {
      active: "Faol",
      depleted: "Tugagan",
      blocked: "Bloklangan",
      expired: "Muddati o'tgan"
    },
    qcStatuses: {
      pending: "Kutilmoqda",
      approved: "Tasdiqlangan",
      rejected: "Rad etilgan"
    },
    unitCost: "Narxi",
    supplierBatch: "Yetkazib beruvchi partiyasi",
    notes: "Izohlar",
    selectMaterial: "Materialni tanlang",
    selectWarehouse: "Omborni tanlang",
    allMaterials: "Barcha materiallar",
    allWarehouses: "Barcha omborlar",
    allStatuses: "Barcha statuslar",
    stats: {
      activeBatches: "Faol partiyalar",
      expiringSoon: "Muddati tugayotgan",
      totalQuantity: "Jami miqdor",
      totalValue: "Jami qiymat"
    },
    bulkGenerate: "Ommaviy yaratish",
    selectMultiple: "Bir nechta tanlang",
    printPreview: "Chop etish ko'rinishi",
    close: "Yopish",
    selectedCount: "Tanlangan",
    labelPrint: "Label chop etish",
    labelFormat: "Format",
    labelCopies: "Nusxalar soni",
    labelSentToPrinter: "Printerga yuborildi",
    labelDownloadPdf: "PDF yuklab olish",
    labelCopyZpl: "ZPL nusxalash",
    labelCopyEpl: "EPL nusxalash",
    labelPrinting: "Chop etilmoqda...",
    printerNotConfigured: "Printer sozlanmagan (sozlamalardan qo'shing)",
    printerSettings: "Printer sozlamalari",
    printerIp: "Printer IP manzili",
    printerPort: "Port",
    printerFormat: "Format",
    printerName: "Printer nomi",
    printerSave: "Saqlash",
    printerTest: "Test",
    settings: "Sozlamalar",
  },
  ru: {
    title: tLabel('common.barcode-.untitled', "Система Штрих-кодов"),
    subtitle: tLabel('common.barcode-.untitled', "Партии, генерация штрих-кодов и сканер"),
    batches: "Партии",
    generate: "Генерация штрих-кода",
    scanner: "Сканер",
    search: "Поиск...",
    add: "Добавить",
    edit: "Изменить",
    view: "Просмотр",
    save: "Сохранить",
    cancel: "Отмена",
    copy: "Копировать",
    print: "Печать",
    generate_btn: "Создать",
    scan: "Сканировать",
    batchNumber: "№ Партии",
    material: "Материал",
    warehouse: "Склад",
    quantity: "Количество",
    remaining: "Остаток",
    productionDate: "Дата производства",
    expiryDate: "Срок годности",
    qcStatus: "Статус QC",
    status: "Статус",
    actions: "Действия",
    createBatch: "Создать партию",
    editBatch: "Изменить партию",
    batchDetails: "Детали партии",
    entityType: "Тип элемента",
    selectEntity: "Выберите элемент",
    barcodeGenerated: "Сгенерированный штрих-код",
    scanInput: "Введите или отсканируйте штрих-код",
    actionType: "Тип действия",
    receive: "Приём",
    issue: "Расход",
    move: "Перемещение",
    count: "Инвентаризация",
    lookupResult: "Результат",
    notFound: "Не найдено",
    types: {
      batch: "Партия",
      material: "Материал",
      bin: "Ячейка",
      kit: "Комплект"
    },
    statuses: {
      active: "Активная",
      depleted: "Израсходована",
      blocked: "Заблокирована",
      expired: "Просрочена"
    },
    qcStatuses: {
      pending: "Ожидает",
      approved: "Одобрено",
      rejected: "Отклонено"
    },
    unitCost: "Цена",
    supplierBatch: "Партия поставщика",
    notes: "Примечания",
    selectMaterial: "Выберите материал",
    selectWarehouse: "Выберите склад",
    allMaterials: "Все материалы",
    allWarehouses: "Все склады",
    allStatuses: "Все статусы",
    stats: {
      activeBatches: "Активные партии",
      expiringSoon: "Срок истекает",
      totalQuantity: "Общее кол-во",
      totalValue: "Общая стоимость"
    },
    bulkGenerate: "Массовая генерация",
    selectMultiple: "Выберите несколько",
    printPreview: "Предпросмотр печати",
    close: "Закрыть",
    selectedCount: "Выбрано",
    labelPrint: "Печать этикетки",
    labelFormat: "Формат",
    labelCopies: "Количество копий",
    labelSentToPrinter: "Отправлено на принтер",
    labelDownloadPdf: "Скачать PDF",
    labelCopyZpl: "Копировать ZPL",
    labelCopyEpl: "Копировать EPL",
    labelPrinting: "Печать...",
    printerNotConfigured: "Принтер не настроен (добавьте в настройках)",
    printerSettings: "Настройки принтера",
    printerIp: "IP-адрес принтера",
    printerPort: "Порт",
    printerFormat: "Формат",
    printerName: "Имя принтера",
    printerSave: "Сохранить",
    printerTest: "Тест",
    settings: "Настройки",
  }
};

export const batchFormSchema = z.object({
  batchNumber: z.string().min(1, "Partiya raqamini kiriting").max(100, "Partiya raqami 100 belgidan oshmasligi kerak"),
  materialCardId: z.string(),
  warehouseId: z.string(),
  quantity: z.number().min(0, "Miqdor 0 dan kam bo'lmasligi kerak"),
  remainingQuantity: z.number().min(0, "Qoldiq miqdor 0 dan kam bo'lmasligi kerak"),
  unitCost: z.number().min(0, "Narx 0 dan kam bo'lmasligi kerak"),
  productionDate: z.string(),
  expiryDate: z.string(),
  supplierBatchNumber: z.string().max(100, "Yetkazib beruvchi partiyasi 100 belgidan oshmasligi kerak"),
  qcStatus: z.string().min(1, "QC holatini tanlang"),
  status: z.string().min(1, "Statusni tanlang"),
  notes: z.string().max(1000, "Izoh 1000 belgidan oshmasligi kerak"),
});

export const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500/20 text-green-400 border-green-500/40",
  depleted: "bg-gray-500/20 text-muted-foreground border-gray-500/40",
  blocked: "bg-red-500/20 text-red-400 border-red-500/40",
  expired: "bg-orange-500/20 text-orange-400 border-orange-500/40",
};

export const QC_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  approved: "bg-green-500/20 text-green-400 border-green-500/40",
  rejected: "bg-red-500/20 text-red-400 border-red-500/40",
};