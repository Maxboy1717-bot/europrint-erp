/**
 * @module cameras-management-types
 * @description Interfaces, Zod validation schema, derived types, and
 *              i18n translation helpers for the Cameras Management page.
 *              No JSX — safe to import from both .ts and .tsx files.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Domain interfaces
// ---------------------------------------------------------------------------

export interface CameraData {
  id: string;
  code: string;
  name: string;
  nameRu: string | null;
  rtspUrl: string | null;
  ipAddress: string | null;
  port: number | null;
  username: string | null;
  password: string | null;
  workCenterId: string | null;
  location: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface WorkCenter {
  id: string;
  code: string;
  name: string;
}

// ---------------------------------------------------------------------------
// Form schema (Zod)
// ---------------------------------------------------------------------------

export const cameraFormSchema = z.object({
  code: z.string().min(1, "Kamera kodi kerak"),
  name: z.string().min(2, "Nom kamida 2 ta belgidan iborat bo'lishi kerak"),
  nameRu: z.string().optional(),
  rtspUrl: z.string().optional(),
  ipAddress: z.string().optional(),
  port: z.number().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  workCenterId: z.string().optional(),
  location: z.string().optional(),
  isActive: z.boolean().default(true)
});

export type CameraFormData = z.infer<typeof cameraFormSchema>;

// ---------------------------------------------------------------------------
// i18n translations
// ---------------------------------------------------------------------------

export type Language = "uz" | "ru";

export function buildTranslations(language: Language) {
  const uz = language === "uz";
  return {
    title:            uz ? "Kameralar Boshqaruvi"                         : "Управление камерами",
    subtitle:         uz ? "Kameralarni qo'shish, tahrirlash va boshqarish": "Добавление, редактирование и управление камерами",
    addCamera:        uz ? "Kamera qo'shish"                               : "Добавить камеру",
    editCamera:       uz ? "Kamerani tahrirlash"                           : "Редактировать камеру",
    code:             uz ? "Kod"                                           : "Код",
    name:             uz ? "Nomi"                                          : "Название",
    nameRu:           uz ? "Nomi (rus)"                                    : "Название (рус)",
    location:         uz ? "Joylashuv"                                     : "Местоположение",
    ipAddress:        uz ? "IP manzil"                                     : "IP адрес",
    rtspUrl:          uz ? "RTSP URL"                                      : "RTSP URL",
    workCenter:       uz ? "Ish markazi"                                   : "Рабочий центр",
    status:           uz ? "Holat"                                         : "Статус",
    active:           uz ? "Faol"                                          : "Активная",
    inactive:         uz ? "Nofaol"                                        : "Неактивная",
    actions:          uz ? "Amallar"                                       : "Действия",
    save:             uz ? "Saqlash"                                       : "Сохранить",
    cancel:           uz ? "Bekor qilish"                                  : "Отмена",
    delete:           uz ? "O'chirish"                                     : "Удалить",
    totalCameras:     uz ? "Jami kameralar"                                : "Всего камер",
    activeCameras:    uz ? "Faol kameralar"                                : "Активные камеры",
    selectWorkCenter: uz ? "Ish markazini tanlang"                         : "Выберите рабочий центр",
    noCameras:        uz ? "Kameralar topilmadi"                           : "Камеры не найдены",
  } as const;
}

export type Translations = ReturnType<typeof buildTranslations>;
