/**
 * @module SaaSExtendedSectionsA
 * @description TenantsSection, OnboardingSection, LicensingSection components.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TabsContent } from "@/components/ui/tabs";
import { Plus, Settings, CheckCircle, XCircle, Activity } from "lucide-react";
import { AddTenantDialog } from "./SaaSExtendedDialogs";
import {
  SaaSTenant,
  PLAN_LABELS,
  STATUS_VARIANTS,
} from "./SaaSExtendedTypes";
import { UseFormReturn } from "react-hook-form";

import { useTranslation } from '@/lib/i18n';
import { EPStatusPill } from "@/components/ep";
// ===================== TENANTS SECTION =====================

interface TenantsSectionProps {
  tenants: SaaSTenant[];
  tenantsLoading: boolean;
  showAddDialog: boolean;
  setShowAddDialog: (v: boolean) => void;
  addForm: UseFormReturn<{
    name: string;
    domain: string;
    plan: string;
    contactEmail: string;
    contactPhone: string;
    usersLimit: number;
  }>;
  onAddSubmit: (data: Record<string, unknown>) => void;
  addPending: boolean;
  onSuspend: (id: string) => void;
  onActivate: (id: string) => void;
}

export function TenantsSection({tenants,
  tenantsLoading,
  showAddDialog,
  setShowAddDialog,
  addForm,
  onAddSubmit,
  addPending,
  onSuspend,
  onActivate,
}: TenantsSectionProps) {
  const { t } = useTranslation('common');
  return (
    <TabsContent value="tenants" className="mt-0 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("barchaTenantlar")}</h2>
        <Button onClick={() => setShowAddDialog(true)} data-testid="button-add-tenant">
          <Plus className="h-4 w-4 mr-2" />{t("yangiTenant")}
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {([
          { l: "Jami tenantlar", v: tenantsLoading ? "..." : tenants.length, c: "text-primary" },
          { l: "Faol", v: tenantsLoading ? "..." : (Array.isArray(tenants) ? tenants : []).filter((t: SaaSTenant) => t.status === "active").length, c: "text-[var(--ep-green)]" },
          { l: "Sinov davri", v: tenantsLoading ? "..." : (Array.isArray(tenants) ? tenants : []).filter((t: SaaSTenant) => t.status === "trial").length, c: "text-[var(--ep-primary)]" },
          { l: "Jami foydalanuvchilar", v: tenantsLoading ? "..." : (Array.isArray(tenants) ? tenants : []).reduce((s: number, t: SaaSTenant) => s + (t.usersCount || 0), 0), c: "text-[var(--ep-blue)]" },
        ]).map(s => (
          <Card key={s.l}><CardContent className="pt-4 pb-3">
            <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
          </CardContent></Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {tenantsLoading ? (
            <div className="p-8 text-center text-muted-foreground animate-pulse">{t("Yuklanmoqda...")}</div>
          ) : (
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("tenant")}</TableHead>
                  <TableHead>{t("domen1")}</TableHead>
                  <TableHead>{t("tarif1")}</TableHead>
                  <TableHead>{t("foydalanuvchilar")}</TableHead>
                  <TableHead>{t("muddat")}</TableHead>
                  <TableHead>{t("holati")}</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(tenants) ? tenants : []).map((t: SaaSTenant) => (
                  <TableRow key={t.id} data-testid={`row-tenant-${t.id}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell>
                      <div className="font-medium">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.contactEmail || t.city || "—"}</div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t.domain}</TableCell>
                    <TableCell>
                      <Badge variant={t.plan === "enterprise" ? "default" : "outline"}>
                        {PLAN_LABELS[t.plan ?? ""] || t.plan}
                      </Badge>
                    </TableCell>
                    <TableCell>{t.usersCount}/{t.usersLimit}</TableCell>
                    <TableCell className="text-sm">{t.expiresAt || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[t.status ?? ""] || "outline"}>
                        {t.status === "active" ? "Faol" : t.status === "trial" ? "Sinov" : t.status === "suspended" ? "Bloklangan" : "Bekor"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {t.status === "active" && (
                          <Button variant="ghost" size="sm" onClick={() => onSuspend(String(t.id))} data-testid={`button-suspend-${t.id}`}>
                            {t("bloklash")}
                          </Button>
                        )}
                        {t.status === "suspended" && (
                          <Button variant="ghost" size="sm" onClick={() => onActivate(String(t.id))} data-testid={`button-activate-${t.id}`}>
                            {t("faollashtirish")}
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" data-testid={`button-manage-${t.id}`}>
                          <Settings className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {tenants.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">{t("tenantlarYoq")}</TableCell></TableRow>
                )}
              </TableBody>
            </Table></div>
          )}
        </CardContent>
      </Card>

      <AddTenantDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        form={addForm}
        onSubmit={onAddSubmit}
        isPending={addPending}
      />
    </TabsContent>
  );
}

// ===================== ONBOARDING SECTION =====================

interface OnboardingSectionProps {
  tenants: SaaSTenant[];
  onTenantChange: (id: string) => void;
}

export function OnboardingSection({ tenants, onTenantChange }: OnboardingSectionProps) {
  return (
    <TabsContent value="onboarding" className="mt-0 space-y-4">
      <h2 className="text-lg font-semibold">{t("yangiZavodOnboarding")}</h2>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{t("onboardingJarayoniBosqichlari")}</CardTitle>
            <Select defaultValue={tenants[0]?.id as string | undefined} onValueChange={onTenantChange}>
              <SelectTrigger className="w-56 h-9" data-testid="select-onboard-tenant">
                <SelectValue placeholder={t("tenantTanlang")} />
              </SelectTrigger>
              <SelectContent>
                {(Array.isArray(tenants) ? tenants : []).map((t: SaaSTenant) => (
                  <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {([
              { step: 1, title: "Tenant schema va ma'lumotlar bazasi yaratish", status: "done" },
              { step: 2, title: "Super admin foydalanuvchi qo'shish", status: "done" },
              { step: 3, title: "Tarif plani va modullarni belgilash", status: "done" },
              { step: 4, title: "Demo ma'lumotlar yuklash (ixtiyoriy)", status: "done" },
              { step: 5, title: "Admin onboarding treningi o'tkazish", status: "current" },
              { step: 6, title: "Haqiqiy ma'lumotlar migratsiyasi", status: "pending" },
              { step: 7, title: "Foydalanuvchilarni import qilish va rollarni belgilash", status: "pending" },
              { step: 8, title: "Go-live tasdiqlash va monitoring", status: "pending" },
            ]).map(s => (
              <div key={s.step} className="flex items-center gap-3" data-testid={`row-step-${s.step}`}>
                {s.status === "done"
                  ? <CheckCircle className="h-4 w-4 text-[var(--ep-green)] shrink-0" />
                  : s.status === "current"
                    ? <Activity className="h-5 w-5 text-[var(--ep-blue)] shrink-0" />
                    : <XCircle className="h-5 w-5 text-muted-foreground shrink-0" />}
                <span className={`text-sm flex-1 ${s.status === "done" ? "text-muted-foreground line-through" : s.status === "current" ? "font-medium" : "text-muted-foreground"}`}>
                  {s.step}. {s.title}
                </span>
                {s.status === "current" && <EPStatusPill tone="neutral">{t("davomEtmoqda")}</EPStatusPill>}
                {s.status === "done" && <EPStatusPill tone="success">{t("Bajarildi")}</EPStatusPill>}
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" size="sm" data-testid="button-onboard-next">{t("keyingiBosqich")}</Button>
            <Button variant="outline" size="sm" data-testid="button-onboard-complete">{t("goLiveQilish")}</Button>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}

// ===================== LICENSING SECTION =====================

interface LicensingSectionProps {
  tenants: SaaSTenant[];
}

export function LicensingSection({ tenants }: LicensingSectionProps) {
  return (
    <TabsContent value="licensing" className="mt-0 space-y-4">
      <h2 className="text-lg font-semibold">{t("tarifRejalariVaLitsenziyalar")}</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {([
          { plan: "Basic", price: "$199/oy", users: "30 nafar", modules: "5 modul (CRM, WMS, QC, HR, SD)", color: "border-muted", highlight: false },
          { plan: "Starter", price: "$399/oy", users: "80 nafar", modules: "10 modul", color: "border-secondary", highlight: false },
          { plan: "Professional", price: "$799/oy", users: "200 nafar", modules: "14 modul", color: "border-primary", highlight: true },
          { plan: "Enterprise", price: "$1,499/oy", users: "Cheksiz", modules: "17 ta barcha modul + IoT", color: "border-blue-400", highlight: false },
        ]).map(p => (
          <Card key={p.plan} className={`border-2 ${p.color} ${p.highlight ? "shadow-md" : ""}`}>
            <CardContent className="pt-5 pb-4">
              {p.highlight && <Badge className="mb-2 w-full justify-center">{t("tavsiyaEtilgan")}</Badge>}
              <div className="text-center">
                <div className="font-bold text-lg">{p.plan}</div>
                <div className="text-2xl font-bold text-primary mt-1">{p.price}</div>
                <div className="text-xs text-muted-foreground mt-1">{p.users}</div>
              </div>
              <div className="mt-4">
                <p className="text-xs text-muted-foreground">{p.modules}</p>
              </div>
              <div className="mt-3 pt-3 border-t">
                <div className="text-xs text-muted-foreground text-center">
                  {(Array.isArray(tenants) ? tenants : []).filter((t: SaaSTenant) => (t.plan ?? "") === p.plan.toLowerCase()).length} ta joriy tenant
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">{t("tenantTarifHolati")}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("tenant")}</TableHead>
                <TableHead>{t("tarif1")}</TableHead>
                <TableHead>{t("oylikTolov")}</TableHead>
                <TableHead>{t("muddati")}</TableHead>
                <TableHead>{"Holat"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(tenants) ? tenants : []).map((t: SaaSTenant) => (
                <TableRow key={t.id} data-testid={`row-license-${t.id}`} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell><Badge variant="outline">{PLAN_LABELS[t.plan ?? ""] || t.plan}</Badge></TableCell>
                  <TableCell>${t.monthlyFee || 0}/oy</TableCell>
                  <TableCell className={t.expiresAt && t.expiresAt < new Date().toISOString().split("T")[0] ? "text-[var(--ep-red)]" : ""}>{t.expiresAt || "—"}</TableCell>
                  <TableCell><Badge variant={STATUS_VARIANTS[t.status ?? ""] || "outline"}>{t.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}

