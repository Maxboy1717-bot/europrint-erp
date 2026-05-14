/**
 * @module MESWorkCenters
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { mesApi } from "@/lib/api/mes";
import { ppApi } from "@/lib/api/pp";
import { useToast } from "@/hooks/use-toast";
import {
  Session, WcFormState, SessionFormState, buildEquipmentList,
} from "./MESWorkCentersTypes";
import { WorkCentersHeader, EquipmentGrid } from "./MESWorkCentersSections";
import { CreateWCDialog, CreateSessionDialog } from "./MESWorkCentersDialogs";

export default function MESWorkCenters() {
  const { toast } = useToast();
  const [createWCOpen, setCreateWCOpen]           = useState(false);
  const [createSessionOpen, setCreateSessionOpen] = useState(false);
  const [wcForm, setWcForm]                       = useState<WcFormState>({
    name: "", code: "", type: "machine", capacity: "",
  });
  const [sessionForm, setSessionForm] = useState<SessionFormState>({
    equipmentId: "", targetQuantity: "", orderNumber: "",
  });

  const { data: raw, isLoading, refetch } = useQuery<Session[]>({
    queryKey: ["/api/iot/production-sessions"],
    refetchInterval: 30000,
  });

  const sessions: Session[] = Array.isArray(raw) ? raw : [];
  const equipmentList = buildEquipmentList(sessions);
  const running = equipmentList.filter(e => e.latest.status === "running" || e.latest.status === "active").length;
  const stopped = equipmentList.filter(e => e.latest.status === "stopped" || e.latest.status === "paused").length;

  const createWCMutation = useMutation({
    mutationFn: (data: WcFormState) =>
      ppApi.createWorkCenter({ ...data, capacity: Number(data.capacity) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pp/work-centers"] });
      setCreateWCOpen(false);
      setWcForm({ name: "", code: "", type: "machine", capacity: "" });
      toast({ title: "Ish markazi yaratildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const createSessionMutation = useMutation({
    mutationFn: (data: SessionFormState) =>
      mesApi.createSession({
        equipmentId:    data.equipmentId,
        targetQuantity: Number(data.targetQuantity),
        orderNumber:    data.orderNumber,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/iot/production-sessions"] });
      setCreateSessionOpen(false);
      setSessionForm({ equipmentId: "", targetQuantity: "", orderNumber: "" });
      toast({ title: "Sessiya yaratildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const handleNewSessionForStopped = (form: SessionFormState) => {
    setSessionForm(form);
    createSessionMutation.mutate(form);
  };

  return (
    <div className="flex flex-col flex-1 overflow-auto p-5 lg:p-6 gap-5">
      <WorkCentersHeader
        running={running}
        stopped={stopped}
        total={equipmentList.length}
        onRefresh={() => refetch()}
        onCreateWC={() => setCreateWCOpen(true)}
        onCreateSession={() => setCreateSessionOpen(true)}
      />

      <EquipmentGrid
        isLoading={isLoading}
        equipmentList={equipmentList}
        onCreateSession={() => setCreateSessionOpen(true)}
        onNewSessionForStopped={handleNewSessionForStopped}
      />

      <CreateWCDialog
        open={createWCOpen}
        onOpenChange={setCreateWCOpen}
        form={wcForm}
        onChange={patch => setWcForm(p => ({ ...p, ...patch }))}
        onSubmit={() => createWCMutation.mutate(wcForm)}
        isPending={createWCMutation.isPending}
      />

      <CreateSessionDialog
        open={createSessionOpen}
        onOpenChange={setCreateSessionOpen}
        form={sessionForm}
        onChange={patch => setSessionForm(p => ({ ...p, ...patch }))}
        onSubmit={() => createSessionMutation.mutate(sessionForm)}
        isPending={createSessionMutation.isPending}
      />
    </div>
  );
}
