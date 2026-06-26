/**
 * @module MainTab
 * @description Karta-detal "Asosiy" tab — KARTA TA'RIFI: oylik/ЦКП/rbac/ish-vaqti/bonus/holat (node-detal
 *   javobidan, org-queries.repo) + asosiy ma'lumot + rahbar. RAZRYAD endi alohida "Razryad" tabda
 *   (egasi 2026-06-25: "razryad mana shu tabda bo'lsin") — bu yerda takrorlanmaydi.
 */

import { User, CheckCircle, UserX, Building2, Award, Wallet, Calculator } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { NodeDetail, NODE_TYPE_LABELS } from "./types";
import { useTranslation } from '@/lib/i18n';

interface MainTabProps {
  node: NodeDetail;
}

/** Razryad daraja (master-data) — koeffitsient FAQAT shu kanonik jadvaldan o'qiladi (fabrikatsiya yo'q). */
interface RazryadLevel {
  id: number;
  level: number;
  name: string;
  coefficient?: number | string | null;
}

const SALARY_TYPE_LABEL: Record<string, string> = { oylik: "Oylik", soatbay: "Soatbay", ishbay: "Ishbay" };

function fmtSom(v: number | string | null | undefined): string | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : `${n.toLocaleString("uz-UZ")} so'm`;
}

function toNum(v: number | string | null | undefined): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function DefRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

/** Formula komponenti kartochkasi: nomi · qiymati (yoki "belgilanmagan"). */
function FormulaTerm({
  label, value, set, hint,
}: { label: string; value: React.ReactNode; set: boolean; hint?: string }) {
  return (
    <div
      className={`rounded-md border px-3 py-2 flex flex-col gap-0.5 ${
        set ? "border-border bg-muted/30" : "border-dashed border-border"
      }`}
    >
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</span>
      {set ? (
        <span className="text-sm font-semibold">{value}</span>
      ) : (
        <span className="text-sm font-medium text-muted-foreground italic">belgilanmagan</span>
      )}
      {hint && <span className="text-[10px] text-muted-foreground">{hint}</span>}
    </div>
  );
}

/**
 * Oylik FORMULA breakdown (egasi 8-qaror #5):
 *   oylik = baza × razryad-koeff × ЦКП-bajarish% × stake-ulush
 *
 * ⭐ FABRIKATSIYA YO'Q (Q-40): faqat REAL qiymatlar ko'rsatiladi —
 *   - baza        = node.min/max salary (karta-data); yo'q bo'lsa "belgilanmagan"
 *   - razryad-koeff = razryad_levels.coefficient (kanonik master-data, razryadLevelId orqali)
 *   - ЦКП-bajarish% = fakt qiymat (hali node-detalda materializatsiya qilinmagan = egasi-data) → "belgilanmagan"
 *   - stake-ulush  = ko'p-karta ulushi (employee_cards'da stake ustuni hali YO'Q = egasi-data) → "belgilanmagan"
 *  Backend formula manbasi: payroll.service.ts → computeCardPay (bir xil model + NULL/gate-darvozalari).
 */
