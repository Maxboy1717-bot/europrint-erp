import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PRIORITY_OPTIONS } from "./types";

interface TaskFormProps {
  entityType: string;
  entityId: number;
  onActivityCreated?: () => void;
}

export function TaskForm({ entityType, entityId, onActivityCreated }: TaskFormProps) {
  const { toast } = useToast();
  const [taskForm, setTaskForm] = useState({
    title: "",
    dueDate: new Date(),
    responsibleId: "",
    priority: "medium" as string,
    description: "",
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      return apiRequest("POST", "/api/crm/tasks", {
        ...data,
        entityType,
        entityId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/activities", entityType, entityId] });
      toast({ title: "Vazifa yaratildi" });
      onActivityCreated?.();
      setTaskForm({ title: "", dueDate: new Date(), responsibleId: "", priority: "medium", description: "" });
    },
  });

  return (
    <div className="space-y-3 p-4">
      <Input
        placeholder="Vazifa nomi"
        value={taskForm.title}
        onChange={(e) => setTaskForm((prev) => ({ ...prev, title: e.target.value }))}
        data-testid="input-task-title"
      />
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs text-muted-foreground">Muddat</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start" data-testid="button-task-due-date">
                <CalendarIcon className="h-3.5 w-3.5 mr-2" />
                {format(taskForm.dueDate, "dd MMM yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={taskForm.dueDate}
                onSelect={(date) => date && setTaskForm((prev) => ({ ...prev, dueDate: date }))}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Muhimlik</Label>
          <Select
            value={taskForm.priority}
            onValueChange={(value) => setTaskForm((prev) => ({ ...prev, priority: value }))}
          >
            <SelectTrigger data-testid="select-task-priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Array.isArray(PRIORITY_OPTIONS) ? PRIORITY_OPTIONS : []).map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <span className={option.color}>{option.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button
        className="w-full bg-blue-500 hover:bg-blue-600"
        onClick={() => createTaskMutation.mutate(taskForm)}
        disabled={!taskForm.title || createTaskMutation.isPending}
        data-testid="button-save-task"
      >
        <Plus className="h-4 w-4 mr-2" />
        Vazifa yaratish
      </Button>
    </div>
  );
}
