/**
 * @module ParentCardSelect
 * @description G4 (ORG-CARD-MANUAL-ENTRY-READINESS-2026-07-06, finding B5) — searchable parent-
 *   card picker for AddNodeDialog, replacing a hand-typed numeric `org_departments.id` text
 *   input. Building 50+ cards one-by-one with a raw numeric-ID field was slow and error-prone
 *   (no way to confirm which card an id number actually referred to without leaving the dialog).
 *
 *   Mirrors the established combobox pattern already used for the employee-form manager picker
 *   (components/hr/employee-dialog/ManagerSelect.tsx: Radix Popover + cmdk Command, client-side
 *   filter over a name-autocomplete list, "clear" support) rather than inventing new UI. Sourced
 *   from GET /api/org-structure/nodes/flat (limit=1000 — 143 live rows, comfortably one page) —
 *   the same endpoint the hierarchy list view already uses.
 */

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { tLabel } from "@/lib/i18n/tLabel";
import { NODE_TYPE_LABELS } from "./types";

interface CardOption {
  id: number;
  name: string;
  nodeType?: string;
  headUserName?: string | null;
}

interface ParentCardSelectProps {
  /** Currently selected parent card id (string form-state, matching AddNodeDialog's convention) — or empty string for "no parent / root". */
  value: string;
  /** Setter — called with the parent id as a string, or empty string to clear (root card). */
  onChange: (id: string) => void;
  /** Exclude this card from the candidate list (edit flows: a card can't be its own parent). */
  excludeNodeId?: string;
  disabled?: boolean;
  placeholder?: string;
}

export function ParentCardSelect({
  value,
  onChange,
  excludeNodeId,
  disabled = false,
  placeholder = tLabel("org.parentCard.placeholder", "Ota kartani tanlang (bo'sh — ildiz)"),
}: ParentCardSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery<{ data?: CardOption[] }>({
    queryKey: ["/api/org-structure/nodes/flat", { limit: 1000, picker: true }],
    staleTime: 60_000,
  });

  const cards: CardOption[] = useMemo(() => {
    const raw = Array.isArray(data?.data) ? data.data : [];
    return excludeNodeId ? raw.filter((c) => String(c.id) !== excludeNodeId) : raw;
  }, [data, excludeNodeId]);

  const filtered = useMemo(() => {
    if (!search.trim()) return cards;
    const q = search.toLowerCase();
    return cards.filter((c) => c.name?.toLowerCase().includes(q));
  }, [cards, search]);

  const selected = cards.find((c) => String(c.id) === value);

  const handleSelect = (id: string) => {
    onChange(id === value ? "" : id);
    setOpen(false);
    setSearch("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={tLabel("org.parentCard.select_label", "Ota karta tanlash")}
          className={cn(
            "w-full justify-between font-normal h-9",
            !selected && "text-muted-foreground",
          )}
          disabled={disabled || isLoading}
          data-testid="parent-card-select-trigger"
        >
          <span className="truncate">
            {selected ? selected.name : placeholder}
          </span>
          <span className="flex items-center gap-1 shrink-0">
            {selected && !disabled && (
              <span
                role="button"
                aria-label={tLabel("org.parentCard.clear_label", "Ota kartani tozalash")}
                className="p-0.5 rounded hover:bg-muted"
                onClick={handleClear}
                data-testid="parent-card-select-clear"
              >
                <X className="h-3 w-3 opacity-50 hover:opacity-100" />
              </span>
            )}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command shouldFilter={false} data-testid="parent-card-select-command">
          <CommandInput
            placeholder={tLabel("org.parentCard.search_placeholder", "Karta nomi bo'yicha qidiring")}
            value={search}
            onValueChange={setSearch}
            data-testid="parent-card-select-input"
          />
          <CommandList>
            <CommandEmpty>{tLabel("org.parentCard.not_found", "Topilmadi")}</CommandEmpty>
            <CommandGroup>
              {filtered.slice(0, 100).map((card) => {
                const id = String(card.id);
                const isSelected = id === value;
                return (
                  <CommandItem
                    key={id}
                    value={id}
                    onSelect={() => handleSelect(id)}
                    data-testid={`parent-card-select-option-${id}`}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="flex-1 truncate">{card.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground truncate">
                      {card.nodeType ? NODE_TYPE_LABELS[card.nodeType] ?? card.nodeType : ""}
                      {card.headUserName ? ` · ${card.headUserName}` : ""}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
