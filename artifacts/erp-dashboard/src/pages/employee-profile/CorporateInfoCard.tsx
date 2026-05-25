/**
 * @module CorporateInfoCard
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Edit, Check, X, Phone, Mail, Settings, Clock } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { useTranslation } from '@/lib/i18n';
import { EPStatusPill } from "@/components/ep";
interface CorporateInfo {
  id: number;
  corporate_phone: string | null;
  corporate_email: string | null;
  is_machine_operator: boolean;
  retention_years: number;
  block_erp_access: boolean;
}

interface CorporateInfoCardProps {
  employeeId: string;
  isHr: boolean;
}

export function CorporateInfoCard({employeeId, isHr }: CorporateInfoCardProps) {
  const { t } = useTranslation('common');
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<CorporateInfo>>({});

  const { data, isLoading } = useQuery<CorporateInfo>({
    queryKey: ["/api/hr/employee-corp", employeeId],
    queryFn: () =>
      apiRequest("GET", `/api/hr/employee-corp/${employeeId}`),
    enabled: !!employeeId,
  });

  const saveMutation = useMutation({
    mutationFn: (body: Partial<CorporateInfo>) =>
      apiRequest("PATCH", `/api/hr/employee-corp/${employeeId}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/employee-corp", employeeId] });
      toast({ title: "Korporativ ma'lumotlar saqlandi" });
      setEditing(false);
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  function startEdit() {
    setForm({
      corporate_phone: data?.corporate_phone ?? "",
      corporate_email: data?.corporate_email ?? "",
      is_machine_operator: data?.is_machine_operator ?? false,
      retention_years: data?.retention_years ?? 3,
      block_erp_access: data?.block_erp_access ?? false,
    });
    setEditing(true);
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-5 w-40 rounded-lg" /></CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-9 w-full rounded-lg" />
          <Skeleton className="h-9 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Settings className="h-4 w-4 text-muted-foreground" />
          {t("korporativMalumotlar")}
        </CardTitle>
        {isHr && !editing && (
          <Button variant="outline" size="sm" onClick={startEdit}>
            <Edit className="h-3.5 w-3.5 mr-1.5" />
            {t("edit")}
          </Button>
        )}
        {editing && (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
              <Check className="h-3.5 w-3.5 mr-1.5" />
              {t("Saqlash")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {editing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">{t("korporativTelefon")}</Label>
              <Input
                value={form.corporate_phone ?? ""}
                onChange={(e) => setForm({ ...form, corporate_phone: e.target.value || null })}
                placeholder="+998 90 000 00 00"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t('korporativEmail')}</Label>
              <Input
                value={form.corporate_email ?? ""}
                onChange={(e) => setForm({ ...form, corporate_email: e.target.value || null })}
                placeholder={t("xodimEuroprintUz")}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("saqlanishMuddatiYil")}</Label>
              <Input
                type="number"
                min={1}
                max={20}
                value={form.retention_years ?? 3}
                onChange={(e) => setForm({ ...form, retention_years: parseInt(e.target.value) || 3 })}
              />
            </div>
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs">{t("mashinaOperatori")}</Label>
                <Switch
                  checked={form.is_machine_operator ?? false}
                  onCheckedChange={(v) => setForm({ ...form, is_machine_operator: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs text-destructive">{t("erpKirishiniBloklash")}</Label>
                <Switch
                  checked={form.block_erp_access ?? false}
                  onCheckedChange={(v) => setForm({ ...form, block_erp_access: v })}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">{t("korpTel")}</span>
              <span className="font-medium">{data?.corporate_phone ?? "—"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">{t('korpEmail')}</span>
              <span className="font-medium">{data?.corporate_email ?? "—"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">{t("saqlanish")}</span>
              <span className="font-medium">{data?.retention_years ?? 3} yil</span>
            </div>
            <div className="flex items-center gap-3">
              {data?.is_machine_operator && (
                <EPStatusPill tone="neutral">{t("mashinaOperatori")}</EPStatusPill>
              )}
              {data?.block_erp_access && (
                <EPStatusPill tone="danger">{t("erpBloklangan")}</EPStatusPill>
              )}
              {!data?.is_machine_operator && !data?.block_erp_access && (
                <span className="text-muted-foreground text-xs">{t("standartKirish")}</span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
