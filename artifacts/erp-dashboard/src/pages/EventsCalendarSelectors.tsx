/**
 * @module EventsCalendarSelectors
 * @description Reusable checkbox-list panel for selecting target departments
 * in the event create/edit dialog.
 */

import { Checkbox } from "@/components/ui/checkbox";
import { Building2 } from "lucide-react";
import { Department } from "./EventsCalendarTypes";

// ---------------------------------------------------------------------------
// Department selector
// ---------------------------------------------------------------------------

interface DepartmentSelectorProps {
  departments: Department[];
  selected: string[];
  onChange: (ids: string[]) => void;
}

export function DepartmentSelector({
  departments,
  selected,
  onChange,
}: DepartmentSelectorProps) {
  const toggle = (id: string, checked: boolean) => {
    if (checked) {
      onChange([...selected, id]);
    } else {
      onChange((Array.isArray(selected) ? selected : []).filter((d) => d !== id));
    }
  };

  return (
    <div>
      <label className="text-sm font-medium flex items-center gap-2 mb-2">
        <Building2 className="h-4 w-4" />
        Maqsadli bo'limlar (ixtiyoriy)
      </label>
      <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
        {departments.map((dept) => (
          <div key={dept.id} className="flex items-center space-x-2">
            <Checkbox
              id={`dept-${dept.id}`}
              checked={selected.includes(dept.id)}
              onCheckedChange={(checked) => toggle(dept.id, !!checked)}
            />
            <label
              htmlFor={`dept-${dept.id}`}
              className="text-sm cursor-pointer"
            >
              {dept.name}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
