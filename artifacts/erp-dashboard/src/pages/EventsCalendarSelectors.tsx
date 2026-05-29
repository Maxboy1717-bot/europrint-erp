/**
 * @module EventsCalendarSelectors
 * @description Reusable checkbox-list panels for selecting target departments
 * and target positions in the event create/edit dialog.
 */

import { Checkbox } from "@/components/ui/checkbox";
import { Building2, Briefcase } from "lucide-react";
import { Department, Position } from "./EventsCalendarTypes";

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

// ---------------------------------------------------------------------------
// Position selector
// ---------------------------------------------------------------------------

interface PositionSelectorProps {
  positions: Position[];
  selected: string[];
  onChange: (ids: string[]) => void;
}

export function PositionSelector({
  positions,
  selected,
  onChange,
}: PositionSelectorProps) {
  const toggle = (id: string, checked: boolean) => {
    if (checked) {
      onChange([...selected, id]);
    } else {
      onChange((Array.isArray(selected) ? selected : []).filter((p) => p !== id));
    }
  };

  return (
    <div>
      <label className="text-sm font-medium flex items-center gap-2 mb-2">
        <Briefcase className="h-4 w-4" />
        Maqsadli lavozimlar (ixtiyoriy)
      </label>
      <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
        {positions.map((pos) => (
          <div key={pos.id} className="flex items-center space-x-2">
            <Checkbox
              id={`pos-${pos.id}`}
              checked={selected.includes(pos.id)}
              onCheckedChange={(checked) => toggle(pos.id, !!checked)}
            />
            <label
              htmlFor={`pos-${pos.id}`}
              className="text-sm cursor-pointer"
            >
              {pos.name}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
