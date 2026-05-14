/** @module CRMSettingsTypes @description Shared interfaces, Zod schemas, and UI constants for the CRM Settings page. No JSX. */

import { z } from "zod";
import {
  FileText,
  Package,
  Users,
  Building2,
  Settings,
  Key,
  Layers,
  CheckSquare,
  Type,
  Hash,
  Calendar,
  List,
  Phone,
  Mail,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Domain interfaces
// ---------------------------------------------------------------------------

export interface CustomField {
  id: number;
  entityType: string;
  fieldName: string;
  fieldLabel: string;
  fieldLabelRu: string | null;
  fieldType: string;
  options: { value: string; label: string }[] | null;
  isRequired: boolean;
  isVisible: boolean;
  sort: number;
}

export interface SortableFieldRowProps {
  field: CustomField;
  onEdit: (field: CustomField) => void;
  onDelete: (id: number) => void;
}

export interface FieldFormState {
  fieldName: string;
  fieldLabel: string;
  fieldLabelRu: string;
  fieldType: string;
  options: { value: string; label: string }[];
  isRequired: boolean;
  isVisible: boolean;
  sort: number;
}

// ---------------------------------------------------------------------------
// Zod validation schema
// ---------------------------------------------------------------------------

export const crmFieldFormSchema = z.object({
  fieldName: z.string().max(100, "Maydon nomi 100 belgidan oshmasligi kerak"),
  fieldLabel: z
    .string()
    .min(1, "Maydon yorlig'ini kiriting")
    .max(200, "Yorliq 200 belgidan oshmasligi kerak"),
  fieldLabelRu: z.string().max(200, "Yorliq 200 belgidan oshmasligi kerak"),
  fieldType: z.string().min(1, "Maydon turini tanlang"),
  options: z.array(z.object({ value: z.string(), label: z.string() })),
  isRequired: z.boolean(),
  isVisible: z.boolean(),
  sort: z
    .number()
    .min(0, "Tartib raqami 0 dan kam bo'lmasligi kerak")
    .max(10000, "Tartib raqami 10000 dan oshmasligi kerak"),
});

// ---------------------------------------------------------------------------
// UI constant lookup tables
// ---------------------------------------------------------------------------

export const FIELD_TYPES = [
  { value: "text", label: "Matn", icon: Type },
  { value: "number", label: "Raqam", icon: Hash },
  { value: "date", label: "Sana", icon: Calendar },
  { value: "select", label: "Tanlov", icon: List },
  { value: "multiselect", label: "Ko'p tanlov", icon: Layers },
  { value: "checkbox", label: "Checkbox", icon: CheckSquare },
  { value: "phone", label: "Telefon", icon: Phone },
  { value: "email", label: "Email", icon: Mail },
] as const;

export const ENTITY_TYPES = [
  { value: "lead", label: "Lidlar", icon: FileText },
  { value: "deal", label: "Bitimlar", icon: Package },
  { value: "contact", label: "Kontaktlar", icon: Users },
  { value: "company", label: "Kompaniyalar", icon: Building2 },
] as const;

export const MENU_ITEMS = [
  { id: "requisites", label: "Mening rekvizitlarim", icon: FileText },
  { id: "access", label: "Kirish huquqlari", icon: Key },
  { id: "products", label: "Tovarlar va omborlar", icon: Package },
  { id: "integrations", label: "Integratsiyalar", icon: Layers },
  { id: "custom-fields", label: "Maxsus maydonlar", icon: Settings },
] as const;

// ---------------------------------------------------------------------------
// Default form state factory
// ---------------------------------------------------------------------------

export function defaultFieldForm(): FieldFormState {
  return {
    fieldName: "",
    fieldLabel: "",
    fieldLabelRu: "",
    fieldType: "text",
    options: [],
    isRequired: false,
    isVisible: true,
    sort: 500,
  };
}
