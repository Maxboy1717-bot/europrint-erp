/**
 * @module PositionSection
 * @description React UI component.
 */

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormSectionProps, Department, Position } from "./types";

interface PositionSectionProps extends FormSectionProps {
  departments: Department[];
  positions: Position[];
}

export function PositionSection({ form, departments, positions }: PositionSectionProps) {
  const watchedDepartmentId = form.watch("departmentId");
  const filteredPositions = watchedDepartmentId
    ? (Array.isArray(positions) ? positions : []).filter(p => !p.departmentId || p.departmentId === watchedDepartmentId)
    : positions;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="departmentId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Bo'lim</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger data-testid="select-department" className="h-9">
                  <SelectValue placeholder="Bo'limni tanlang" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {(Array.isArray(departments) ? departments : []).map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="positionId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Lavozim</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger data-testid="select-position" className="h-9">
                  <SelectValue placeholder="Lavozimni tanlang" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {(Array.isArray(filteredPositions) ? filteredPositions : []).map((pos) => (
                  <SelectItem key={pos.id} value={pos.id}>
                    {pos.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
