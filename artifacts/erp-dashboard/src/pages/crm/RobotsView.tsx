/**
 * @module RobotsView
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Bot } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { RobotsViewProps, Robot, RobotFormData, RobotFormValues } from "./RobotsViewTypes";
import { robotFormSchema, DEFAULT_ROBOT_FORM } from "./RobotsViewTypes";
import { RobotCard } from "./RobotsViewSections";
import { RobotFormDialog } from "./RobotsViewDialog";
import { EPStatusPill } from "@/components/ep";

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
    mutationFn: async (robotId: number) =>
      apiRequest("PATCH", `/api/crm-bitrix/robots/${robotId}/toggle`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm-bitrix/robots"] });
      toast({ title: "Robot holati o'zgartirildi" });
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  const createMutation = useMutation({
    mutationFn: async (data: RobotFormData) =>
      apiRequest("POST", "/api/crm-bitrix/robots", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm-bitrix/robots"] });
      toast({ title: "Robot yaratildi" });
      setShowCreateModal(false);
      form.reset(DEFAULT_ROBOT_FORM);
    },
    onError: () => toast({ title: "Robot yaratishda xatolik", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<RobotFormData> }) =>
      apiRequest("PUT", `/api/crm-bitrix/robots/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm-bitrix/robots"] });
      toast({ title: "Robot yangilandi" });
      setEditingRobot(null);
      form.reset(DEFAULT_ROBOT_FORM);
    },
    onError: () => toast({ title: "Robot yangilashda xatolik", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (robotId: number) =>
      apiRequest("DELETE", `/api/crm-bitrix/robots/${robotId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm-bitrix/robots"] });
      toast({ title: "Robot o'chirildi" });
    },
    onError: () => toast({ title: "Robot o'chirishda xatolik", variant: "destructive" }),
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

  const filteredRobots = entityFilter === "all"
    ? robots
    : (Array.isArray(robots) ? robots : []).filter(r => r.entityType === entityFilter);

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {([1, 2, 3]).map(i => (
            <Skeleton key={`k-${i}`} className="h-48 w-full rounded-lg" />
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
            <SelectTrigger className="w-40 h-9" data-testid="select-entity-filter">
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
          <EPStatusPill tone="neutral">{filteredRobots.length} ta robot</EPStatusPill>
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
          (Array.isArray(filteredRobots) ? filteredRobots : []).map((robot: Robot) => (
            <RobotCard
              key={robot.id}
              robot={robot}
              onToggle={(id) => toggleMutation.mutate(id)}
              onEdit={handleEditClick}
              onDelete={setDeleteId}
            />
          ))
        )}
      </div>

      <RobotFormDialog
        open={showCreateModal || !!editingRobot}
        editingRobot={editingRobot}
        form={form}
        isSaving={createMutation.isPending || updateMutation.isPending}
        onClose={handleCloseModal}
        onSubmit={onSubmit}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => { if (!v) setDeleteId(null); }}
        title="Robotni o'chirish"
        description="Ushbu CRM robotni o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi."
        confirmText="O'chirish"
        variant="destructive"
        onConfirm={() => {
          if (deleteId) {
            deleteMutation.mutate(Number(deleteId));
            setDeleteId(null);
          }
        }}
      />
    </div>
  );
}
