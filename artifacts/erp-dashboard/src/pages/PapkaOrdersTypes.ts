/**
 * @module PapkaOrdersTypes
 * @description Types, constants and i18n strings for PapkaOrders.
 */

import { z } from "zod";

import { tLabel } from '@/lib/i18n/tLabel';
export const formSchema = z.object({
  papkaNo: z.string().min(1, "Papka raqami kiritilishi kerak"),
  mijozNomi: z.string().min(1, "Mijoz nomi kiritilishi kerak"),
  mahsulotNomi: z.string().min(1, "Mahsulot nomi kiritilishi kerak"),
  mahsulotTuri: z.string().optional(),
  tiraj: z.coerce.number().min(1, "Tiraj kiritilishi kerak"),
  listSoni: z.coerce.number().optional(),
  formatA: z.coerce.number().optional(),
  formatB: z.coerce.number().optional(),
  status: z.string().default("new"),
  sana: z.string().optional(),
  tayyorBolishSanasi: z.string().optional(),
  notes: z.string().optional(),
});

export type FormData = z.infer<typeof formSchema>;

export type Lang = "uz" | "ru";

export const STATUS_CONFIG: Record<string, { label: string; labelRu: string; className: string }> = {
  new: { label: tLabel('common.PapkaOrders.yangi', "Yangi"), labelRu: "Новый", className: "bg-primary/10 text-primary" },
  planning: { label: tLabel('common.PapkaOrders.rejalashtirish', "Rejalashtirish"), labelRu: "Планирование", className: "bg-amber-100 text-amber-800" },
  production: { label: tLabel('common.PapkaOrders.ishlabChiqarish', "Ishlab chiqarish"), labelRu: "Производство", className: "bg-blue-100 text-blue-800" },
  completed: { label: "Bajarildi", labelRu: "Завершен", className: "bg-green-100 text-green-800" },
  cancelled: { label: tLabel('common.PapkaOrders.bekorQilindi', "Bekor qilindi"), labelRu: "Отменен", className: "bg-red-100 text-red-800" },
};

export const TRANSLATIONS = {
  uz: {
    title: "Papka Buyurtmalari",
    addOrder: "Yangi Buyurtma",
    search: "Qidirish...",
    status: "Holati",
    all: "Hammasi",
    new: "Yangi",
    planning: "Rejalashtirish",
    production: "Ishlab chiqarish",
    completed: "Bajarildi",
    cancelled: "Bekor qilindi",
    papkaNo: "Papka №",
    product: "Mahsulot",
    client: "Mijoz",
    tiraj: "Tiraj",
    orderDate: "Buyurtma sanasi",
    deadline: "Tayyor bo'lish",
    actions: "Amallar",
    noOrders: "Buyurtmalar topilmadi",
    createOrder: "Yangi Buyurtma",
    editOrder: "Buyurtmani Tahrirlash",
    save: "Saqlash",
    cancel: "Bekor qilish",
    notes: "Izohlar",
    productType: "Mahsulot turi",
    format: "Format (A x B)",
    totalOrders: "Jami Buyurtmalar",
    activeOrders: "Faol Buyurtmalar",
    completedOrders: "Bajarilgan",
  },
  ru: {
    title: tLabel('common.PapkaOrders.untitled', "Заказы Папок"),
    addOrder: "Новый Заказ",
    search: "Поиск...",
    status: "Статус",
    all: "Все",
    new: "Новый",
    planning: "Планирование",
    production: "Производство",
    completed: "Завершенные",
    cancelled: "Отмененные",
    papkaNo: "Папка №",
    product: "Продукт",
    client: "Клиент",
    tiraj: "Тираж",
    orderDate: "Дата заказа",
    deadline: "Срок",
    actions: "Действия",
    noOrders: "Заказы не найдены",
    createOrder: "Новый Заказ",
    editOrder: "Редактировать Заказ",
    save: "Сохранить",
    cancel: "Отмена",
    notes: "Примечания",
    productType: "Тип продукта",
    format: "Формат (A x B)",
    totalOrders: "Всего Заказов",
    activeOrders: "Активных",
    completedOrders: "Завершенных",
  },
} as const;

export const DEFAULT_FORM_VALUES: FormData = {
  papkaNo: "",
  mijozNomi: "",
  mahsulotNomi: "",
  mahsulotTuri: "",
  tiraj: 0,
  listSoni: 0,
  formatA: 0,
  formatB: 0,
  status: "new",
  sana: new Date().toISOString().split("T")[0],
  tayyorBolishSanasi: "",
  notes: "",
};
