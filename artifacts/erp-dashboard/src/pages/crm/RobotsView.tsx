import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Bot,
  Edit,
  Trash2,
  Loader2,
  Settings,
  Save,
  Zap,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { RobotsViewProps, Robot, RobotFormData } from "./crm-types";
import { TRIGGER_TYPES, ACTION_TYPES, ENTITY_COLORS, DEFAULT_ROBOT_FORM } from "./crm-types";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const robotFormSchema = z.object({
  name: z.string().min(1, "Robot nomini kiriting"),
  description: z.string().optional(),
  entityType: z.string().min(1, "Obyekt turini tanlang"),
  triggerType: z.string().min(1, "Trigger turini tanlang"),
  triggerConditions: z.record(z.unknown()).default({}),
  actionType: z.string().min(1, "Harakat turini tanlang"),
  actionConfig: z.record(z.unknown()).default({}),
  isActive: z.boolean().default(true),
});

type RobotFormValues = z.infer<typeof robotFormSchema>;

export function RobotsView({ robots, isLoading }: RobotsViewProps) {
  const { toast } = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRobot, setEditingRobot] = useState<Robot | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [entityFilter, setEntityFilter] = useState<string>("all");

  const form = useForm<RobotFormValues>({
    resolver: zodResolver(robotFormSchema),
    defaultValues: DEFAULT_ROBOT_FORM,
  });

  const toggleMutation = useMutation({
    mutationFn: async (robotId: number) => {
      return apiRequest("POST", `/api/crm-bitrix/robots/${robotId}/toggle`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm-bitrix/robots"] });
      toast({ title: "Robot holati o'zgartirildi" });
    },
    onError: () => {
      toast({ title: "Xatolik yuz berdi", variant: "destructive" });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: RobotFormData) => apiRequest("POST", "/api/crm-bitrix/robots", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm-bitrix/robots"] });
      toast({ title: "Robot yaratildi" });
      setShowCreateModal(false);
      form.reset(DEFAULT_ROBOT_FORM);
    },
    onError: () => {
      toast({ title: "Robot yaratishda xatolik", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<RobotFormData> }) => apiRequest("PATCH", `/api/crm-bitrix/robots/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm-bitrix/robots"] });
      toast({ title: "Robot yangilandi" });
      setEditingRobot(null);
      form.reset(DEFAULT_ROBOT_FORM);
    },
    onError: () => {
      toast({ title: "Robot yangilashda xatolik", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (robotId: number) => apiRequest("DELETE", `/api/crm-bitrix/robots/${robotId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm-bitrix/robots"] });
      toast({ title: "Robot o'chirildi" });
    },
    onError: () => {
      toast({ title: "Robot o'chirishda xatolik", variant: "destructive" });
    },
  });

  const handleEditClick = (robot: Robot) => {
    setEditingRobot(robot);
    form.reset({
      name: robot.name,
      description: robot.description || "",
      entityType: robot.entityType,
      triggerType: robot.triggerType,
      triggerConditions: (robot.triggerConditions as Record<string, unknown>) || {},
      actionType: robot.actionType,
      actionConfig: (robot.actionConfig as Record<string, unknown>) || {},
      isActive: robot.isActive,
    });
  };

  const onSubmit = (values: RobotFormValues) => {
    if (editingRobot) {
      updateMutation.mutate({ id: editingRobot.id, data: values });
    } else {
      createMutation.mutate(values as RobotFormData);
    }
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingRobot(null);
    form.reset(DEFAULT_ROBOT_FORM);
  };

  const getTriggerIcon = (triggerType: string) => {
    const trigger = TRIGGER_TYPES.find(t => t.value === triggerType);
    return trigger?.icon || Zap;
  };

  const getTriggerLabel = (triggerType: string) => {
    const trigger = TRIGGER_TYPES.find(t => t.value === triggerType);
    return trigger?.label || triggerType;
  };

  const getActionIcon = (actionType: string) => {
    const action = ACTION_TYPES.find(a => a.value === actionType);
    return action?.icon || Settings;
  };

  const getActionLabel = (actionType: string) => {
    const action = ACTION_TYPES.find(a => a.value === actionType);
    return action?.label || actionType;
  };

  const getEntityLabel = (entityType: string) => {
    const labels: Record<string, string> = {
      leads: "Lidlar",
      deals: "Bitimlar",
      contacts: "Kontaktlar",
      companies: "Kompaniyalar",
    };
    return labels[entityType] || entityType;
  };

  const filteredRobots = entityFilter === "all" 
    ? robots 
    : (Array.isArray(robots) ? robots : []).filter(r => r.entityType === entityFilter);

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {([1, 2, 3]).map(i => (
            <Skeleton key={`k-${i}`} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
        <div className="flex items-center gap-2">
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="w-40" data-testid="select-entity-filter">
              <SelectValue placeholder="Barchasi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barchasi</SelectItem>
              <SelectItem value="leads">Lidlar</SelectItem>
              <SelectItem value="deals">Bitimlar</SelectItem>
              <SelectItem value="contacts">Kontaktlar</SelectItem>
              <SelectItem value="companies">Kompaniyalar</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="secondary">{filteredRobots.length} ta robot</Badge>
        </div>
        <Button onClick={() => setShowCreateModal(true)} data-testid="button-new-robot">
          <Plus className="h-4 w-4 mr-2" />
          Yangi robot
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredRobots.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Bot className="h-12 w-12 mb-4 opacity-50" />
            <p className="font-medium">Robotlar topilmadi</p>
            <p className="text-sm">Avtomatlashtirish qoidalarini bu yerda boshqaring</p>
            <Button 
              onClick={() => setShowCreateModal(true)} 
              className="mt-4"
              data-testid="button-create-first-robot"
            >
              <Plus className="h-4 w-4 mr-2" />
              Birinchi robotni yaratish
            </Button>
          </div>
        ) : (
          (Array.isArray(filteredRobots) ? filteredRobots : []).map((robot: Robot) => {
            const TriggerIcon = getTriggerIcon(robot.triggerType);
            const ActionIcon = getActionIcon(robot.actionType);

            return (
              <Card 
                key={robot.id} 
                className={cn("p-4", ENTITY_COLORS[robot.entityType] || "")} 
                data-testid={`card-robot-${robot.id}`}
              >
                <div className="flex items-start justify-between mb-3 gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className={cn(
                      "p-2 rounded-lg shrink-0",
                      robot.isActive 
                        ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" 
                        : "bg-surface-container-low text-on-surface-variant dark:bg-gray-800 dark:text-on-surface-variant"
                    )}>
                      <Bot className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium truncate">{robot.name}</h3>
                      <p className="text-xs text-muted-foreground">{getEntityLabel(robot.entityType)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Switch
                      checked={robot.isActive}
                      onCheckedChange={() => toggleMutation.mutate(robot.id)}
                      data-testid={`switch-robot-${robot.id}`}
                    />
                  </div>
                </div>

                {robot.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{robot.description}</p>
                )}

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs bg-muted/50 p-2 rounded">
                    <TriggerIcon className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    <span className="truncate">{getTriggerLabel(robot.triggerType)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs bg-muted/50 p-2 rounded">
                    <ActionIcon className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                    <span className="truncate">{getActionLabel(robot.actionType)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <Badge variant={robot.isActive ? "default" : "secondary"} className="text-xs">
                    {robot.isActive ? "Faol" : "O'chirilgan"}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Button 
                      size="icon" 
                      variant="ghost"
                      onClick={() => handleEditClick(robot)}
                      data-testid={`button-edit-robot-${robot.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost"
                      onClick={() => setDeleteId(String(robot.id))}
                      data-testid={`button-delete-robot-${robot.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      <Dialog open={showCreateModal || !!editingRobot} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRobot ? "Robotni tahrirlash" : "Yangi robot yaratish"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nomi *</Label>
              <Input {...form.register("name")} placeholder="Robot nomi" data-testid="input-robot-name" />
              {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Tavsif</Label>
              <Textarea {...form.register("description")} placeholder="Robot haqida qisqacha ma'lumot" rows={3} data-testid="input-robot-description" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Obyekt turi *</Label>
                <Controller control={form.control} name="entityType" render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger data-testid="select-entity-type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="leads">Lidlar</SelectItem>
                      <SelectItem value="deals">Bitimlar</SelectItem>
                      <SelectItem value="contacts">Kontaktlar</SelectItem>
                      <SelectItem value="companies">Kompaniyalar</SelectItem>
                    </SelectContent>
                  </Select>
                )} />
              </div>
              <div className="space-y-2">
                <Label>Trigger turi *</Label>
                <Controller control={form.control} name="triggerType" render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger data-testid="select-trigger-type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Array.isArray(TRIGGER_TYPES) ? TRIGGER_TYPES : []).map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )} />
              </div>
            </div>

            {form.watch("triggerType") === "TIME_ELAPSED" && (
              <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                <Label>Vaqt (soatda)</Label>
                <Input
                  type="number"
                  value={(form.watch("triggerConditions")?.hours as number) || 24}
                  onChange={(e) => form.setValue("triggerConditions", { ...form.getValues("triggerConditions"), hours: parseInt(e.target.value) || 24 })}
                  placeholder="24" min={1} data-testid="input-time-elapsed-hours"
                />
                <p className="text-xs text-muted-foreground">Necha soat faoliyatsizlikdan keyin ishga tushadi</p>
              </div>
            )}

            {form.watch("triggerType") === "FIELD_CHANGED" && (
              <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                <Label>Maydon nomi</Label>
                <Input
                  value={(form.watch("triggerConditions")?.fieldName as string) || ""}
                  onChange={(e) => form.setValue("triggerConditions", { ...form.getValues("triggerConditions"), fieldName: e.target.value })}
                  placeholder="status, title, budget..." data-testid="input-field-name"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Harakat turi *</Label>
              <Controller control={form.control} name="actionType" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger data-testid="select-action-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Array.isArray(ACTION_TYPES) ? ACTION_TYPES : []).map(a => (
                      <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
            </div>

            {form.watch("actionType") === "SEND_NOTIFICATION" && (
              <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                <Label>Xabar matni</Label>
                <Textarea
                  value={(form.watch("actionConfig")?.message as string) || ""}
                  onChange={(e) => form.setValue("actionConfig", { ...form.getValues("actionConfig"), message: e.target.value })}
                  placeholder="Xabar matni..." rows={2} data-testid="input-notification-message"
                />
              </div>
            )}

            {form.watch("actionType") === "CREATE_TASK" && (
              <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                <div className="space-y-2">
                  <Label>Vazifa sarlavhasi</Label>
                  <Input
                    value={(form.watch("actionConfig")?.taskTitle as string) || ""}
                    onChange={(e) => form.setValue("actionConfig", { ...form.getValues("actionConfig"), taskTitle: e.target.value })}
                    placeholder="Vazifa sarlavhasi" data-testid="input-task-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vazifa tavsifi</Label>
                  <Textarea
                    value={(form.watch("actionConfig")?.taskDescription as string) || ""}
                    onChange={(e) => form.setValue("actionConfig", { ...form.getValues("actionConfig"), taskDescription: e.target.value })}
                    placeholder="Vazifa tavsifi" rows={2} data-testid="input-task-description"
                  />
                </div>
              </div>
            )}

            {form.watch("actionType") === "CHANGE_STAGE" && (
              <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                <Label>Yangi bosqich ID</Label>
                <Input
                  value={(form.watch("actionConfig")?.newStageId as string) || ""}
                  onChange={(e) => form.setValue("actionConfig", { ...form.getValues("actionConfig"), newStageId: e.target.value })}
                  placeholder="NEW, IN_PROGRESS, C0:NEW..." data-testid="input-new-stage"
                />
              </div>
            )}

            {form.watch("actionType") === "SEND_EMAIL" && (
              <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                <div className="space-y-2">
                  <Label>Email mavzusi</Label>
                  <Input
                    value={(form.watch("actionConfig")?.emailSubject as string) || ""}
                    onChange={(e) => form.setValue("actionConfig", { ...form.getValues("actionConfig"), emailSubject: e.target.value })}
                    placeholder="Email mavzusi" data-testid="input-email-subject"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email matni</Label>
                  <Textarea
                    value={(form.watch("actionConfig")?.emailBody as string) || ""}
                    onChange={(e) => form.setValue("actionConfig", { ...form.getValues("actionConfig"), emailBody: e.target.value })}
                    placeholder="Email matni" rows={3} data-testid="input-email-body"
                  />
                </div>
              </div>
            )}

            {form.watch("actionType") === "SEND_TELEGRAM" && (
              <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                <Label>Telegram xabar matni</Label>
                <Textarea
                  value={(form.watch("actionConfig")?.telegramMessage as string) || ""}
                  onChange={(e) => form.setValue("actionConfig", { ...form.getValues("actionConfig"), telegramMessage: e.target.value })}
                  placeholder="Telegram xabar matni" rows={2} data-testid="input-telegram-message"
                />
              </div>
            )}

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <Label>Faol holat</Label>
                <p className="text-xs text-muted-foreground">Robot yaratilgandan keyin ishga tushadi</p>
              </div>
              <Controller control={form.control} name="isActive" render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-robot-active" />
              )} />
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                Bekor qilish
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-robot">
                {(createMutation.isPending || updateMutation.isPending) ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saqlanmoqda...</>
                ) : (
                  <><Save className="h-4 w-4 mr-2" />{editingRobot ? "Yangilash" : "Yaratish"}</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => { if (!v) setDeleteId(null); }}
        title="Robotni o'chirish"
        description="Ushbu CRM robotni o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi."
        confirmText="O'chirish"
        variant="destructive"
        onConfirm={() => { if (deleteId) { deleteMutation.mutate(Number(deleteId)); setDeleteId(null); } }}
      />
    </div>
  );
}
