/**
 * @module CallForm
 * @description React UI component.
 */

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ACTIVITY_TYPE_OPTIONS } from "./types";

interface CallFormProps {
  entityType: string;
  entityId: number;
  onActivityCreated?: () => void;
}

export function CallForm({ entityType, entityId, onActivityCreated }: CallFormProps) {
  const { toast } = useToast();
  const [activityForm, setActivityForm] = useState({
    subject: "",
    type: "call" as string,
    deadline: new Date(),
    description: "",
  });

  const createActivityMutation = useMutation({
    mutationFn: async (data: typeof activityForm) => {
      const payload: Record<string, unknown> = {
        type:      data.type,
        subject:   data.subject,
        notes:     data.description || undefined,
        due_date:  data.deadline.toISOString(),
      };
      if (entityType === "leads")  payload.lead_id  = entityId;
      else if (entityType === "deals") payload.deal_id = entityId;
      return apiRequest("POST", "/api/crm/activities", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/activities", entityType, entityId] });
      toast({ title: "Faoliyat yaratildi" });
      onActivityCreated?.();
      setActivityForm({ subject: "", type: "call", deadline: new Date(), description: "" });
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Faoliyat yaratishda xatolik", variant: "destructive" });
    },
  });

  return (
    <div className="space-y-3 p-4">
      <Input
        placeholder="Nima qilish kerak?"
        value={activityForm.subject}
        onChange={(e) => setActivityForm((prev) => ({ ...prev, subject: e.target.value }))}
        className="border-blue-500/30 focus:border-blue-500"
        data-testid="input-activity-subject"
      />
      <div className="flex items-center gap-2 flex-wrap">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" data-testid="button-activity-date">
              <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
              {format(activityForm.deadline, "dd MMM")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={activityForm.deadline}
              onSelect={(date) => date && setActivityForm((prev) => ({ ...prev, deadline: date }))}
            />
          </PopoverContent>
        </Popover>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setActivityForm((prev) => ({ ...prev, deadline: new Date() }))}
          data-testid="button-today"
        >
          Bugun
        </Button>
        <Select
          value={activityForm.type}
          onValueChange={(value) => setActivityForm((prev) => ({ ...prev, type: value }))}
        >
          <SelectTrigger className="w-full sm:w-[140px] h-9" data-testid="select-activity-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Array.isArray(ACTIVITY_TYPE_OPTIONS) ? ACTIVITY_TYPE_OPTIONS : []).map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <option.icon className="h-3.5 w-3.5" />
                  {option.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Textarea
        placeholder="Qo'shimcha ma'lumot..."
        value={activityForm.description}
        onChange={(e) => setActivityForm((prev) => ({ ...prev, description: e.target.value }))}
        className="min-h-[60px] resize-none"
        data-testid="input-activity-description"
      />
      <Button
        className="w-full bg-blue-500 hover:bg-[var(--ep-blue)]/90"
        onClick={() => createActivityMutation.mutate(activityForm)}
        disabled={!activityForm.subject || createActivityMutation.isPending}
        data-testid="button-save-activity"
      >
        <Plus className="h-4 w-4 mr-2" />
        Saqlash
      </Button>
    </div>
  );
}
