/**
 * @module EventsCalendarCards
 * @description Individual card-level components for the EventsCalendar page:
 * the upcoming-events card and the all-events table card.  Consumed by
 * EventsCalendarGrid.
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { Calendar, MapPin, Edit } from "lucide-react";
import { format } from "date-fns";
import { CalendarEvent, getEventTypeBadge } from "./EventsCalendarTypes";
import { useTranslation } from '@/lib/i18n';

// ---------------------------------------------------------------------------
// Shared prop shape used by both cards
// ---------------------------------------------------------------------------

interface CardSharedProps {
  isDeletePending: boolean;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Upcoming events card
// ---------------------------------------------------------------------------

export interface UpcomingEventsCardProps extends CardSharedProps {
  upcomingEvents: CalendarEvent[];
}

export function UpcomingEventsCard({
  upcomingEvents,
  isDeletePending,
  onEdit,
  onDelete,
}: UpcomingEventsCardProps) {
  const { t } = useTranslation("common");
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("kelgusiTadbirlar")}</CardTitle>
        <CardDescription>{t("rejalashtirilganTadbirlar")}</CardDescription>
      </CardHeader>
      <CardContent>
        {!upcomingEvents.length ? (
          <div className="text-center py-8 text-[13px] text-muted-foreground">
            {t("kelgusiTadbirlarYoq")}
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingEvents.slice(0, 5).map((event) => {
              const eventType = getEventTypeBadge(event.eventType);
              return (
                <div
                  key={event.id}
                  className="flex items-start justify-between p-3 border rounded-lg hover-elevate"
                  data-testid={`card-event-${event.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold" data-testid={`text-event-title-${event.id}`}>
                        {event.title}
                      </h4>
                      <Badge variant={eventType.variant}>{eventType.label}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1" data-testid={`text-event-desc-${event.id}`}>
                      {event.description || "Tavsif yo'q"}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {event.startDate
                          ? format(new Date(event.startDate), "dd.MM.yyyy")
                          : "—"}
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(event)}
                      data-testid={`button-edit-${event.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <DeleteConfirmDialog
                      title={t("tadbirniOchirishniTasdiqlaysizmi")}
                      description={t("tadbirVaUngaBogliqBarcha")}
                      onConfirm={() => onDelete(event.id)}
                      isPending={isDeletePending}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// All events table card
// ---------------------------------------------------------------------------

export interface AllEventsTableCardProps extends CardSharedProps {
  events: CalendarEvent[];
  loadingEvents: boolean;
}

export function AllEventsTableCard({
  events,
  loadingEvents,
  isDeletePending,
  onEdit,
  onDelete,
}: AllEventsTableCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("barchaTadbirlar")}</CardTitle>
        <CardDescription>{t("toliqTadbirlarRoyxati")}</CardDescription>
      </CardHeader>
      <CardContent>
        {loadingEvents ? (
          <div className="text-center py-8 text-[13px] text-muted-foreground">
            {t("Yuklanmoqda...")}
          </div>
        ) : !events.length ? (
          <div className="text-center py-8 text-[13px] text-muted-foreground">
            {t("hozirchaTadbirlarYoq")}
          </div>
        ) : (
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("progress.title")}</TableHead>
                <TableHead>{t("type")}</TableHead>
                <TableHead>{t("date")}</TableHead>
                <TableHead className="text-right">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.slice(0, 10).map((event) => {
                const eventType = getEventTypeBadge(event.eventType);
                return (
                  <TableRow key={event.id} data-testid={`row-event-${event.id}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell data-testid={`text-event-title-${event.id}`}>
                      {event.title}
                    </TableCell>
                    <TableCell>
                      <Badge variant={eventType.variant}>{eventType.label}</Badge>
                    </TableCell>
                    <TableCell data-testid={`text-event-date-${event.id}`}>
                      {event.startDate
                        ? format(new Date(event.startDate), "dd.MM")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(event)}
                          data-testid={`button-edit-${event.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <DeleteConfirmDialog
                          title={t("tadbirniOchirishniTasdiqlaysizmi")}
                          description={t("tadbirVaUngaBogliqBarcha")}
                          onConfirm={() => onDelete(event.id)}
                          isPending={isDeletePending}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table></div>
        )}
      </CardContent>
    </Card>
  );
}
