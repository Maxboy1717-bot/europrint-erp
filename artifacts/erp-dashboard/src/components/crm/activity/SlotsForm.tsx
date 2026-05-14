/**
 * @module SlotsForm
 * @description React UI component.
 */

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { TIME_SLOTS, MEETING_DURATIONS } from "./types";
import { useTranslation } from '@/lib/i18n';

interface SlotsFormProps {
  entityType: string;
  entityId: number;
  onActivityCreated?: () => void;
}

export function SlotsForm({ entityType, entityId, onActivityCreated }: SlotsFormProps) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [meetingForm, setMeetingForm] = useState({
    date: new Date(),
    slot: "",
    duration: "30",
    location: "",
    notifyClient: true,
  });

  const scheduleMeetingMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      return apiRequest("POST", "/api/crm/meetings/schedule", {
        ...data,
        entityType,
        entityId,
      });
    },
    onSuccess: () => {
      toast({ title: "Uchrashuv rejalashtirildi" });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/activities", entityType, entityId] });
      onActivityCreated?.();
      setMeetingForm({ date: new Date(), slot: "", duration: "30", location: "", notifyClient: true });
    },
  });

  return (
    <div className="space-y-3 p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">{t("date")}</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start h-9 gap-2" data-testid="button-meeting-date">
                <CalendarIcon className="h-3.5 w-3.5" />
                {format(meetingForm.date, "dd.MM.yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={meetingForm.date}
                onSelect={(date) => date && setMeetingForm((prev) => ({ ...prev, date }))}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">{t("time")}</Label>
          <Select
            value={meetingForm.slot}
            onValueChange={(value) => setMeetingForm((prev) => ({ ...prev, slot: value }))}
          >
            <SelectTrigger className="h-9" data-testid="select-meeting-time">
              <SelectValue placeholder={t("time")} />
            </SelectTrigger>
            <SelectContent>
              {(Array.isArray(TIME_SLOTS) ? TIME_SLOTS : []).map((slot) => (
                <SelectItem key={slot} value={slot}>{slot}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">{t("davomiyligi")}</Label>
          <Select
            value={meetingForm.duration}
            onValueChange={(value) => setMeetingForm((prev) => ({ ...prev, duration: value }))}
          >
            <SelectTrigger className="h-9" data-testid="select-meeting-duration">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Array.isArray(MEETING_DURATIONS) ? MEETING_DURATIONS : []).map((d) => (
                <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">{t("location")}</Label>
          <Input
            value={meetingForm.location}
            onChange={(e) => setMeetingForm((prev) => ({ ...prev, location: e.target.value }))}
            placeholder="Ofis / Onlayn"
            className="h-9"
            data-testid="input-meeting-location"
          />
        </div>
      </div>
      <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg border border-border">
        <div className="space-y-0.5">
          <Label className="text-xs font-medium">{t("mijozniOgohlantirish")}</Label>
          <p className="text-[10px] text-muted-foreground">{t("smsVaEmailOrqaliEslatma")}</p>
        </div>
        <Switch
          checked={meetingForm.notifyClient}
          onCheckedChange={(checked) => setMeetingForm((prev) => ({ ...prev, notifyClient: checked }))}
          data-testid="switch-meeting-notify"
        />
      </div>
      <Button
        className="w-full bg-blue-500 hover:bg-[var(--ep-blue)]/90"
        onClick={() => scheduleMeetingMutation.mutate(meetingForm)}
        disabled={!meetingForm.slot || scheduleMeetingMutation.isPending}
        data-testid="button-save-meeting"
      >
        <CalendarIcon className="h-4 w-4 mr-2" />
        {t("rejalashtirish")}
      </Button>
    </div>
  );
}
