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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
 * The midpoint salaries here are presets, not authoritative — they
 * pre-fill the input and let HR adjust upward from there.
 */
const GRADE_PRESETS: ReadonlyArray<{ value: string; label: string; midpoint: number }> = [
  { value: "A", label: "A — Yuqori sinf",     midpoint: 12_000_000 },
  { value: "B", label: "B — O'rta-yuqori",     midpoint:  8_000_000 },
  { value: "C", label: "C — O'rta",             midpoint:  5_000_000 },
  { value: "D", label: "D — Boshlang'ich",      midpoint:  3_000_000 },
];

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

  const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = rawDigits(e.target.value);
    onChange(raw);
  };

  const handleGradePick = (grade: string) => {
    const preset = GRADE_PRESETS.find((g) => g.value === grade);
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
            {GRADE_PRESETS.map((g) => (
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
