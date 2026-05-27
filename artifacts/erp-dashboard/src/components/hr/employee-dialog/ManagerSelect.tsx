/**
 * @module ManagerSelect
 * @description Phase 2 / Task 2.5 — manager picker for the Add/Edit Employee
 *   form. Existing flow has no field for `managerId` even though the DB
 *   column and FK have always existed; HR managers had to update the value
 *   via the API directly.
 *
 *   This is a name-autocomplete combobox built on Radix Popover + cmdk
 *   Command. Selecting "no manager" is supported (clears the field). The
 *   list is sourced from /api/employees and filtered client-side — every
 *   employee record is a potential manager, including the candidate's own
 *   peers, but NOT the candidate themselves (passed via excludeEmployeeId
 *   on edit to prevent self-reference cycles).
 *
 *   The component is controlled — it expects `value` (string id) and
 *   `onChange(id: string | null)`. Wired to the form via FormField in
 *   PositionSection (Phase 2 / Task 2.5).
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

interface ManagerOption {
  id: string | number;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  positionName?: string;
}

interface ManagerSelectProps {
  /** Currently selected manager id (string from form state) — or empty string. */
  value: string;
  /** Setter — called with the manager id string, or empty string for "clear". */
  onChange: (id: string) => void;
  /** Exclude this employee from the candidate list (prevents self-as-manager). */
  excludeEmployeeId?: string;
  /** Render as disabled (e.g. while a parent submission is in flight). */
  disabled?: boolean;
  placeholder?: string;
}

function displayName(m: ManagerOption): string {
  if (m.fullName && m.fullName.trim()) return m.fullName.trim();
  const parts = [m.firstName, m.lastName].filter(Boolean).join(" ").trim();
  return parts || `#${m.id}`;
}

export function ManagerSelect({
  value,
  onChange,
  excludeEmployeeId,
  disabled = false,
  placeholder = "Rahbarni tanlang",
}: ManagerSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: employeesData, isLoading } = useQuery<{ data?: ManagerOption[] } | ManagerOption[]>({
    queryKey: ["/api/hr/employees", { managerPicker: true }],
    // Slight cache window — the manager list rarely changes mid-edit
    staleTime: 60_000,
  });

  const employees: ManagerOption[] = useMemo(() => {
    const raw = Array.isArray(employeesData)
      ? employeesData
      : (employeesData && "data" in employeesData ? employeesData.data : []) ?? [];
    if (!Array.isArray(raw)) return [];
    return excludeEmployeeId
      ? raw.filter((e) => String(e.id) !== excludeEmployeeId)
      : raw;
  }, [employeesData, excludeEmployeeId]);

  const filtered = useMemo(() => {
    if (!search.trim()) return employees;
    const q = search.toLowerCase();
    return employees.filter((e) =>
      displayName(e).toLowerCase().includes(q),
    );
  }, [employees, search]);

  const selected = employees.find((e) => String(e.id) === value);

  const handleSelect = (id: string) => {
    if (id === value) {
      // Toggle off — second click clears.
      onChange("");
    } else {
      onChange(id);
    }
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
          aria-label={tLabel("hr.manager.select_label", "Rahbar tanlash")}
          className={cn(
            "w-full justify-between font-normal h-9",
            !selected && "text-muted-foreground",
          )}
          disabled={disabled || isLoading}
          data-testid="manager-select-trigger"
        >
          <span className="truncate">
            {selected ? displayName(selected) : placeholder}
          </span>
          <span className="flex items-center gap-1 shrink-0">
            {selected && !disabled && (
              <span
                role="button"
                aria-label="Rahbarni tozalash"
                className="p-0.5 rounded hover:bg-muted"
                onClick={handleClear}
                data-testid="manager-select-clear"
              >
                <X className="h-3 w-3 opacity-50 hover:opacity-100" />
              </span>
            )}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false} data-testid="manager-select-command">
          <CommandInput
            placeholder={tLabel("hr.manager.search_placeholder", "Ism yoki familiya bo'yicha qidiring")}
            value={search}
            onValueChange={setSearch}
            data-testid="manager-select-input"
          />
          <CommandList>
            <CommandEmpty>Topilmadi</CommandEmpty>
            <CommandGroup>
              {filtered.slice(0, 50).map((emp) => {
                const id = String(emp.id);
                const isSelected = id === value;
                return (
                  <CommandItem
                    key={id}
                    value={id}
                    onSelect={() => handleSelect(id)}
                    data-testid={`manager-select-option-${id}`}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="flex-1 truncate">{displayName(emp)}</span>
                    {emp.positionName && (
                      <span className="ml-2 text-xs text-muted-foreground truncate">
                        {emp.positionName}
                      </span>
                    )}
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
