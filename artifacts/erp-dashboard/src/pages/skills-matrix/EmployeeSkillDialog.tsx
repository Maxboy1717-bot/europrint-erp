/**
 * @module EmployeeSkillDialog
 * @description React page component. Route-level UI.
 */

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { Skill, Employee, EmployeeSkillFormValues } from "./types";

interface EmployeeSkillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<EmployeeSkillFormValues>;
  employees?: Employee[];
  skills?: Skill[];
  onSubmit: (data: EmployeeSkillFormValues) => void;
  isPending: boolean;
  onCancel: () => void;
}

export function EmployeeSkillDialog({ open, onOpenChange, form, employees, skills, onSubmit, isPending, onCancel }: EmployeeSkillDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" data-testid="button-add-employee-skill">
          <Plus className="mr-2 h-4 w-4" />
          Ko'nikma belgilash
        </Button>
      </DialogTrigger>
      <DialogContent data-testid="dialog-add-employee-skill" className="p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">Xodimga ko'nikma belgilash</DialogTitle>
          <DialogDescription>Xodim profiliga ko'nikma qo'shing</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="userId" render={({ field }) => (
              <FormItem>
                <FormLabel>Xodim</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-employee" className="h-9"><SelectValue placeholder="Xodimni tanlang" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {employees?.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>{emp.fullName} ({emp.employeeId})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="skillId" render={({ field }) => (
              <FormItem>
                <FormLabel>Ko'nikma</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-skill" className="h-9"><SelectValue placeholder="Ko'nikmani tanlang" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {skills?.map((skill) => (
                      <SelectItem key={skill.id} value={skill.id}>{skill.name} ({skill.category})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="level" render={({ field }) => (
              <FormItem>
                <FormLabel>Daraja (1-5)</FormLabel>
                <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value.toString()}>
                  <FormControl>
                    <SelectTrigger data-testid="select-level" className="h-9"><SelectValue placeholder="Darajani tanlang" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1">1 - Boshlang'ich</SelectItem>
                    <SelectItem value="2">2 - Oddiy</SelectItem>
                    <SelectItem value="3">3 - O'rta</SelectItem>
                    <SelectItem value="4">4 - Yuqori</SelectItem>
                    <SelectItem value="5">5 - Mutaxassis</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Izoh (ixtiyoriy)</FormLabel>
                <FormControl><Textarea {...field} placeholder="Qo'shimcha ma'lumot" data-testid="input-notes" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel">Bekor qilish</Button>
              <Button type="submit" disabled={isPending} data-testid="button-submit">Qo'shish</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
