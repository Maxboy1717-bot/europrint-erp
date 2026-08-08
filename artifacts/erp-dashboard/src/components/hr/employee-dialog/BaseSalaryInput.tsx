/**
 * @module BaseSalaryInput
 * @description Phase 2 / Task 2.5 — base salary picker with currency
 *   formatting + Vysotskiy grade preset for the Add/Edit Employee form.
 *
 *   The previous form had no base-salary field at all. Salaries were
 *   either set via the salary-review endpoint (Director-only) or left at
 *   the position-level default. HR managers can now set / adjust the
 *   employee base salary inline at creation time.
 *
 *   UX:
 *     - Number input shows the value with thousand-separator commas
 *       while typing ("1,500,000"). The stored form value is the raw
 *       digits string ("1500000") so existing useEmployeeMutation
 *       cleanData logic still works.
 *     - Currency suffix ("UZS") is rendered as a label, not stored.
 *     - Grade picker below maps Vysotskiy categories (A/B/C/D) to typical
 *       salary brackets. Picking a grade pre-fills the input to the
 *       category's midpoint; the user can then adjust freely.
 */

import { ChangeEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { tLabel } from "@/lib/i18n/tLabel";
import { selectArray } from "@/lib/queryClient";

interface BaseSalaryInputProps {
  /** Raw digits string. Empty string when blank. */
  value: string;
  /** Setter — receives the raw digits string (no commas, no currency). */
  onChange: (raw: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Vysotskiy categories — mirrors the values in
 * `lib/db/src/schema/employees.ts` (`vysotskiy_category` column).
 * The midpoint salaries here are fallback defaults only — the real,
 * owner-editable values live in business_settings (module "hr", keys
 * hr.grade_a_salary..hr.grade_d_salary, see /admin/business-settings).
 * These constants are used only if that fetch hasn't resolved yet.
 */
const DEFAULT_MIDPOINTS: Record<string, number> = { A: 12_000_000, B: 8_000_000, C: 5_000_000, D: 3_000_000 };
const GRADE_LABELS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "A", label: tLabel("hr.grade.a", "A — Yuqori sinf") },
  { value: "B", label: tLabel("hr.grade.b", "B — O'rta-yuqori") },
  { value: "C", label: tLabel("hr.grade.c", "C — O'rta") },
  { value: "D", label: tLabel("hr.grade.d", "D — Boshlang'ich") },
];

interface BusinessSettingRow {
  setting_key: string;
  value_num: string | null;
}

/** Strip every non-digit character. Negative / decimal salaries are out of scope. */
export function rawDigits(input: string): string {
  return input.replace(/[^\d]/g, "");
}

/** Insert thousand separators. Empty input → empty output. */
export function formatWithCommas(raw: string): string {
  if (!raw) return "";
  return raw.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function BaseSalaryInput({
  value,
  onChange,
  disabled = false,
  placeholder = "0",
}: BaseSalaryInputProps) {
  const display = formatWithCommas(value);

  const { data: settingsData } = useQuery<BusinessSettingRow[]>({
    queryKey: ["/api/business-settings", { module: "hr" }],
    select: selectArray<BusinessSettingRow>,
    staleTime: 300_000,
  });
  const settingsRows = Array.isArray(settingsData) ? settingsData : [];
  const gradePresets = GRADE_LABELS.map((g) => {
    const row = settingsRows.find((r) => r.setting_key === `hr.grade_${g.value.toLowerCase()}_salary`);
    const midpoint = row?.value_num != null ? Number(row.value_num) : DEFAULT_MIDPOINTS[g.value];
    return { ...g, midpoint };
  });

  const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = rawDigits(e.target.value);
    onChange(raw);
  };

  const handleGradePick = (grade: string) => {
    const preset = gradePresets.find((g) => g.value === grade);
    if (!preset) return;
    onChange(String(preset.midpoint));
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="base-salary-input">Asosiy maosh</Label>
      <div className="relative">
        <Input
          id="base-salary-input"
          inputMode="numeric"
          autoComplete="off"
          value={display}
          onChange={handleInput}
          disabled={disabled}
          placeholder={placeholder}
          data-testid="input-base-salary"
          className="pr-14 h-9"
        />
        <span
          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none"
          aria-hidden="true"
        >
          UZS
        </span>
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Vysotskiy darajasi (preset)</Label>
        <Select onValueChange={handleGradePick} disabled={disabled}>
          <SelectTrigger
            className="h-9"
            data-testid="select-grade"
            aria-label="Vysotskiy darajasi"
          >
            <SelectValue placeholder="Darajani tanlang (ixtiyoriy)" />
          </SelectTrigger>
          <SelectContent>
            {gradePresets.map((g) => (
              <SelectItem
                key={g.value}
                value={g.value}
                data-testid={`select-grade-option-${g.value}`}
              >
                {g.label} — {formatWithCommas(String(g.midpoint))} UZS
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
