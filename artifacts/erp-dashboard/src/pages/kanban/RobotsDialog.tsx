/**
 * @module RobotsDialog
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, Plus, Trash2 } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import type { KanbanColumn, AutomationRobot } from "@shared/schema";
import { type T, type Employee } from "./kanban-types";

export function RobotsDialog({
  open,
  onOpenChange,
  boardId,
  columns,
  employees,
  t,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string | null;
  columns: KanbanColumn[];
  employees: Employee[];
  t: typeof T.uz;
}) {
  const { toast } = useToast();
  const [showAddRobot, setShowAddRobot] = useState(false);
  const [newRobot, setNewRobot] = useState({
    name: "",
    triggerType: "on_create",
    actionType: "move_to_column",
    triggerColumnId: "",
    actionConfig: {} as Record<string, string>,
  });

  const { data: robots = [], refetch } = useQuery<AutomationRobot[]>({
    queryKey: ["/api/kanban/boards", boardId, "robots"],
    enabled: open && !!boardId,
  });

  const createRobotMutation = useMutation({
    mutationFn: async (data: typeof newRobot) => {
      await apiRequest("POST", `/api/kanban/boards/${boardId}/robots`, data);
    },
    onSuccess: () => {
      refetch();
      setShowAddRobot(false);
      setNewRobot({ name: "", triggerType: "on_create", actionType: "move_to_column", triggerColumnId: "", actionConfig: {} });
      toast({ title: "Robot yaratildi", description: "Yangi avtomatizatsiya muvaffaqiyatli qo'shildi" });
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Robotni yaratib bo'lmadi", variant: "destructive" });
    },
  });

  const deleteRobotMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/kanban/robots/${id}`);
    },
    onSuccess: () => {
      refetch();
      toast({ title: "O'chirildi", description: "Robot muvaffaqiyatli o'chirildi" });
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Robotni o'chirib bo'lmadi", variant: "destructive" });
    },
  });

  const triggerTypes = [
    { value: "on_create", label: t.robots.onCreate },
    { value: "on_move", label: t.robots.onMove },
    { value: "on_complete", label: t.robots.onComplete },
    { value: "on_deadline", label: t.robots.onDeadline },
  ];

  const actionTypes = [
    { value: "move_to_column", label: t.robots.moveToColumn },
    { value: "send_notification", label: t.robots.sendNotification },
    { value: "assign_user", label: t.robots.assignUser },
    { value: "add_tag", label: t.robots.addTag },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            {t.robots.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {(Array.isArray(robots) ? robots : []).map((robot) => (
            <div key={robot.id} className="flex items-center justify-between p-3 border rounded-md" data-testid={`robot-${robot.id}`}>
              <div>
                <p className="font-medium">{robot.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(Array.isArray(triggerTypes) ? triggerTypes : []).find(t => t.value === robot.triggerType)?.label} → {actionTypes.find(a => a.value === robot.actionType)?.label}
                </p>
              </div>
              <DeleteConfirmDialog
                title="Robotni o'chirish"
                description="Bu amalni qaytarib bo'lmaydi."
                onConfirm={() => deleteRobotMutation.mutate(robot.id)}
                isPending={deleteRobotMutation.isPending}
              >
                <Button variant="ghost" size="icon" aria-label="O'chirish" data-testid={`button-delete-robot-${robot.id}`}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </DeleteConfirmDialog>
            </div>
          ))}

          {robots.length === 0 && !showAddRobot && (
            <div className="text-center py-8 text-[13px] text-muted-foreground">
              <Bot className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Robotlar yo'q</p>
            </div>
          )}

          {showAddRobot ? (
            <div className="space-y-4 p-4 border rounded-md">
              <div>
                <Label>Nomi</Label>
                <Input
                  value={newRobot.name}
                  onChange={(e) => setNewRobot({ ...newRobot, name: e.target.value })}
                  placeholder="Robot nomi"
                  data-testid="input-robot-name"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>{t.robots.trigger}</Label>
                  <Select value={newRobot.triggerType} onValueChange={(v) => setNewRobot({ ...newRobot, triggerType: v })}>
                    <SelectTrigger data-testid="select-trigger-type" className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Array.isArray(triggerTypes) ? triggerTypes : []).map((tt) => (
                        <SelectItem key={tt.value} value={tt.value}>{tt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>{t.robots.action}</Label>
                  <Select value={newRobot.actionType} onValueChange={(v) => setNewRobot({ ...newRobot, actionType: v })}>
                    <SelectTrigger data-testid="select-action-type" className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Array.isArray(actionTypes) ? actionTypes : []).map((at) => (
                        <SelectItem key={at.value} value={at.value}>{at.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {newRobot.actionType === "move_to_column" && (
                <div>
                  <Label>Maqsad ustun</Label>
                  <Select
                    value={newRobot.actionConfig.targetColumnId || ""}
                    onValueChange={(v) => setNewRobot({ ...newRobot, actionConfig: { ...newRobot.actionConfig, targetColumnId: v } })}
                  >
                    <SelectTrigger data-testid="select-target-column" className="h-9">
                      <SelectValue placeholder="Ustunni tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      {(Array.isArray(columns) ? columns : []).map((col) => (
                        <SelectItem key={col.id} value={col.id}>{col.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {newRobot.actionType === "assign_user" && (
                <div>
                  <Label>Foydalanuvchi</Label>
                  <Select
                    value={newRobot.actionConfig.targetUserId || ""}
                    onValueChange={(v) => setNewRobot({ ...newRobot, actionConfig: { ...newRobot.actionConfig, targetUserId: v } })}
                  >
                    <SelectTrigger data-testid="select-target-user" className="h-9">
                      <SelectValue placeholder="Foydalanuvchini tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      {(Array.isArray(employees) ? employees : []).map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>{emp.fullName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddRobot(false)}>{t.actions.cancel}</Button>
                <Button
                  onClick={() => createRobotMutation.mutate(newRobot)}
                  disabled={!newRobot.name || createRobotMutation.isPending}
                  data-testid="button-save-robot"
                >
                  {t.actions.save}
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" className="w-full" onClick={() => setShowAddRobot(true)} data-testid="button-add-robot">
              <Plus className="h-4 w-4 mr-2" />
              {t.robots.addRobot}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
