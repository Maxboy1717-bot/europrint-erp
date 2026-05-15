/** @module FinanceTabRecordLists @description List and table sub-components for displaying bonus, fine, overtime, and cash-advance records in the employee finance tab. */

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Gift, AlertTriangle, Wallet } from "lucide-react";
import type { BonusRecord, FineRecord, OvertimeRecord, CashAdvanceRecord } from "./profile-types";
import { BONUS_TYPE_LABELS, FINE_TYPE_LABELS, CASH_ADVANCE_STATUS_CONFIG } from "./FinanceTabTypes";
import { EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

// ---------------------------------------------------------------------------
// BonusList
// ---------------------------------------------------------------------------

interface BonusListProps {
  loading: boolean;
  bonuses: BonusRecord[] | undefined;
}

export function BonusList({ loading, bonuses }: BonusListProps) {
  const { t } = useTranslation("common");
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Skeleton className="h-32 rounded-lg" /><Skeleton className="h-32 rounded-lg" />
      </div>
    );
  }
  if (!bonuses || bonuses.length === 0) {
    return <p className="text-muted-foreground text-center py-8">{t("bonuslarYoq")}</p>;
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {(Array.isArray(bonuses) ? bonuses : []).map((bonus: BonusRecord) => (
        <Card key={bonus.id} className="border" data-testid={`card-bonus-${bonus.id}`}>
          <CardContent className="pt-4">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-[var(--ep-green)]" />
                <EPStatusPill tone="success">{BONUS_TYPE_LABELS[bonus.bonusType] || bonus.bonusType}</EPStatusPill>
              </div>
            </div>
            <p className="text-2xl font-bold text-[var(--ep-green)] mb-2">+{bonus.amount?.toLocaleString()} so'm</p>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Sana: {bonus.paymentDate}</p>
              {bonus.description && <p>Izoh: {bonus.description}</p>}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FineList
// ---------------------------------------------------------------------------

interface FineListProps {
  loading: boolean;
  fines: FineRecord[] | undefined;
}

export function FineList({ loading, fines }: FineListProps) {
  const { t } = useTranslation("common");
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Skeleton className="h-32 rounded-lg" /><Skeleton className="h-32 rounded-lg" />
      </div>
    );
  }
  if (!fines || fines.length === 0) {
    return <p className="text-muted-foreground text-center py-8">{t("jarimalarYoq")}</p>;
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {(Array.isArray(fines) ? fines : []).map((fine: FineRecord) => (
        <Card key={fine.id} className="border" data-testid={`card-fine-${fine.id}`}>
          <CardContent className="pt-4">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-[var(--ep-red)]" />
                <EPStatusPill tone="danger">{FINE_TYPE_LABELS[fine.fineType] || fine.fineType}</EPStatusPill>
              </div>
              {fine.deductedFromSalary && <EPStatusPill tone="info">{t("tolabTashlandi")}</EPStatusPill>}
            </div>
            <p className="text-2xl font-bold text-[var(--ep-red)] mb-2">-{fine.amount?.toLocaleString()} so'm</p>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Sana: {fine.fineDate}</p>
              {fine.description && <p>Izoh: {fine.description}</p>}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// OvertimeTable
// ---------------------------------------------------------------------------

interface OvertimeTableProps {
  loading: boolean;
  overtime: OvertimeRecord[] | undefined;
}

export function OvertimeTable({ loading, overtime }: OvertimeTableProps) {
  const { t } = useTranslation("common");
  if (loading) return <Skeleton className="h-40 w-full rounded-lg" />;
  if (!overtime || overtime.length === 0) {
    return <p className="text-muted-foreground text-center py-8">{t("overtaymYozuvlariYoq")}</p>;
  }
  return (
    <div className="ep-table-scroll"><Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("date")}</TableHead>
          <TableHead>{t("soatlar")}</TableHead>
          <TableHead>{t("stavka")}</TableHead>
          <TableHead>{t("koeff")}</TableHead>
          <TableHead>{t("total")}</TableHead>
          <TableHead>{t("sabab")}</TableHead>
          <TableHead>{t("status28")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(Array.isArray(overtime) ? overtime : []).map((record: OvertimeRecord) => (
          <TableRow key={record.id} data-testid={`row-overtime-${record.id}`} className="hover:bg-muted/40 transition-colors">
            <TableCell>{record.workDate}</TableCell>
            <TableCell>{record.hours} soat</TableCell>
            <TableCell>{record.hourlyRate?.toLocaleString()} so'm</TableCell>
            <TableCell>{record.multiplier}x</TableCell>
            <TableCell className="font-bold text-[var(--ep-primary)]">{record.totalAmount?.toLocaleString()} so'm</TableCell>
            <TableCell className="max-w-[200px] truncate">{record.reason || "-"}</TableCell>
            <TableCell>
              {record.isPaid
                ? <EPStatusPill tone="success">{t("tolangan")}</EPStatusPill>
                : <EPStatusPill tone="neutral">{t("Kutilmoqda")}</EPStatusPill>}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table></div>
  );
}

// ---------------------------------------------------------------------------
// CashAdvanceList
// ---------------------------------------------------------------------------

interface CashAdvanceListProps {
  loading: boolean;
  cashAdvances: CashAdvanceRecord[] | undefined;
}

export function CashAdvanceList({ loading, cashAdvances }: CashAdvanceListProps) {
  const { t } = useTranslation("common");
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Skeleton className="h-32 rounded-lg" /><Skeleton className="h-32 rounded-lg" />
      </div>
    );
  }
  if (!cashAdvances || cashAdvances.length === 0) {
    return <p className="text-muted-foreground text-center py-8">{t("avansSorovlariYoq")}</p>;
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {(Array.isArray(cashAdvances) ? cashAdvances : []).map((advance) => {
        const status = CASH_ADVANCE_STATUS_CONFIG[advance.status] || { label: advance.status, color: "bg-gray-500" };
        return (
          <Card key={advance.id} className="border" data-testid={`card-advance-${advance.id}`}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-[var(--ep-blue)]" />
                  <Badge className={status.color}>{status.label}</Badge>
                </div>
              </div>
              <p className="text-2xl font-bold text-[var(--ep-blue)] mb-2">{advance.amount?.toLocaleString()} so'm</p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Sana: {advance.requestDate}</p>
                {advance.reason && <p>Sabab: {advance.reason}</p>}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