function OylikFormulaCard({ node, t }: { node: NodeDetail; t: ReturnType<typeof useTranslation>["t"] }) {
  // Razryad koeffitsienti — RazryadTab bilan bir xil kanonik manba (master-data, cache reuse).
  const { data: rzData } = useQuery<{ items: RazryadLevel[] }>({
    queryKey: ["/api/org-structure/razryad-levels"],
    staleTime: 300_000,
  });
  const levels = Array.isArray(rzData?.items) ? rzData!.items : [];
  const razryad = node.razryadLevelId != null ? levels.find((r) => r.id === node.razryadLevelId) : undefined;
  const coeff = toNum(razryad?.coefficient);

  // Baza = oylik diapazonining pastki chegarasi (yo'q bo'lsa yuqori chegara). Egasi-data.
  const base = toNum(node.minSalary) ?? toNum(node.maxSalary);
  const baseLabel = (() => {
    const lo = fmtSom(node.minSalary), hi = fmtSom(node.maxSalary);
    if (lo && hi) return `${lo} – ${hi}`;
    return lo ?? hi ?? null;
  })();

  // ЦКП-bajarish% (fakt) va stake-ulush hali node-detalda materializatsiya qilinmagan = egasi-data
  // (Q-40 fabrikatsiya-taqiq). node.tskpTarget = MAQSAD (bajarish emas) — formulaga kiritilmaydi.
  const ckpPct: number | null = null;
  const stakeShare: number | null = null;

  // Gross FAQAT barcha real komponentlar mavjud bo'lganda hisoblanadi (ЦКП-gate QATTIQ — egasi 8-qaror #6).
  // ckpPct/stakeShare hozir doim null (egasi-data materializatsiya qilinmagan) → gross null = "hisoblab bo'lmaydi".
  const gross: number | null =
    base != null && coeff != null && ckpPct != null && stakeShare != null
      ? base * coeff * (ckpPct / 100) * stakeShare
      : null;

  return (
    <Card className="md:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Calculator className="h-4 w-4" />{t("oylikFormulasi", "Oylik formulasi")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] text-muted-foreground">
          <span className="font-medium text-foreground">{t("oylik", "Oylik")}</span>
          <span>=</span>
          <span className="rounded bg-muted px-1.5 py-0.5">{t("baza", "baza")}</span>
          <span>×</span>
          <span className="rounded bg-muted px-1.5 py-0.5">{t("razryadKoeff", "razryad-koeff")}</span>
          <span>×</span>
          <span className="rounded bg-muted px-1.5 py-0.5">{t("ckpBajarish", "ЦКП-bajarish%")}</span>
          <span>×</span>
          <span className="rounded bg-muted px-1.5 py-0.5">{t("stakeUlush", "stake-ulush")}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <FormulaTerm
            label={t("baza", "Baza")}
            value={baseLabel}
            set={base != null}
            hint={t("bazaHint", "Oylik diapazon (karta-data)")}
          />
          <FormulaTerm
            label={t("razryadKoeff", "Razryad-koeff")}
            value={coeff != null ? `×${coeff}` : null}
            set={coeff != null}
            hint={razryad ? razryad.name : t("razryadKoeffHint", "Razryad tayinlanmagan")}
          />
          <FormulaTerm
            label={t("ckpBajarish", "ЦКП-bajarish%")}
            value={ckpPct != null ? `${ckpPct}%` : null}
            set={ckpPct != null}
            hint={t("ckpFaktHint", "Fakt hali kiritilmagan")}
          />
          <FormulaTerm
            label={t("stakeUlush", "Stake-ulush")}
            value={stakeShare != null ? `${Math.round(stakeShare * 100)}%` : null}
            set={stakeShare != null}
            hint={t("stakeHint", "Ko'p-karta ulushi (egasi-data)")}
          />
        </div>

        <div className="flex items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-2">
          <span className="text-muted-foreground inline-flex items-center gap-1.5">
            <Wallet className="h-3.5 w-3.5" />{t("hisoblanganOylik", "Hisoblangan oylik")}
          </span>
          {gross != null ? (
            <span className="font-semibold text-[var(--ep-green)]">{fmtSom(gross)}</span>
          ) : (
            <span className="text-xs text-muted-foreground italic">{t("hisoblabBolmaydi", "Hisoblab bo'lmaydi — yetishmovchi qiymatlar")}</span>
          )}
        </div>

        <p className="text-[11px] text-muted-foreground">
          {t(
            "oylikFormulaIzoh",
            "Oylik faqat barcha komponentlar real bo'lganda hisoblanadi. ЦКП-bajarish fakti yo'q bo'lsa oylik berilmaydi (qattiq darvoza). Stake — ko'p-karta ulushi (egasi-data, hali materializatsiya qilinmagan)."
          )}
        </p>
      </CardContent>
    </Card>
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

      {/* A22 — Oylik formulasi breakdown (ADDITIV): baza × razryad-koeff × ЦКП-bajarish% × stake-ulush */}
      <OylikFormulaCard node={node} t={t} />

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
