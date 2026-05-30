/** @module SettingsTypes @description Shared interfaces, types, and default-value constants for the Settings page. No JSX. */

export interface Position {
  id: string;
  name: string;
}

export interface Guideline {
  id: string;
  positionName: string;
  version: string;
  filePath: string;
}

export interface ContactSettings {
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  addressRu?: string;
  workingHours?: string;
  workingHoursRu?: string;
}

export interface SystemSettings {
  companyName?: string;
  defaultLanguage?: string;
  notificationsEnabled?: boolean;
  passPercentage?: number;
  maxAttempts?: number;
  randomizeQuestions?: boolean;
  gptModel?: string;
  promptTemplate?: string;
  qqsRate?: number;
}

export type ContactForm = Required<{
  [K in keyof ContactSettings]: string;
}>;

export interface SettingsForm {
  companyName: string;
  defaultLanguage: string;
  notificationsEnabled: boolean;
  passPercentage: number;
  maxAttempts: number;
  randomizeQuestions: boolean;
  gptModel: string;
  promptTemplate: string;
  qqsRate: number;
}

export const DEFAULT_PROMPT_TEMPLATE =
  "KONTEKST: Europrint {bo'lim} bo'limi, lavozim: {lavozim}.\n" +
  "YO'RIQNOMA: {yo'riqnoma_matni}\n" +
  "RUBRIKA VA VAZNLAR: {rubrika_json}\n" +
  "TOPSHIRIQ: {savol_matni}\n" +
  "XODIM JAVOBI: {xodim_javobi}";

export const DEFAULT_SETTINGS_FORM: SettingsForm = {
  companyName: "Europrint",
  defaultLanguage: "uz",
  notificationsEnabled: true,
  passPercentage: 80,
  maxAttempts: 3,
  randomizeQuestions: true,
  gptModel: "gpt-4o",
  promptTemplate: DEFAULT_PROMPT_TEMPLATE,
  qqsRate: 12.0,
};

export const DEFAULT_CONTACT_FORM: ContactForm = {
  email: "",
  phone: "",
  website: "",
  address: "",
  addressRu: "",
  workingHours: "",
  workingHoursRu: "",
};
