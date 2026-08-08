/**
 * @module CardAssignDialog
 * @description Assign an employee to a card (ORG Phase 6, EP-ORG-002 M:N). POST /api/org-structure/
 *   cards/:id/assign {employeeId, isPrimary}. The BE atomic guard rejects (409) if the card already
 *   has an active occupant. Reuses the /api/hr/employees list.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import type { OrgCard } from "@/components/hr/org/CardFormDialog";

interface Employee {
  id: number | string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  name?: string;
}

function empName(e: Employee): string {
  return e.full_name || [e.first_name, e.last_name].filter(Boolean).join(" ") || e.name || `#${e.id}`;
}

export function CardAssignDialog({
  open,
  onClose,
  card,
}: {
  open: boolean;
  onClose: () => void;
  card: OrgCard | null;
}) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const cardId = card?.id ?? 0;

  const [employeeId, setEmployeeId] = useState<string>("");
  const [isPrimary, setIsPrimary] = useState<boolean>(true);
  const [isActing, setIsActing] = useState<boolean>(false);
  const [supplement, setSupplement] = useState<string>("");
  const [endedAt, setEndedAt] = useState<string>("");

  const { data: employeesData } = useQuery<Employee[]>({
    queryKey: ["/api/hr/employees"],
    enabled: open,
  });
  const employees = Array.isArray(employeesData) ? employeesData : [];

  const assignMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/org-structure/cards/${cardId}/assign`, {
        employeeId: Number(employeeId),
        isPrimary: isActing ? false : isPrimary,
        isActing,
        ...(isActing && supplement ? { actingSupplement: Number(supplement) } : {}),
        ...(isActing && endedAt ? { endedAt } : {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/org-structure/cards/${cardId}/employees`] });
      queryClient.invalidateQueries({ queryKey: [`/api/org-structure/cards/by-employee/${employeeId}`] });
      toast({ title: t("xodimBiriktirildi") });
      setEmployeeId(""); setIsActing(false); setSupplement(""); setEndedAt("");
      onClose();
    },
    onError: () => toast({ title: t("kartaBand"), variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {t("xodimBiriktirish")}{card?.position_name ? ` — ${card.position_name}` : ""}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <Select value={employeeId || undefined} onValueChange={setEmployeeId}>
            <SelectTrigger><SelectValue placeholder={t("xodimTanlang")} /></SelectTrigger>
            <SelectContent>
              {employees.map((e) => (
                <SelectItem key={String(e.id)} value={String(e.id)}>{empName(e)}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Checkbox id="isActing" checked={isActing} onCheckedChange={(v) => setIsActing(v === true)} />
            <Label htmlFor="isActing" className="text-[13px] cursor-pointer">{t("ioVaqtinchalik")}</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild><HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" /></TooltipTrigger>
                <TooltipContent className="max-w-xs">{t("glossaryIo")}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {isActing ? (
            <div className="space-y-2 pl-6">
              <div>
                <Label className="text-[12px] text-muted-foreground">{t("ustama")}</Label>
                <Input type="number" min={0} value={supplement} onChange={(e) => setSupplement(e.target.value)} placeholder="0" />
              </div>
              <div>
                <Label className="text-[12px] text-muted-foreground">{t("tugashSanasi")}</Label>
                <Input type="date" value={endedAt} onChange={(e) => setEndedAt(e.target.value)} />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Checkbox id="isPrimary" checked={isPrimary} onCheckedChange={(v) => setIsPrimary(v === true)} />
              <Label htmlFor="isPrimary" className="text-[13px] cursor-pointer">{t("asosiyKarta")}</Label>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("bekorQilish")}</Button>
          <Button onClick={() => assignMutation.mutate()} disabled={!employeeId || assignMutation.isPending}>
            {assignMutation.isPending ? t("saqlanmoqda") : t("biriktirish")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
