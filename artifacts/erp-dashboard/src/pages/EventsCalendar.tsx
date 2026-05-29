/**
 * @module EventsCalendar
 * @description Route-level orchestrator for the Events Calendar page.
 * Owns all server-state (useQuery / useMutation), local UI state, and
 * event handlers.  Delegates rendering to EventsCalendarGrid and
 * EventsCalendarDialogs.
 */

import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  CalendarEvent,
  Department,
  EventFormValues,
  eventFormSchema,
} from "./EventsCalendarTypes";
import { EventDialog } from "./EventsCalendarDialogs";
import { EventsCalendarGrid } from "./EventsCalendarGrid";
import { EPErrorState } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const EVENTS_KEY    = ["/api/calendar-events"] as const;
const UPCOMING_KEY  = ["/api/calendar-events/upcoming"] as const;
const DEPTS_KEY     = ["/api/org-departments"] as const;

// ---------------------------------------------------------------------------
// Default form values
// ---------------------------------------------------------------------------

const DEFAULT_VALUES: EventFormValues = {
  title: "",
  titleRu: "",
  description: "",
  descriptionRu: "",
  startDate: "",
  startTime: "",
  endDate: "",
  endTime: "",
  location: "",
  eventType: "training",
  maxParticipants: undefined,
  targetDepartments: [],
  targetPositions: [],
};

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function EventsCalendar() {
  const { t } = useTranslation("common");
  const { toast } = useToast();

  // Dialog / editing state
  const [isDialogOpen,         setIsDialogOpen]         = useState(false);
  const [editingEvent,         setEditingEvent]          = useState<CalendarEvent | null>(null);
  const [selectedDepartments,  setSelectedDepartments]   = useState<string[]>([]);

  // -------------------------------------------------------------------------
  // Queries
  // -------------------------------------------------------------------------

  const { data: eventsRaw, isLoading: loadingEvents, isError, error, refetch } = useQuery({
    queryKey: EVENTS_KEY,
  });

  const { data: upcomingRaw } = useQuery({ queryKey: UPCOMING_KEY });
  const { data: departmentsRaw } = useQuery({ queryKey: DEPTS_KEY });

  const events         = Array.isArray(eventsRaw)      ? (eventsRaw      as CalendarEvent[]) : [];
  const upcomingEvents = Array.isArray(upcomingRaw)    ? (upcomingRaw    as CalendarEvent[]) : [];
  const departments    = Array.isArray(departmentsRaw) ? (departmentsRaw as Department[])    : [];

  // -------------------------------------------------------------------------
  // Form
  // -------------------------------------------------------------------------

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  // -------------------------------------------------------------------------
  // Mutations
  // -------------------------------------------------------------------------

  const invalidateEvents = () => {
    queryClient.invalidateQueries({ queryKey: EVENTS_KEY });
    queryClient.invalidateQueries({ queryKey: UPCOMING_KEY });
  };

  const resetDialog = () => {
    setIsDialogOpen(false);
    setEditingEvent(null);
    setSelectedDepartments([]);
    form.reset(DEFAULT_VALUES);
  };

  const createEventMutation = useMutation({
    mutationFn: (data: EventFormValues) =>
      apiRequest("POST", "/api/calendar-events", data),
    onSuccess: () => {
      invalidateEvents();
      resetDialog();
      toast({ title: "Tadbir muvaffaqiyatli yaratildi va xodimlar xabardor qilindi" });
    },
    onError: () => {
      toast({ title: "Tadbir yaratishda xatolik", variant: "destructive" });
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EventFormValues> }) =>
      apiRequest("PUT", `/api/calendar-events/${id}`, data),
    onSuccess: () => {
      invalidateEvents();
      resetDialog();
      toast({ title: "Tadbir muvaffaqiyatli yangilandi" });
    },
    onError: () => {
      toast({ title: "Tadbir yangilashda xatolik", variant: "destructive" });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("DELETE", `/api/calendar-events/${id}`),
    onSuccess: () => {
      invalidateEvents();
      toast({ title: "Tadbir muvaffaqiyatli o'chirildi" });
    },
    onError: () => {
      toast({ title: "Tadbir o'chirishda xatolik", variant: "destructive" });
    },
  });

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleSubmit = (data: EventFormValues) => {
    const payload: EventFormValues = {
      ...data,
      targetDepartments: selectedDepartments,
      targetPositions:   [],
    };
    if (editingEvent) {
      updateEventMutation.mutate({ id: editingEvent.id, data: payload });
    } else {
      createEventMutation.mutate(payload);
    }
  };

  const handleEdit = (event: CalendarEvent) => {
    setEditingEvent(event);
    setSelectedDepartments(event.targetDepartments ?? []);
    form.reset({
      title:           event.title,
      titleRu:         event.titleRu,
      description:     event.description     ?? "",
      descriptionRu:   event.descriptionRu   ?? "",
      startDate:       event.startDate ? new Date(event.startDate).toISOString().split("T")[0] : "",
      startTime:       event.startTime  ?? "",
      endDate:         event.endDate   ? new Date(event.endDate).toISOString().split("T")[0]   : "",
      endTime:         event.endTime    ?? "",
      location:        event.location   ?? "",
      eventType:       event.eventType,
      maxParticipants: event.maxParticipants ?? undefined,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => deleteEventMutation.mutate(id);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  if (isError) return <EPErrorState onRetry={refetch}  error={error} />;

  const isPending =
    createEventMutation.isPending || updateEventMutation.isPending;

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      {/* Page header + create dialog trigger */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="ep-h1">{t("tadbirlarKalendari")}</h1>
          <p className="text-muted-foreground">
            {t("oquvTadbirlariVaYigilishlarniBoshqarish")}
          </p>
        </div>
        <EventDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          editingEvent={editingEvent}
          form={form}
          onSubmit={handleSubmit}
          isPending={isPending}
          departments={departments}
          selectedDepartments={selectedDepartments}
          onDepartmentsChange={setSelectedDepartments}
          onCancel={resetDialog}
        />
      </div>

      {/* Stats + event lists */}
      <EventsCalendarGrid
        events={events}
        upcomingEvents={upcomingEvents}
        loadingEvents={loadingEvents}
        isDeletePending={deleteEventMutation.isPending}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
