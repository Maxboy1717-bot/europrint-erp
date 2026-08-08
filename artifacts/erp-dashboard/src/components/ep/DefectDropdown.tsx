/**
 * @module DefectDropdown
 * @description Tezkor NUQSON-tanlash dropdown (T11-09, EP-ORG-097) — XATO-KATALOG
 *   (`error_catalog`, T10-08) API'sidan tipik xatolar / nuqson-sabablarini o'qib,
 *   "Nima xato/sabab bo'ldi?" tanlovini ko'rsatadi. Kunlik-hisobot / ЦКП-fakt /
 *   IoT-tablet formasida ishlatish uchun mo'ljallangan ADDITIV komponent.
 *
 *   Ma'lumot manbai: GET /api/org-structure/error-catalog?cardId=<id>
 *     - cardId berilsa: o'sha kartaga xos + umumiy (card_id IS NULL) qaytadi.
 *     - cardId berilmasa: faqat umumiy xatolar.
 *
 *   ⭐ JADVAL BO'SH tug'iladi (Q-40 fabrikatsiya-taqiq) — real xato-ro'yxati
 *   EGASI/HR tomonidan kiritiladi. Bo'sh bo'lsa komponent "katalog bo'sh"
 *   holatini ko'rsatadi (soxta satr generatsiya QILMAYDI).
 *
 *   Faqat O'QIYDI + tanlaydi (mutation YO'Q) — bu tezkor-tanlash primitivi.
 *   Tanlangan xato ota-komponentga (`onSelect`) qaytariladi; saqlash logikasi
 *   (ckp_fact_values.error_reason kabi) ota-formaning vazifasi.
 */

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EPStatusPill, type EPStatusTone } from "./EPStatusPill";
import { cn } from "@/lib/utils";

/** error_catalog qatori (T10-08 API javobining bir elementi). */
export interface DefectCatalogItem {
  id: number;
  /** NULL = umumiy (hamma kartaga); raqam = o'sha kartaga xos. */
  card_id: number | null;
  code: string | null;
  name: string;
  name_ru: string | null;
  /** defect-guruh: sifat / deadline / material / qayta-ishlash / ... */
  category: string | null;
  severity: string | null;
  description: string | null;
  sort_order: number | null;
}

interface ErrorCatalogResponse {
  items?: DefectCatalogItem[];
  total?: number;
}

interface DefectDropdownProps {
  /**
   * Karta id — berilsa o'sha kartaga xos + umumiy xatolar ko'rinadi;
   * berilmasa faqat umumiy. NULL/undefined ham qabul qilinadi.
   */
  cardId?: number | null;
  /** Tanlangan xato id (controlled). null = tanlanmagan. */
  value?: number | null;
  /** Tanlov o'zgarganda: tanlangan id + to'liq qator (yoki null tozalashda). */
  onSelect?: (id: number | null, item: DefectCatalogItem | null) => void;
  /** Placeholder matni (default: "Nuqson / sabab tanlang"). */
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/** severity → EPStatusPill ohangi (master-data severity erkin-matn bo'lishi mumkin). */
function severityTone(severity: string | null): EPStatusTone {
  switch ((severity ?? "").toLowerCase()) {
    case "high":
    case "critical":
    case "yuqori":
      return "danger";
    case "major":
      return "brand";
    case "medium":
    case "o'rta":
    case "orta":
      return "warning";
    case "low":
    case "past":
      return "info";
    default:
      return "neutral";
  }
}

export function DefectDropdown({
  cardId,
  value,
  onSelect,
  placeholder = "Nuqson / sabab tanlang",
  disabled,
  className,
}: DefectDropdownProps) {
  // cardId NULL/undefined bo'lsa ham so'rov yuboriladi (faqat umumiy xatolar).
  const { data, isLoading, isError } = useQuery<ErrorCatalogResponse>({
    queryKey: ["/api/org-structure/error-catalog", { cardId: cardId ?? undefined }],
  });

  const items: DefectCatalogItem[] = Array.isArray(data?.items) ? data.items : [];

  // Umumiy (card_id IS NULL) vs karta-xos — operator uchun ajratib ko'rsatamiz.
  const general = items.filter((i) => i.card_id == null);
  const cardSpecific = items.filter((i) => i.card_id != null);

  function handleChange(raw: string) {
    if (raw === "") {
      onSelect?.(null, null);
      return;
    }
    const id = Number(raw);
    const found = items.find((i) => i.id === id) ?? null;
    onSelect?.(Number.isFinite(id) ? id : null, found);
  }

  const renderItem = (i: DefectCatalogItem) => (
    <SelectItem key={i.id} value={String(i.id)}>
      <span className="flex w-full items-center justify-between gap-2">
        <span className="truncate">{i.name}</span>
        {i.severity ? (
          <EPStatusPill tone={severityTone(i.severity)} hideDot className="ml-2 shrink-0">
            {i.severity}
          </EPStatusPill>
        ) : null}
      </span>
    </SelectItem>
  );

  return (
    <Select
      value={value != null ? String(value) : undefined}
      onValueChange={handleChange}
      disabled={disabled || isLoading}
    >
      <SelectTrigger className={cn("w-full", className)} aria-label={placeholder}>
        <SelectValue placeholder={isLoading ? "Yuklanmoqda…" : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {isError ? (
          <div className="px-3 py-2 text-sm text-[var(--ep-red)]">
            Katalogni yuklab bo'lmadi
          </div>
        ) : items.length === 0 && !isLoading ? (
          <div className="px-3 py-2 text-sm text-muted-foreground">
            Xato-katalog bo'sh
          </div>
        ) : (
          <>
            {cardSpecific.length > 0 && (
              <SelectGroup>
                <SelectLabel>Kartaga xos</SelectLabel>
                {cardSpecific.map(renderItem)}
              </SelectGroup>
            )}
            {general.length > 0 && (
              <SelectGroup>
                <SelectLabel>Umumiy</SelectLabel>
                {general.map(renderItem)}
              </SelectGroup>
            )}
          </>
        )}
      </SelectContent>
    </Select>
  );
}
