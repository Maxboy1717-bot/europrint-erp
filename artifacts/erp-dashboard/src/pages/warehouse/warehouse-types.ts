/**
 * @module warehouse-types
 * @description React page component. Route-level UI.
 */

import { z } from "zod";

export interface WarehouseData {
  id: string;
  code: string;
  name: string;
  nameRu?: string | null;
  type: string;
  location?: string | null;
  managerId?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface ZoneData {
  id: string;
  warehouseId: string;
  code: string;
  name: string;
  nameRu?: string | null;
  zoneType: string;
  capacity?: number | null;
  isActive: boolean;
  createdAt: string;
}

export interface BinData {
  id: string;
  zoneId: string;
  warehouseId: string;
  binCode: string;
  row?: string | null;
  shelf?: string | null;
  level?: string | null;
  binType: string;
  maxWeight?: number | null;
  maxVolume?: number | null;
  currentOccupancy: number;
  isActive: boolean;
  zoneName?: string;
  zoneCode?: string;
}

export interface TransferData {
  id: string;
  transferNumber: string;
  transferDate: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  status: string;
  totalItems: number;
  totalValue: number;
  notes?: string | null;
  createdAt: string;
  lines?: TransferLineData[];
}

export interface TransferLineData {
  id: string;
  materialCardId?: string;
  productId?: string;
  itemType: string;
  requestedQuantity: number;
  shippedQuantity?: number;
  receivedQuantity?: number;
  unitCost: number;
  totalCost: number;
  batchNumber?: string;
  expiryDate?: string;
  notes?: string;
  materialName?: string;
  materialCode?: string;
}

export interface MaterialCard {
  id: string;
  kod: string;
  xomAshyo: string;
  unitOfMeasure: string;
  unitPrice: number;
  currentStock: number;
}

export type Lang = "uz" | "ru";

export const translations = {
  uz: {
    title: "Ombor Katalogi",
    subtitle: "Omborlar, zonalar, binlar va ko'chirishlarni boshqarish",
    warehouses: "Omborlar",
    zones: "Zonalar",
    bins: "Binlar",
    transfers: "Ko'chirishlar",
    search: "Qidirish...",
    add: "Qo'shish",
    edit: "Tahrirlash",
    delete: "O'chirish",
    save: "Saqlash",
    cancel: "Bekor qilish",
    code: "Kod",
    name: "Nomi",
    nameRu: "Nomi (RU)",
    type: "Turi",
    location: "Manzil",
    status: "Holat",
    actions: "Amallar",
    active: "Faol",
    inactive: "Nofaol",
    capacity: "Sig'im",
    zoneType: "Zona turi",
    binCode: "Bin kodi",
    row: "Qator",
    shelf: "Tokcha",
    level: "Daraja",
    binType: "Bin turi",
    maxWeight: "Max og'irlik (kg)",
    maxVolume: "Max hajm (L)",
    occupancy: "Band bo'lish %",
    transferNumber: "Transfer №",
    date: "Sana",
    from: "Qayerdan",
    to: "Qayerga",
    items: "Elementlar",
    totalValue: "Umumiy qiymat",
    selectWarehouse: "Omborni tanlang",
    selectZone: "Zonani tanlang",
    allWarehouses: "Barcha omborlar",
    allZones: "Barcha zonalar",
    allStatuses: "Barcha holatlar",
    createWarehouse: "Ombor yaratish",
    editWarehouse: "Omborni tahrirlash",
    createZone: "Zona yaratish",
    editZone: "Zonani tahrirlash",
    createBin: "Bin yaratish",
    editBin: "Binni tahrirlash",
    createTransfer: "Ko'chirish yaratish",
    transferDetails: "Ko'chirish tafsilotlari",
    step1: "1-qadam: Omborlarni tanlash",
    step2: "2-qadam: Materiallarni qo'shish",
    next: "Keyingi",
    back: "Orqaga",
    submit: "Yuborish",
    sourceWarehouse: "Manba ombori",
    targetWarehouse: "Maqsad ombori",
    material: "Material",
    quantity: "Miqdor",
    addMaterial: "Material qo'shish",
    notes: "Izohlar",
    stats: {
      totalWarehouses: "Jami omborlar",
      totalMaterials: "Jami materiallar",
      stockValue: "Zaxira qiymati",
      lowStock: "Kam qoldiq",
    },
    warehouseTypes: {
      main: "Asosiy",
      raw_material: "Xom ashyo",
      finished_goods: "Tayyor mahsulot",
      transit: "Tranzit",
      semi_finished: "Yarim tayyor",
      defective: "Brak",
      quarantine: "Karantin",
      tools_equipment: "Asbob-uskuna",
      household_mro: "Xo'jalik",
      mro: "MRO",
      production: "Ishlab chiqarish ombori",
    },
    zoneTypes: {
      storage: "Saqlash",
      receiving: "Qabul qilish",
      shipping: "Jo'natish",
      staging: "Tayyorlash",
      quarantine: "Karantin",
    },
    binTypes: {
      standard: "Standart",
      bulk: "Ommaviy",
      cold: "Sovuq",
      hazardous: "Xavfli",
    },
    transferStatuses: {
      draft: "Qoralama",
      pending: "Kutilmoqda",
      in_transit: "Yo'lda",
      received: "Qabul qilindi",
      cancelled: "Bekor qilindi",
    },
  },
  ru: {
    title: "Каталог Складов",
    subtitle: "Управление складами, зонами, ячейками и перемещениями",
    warehouses: "Склады",
    zones: "Зоны",
    bins: "Ячейки",
    transfers: "Перемещения",
    search: "Поиск...",
    add: "Добавить",
    edit: "Изменить",
    delete: "Удалить",
    save: "Сохранить",
    cancel: "Отмена",
    code: "Код",
    name: "Название",
    nameRu: "Название (RU)",
    type: "Тип",
    location: "Адрес",
    status: "Статус",
    actions: "Действия",
    active: "Активен",
    inactive: "Неактивен",
    capacity: "Вместимость",
    zoneType: "Тип зоны",
    binCode: "Код ячейки",
    row: "Ряд",
    shelf: "Полка",
    level: "Уровень",
    binType: "Тип ячейки",
    maxWeight: "Макс. вес (кг)",
    maxVolume: "Макс. объём (Л)",
    occupancy: "Заполненность %",
    transferNumber: "№ перемещения",
    date: "Дата",
    from: "Откуда",
    to: "Куда",
    items: "Элементы",
    totalValue: "Общая стоимость",
    selectWarehouse: "Выберите склад",
    selectZone: "Выберите зону",
    allWarehouses: "Все склады",
    allZones: "Все зоны",
    allStatuses: "Все статусы",
    createWarehouse: "Создать склад",
    editWarehouse: "Изменить склад",
    createZone: "Создать зону",
    editZone: "Изменить зону",
    createBin: "Создать ячейку",
    editBin: "Изменить ячейку",
    createTransfer: "Создать перемещение",
    transferDetails: "Детали перемещения",
    step1: "Шаг 1: Выбор складов",
    step2: "Шаг 2: Добавление материалов",
    next: "Далее",
    back: "Назад",
    submit: "Отправить",
    sourceWarehouse: "Склад-источник",
    targetWarehouse: "Склад-назначение",
    material: "Материал",
    quantity: "Количество",
    addMaterial: "Добавить материал",
    notes: "Примечания",
    stats: {
      totalWarehouses: "Всего складов",
      totalMaterials: "Всего материалов",
      stockValue: "Стоимость запасов",
      lowStock: "Низкий остаток",
    },
    warehouseTypes: {
      main: "Основной",
      raw_material: "Сырьё",
      finished_goods: "Готовая продукция",
      transit: "Транзит",
      semi_finished: "Полуфабрикаты",
      defective: "Брак",
      quarantine: "Карантин",
      tools_equipment: "Инструменты/Оборудование",
      household_mro: "Хозяйство",
      mro: "MRO",
      production: "Производственный склад",
    },
    zoneTypes: {
      storage: "Хранение",
      receiving: "Приём",
      shipping: "Отправка",
      staging: "Подготовка",
      quarantine: "Карантин",
    },
    binTypes: {
      standard: "Стандартный",
      bulk: "Насыпной",
      cold: "Холодный",
      hazardous: "Опасный",
    },
    transferStatuses: {
      draft: "Черновик",
      pending: "Ожидает",
      in_transit: "В пути",
      received: "Получено",
      cancelled: "Отменено",
    },
  },
};

export type Translations = typeof translations.uz;

export const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-500/20 text-gray-400 border-gray-500/40",
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  in_transit: "bg-blue-500/20 text-blue-400 border-blue-500/40",
  received: "bg-green-500/20 text-green-400 border-green-500/40",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/40",
};


