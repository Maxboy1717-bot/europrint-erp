/**
 * @module EventsCalendarDialogs
 * @description Event create/edit dialog component for the EventsCalendar page.
 * Receives form, mutation state, and selection state via props so the parent
 * orchestrator retains full control over query invalidation and toasts.
 * Checkbox panels are delegated to EventsCalendarSelectors.
 */

import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import {
  CalendarEvent,
  Department,
  EventFormValues,
  Position,
} from "./EventsCalendarTypes";
import { DepartmentSelector, PositionSelector } from "./EventsCalendarSelectors";

import { useTranslation } from '@/lib/i18n';
// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingEvent: CalendarEvent | null;
  form: UseFormReturn<EventFormValues>;
  onSubmit: (data: EventFormValues) => void;
  isPending: boolean;
  departments: Department[];
  positions: Position[];
  selectedDepartments: string[];
  onDepartmentsChange: (ids: string[]) => void;
  selectedPositions: string[];
  onPositionsChange: (ids: string[]) => void;
  onCancel: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EventDialog({open,
  onOpenChange,
  editingEvent,
  form,
  onSubmit,
  isPending,
  departments,
  positions,
  selectedDepartments,
  onDepartmentsChange,
  selectedPositions,
  onPositionsChange,
  onCancel,
}: EventDialogProps) {
  const { t } = useTranslation('common');
  const isEditing = editingEvent !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button data-testid="button-create-event">
          <Plus className="mr-2 h-4 w-4" />
          {t("tadbirYaratish")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold"> {isEditing ? "Tadbirni tahrirlash" : "Tadbir yaratish"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Tadbir ma'lumotlarini yangilang"
              : "Yangi kalendar tadbiri yarating"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            {/* Bilingual titles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sarlavha (O'zbekcha)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t("oquvMashguloti")} data-testid="input-event-title-uz" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="titleRu"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sarlavha (Русский)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Учебное занятие" data-testid="input-event-title-ru" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Bilingual descriptions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tavsif (O'zbekcha)</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder={t("tadbirTavsifi")} data-testid="input-event-desc-uz" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="descriptionRu"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tavsif (Русский)</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Описание мероприятия..." data-testid="input-event-desc-ru" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Start date / time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("startDate")}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field}
                        min={new Date().toISOString().split("T")[0]}
                        max="2099-12-31"
                        data-testid="input-start-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Boshlanish vaqti (ixtiyoriy)</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} data-testid="input-start-time" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* End date / time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tugash sanasi (ixtiyoriy)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field}
                        min={form.watch("startDate") || new Date().toISOString().split("T")[0]}
                        max="2099-12-31"
                        data-testid="input-end-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tugash vaqti (ixtiyoriy)</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} data-testid="input-end-time" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Event type */}
            <FormField control={form.control} name="eventType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("type")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t('training')} data-testid="input-event-type" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Location / max participants */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Manzil (ixtiyoriy)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="A xona" data-testid="input-location" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="maxParticipants"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maksimal ishtirokchilar (ixtiyoriy)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                        }
                        value={field.value ?? ""}
                        data-testid="input-max-participants"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Target department / position selectors */}
            <div className="space-y-3">
              <DepartmentSelector
                departments={departments}
                selected={selectedDepartments}
                onChange={onDepartmentsChange}
              />
              <PositionSelector
                positions={positions}
                selected={selectedPositions}
                onChange={onPositionsChange}
              />
            </div>

            {/* Form actions */}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel">
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isPending} data-testid="button-submit">
                {isEditing ? "Yangilash" : "Yaratish va xabarnoma yuborish"}
              </Button>
            </div>

          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
