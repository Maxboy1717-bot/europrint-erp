/**
 * @module EmployeeCardsSummary
 * @description Employee's ORG cards + card-gate + salary-component breakdown. Read-only surface on the
 *   profile "work" tab (A21). Three additive sections, all REAL backend data, no fabricated values:
 *     1. Card-gate banner — GET /api/org-structure/cards/gate/by-user/:id → primary card name,
 *        card-derived RBAC tier, salary-eligibility. Card-less user is flagged (gated), never blocked
 *        (login-gate stays OFF; vizyon EGASI qaror #4/#7).
 *     2. Cards table + FORMULA-A total — GET /api/org-structure/cards/by-employee/:id →
 *        { cards, totalSalary }. FORMULA A = SUM of active cards' card_salary (substantive max_salary,
 *        acting → acting_supplement), no cap. NULL salaries during build phase → shows 0, honestly.
 *     3. Oylik komponentlari (vizyon formula: baza × razryad-koeff × ЦКП-bajarish% × stake-ulush).
 *        Only the BAZA (card_salary) is data-backed today; razryad-koeff / ЦКП% / stake are owner-DATA
 *        gaps (Q-40 fabrikatsiya taqiq) → rendered as "—" with a build-phase note, structure only.
 */

import { useQuery } from "@tanstack/react-query";
import { Layers, ShieldCheck, ShieldAlert, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EPLoader, EPEmptyState, EPStatusPill } from "@/components/ep";
import { useTranslation } from "@/lib/i18n";

interface EmpCard {
  card_id: number;
  is_primary: boolean;
  is_acting?: boolean;
  position_name: string;
  code: string | null;
  card_salary: string | number | null;
}

interface CardGate {
  user_id?: number;
  username?: string;
  role?: string;
  card_id?: number | null;
  card_name?: string | null;
  rbac_tier?: string | null;
  has_card?: boolean;
  salary_eligible?: boolean;
  gated?: boolean;
  flag?: string | null;
}

const fmtSom = (v: string | number | null | undefined): string => {
  const n = Number(v ?? 0);
  // M11/i18n-F1 (2026-07-05): was the one "ru-RU" outlier against lib/format.ts's
  // documented, stakeholder-approved uz-UZ convention (see that file's header:
  // "everyone reads 22.04.2026 the same way" -- deliberate, not an oversight).
  return Number.isFinite(n) ? n.toLocaleString("uz-UZ") + " so'm" : "0 so'm";
};

