/**
 * @module ManagerSalarySection
 * @description Phase 2 / Task 2.5 — bundles the new ManagerSelect and
 *   BaseSalaryInput into a single FormField pair for the EmployeeDialog.
 *
 *   Kept in its own section file so EmployeeDialog stays at 270~ lines
 *   (project cap is 300) and so the two related fields render together
 *   in the form layout.
 */

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { FormSectionProps } from "./types";
import { ManagerSelect } from "./ManagerSelect";
import { BaseSalaryInput } from "./BaseSalaryInput";

interface ManagerSalarySectionProps extends FormSectionProps {
  /** When editing, pass the employee id so they cannot be their own manager. */
  excludeEmployeeId?: string;
}

export function ManagerSalarySection({
  form,
  excludeEmployeeId,
}: ManagerSalarySectionProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="managerId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Bevosita rahbar</FormLabel>
            <FormControl>
              <ManagerSelect
                value={field.value ?? ""}
                onChange={field.onChange}
                excludeEmployeeId={excludeEmployeeId}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="baseSalary"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <BaseSalaryInput
                value={field.value ?? ""}
                onChange={field.onChange}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
