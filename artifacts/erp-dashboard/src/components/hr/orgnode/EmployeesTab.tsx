/**
 * @module EmployeesTab
 * @description Karta-detal "Xodimlar" tab — kartadan xodim BOSHQARISH (biriktirish/olib tashlash).
 *   VISION (egasi): 1 xodim = 1 KARTA; hamma xodim KARTADAN boshqariladi. Biriktirish 1:1 majburlaydi
 *   (position-karta band bo'lsa rad; xodim oldingi kartasidan ko'chadi).
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Clock, UserPlus, UserX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { NodeDetail } from "./types";
import { useTranslation } from '@/lib/i18n';

interface EmployeesTabProps {
  node: NodeDetail;
}

export function EmployeesTab({ node }: EmployeesTabProps) {
  const { t } = useTranslation("common");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [assignOpen, setAssignOpen] = useState(false);
  const [pickUserId, setPickUserId] = useState<string>("");
  const [stake, setStake] = useState<string>("");

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: [`/api/org-structure/nodes/${node.id}`] });
    queryClient.invalidateQueries({ queryKey: ["/api/org-structure/hierarchy"] });
  };

  const { data: usersData } = useQuery<{ users: { id: number; name: string }[] }>({
    queryKey: ["/api/org-structure/available-users"],
    enabled: assignOpen,
    staleTime: 60_000,
  });
  const employees = Array.isArray(node.employees) ? node.employees : [];
  const presentIds = new Set(employees.map((e) => e.id));
  const candidates = (Array.isArray(usersData?.users) ? usersData!.users : []).filter((u) => !presentIds.has(u.id));

  const assignMutation = useMutation({
    mutationFn: (vars: { userId: number; stake: number | null }) =>
      apiRequest<{ assigned?: boolean; message?: string }>("PATCH", `/api/org-structure/users/${vars.userId}/node`, { nodeId: node.id, stakeFraction: vars.stake }),
    onSuccess: (res) => {
      if (res && res.assigned === false) {
        toast({ title: res.message ?? t("Xatolik"), variant: "destructive" });
        return;
      }
      invalidate();
      setAssignOpen(false);
      setPickUserId("");
      setStake("");
      toast({ title: t("xodimBiriktirildi", "Xodim kartaga biriktirildi") });
    },
    onError: () => toast({ title: t("Xatolik"), variant: "destructive" }),
  });

  const removeMutation = useMutation({
    mutationFn: (userId: number) => apiRequest("DELETE", `/api/org-structure/users/${userId}/node/${node.id}`),
    onSuccess: () => {
      invalidate();
      toast({ title: t("xodimOlibTashlandi", "Xodim kartadan olib tashlandi") });
    },
    onError: () => toast({ title: t("Xatolik"), variant: "destructive" }),
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
          <Users className="h-4 w-4" />
          {employees.length} {t("xodim", "xodim")}
        </p>
        <Button size="sm" onClick={() => setAssignOpen(true)} data-testid="button-assign-employee">
          <UserPlus className="h-4 w-4 mr-2" />{t("xodimBiriktirish", "Xodim biriktirish")}
        </Button>
      </div>

      {employees.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
          <Users className="h-10 w-10" />
          <p>{t("buBolimdaXodimlarYoq")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {employees.map((emp) => {
            const isActive = !emp.status || emp.status === "active";
            return (
              <Card key={emp.id} className="hover:shadow transition-shadow">
                <CardContent className="py-3 px-4 flex items-center gap-3">
                  <div
                    className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0 cursor-pointer"
                    onClick={() => navigate(`/employees/${emp.id}`)}
                  >
                    {emp.fullName?.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1 cursor-pointer" onClick={() => navigate(`/employees/${emp.id}`)}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm truncate">{emp.fullName}</p>
                      {emp.status && !isActive && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                          {emp.status === "fired" ? "Ishdan ketgan" : emp.status === "vacation" ? "Ta'tilda" : emp.status}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {emp.employeeId && <span className="text-xs text-muted-foreground">#{emp.employeeId}</span>}
                      {emp.role && <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">{emp.role}</Badge>}
                      {emp.salary != null && (
                        <span className="text-xs text-[var(--ep-green)] font-medium">
                          {Number(emp.salary).toLocaleString("uz-UZ")} so'm
                        </span>
                      )}
                      {emp.yearsOfService != null && emp.yearsOfService > 0 && (
                        <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5" />{emp.yearsOfService} yil staj
                        </span>
                      )}
                    </div>
                  </div>
                  {emp.phone && <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">{emp.phone}</span>}
                  <DeleteConfirmDialog
                    title={t("xodimniOlibTashlash", "Xodimni kartadan olib tashlash")}
                    description={t("xodimniOlibTashlashMatn", "Bu xodim ushbu kartadan ajratiladi.")}
                    buttonText={t("olibTashlash", "Olib tashlash")}
                    isPending={removeMutation.isPending}
                    onConfirm={() => removeMutation.mutate(emp.id)}
                    trigger={
                      <Button size="icon" variant="ghost" title={t("olibTashlash", "Olib tashlash")} data-testid={`button-remove-emp-${emp.id}`}>
                        <UserX className="h-4 w-4 text-destructive" />
                      </Button>
                    }
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("xodimBiriktirish", "Xodim biriktirish")}</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-2">
            <Label>{t("xodim", "Xodim")}</Label>
            <Select value={pickUserId} onValueChange={setPickUserId}>
              <SelectTrigger data-testid="select-assign-user">
                <SelectValue placeholder={t("xodimniTanlang", "Xodimni tanlang")} />
              </SelectTrigger>
              <SelectContent>
                {candidates.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">{t("mavjudXodimYoq", "Mavjud xodim yo'q")}</div>
                ) : candidates.map((u) => (
                  <SelectItem key={u.id} value={String(u.id)}>{u.name || `#${u.id}`}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Label>{t("ulushStavka", "Ulush / stavka (0–1, ixtiyoriy)")}</Label>
            <Input type="number" min="0" max="1" step="0.05" value={stake}
              onChange={(e) => setStake(e.target.value)} placeholder="masalan 0.5 (yarim stavka)" />
            <p className="text-[11px] text-muted-foreground">
              {t("kopKartaIzoh", "Ko'p-karta: xodim bir nechta kartaga ulanadi (oldingi karta SAQLANADI). Ulushlar yig'indisi 1.0 dan oshsa owner ruxsati kerak.")}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>{t("Bekor")}</Button>
            <Button
              onClick={() => pickUserId && assignMutation.mutate({ userId: Number(pickUserId), stake: stake.trim() === "" ? null : Number(stake) })}
              disabled={!pickUserId || assignMutation.isPending}
              data-testid="button-confirm-assign"
            >
              {assignMutation.isPending ? t("saqlanmoqda", "Saqlanmoqda...") : t("biriktirish", "Biriktirish")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
