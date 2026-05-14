/**
 * @module OffboardingTab
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ShieldAlert, UserX } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { OffboardingCase } from "./OffboardingTabTypes";
import { ExitInterviewForm } from "./OffboardingTabDialogs";
import {
  CaseOverviewCard,
  ExitInterviewCard,
  EquipmentReturnCard,
  FullChecklistCard,
} from "./OffboardingTabSections";

export function OffboardingTab({ employeeId }: { employeeId: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showInterviewForm, setShowInterviewForm] = useState(false);
  const numericId = parseInt(employeeId);

  const { data: offboardingCase, isLoading, isError } = useQuery<OffboardingCase | null>({
    queryKey: ["/api/hr/offboarding/cases", numericId, "byEmployee"],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/hr/offboarding/cases/employee/${numericId}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch");
      const base = await res.json() as OffboardingCase;
      const detailRes = await apiRequest('GET', `/api/hr/offboarding/cases/${base.id}`);
      if (!detailRes.ok) return base;
      return detailRes.json() as Promise<OffboardingCase>;
    },
  });

  const markItem = useMutation({
    mutationFn: ({ caseId, itemId, done, returnStatus }: {
      caseId: number; itemId: number; done?: boolean; returnStatus?: string;
    }) =>
      apiRequest("PATCH", `/api/hr/offboarding/cases/${caseId}/checklist/${itemId}`, { done, returnStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/offboarding/cases", numericId, "byEmployee"] });
      toast({ title: "Yangilandi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const finalizeCase = useMutation({
    mutationFn: (caseId: number) =>
      apiRequest("POST", `/api/hr/offboarding/cases/${caseId}/finalize`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/offboarding/cases", numericId, "byEmployee"] });
      toast({ title: "Offboarding yakunlandi" });
    },
    onError: (err: Error) => {
      const msg = err?.message?.includes("EXIT_INTERVIEW_REQUIRED")
        ? "Avval chiqish suhbatini o'tkazing"
        : err?.message?.includes("EXIT_INTERVIEW_INCOMPLETE")
        ? "Suhbatning barcha savollari to'ldirilmagan"
        : "Xatolik yuz berdi";
      toast({ title: msg, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  if (isError || !offboardingCase) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
        <UserX className="h-14 w-14 opacity-10" />
        <p className="text-sm">Offboarding jarayoni topilmadi</p>
        <p className="text-xs text-muted-foreground/60">Bu xodim uchun hali offboarding boshlangmagan</p>
      </div>
    );
  }

  const oCase = offboardingCase;
  const pct = oCase.total_items > 0
    ? Math.round((oCase.completed_items / oCase.total_items) * 100)
    : 0;
  const checklist = Array.isArray(oCase.checklist) ? oCase.checklist : [];
  const equipmentItems = checklist.filter(i =>
    ["equipment_returned", "id_card_returned"].includes(i.item_key)
  );

  return (
    <div className="space-y-5 p-4">
      <CaseOverviewCard oCase={oCase} pct={pct} />

      <ExitInterviewCard
        oCase={oCase}
        showInterviewForm={showInterviewForm}
        onShowForm={() => setShowInterviewForm(true)}
        formSlot={
          <ExitInterviewForm
            caseId={oCase.id}
            onDone={() => setShowInterviewForm(false)}
          />
        }
      />

      <EquipmentReturnCard
        oCase={oCase}
        equipmentItems={equipmentItems}
        onMarkItem={markItem.mutate}
        isPending={markItem.isPending}
      />

      <FullChecklistCard
        oCase={oCase}
        checklist={checklist}
        onMarkItem={markItem.mutate}
        isPending={markItem.isPending}
      />

      {oCase.status === "active" && oCase.exit_interview_done && !oCase.blocks_settlement && (
        <Button
          className="w-full bg-[var(--ep-green)] hover:bg-[var(--ep-green)]/90 text-white"
          onClick={() => finalizeCase.mutate(oCase.id)}
          disabled={finalizeCase.isPending}
        >
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Offboardingni Finallashtirish
        </Button>
      )}

      {oCase.status === "active" && oCase.exit_interview_done && oCase.blocks_settlement && (
        <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-900/10 p-3 text-sm">
          <ShieldAlert className="h-4 w-4 text-[var(--ep-primary)] shrink-0" />
          <span className="text-[var(--ep-primary)] dark:text-orange-400">
            Finalashtirish bloklangan — suhbatni to'liq to'ldiring
          </span>
        </div>
      )}
    </div>
  );
}
