/**
 * @module EventsCalendarGrid
 * @description Layout component that composes the stat summary row and the
 * two-column event list section for the EventsCalendar page.
 * Card-level components live in EventsCalendarCards; stat cards are defined
 * inline here as they are small and tightly coupled to this layout.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, MapPin } from "lucide-react";
import { CalendarEvent } from "./EventsCalendarTypes";
import { UpcomingEventsCard, AllEventsTableCard } from "./EventsCalendarCards";

import { tLabel } from '@/lib/i18n/tLabel';
// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface EventsCalendarGridProps {
  events: CalendarEvent[];
  upcomingEvents: CalendarEvent[];
  loadingEvents: boolean;
  isDeletePending: boolean;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Stat cards row
// ---------------------------------------------------------------------------

function StatsCards({
  events,
  upcomingEvents,
}: {
  events: CalendarEvent[];
  upcomingEvents: CalendarEvent[];
}) {
  const stats = [
    {
      label: tLabel('common.EventsCalendarGrid.tsx.jamiTadbirlar', "Jami tadbirlar"),
      value: events.length,
      icon: <Calendar className="h-4 w-4 text-muted-foreground" />,
    },
    {
      label: tLabel('common.EventsCalendarGrid.tsx.kelgusiTadbirlar', "Kelgusi tadbirlar"),
      value: upcomingEvents.length,
      icon: <Clock className="h-4 w-4 text-muted-foreground" />,
    },
    {
      label: tLabel('common.EventsCalendarGrid.tsx.treninglar', "Treninglar"),
      value: events.filter((e) => e.eventType === "training").length,
      icon: <MapPin className="h-4 w-4 text-muted-foreground" />,
    },
    {
      label: "Yig'ilishlar",
      value: events.filter((e) => e.eventType === "meeting").length,
      icon: <MapPin className="h-4 w-4 text-muted-foreground" />,
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-4">
      {stats.map((s) => (
        <Card key={s.label}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{s.label}</CardTitle>
            {s.icon}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{s.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Composed grid export
// ---------------------------------------------------------------------------

/**
 * Renders the stat cards row followed by the two-column upcoming/all events
 * section.
 */
export function EventsCalendarGrid({
  events,
  upcomingEvents,
  loadingEvents,
  isDeletePending,
  onEdit,
  onDelete,
}: EventsCalendarGridProps) {
  return (
    <>
      <StatsCards events={events} upcomingEvents={upcomingEvents} />

      <div className="grid gap-6 lg:grid-cols-2">
        <UpcomingEventsCard
          upcomingEvents={upcomingEvents}
          isDeletePending={isDeletePending}
          onEdit={onEdit}
          onDelete={onDelete}
        />
        <AllEventsTableCard
          events={events}
          loadingEvents={loadingEvents}
          isDeletePending={isDeletePending}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
    </>
  );
}
