/**
 * @module MainTab
 * @description Karta-detal "Asosiy" tab — KARTA TA'RIFI: oylik/ЦКП/rbac/ish-vaqti/bonus/holat (node-detal
 *   javobidan, org-queries.repo) + asosiy ma'lumot + rahbar. RAZRYAD endi alohida "Razryad" tabda
 *   (egasi 2026-06-25: "razryad mana shu tabda bo'lsin") — bu yerda takrorlanmaydi.
 */

import { User, CheckCircle, UserX, Building2, Award, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { NodeDetail, NODE_TYPE_LABELS } from "./types";
import { useTranslation } from '@/lib/i18n';

interface MainTabProps {
  node: NodeDetail;
}

const SALARY_TYPE_LABEL: Record<string, string> = { oylik: "Oylik", soatbay: "Soatbay", ishbay: "Ishbay" };

function fmtSom(v: number | string | null | undefined): string | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : `${n.toLocaleString("uz-UZ")} so'm`;
}

function DefRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

export function MainTab({ node }: MainTabProps) {
  const { t } = useTranslation("common");

  const cardSalary = (() => {
    const lo = fmtSom(node.minSalary), hi = fmtSom(node.maxSalary);
    if (lo && hi) return `${lo} – ${hi}`;
    return lo ?? hi ?? null;
  })();

  const hasCardFields = !!(node.salaryType || cardSalary ||
    node.tskpTarget != null || node.rbacTier || node.workSchedule || node.bonusConfig || node.currentState);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Building2 className="h-4 w-4" />{t("asosiyMalumot")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <DefRow label="ID" value={node.id} />
          <DefRow label="Nom (UZ)" value={node.name} />
          <DefRow label="Nom (RU)" value={node.nameRu || "—"} />
          <DefRow label="Turi" value={NODE_TYPE_LABELS[node.nodeType] || node.nodeType} />
          <DefRow label="Daraja" value={node.hierarchyLevel} />
          <DefRow label="Ota node" value={node.parentId ? `#${node.parentId}` : "Ildiz"} />
          <DefRow label="Holat" value={node.isActive ? "Faol" : "Nofaol"} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <User className="h-4 w-4" />{t("rahbar")}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          {node.headUserName ? (
            <div className="space-y-2">
              <p className="font-semibold text-base">{node.headUserName}</p>
              {node.headUserEmployeeId && <p className="text-muted-foreground">ID: {node.headUserEmployeeId}</p>}
              <Badge className="bg-green-500/20 text-[var(--ep-green)] border-none">
                <CheckCircle className="h-3 w-3 mr-1" />{t("tayinlangan")}
              </Badge>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <UserX className="h-4 w-4 text-[var(--ep-red)]" />
                <span>{t("rahbarTayinlanmaganVakant")}</span>
              </div>
              <Badge variant="destructive" className="w-fit">{t("vakantLavozim")}</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* KARTA TA'RIFI — razryad prominent + oylik/ЦКП/rbac/smena/bonus/holat */}
      <Card className="md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Award className="h-4 w-4" />Karta ta'rifi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {/* Karta-maydonlari (razryad endi alohida "Razryad" tabda) */}
          {hasCardFields ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
              {node.salaryType && <DefRow label="Oylik turi" value={SALARY_TYPE_LABEL[node.salaryType] ?? node.salaryType} />}
              {cardSalary && (
                <DefRow label="Oylik diapazon" value={<span className="text-[var(--ep-green)] inline-flex items-center gap-1"><Wallet className="h-3 w-3" />{cardSalary}</span>} />
              )}
              {node.tskpTarget != null && (
                <DefRow label="ЦКП maqsad" value={`${node.tskpTarget}${node.tskpMeasurementUnit ? " " + node.tskpMeasurementUnit : ""}`} />
              )}
              {node.rbacTier && <DefRow label="Ruxsat (RBAC)" value={node.rbacTier} />}
              {node.workSchedule && <DefRow label="Ish vaqti / smena" value={node.workSchedule} />}
              {node.bonusConfig && <DefRow label="Bonus" value={node.bonusConfig} />}
              {node.currentState && <DefRow label="Holat" value={node.currentState} />}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Karta maydonlari hali to'ldirilmagan — “Tahrirlash” orqali kiriting.</p>
          )}
        </CardContent>
      </Card>

      {(node.tskp || node.tskpRu) && (
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t("qyam")}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            {node.tskp && <p className="text-muted-foreground">{node.tskp}</p>}
            {node.tskpRu && <p className="text-muted-foreground italic">{node.tskpRu}</p>}
          </CardContent>
        </Card>
      )}

      {node.description && (
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t("progress.description")}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{node.description}</CardContent>
        </Card>
      )}
    </div>
  );
}
