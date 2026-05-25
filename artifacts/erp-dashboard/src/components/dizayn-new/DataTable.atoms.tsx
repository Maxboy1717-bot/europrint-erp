/**
 * @module DataTable.atoms
 * @description Small UI atoms used by DataTable: StatusBadge, SortIcon,
 *   RowActionMenu, Checkbox. Split out so the main file stays under 300 lines.
 */

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { ChevronUp, ChevronDown, ChevronsUpDown, MoreVertical } from "lucide-react";

import { STATUS_CONFIG, type SortDir } from "./DataTable.types";

export function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    color: "bg-muted text-muted-foreground border-border",
    dot: "bg-muted-foreground",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium",
        cfg.color
      )}
      role="status"
      aria-label={cfg.label}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", cfg.dot)} aria-hidden="true" />
      {cfg.label}
    </span>
  );
}

export function SortIcon({ dir }: { dir: SortDir }) {
  const { t } = useTranslation("common");
  if (dir === "asc") return <ChevronUp className="w-3.5 h-3.5 text-primary" aria-label={t("ascending")} />;
  if (dir === "desc") return <ChevronDown className="w-3.5 h-3.5 text-primary" aria-label={t("descending")} />;
  return <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground/50" aria-label={t("sortBy")} />;
}

export function RowActionMenu({
  id,
  onAction,
}: {
  id: string | number;
  onAction?: (id: string | number, action: string) => void;
}) {
  const { t } = useTranslation("common");
  const [open, setOpen] = useState(false);
  const actions = [
    { key: "view", label: "Ko'rish" },
    { key: "edit", label: "Tahrirlash" },
    { key: "delete", label: "O'chirish", danger: true },
  ];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((p) => !p);
        }}
        aria-label={t("amallarMenyusi")}
        aria-expanded={open}
        aria-haspopup="menu"
        className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <MoreVertical className="w-4 h-4" aria-hidden="true" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            role="menu"
            className="absolute right-0 top-8 z-20 w-36 bg-card border border-border rounded-lg shadow-[var(--shadow-lg)] overflow-hidden"
          >
            {actions.map((a) => (
              <button
                key={a.key}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onAction?.(id, a.key);
                }}
                className={cn(
                  "w-full px-3 py-2 text-sm text-left transition-colors",
                  a.danger
                    ? "text-[hsl(var(--error))] hover:bg-[hsl(var(--error))]/10"
                    : "text-foreground hover:bg-muted"
                )}
              >
                {a.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function Checkbox({
  checked,
  indeterminate,
  onChange,
  "aria-label": ariaLabel,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (v: boolean) => void;
  "aria-label": string;
}) {
  return (
    <input
      type="checkbox"
      checked={checked}
      ref={(el) => {
        if (el) el.indeterminate = !!indeterminate;
      }}
      onChange={(e) => onChange(e.target.checked)}
      aria-label={ariaLabel}
      className="w-4 h-4 rounded border-border text-primary accent-primary cursor-pointer"
    />
  );
}