export function EmployeeCardsSummary({ employeeId }: { employeeId: string | number }) {
  const { t } = useTranslation("common");

  const { data, isLoading } = useQuery<{ cards: EmpCard[]; totalSalary: number }>({
    queryKey: [`/api/org-structure/cards/by-employee/${employeeId}`],
    enabled: !!employeeId,
  });
  // Card-gate (EP-ORG-003): card-derived RBAC tier + salary eligibility. Keyed by user id
  // (employees.id == users.id in EuroPrint). Non-blocking — card-less user is flagged, not denied.
  const { data: gate, isLoading: gateLoading } = useQuery<CardGate>({
    queryKey: [`/api/org-structure/cards/gate/by-user/${employeeId}`],
    enabled: !!employeeId,
  });

  const cards = Array.isArray(data?.cards) ? data!.cards : [];
  const total = data?.totalSalary ?? 0;
  const primaryCard = cards.find((c) => c.is_primary) ?? null;
  const hasCard = gate?.has_card === true;
  const salaryEligible = gate?.salary_eligible === true;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-[16px] font-semibold flex items-center gap-2">
          <Layers className="h-4 w-4" />
          {t("kartalarVaUmumiyOylik")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* 1. Card-gate banner — birlamchi karta + RBAC daraja + oylik huquqi */}
        {gateLoading ? (
          <div className="mb-4"><EPLoader /></div>
        ) : (
          <div className="mb-4 rounded-lg border border-border p-3 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:flex-wrap sm:gap-x-6 sm:gap-y-2">
            <div className="flex items-center gap-2 text-[12px] font-semibold uppercase text-muted-foreground">
              {hasCard
                ? <ShieldCheck className="h-3.5 w-3.5 text-[var(--ep-green)]" />
                : <ShieldAlert className="h-3.5 w-3.5 text-[var(--ep-red)]" />}
              {t("kirishHuquqlari")}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] text-muted-foreground">{t("asosiyKarta", "Birlamchi karta")}:</span>
              <span className="text-[13px] font-medium">
                {gate?.card_name ?? primaryCard?.position_name ?? "—"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] text-muted-foreground">{t("rbacDaraja")}:</span>
              {gate?.rbac_tier
                ? <EPStatusPill tone="info">{gate.rbac_tier}</EPStatusPill>
                : <span className="text-[13px] text-muted-foreground">—</span>}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] text-muted-foreground">{t("oylikHuquqi", "Oylik huquqi")}:</span>
              {salaryEligible
                ? <EPStatusPill tone="success">{t("haq", "Bor")}</EPStatusPill>
                : <EPStatusPill tone="warning">{t("yoq", "Yo'q")}</EPStatusPill>}
            </div>
            {gate?.gated && gate.flag ? (
              <p className="basis-full text-[12px] text-[var(--ep-yellow)] mt-0.5">{gate.flag}</p>
            ) : null}
          </div>
        )}

        {/* 2. Kartalar jadvali + FORMULA-A umumiy oylik */}
        {isLoading ? (
          <EPLoader />
        ) : cards.length === 0 ? (
          <EPEmptyState icon={Layers} title={t("kartaBiriktirilmagan")} />
        ) : (
          <>
            <div className="rounded-lg border border-border overflow-x-auto mb-3">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("lavozimNomi")}</TableHead>
                    <TableHead>{t("kartaKodi")}</TableHead>
                    <TableHead>{t("oylik")}</TableHead>
                    <TableHead>{t("tur")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cards.map((c) => (
                    <TableRow key={c.card_id} data-testid={`row-empcard-${c.card_id}`}>
                      <TableCell className="font-medium">{c.position_name}</TableCell>
                      <TableCell className="text-muted-foreground">{c.code ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{fmtSom(c.card_salary)}</TableCell>
                      <TableCell>
                        {c.is_acting
                          ? <EPStatusPill tone="warning">{t("io")}</EPStatusPill>
                          : c.is_primary
                            ? <EPStatusPill tone="brand">{t("asosiy")}</EPStatusPill>
                            : <EPStatusPill tone="neutral">{t("qoshimcha")}</EPStatusPill>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2">
              <span className="text-[13px] text-muted-foreground">{t("umumiyOylikFormulaA")}</span>
              <span className="text-[16px] font-semibold">{fmtSom(total)}</span>
            </div>

            {/* 3. Oylik komponentlari — vizyon formula (baza × razryad-koeff × ЦКП% × stake-ulush) */}
            <div className="mt-4 rounded-lg border border-border p-3">
              <div className="flex items-center gap-2 mb-2.5 text-[13px] font-semibold">
                <Wallet className="h-4 w-4" />
                {t("oylikKomponentlari", "Oylik komponentlari")}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="rounded-md border border-border p-2.5">
                  <p className="text-[11px] text-muted-foreground">{t("baza", "Baza (karta oyligi)")}</p>
                  <p className="text-[14px] font-semibold mt-0.5">{fmtSom(total)}</p>
                </div>
                <div className="rounded-md border border-border p-2.5">
                  <p className="text-[11px] text-muted-foreground">{t("razryadKoeff", "Razryad koeff.")}</p>
                  <p className="text-[14px] font-semibold mt-0.5 text-muted-foreground">—</p>
                </div>
                <div className="rounded-md border border-border p-2.5">
                  <p className="text-[11px] text-muted-foreground">{t("ckpBajarish", "ЦКП bajarish %")}</p>
                  <p className="text-[14px] font-semibold mt-0.5 text-muted-foreground">—</p>
                </div>
                <div className="rounded-md border border-border p-2.5">
                  <p className="text-[11px] text-muted-foreground">{t("stakeUlush", "Stake ulush")}</p>
                  <p className="text-[14px] font-semibold mt-0.5 text-muted-foreground">—</p>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2.5">
                {t(
                  "oylikFormulaIzoh",
                  "Yakuniy oylik = baza × razryad-koeff × ЦКП-bajarish% × stake-ulush. Koeffitsiyentlar master-data to'lganda faollashadi (qurilish bosqichi).",
                )}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
