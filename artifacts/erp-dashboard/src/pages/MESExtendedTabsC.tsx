/** @module MESExtendedTabsC @description Norms tab and Smena Handover tab for the MES Extended page. */

import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { type MESShift, MACHINE_NORMS } from "./MESExtendedTypes";
import { useTranslation } from '@/lib/i18n';

// ─── Norms Tab ───────────────────────────────────────────────────────────────

/** Tab content: Uskuna Normalari (static data until API is available) */
export function NormsTab() {
  const { t } = useTranslation("common");
  return (
    <TabsContent value="norms" className="mt-0 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("uskunaNormalari")}</h2>
        <Button size="sm" data-testid="button-add-norm">
          <Plus className="h-3.5 w-3.5 mr-1.5" />{t("normaQoshish")}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("stanoq")}</TableHead>
                <TableHead>{t("normativTezlik")}</TableHead>
                <TableHead>{t("tayyorlovVaqti")}</TableHead>
                <TableHead>{t("minBrak")}</TableHead>
                <TableHead>OEE maqsad</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MACHINE_NORMS.map((r, i) => (
                <TableRow key={`norm-${i}`} data-testid={`row-norm-${i}`} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-medium">{r.m}</TableCell>
                  <TableCell>{r.speed}</TableCell>
                  <TableCell>{r.setup}</TableCell>
                  <TableCell>{r.brak}</TableCell>
                  <TableCell className="font-bold text-[var(--ep-green)]">{r.oee}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}

// ─── Smena Handover Tab ──────────────────────────────────────────────────────

interface SmenaTabProps {
  currentShift: MESShift | undefined;
  onHandoverToast: () => void;
}

/** Tab content: Smena O'tkazish Protokoli */
export function SmenaTab({ currentShift, onHandoverToast }: SmenaTabProps) {
  const { t } = useTranslation("common");
  const smenaStats = [
    { l: "Joriy smena ishlab chiqarishi", v: currentShift?.producedQty ?? "—", c: "text-primary"   },
    { l: "Brak miqdori",                  v: currentShift?.brakQty    ?? "—", c: "text-[var(--ep-red)]"   },
    { l: "OEE",                           v: currentShift?.oee ? `${currentShift.oee}%` : "—", c: "text-[var(--ep-green)]" },
  ];

  const outgoingInfo = [
    { label: "Chiquvchi operator", value: currentShift?.operatorName || "—" },
    { label: "Smena boshlanishi",  value: currentShift?.startTime ? new Date(currentShift.startTime).toLocaleTimeString("uz-UZ") : "—" },
    { label: "Stanoq holati",      value: currentShift?.machineStatus || "Ishlamoqda" },
    { label: "Eslatmalar",         value: currentShift?.notes || "Yo'q" },
  ];

  async function handleConfirmHandover() {
    await apiRequest("POST", "/api/mes/shifts/handover", { note: "handover" });
    onHandoverToast();
  }

  return (
    <TabsContent value="smena" className="mt-0 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("smenaOtkazishProtokoli")}</h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline" data-testid="badge-current-shift">
            <Clock className="h-3 w-3 mr-1" />
            {currentShift
              ? `${currentShift.shiftName || "Joriy smena"} — ${currentShift.operatorName || "Operator"}`
              : "Faol smena yo'q"}
          </Badge>
          <Button
            size="sm"
            data-testid="button-start-handover"
            onClick={onHandoverToast}
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />{t("smenaYakunlash")}
          </Button>
        </div>
      </div>

      {/* KPI mini-cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {smenaStats.map(s => (
          <Card key={s.l}>
            <CardContent className="pt-4 pb-3">
              <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
              <div className="text-xs text-muted-foreground">{s.l}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Outgoing shift summary */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-sm">{t("smenaYakuniyHisobot")}</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            {outgoingInfo.map(item => (
              <div
                key={item.label}
                className="flex items-start justify-between py-1.5 border-b border-border/50 last:border-0"
              >
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className="text-sm font-medium text-right max-w-[60%]">{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Incoming shift form */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-sm">{t("yangiSmenaMalumotlari")}</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-sm">{t("kiruvchiOperator")}</Label>
              <Input
                placeholder={t("operatorIsmi")}
                data-testid="input-incoming-operator"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">{t("stanoqHolatiTekshiruvi")}</Label>
              <Select>
                <SelectTrigger data-testid="select-machine-status" className="h-9">
                  <SelectValue placeholder={t("holatTanlang")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="good">{t("Yaxshi")}</SelectItem>
                  <SelectItem value="minor_issue">{t("kichikMuammo")}</SelectItem>
                  <SelectItem value="needs_maintenance">{t("texnikXizmatKerak")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">{t("Izoh")}</Label>
              <Input
                placeholder={t("smenaBoyichaIzoh")}
                data-testid="input-shift-note"
              />
            </div>

            <Button
              className="w-full"
              data-testid="button-confirm-handover"
              onClick={handleConfirmHandover}
            >
              {t("smenaOtkazishniTasdiqlash")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  );
}