export const warehouseSchema = z.object({
  code: z.string().min(1, "Kod majburiy"),
  name: z.string().min(1, "Nom majburiy"),
  nameRu: z.string().optional(),
  type: z.string().min(1, "Tur majburiy"),
  location: z.string().optional(),
  isActive: z.boolean(),
});

export const zoneSchema = z.object({
  warehouseId: z.string().min(1, "Ombor majburiy"),
  code: z.string().min(1, "Kod majburiy"),
  name: z.string().min(1, "Nom majburiy"),
  nameRu: z.string().optional(),
  zoneType: z.string().min(1, "Zona turi majburiy"),
  capacity: z.number().optional(),
  isActive: z.boolean(),
});

export const binSchema = z.object({
  warehouseId: z.string().min(1, "Ombor majburiy"),
  zoneId: z.string().min(1, "Zona majburiy"),
  binCode: z.string().min(1, "Bin kodi majburiy"),
  row: z.string().optional(),
  shelf: z.string().optional(),
  level: z.string().optional(),
  binType: z.string().min(1, "Bin turi majburiy"),
  maxWeight: z.number().optional(),
  maxVolume: z.number().optional(),
  isActive: z.boolean(),
});

export type WarehouseFormData = z.infer<typeof warehouseSchema>;
export type ZoneFormData = z.infer<typeof zoneSchema>;
export type BinFormData = z.infer<typeof binSchema>;
