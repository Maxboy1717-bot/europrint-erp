/**
 * @module CalendarEventsPage
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ModulePage } from "@/components/ui/module-page";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Plus, MapPin } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EPErrorState } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

interface CalendarEvent {
  id: string | number;
  title?: string;
  description?: string;
  startDate?: string;
  start_date?: string;
  endDate?: string;
  end_date?: string;
  allDay?: boolean;
  all_day?: boolean;
  eventType?: string;
  event_type?: string;
  location?: string;
  attendees?: unknown[];
  createdBy?: string;
  created_by?: string;
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  general:  "bg-blue-100 text-[var(--ep-blue)]",
  holiday:  "bg-green-100 text-[var(--ep-green)]",
  meeting:  "bg-purple-100 text-[var(--ep-purple)]",
  training: "bg-amber-100 text-[var(--ep-yellow)]",
  deadline: "bg-red-100 text-[var(--ep-red)]",
  other:    "bg-gray-100 text-gray-600",
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  general:  "Umumiy",
  holiday:  "Dam olish",
  meeting:  "Yig'ilish",
  training: "Trening",
  deadline: "Muddat",
  other:    "Boshqa",
};

const QUERY_KEY = ["/api/calendar-events"];

export default function CalendarEventsPage() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [typeFilter, setTypeFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    startDate: new Date().toISOString().slice(0, 16),
    endDate: "",
    eventType: "general",
    location: "",
    allDay: false,
  });

  const { data: rawData, isLoading, isError, error, refetch } = useQuery<
    CalendarEvent[] | { data?: CalendarEvent[] }
  >({
    queryKey: [...QUERY_KEY, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.set("type", typeFilter);
      return await apiRequest("GET", `/api/calendar-events?${params}`);
    },
  });

  const events: CalendarEvent[] = Array.isArray(rawData)
    ? rawData
    : (rawData as { data?: CalendarEvent[] })?.data ?? [];

  const createMutation = useMutation({
    mutationFn: async (dto: typeof form) => {
      return await apiRequest("POST", "/api/calendar-events", {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate).toISOString() : new Date().toISOString(),
        endDate:   dto.endDate   ? new Date(dto.endDate).toISOString() : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast({ title: "Tadbir qo'shildi" });
      setShowCreate(false);
      setForm({ title: "", description: "", startDate: new Date().toISOString().slice(0, 16), endDate: "", eventType: "general", location: "", allDay: false });
    },
    onError: () => toast({ title: "Xatolik", description: "Yaratishda muammo", variant: "destructive" }),
  });

  if (isError) return <EPErrorState onRetry={refetch}  error={error} />;

  return (
    <ModulePage
      module="hr"
      title={t("taqvimTadbirlari")}
      icon={<Calendar className="h-5 w-5" />}
      actions={
        <Button onClick={() => setShowCreate(true)} data-testid="button-create-event">
          <Plus className="h-4 w-4 mr-2" />
          {t("tadbirQoshish")}
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="flex gap-1.5 flex-wrap">
          {["all", "general", "meeting", "training", "holiday", "deadline"].map(t => (
            <Button
              key={t}
              variant={typeFilter === t ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setTypeFilter(t)}
              data-testid={`filter-${t}`}
            >
              {t === "all" ? "Barchasi" : (EVENT_TYPE_LABELS[t] ?? t)}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={`k-${i}`}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48 rounded-lg" />
                    <Skeleton className="h-3 w-32 rounded-lg" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-lg" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : events.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t("tadbirlarTopilmadi")}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {events.map(e => {
              const eType   = e.eventType ?? e.event_type ?? "general";
              const start   = e.startDate ?? e.start_date;
              const end     = e.endDate ?? e.end_date;
              const allDay  = e.allDay ?? e.all_day;
              const typeClr = EVENT_TYPE_COLORS[eType] ?? EVENT_TYPE_COLORS.other;
              return (
                <Card key={e.id} className="hover:shadow-md transition-shadow" data-testid={`card-event-${e.id}`}>
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{e.title ?? "—"}</p>
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${typeClr}`}>
                          {EVENT_TYPE_LABELS[eType] ?? eType}
                        </span>
                        {allDay && (
                          <Badge variant="outline" className="text-xs">{t("butunKun")}</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                        {start && (
                          <span>📅 {new Date(start).toLocaleString("uz-UZ", { dateStyle: "short", timeStyle: allDay ? undefined : "short" })}</span>
                        )}
                        {end && !allDay && (
                          <span>— {new Date(end).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}</span>
                        )}
                        {e.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {e.location}
                          </span>
                        )}
                        {Array.isArray(e.attendees) && e.attendees.length > 0 && (
                          <span>👥 {e.attendees.length} ishtirokchi</span>
                        )}
                      </div>
                      {e.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{e.description}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">{t("yangiTadbir")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>{t("tadbirNomi1")}</Label>
              <Input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder={t("tadbirNomi")}
                data-testid="input-event-title"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("boshlanish2")}</Label>
                <Input
                  type="datetime-local"
                  value={form.startDate}
                  onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                  data-testid="input-event-start"
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("tugash")}</Label>
                <Input
                  type="datetime-local"
                  value={form.endDate}
                  onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                  data-testid="input-event-end"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("tur")}</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={form.eventType}
                  onChange={e => setForm(f => ({ ...f, eventType: e.target.value }))}
                  data-testid="select-event-type"
                >
                  {Object.entries(EVENT_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("joy")}</Label>
                <Input
                  value={form.location}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  placeholder={t("tadbirJoyi")}
                  data-testid="input-event-location"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t("progress.description")}</Label>
              <Textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2}
                placeholder={t("tadbirHaqida")}
                data-testid="input-event-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>{t("Bekor")}</Button>
            <Button
              onClick={() => { if (form.title.trim()) createMutation.mutate(form); }}
              disabled={!form.title.trim() || createMutation.isPending}
              data-testid="button-confirm-create-event"
            >
              {createMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ModulePage>
  );
}
