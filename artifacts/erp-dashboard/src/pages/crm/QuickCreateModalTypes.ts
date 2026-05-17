/**
 * @module QuickCreateModalTypes
 * @description Shared types + option lists + entity label/icon maps for the
 * QuickCreateModal page. JSX-free where reasonable — icons remain in a .tsx
 * map to keep this file importable from .ts callers.
 */

export interface DuplicateEntry {
  id: number;
  name?: string;
  title?: string;
}

export const SOURCE_OPTIONS = [
  { value: "CALL",     label: "Qo'ng'iroq" },
  { value: "WEBFORM",  label: "Veb-forma" },
  { value: "TELEGRAM", label: "Telegram" },
  { value: "EMAIL",    label: "Email" },
  { value: "WEB",      label: "Veb-sayt" },
  { value: "INBOUND",  label: "Kiruvchi" },
  { value: "PARTNER",  label: "Hamkor" },
  { value: "OTHER",    label: "Boshqa" },
] as const;

export const CURRENCY_OPTIONS = [
  { value: "UZS", label: "UZS — So'm" },
  { value: "USD", label: "USD — Dollar" },
  { value: "EUR", label: "EUR — Yevro" },
  { value: "RUB", label: "RUB — Rubl" },
] as const;

export interface QuickCreateFormState {
  title: string;
  phone: string;
  email: string;
  stir: string;
  source: string;
  description: string;
  amount: string;
  currency: string;
}

export const INITIAL_FORM_STATE: QuickCreateFormState = {
  title: "",
  phone: "",
  email: "",
  stir: "",
  source: "",
  description: "",
  amount: "",
  currency: "UZS",
};
