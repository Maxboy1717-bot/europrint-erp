/**
 * @module FlowsDialog
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { GitBranch, Plus, Check, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { type T, type Employee, type TaskFlowWithUsers } from "./kanban-types";
import { EPStatusPill } from "@/components/ep";

import { tLabel } from '@/lib/i18n/tLabel';
export function FlowsDialog({
  open,
  onOpenChange,
  boardId,
  employees,
  t,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string | null;
  employees: Employee[];
  t: typeof T.uz & ((key: string) => string);
}) {
  const { toast } = useToast();
  const [flowName, setFlowName] = useState("");
  const [flowType, setFlowType] = useState<"round_robin" | "least_busy" | "random">("round_robin");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const { data: flows = [], refetch } = useQuery<TaskFlowWithUsers[]>({
    queryKey: ['/api/kanban/flows', boardId],
    enabled: open,
  });

  const createFlowMutation = useMutation({
    mutationFn: async (data: { name: string; boardId: string | null; assignmentType: string; userIds: string[] }) => {
      const res = await apiRequest("POST", "/api/kanban/flows", data);
      return res;
    },
    onSuccess: () => {
      refetch();
      setFlowName("");
      setSelectedUserIds([]);
      toast({ title: "Oqim yaratildi", description: tLabel('kanban.FlowsDialog.tsx.yangiOqimMuvaffaqiyatliQoshildi', "Yangi oqim muvaffaqiyatli qo'shildi") });
    },
    onError: () => {
      toast({ title: "Xatolik", description: tLabel('kanban.FlowsDialog.tsx.oqimniYaratibBolmadi', "Oqimni yaratib bo'lmadi"), variant: "destructive" });
    },
  });

  const deleteFlowMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/kanban/flows/${id}`);
      return res;
    },
    onSuccess: () => {
      refetch();
      toast({ title: tLabel('kanban.FlowsDialog.tsx.ochirildi', "O'chirildi"), description: tLabel('kanban.FlowsDialog.tsx.oqimMuvaffaqiyatliOchirildi', "Oqim muvaffaqiyatli o'chirildi") });
    },
    onError: () => {
      toast({ title: "Xatolik", description: tLabel('kanban.FlowsDialog.tsx.oqimniOchiribBolmadi', "Oqimni o'chirib bo'lmadi"), variant: "destructive" });
    },
  });

  const typeLabels: Record<string, string> = {
    round_robin: t.flows.roundRobin,
    least_busy: t.flows.leastBusy,
    random: t.flows.random,
  };

  const toggleUser = (userId: string) => {
    setSelectedUserIds(prev => prev.includes(userId) ? (Array.isArray(prev) ? prev : []).filter(id => id !== userId) : [...prev, userId]);
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            {t.flows.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border p-4 space-y-3 bg-muted/20">
            <h3 className="font-medium">{t.flows.addFlow}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>{t.flows.name}</Label>
                <Input
                  value={flowName}
                  onChange={(e) => setFlowName(e.target.value)}
                  placeholder={t.flows.name}
                  data-testid="input-flow-name"
                />
              </div>
              <div>
                <Label>{t.flows.type}</Label>
                <Select value={flowType} onValueChange={(v) => setFlowType(v as typeof flowType)}>
                  <SelectTrigger data-testid="select-flow-type" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="round_robin">{t.flows.roundRobin}</SelectItem>
                    <SelectItem value="least_busy">{t.flows.leastBusy}</SelectItem>
                    <SelectItem value="random">{t.flows.random}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>{t.flows.users}</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {(Array.isArray(employees) ? employees : []).map((emp) => (
                  <Badge
                    key={emp.id}
                    variant={selectedUserIds.includes(emp.id) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleUser(emp.id)}
                    data-testid={`user-toggle-${emp.id}`}
                  >
                    {emp.fullName}
                    {selectedUserIds.includes(emp.id) && <Check className="h-3 w-3 ml-1" />}
                  </Badge>
                ))}
              </div>
            </div>
            <Button
              onClick={() => createFlowMutation.mutate({
                name: flowName,
                boardId,
                assignmentType: flowType,
                userIds: selectedUserIds,
              })}
              disabled={!flowName.trim() || selectedUserIds.length === 0 || createFlowMutation.isPending}
              data-testid="button-create-flow"
            >
              <Plus className="h-4 w-4 mr-1" />
              {t.flows.addFlow}
            </Button>
          </div>

          <div className="space-y-2">
            {flows.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">{t.flows.noFlows}</div>
            ) : (
              (Array.isArray(flows) ? flows : []).map((flow) => (
                <div
                  key={flow.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover-elevate"
                  data-testid={`flow-item-${flow.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <GitBranch className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{flow.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <EPStatusPill tone="neutral" className="text-xs">{typeLabels[flow.assignmentType]}</EPStatusPill>
                        <span>{flow.users.length} {t.flows.users.toLowerCase()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {flow.users.slice(0, 4).map((u) => (
                        <Avatar key={u.id} className="h-6 w-6 border-2 border-background">
                          <AvatarImage src={u.profileImageUrl || undefined} />
                          <AvatarFallback className="text-[8px]">{String((u as unknown as Record<string,unknown>).fullName ?? (u as unknown as Record<string,unknown>).full_name ?? "?").split(" ").map(n => n[0] ?? "").join("").substring(0, 2).toUpperCase() || "?"}</AvatarFallback>
                        </Avatar>
                      ))}
                      {flow.users.length > 4 && (
                        <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] border-2 border-background">
                          +{flow.users.length - 4}
                        </div>
                      )}
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t("delete")}
                          onClick={() => setConfirmDeleteId(flow.id)}
                          data-testid={`button-delete-flow-${flow.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("delete")}</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <ConfirmDialog
      open={confirmDeleteId !== null}
      onOpenChange={(open) => { if (!open) setConfirmDeleteId(null); }}
      title={t("oqimniOchirish")}
      description={t("ushbuTayinlashOqiminiOchirishniTasdiqlaysizmi")}
      confirmText="O'chirish"
      cancelText="Bekor qilish"
      variant="destructive"
      onConfirm={() => { if (confirmDeleteId !== null) deleteFlowMutation.mutate(confirmDeleteId); }}
    />
    </>
  );
}
