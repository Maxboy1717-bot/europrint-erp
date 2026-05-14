/**
 * @module MentorshipDialogs
 * @description Dialog components for the Mentorship page.
 */

import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTranslation } from "@/lib/i18n";
import type { MentorshipFormValues, Employee, Course } from "./MentorshipTypes";

interface MentorshipFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<MentorshipFormValues>;
  onSubmit: (data: MentorshipFormValues) => void;
  isPending: boolean;
  employees: Employee[] | undefined;
  courses: Course[] | undefined;
}

export function MentorshipFormDialog({
  isOpen,
  onOpenChange,
  form,
  onSubmit,
  isPending,
  employees,
  courses,
}: MentorshipFormDialogProps) {
  const { t } = useTranslation('lms');
  const { t: tHr } = useTranslation('hr');

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border p-6" data-testid="dialog-create-mentorship">
        <DialogHeader>
          <DialogTitle className="text-foreground">{"Yaratish"}</DialogTitle>
          <DialogDescription className="text-muted-foreground">{t('mentors')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="mentorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">{t('mentor')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-mentor" className="bg-muted/40 border-border h-9">
                          <SelectValue placeholder={t('mentor')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-card border-border">
                        {employees?.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.fullName} ({emp.employeeId})
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
                name="menteeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Mentee</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-mentee" className="bg-muted/40 border-border h-9">
                          <SelectValue placeholder="Mentee" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-card border-border">
                        {employees?.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.fullName} ({emp.employeeId})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="courseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">{t('course')} ({t('mandatory')})</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-course" className="bg-muted/40 border-border h-9">
                        <SelectValue placeholder={t('course')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-card border-border">
                      {courses?.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">{t('deadline')}</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        min={new Date().toISOString().split('T')[0]}
                        max="2099-12-31"
                        data-testid="input-deadline"
                        className="bg-muted/40 border-border"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bonusPercentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">{tHr('bonus')} (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        placeholder="5"
                        data-testid="input-bonus"
                        className="bg-muted/40 border-border"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">{"Holat"}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-status" className="bg-muted/40 border-border h-9">
                        <SelectValue placeholder={"Holat"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="active">{"Faol"}</SelectItem>
                      <SelectItem value="paused">{"Kutilmoqda"}</SelectItem>
                      <SelectItem value="completed">{"Tugallangan"}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">{"Izoh"} ({"Ixtiyoriy"})</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={"Izoh"}
                      data-testid="input-notes"
                      className="bg-muted/40 border-border"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => { onOpenChange(false); form.reset(); }}
                data-testid="button-cancel"
                className="bg-muted/60 text-foreground hover:bg-muted border-none rounded-lg"
              >
                {"Bekor qilish"}
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                data-testid="button-submit"
                className="bg-primary text-white rounded-lg px-5 py-2.5 text-sm font-semibold shadow-none"
              >
                {"Yaratish"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteMentorshipDialogProps {
  deleteId: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteMentorshipDialog({ deleteId, onOpenChange, onConfirm }: DeleteMentorshipDialogProps) {
  const { t: tCommon } = useTranslation('common');
  return (
    <AlertDialog open={!!deleteId} onOpenChange={onOpenChange}>
      <AlertDialogContent data-testid="dialog-confirm-delete">
        <AlertDialogHeader>
          <AlertDialogTitle>{tCommon('confirmDelete')}</AlertDialogTitle>
          <AlertDialogDescription>{tCommon('deleteWarning')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="button-cancel-delete">{tCommon('cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} data-testid="button-confirm-delete">
            {tCommon('delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
