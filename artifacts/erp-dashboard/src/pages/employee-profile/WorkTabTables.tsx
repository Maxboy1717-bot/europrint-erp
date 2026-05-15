/**
 * @module WorkTabTables
 * @description Table and card display components for WorkTab: SalaryHistoryTable
 * (read-only salary-change rows), TransfersCard (position transfer history), and
 * ContractCard (single employment-contract summary card with expiry badges).
 * These components receive data via props and contain no mutation or dialog logic.
 */

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Briefcase, FileText, AlertTriangle, Clock, CheckCircle } from "lucide-react";
import type {
  EmploymentContract,
  SalaryHistoryRecord,
  TransferRecord,
  TranslationFn,
} from "./WorkTabTypes";
import { CONTRACT_TYPE_COLORS, buildChangeTypeLabels, buildContractTypeLabels } from "./WorkTabTypes";

// ─── Single contract card ─────────────────────────────────────────────────────

interface ContractCardProps {
  contract: EmploymentContract;
  t: TranslationFn & ((key: string) => string);
  tCommon: TranslationFn;
}

export function ContractCard({ contract, t, tCommon }: ContractCardProps) {
  const contractTypeLabels = buildContractTypeLabels(t);
  const now = new Date();
  const endDate = contract.endDate ? new Date(contract.endDate) : null;
  const isActive = !endDate || endDate >= now;
  const daysLeft =
    endDate !== null
      ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;
  const isExpiringSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 30;
  const isExpired = daysLeft !== null && daysLeft < 0;

  return (
    <Card
      className={`border ${
        isExpired
          ? "border-red-300 bg-red-50/30"
          : isExpiringSoon
          ? "border-amber-300 bg-amber-50/30"
          : ""
      }`}
      data-testid={`card-contract-${contract.id}`}
    >
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-2 mb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{contract.contractNumber}</span>
            <Badge
              className={`text-xs border-none ${
                CONTRACT_TYPE_COLORS[contract.contractType] ||
                "bg-muted/60 text-muted-foreground"
              }`}
            >
              {contractTypeLabels[contract.contractType] || contract.contractType}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5">
            {isExpired ? (
              <Badge className="bg-red-100 text-red-800 border-none text-xs gap-1">
                <AlertTriangle className="h-3 w-3" />
                Muddati o&apos;tgan
              </Badge>
            ) : isExpiringSoon ? (
              <Badge className="bg-amber-100 text-amber-800 border-none text-xs gap-1">
                <Clock className="h-3 w-3" />
                {daysLeft} kun qoldi
              </Badge>
            ) : isActive ? (
              <Badge className="bg-green-100 text-green-800 border-none text-xs gap-1">
                <CheckCircle className="h-3 w-3" />
                {tCommon("active")}
              </Badge>
            ) : null}
          </div>
        </div>

        {isExpiringSoon && !isExpired && (
          <div className="mb-3 p-2 rounded-md bg-amber-50 border border-amber-200 flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-[var(--ep-yellow)] shrink-0" />
            <p className="text-xs text-[var(--ep-yellow)]">
              Shartnoma muddati {daysLeft} kunda tugaydi! HR va rahbarga eslatma
              yuborildi.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground">{t("salary")}</p>
            <p className="font-medium text-[var(--ep-green)]">
              {contract.salary?.toLocaleString()} so&apos;m
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">{t("startDate")}</p>
            <p className="font-medium">{contract.startDate}</p>
          </div>
          <div>
            <p className="text-muted-foreground">{t("endDate")}</p>
            <p
              className={`font-medium ${
                isExpired ? "text-[var(--ep-red)]" : isExpiringSoon ? "text-[var(--ep-yellow)]" : ""
              }`}
            >
              {contract.endDate || "Muddatsiz"}
            </p>
          </div>
          {contract.workSchedule && (
            <div>
              <p className="text-muted-foreground">{t("workSchedule")}</p>
              <p className="font-medium">{contract.workSchedule}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Salary history table ─────────────────────────────────────────────────────

interface SalaryHistoryTableProps {
  t: TranslationFn & ((key: string) => string);
  tCommon: TranslationFn;
  loadingSalaryHistory: boolean;
  salaryHistory: SalaryHistoryRecord[] | undefined;
}

export function SalaryHistoryTable({
  t,
  tCommon,
  loadingSalaryHistory,
  salaryHistory,
}: SalaryHistoryTableProps) {
  if (loadingSalaryHistory) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    );
  }

  if (!salaryHistory || salaryHistory.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">
        {tCommon("noData")}
      </p>
    );
  }

  const changeTypeLabels = buildChangeTypeLabels(t);

  return (
    <div className="ep-table-scroll"><Table>
      <TableHeader>
        <TableRow>
          <TableHead>{tCommon("date")}</TableHead>
          <TableHead>{t("previousSalary")}</TableHead>
          <TableHead>{t("newSalary")}</TableHead>
          <TableHead>{t("change")}</TableHead>
          <TableHead>{tCommon("type")}</TableHead>
          <TableHead>{tCommon("note")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(Array.isArray(salaryHistory) ? salaryHistory : []).map(
          (record: SalaryHistoryRecord) => {
            const changePercent = record.changePercent || 0;
            return (
              <TableRow key={record.id} data-testid={`row-salary-${record.id}`} className="hover:bg-muted/40 transition-colors">
                <TableCell>{record.effectiveDate}</TableCell>
                <TableCell>
                  {record.previousSalary?.toLocaleString()} so&apos;m
                </TableCell>
                <TableCell className="font-medium">
                  {record.newSalary?.toLocaleString()} so&apos;m
                </TableCell>
                <TableCell>
                  <span
                    className={
                      changePercent >= 0 ? "text-[var(--ep-green)]" : "text-[var(--ep-red)]"
                    }
                  >
                    {changePercent >= 0 ? "+" : ""}
                    {changePercent.toFixed(1)}%
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {changeTypeLabels[record.changeType] || record.changeType}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[150px] truncate">
                  {record.notes || "-"}
                </TableCell>
              </TableRow>
            );
          }
        )}
      </TableBody>
    </Table></div>
  );
}

// ─── Position transfers card ──────────────────────────────────────────────────

interface TransfersCardProps {
  t: TranslationFn & ((key: string) => string);
  tCommon: TranslationFn;
  transfers: TransferRecord[] | undefined;
}

export function TransfersCard({ t, tCommon, transfers }: TransfersCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          {t("positionChanges")}
        </CardTitle>
        <CardDescription>{t("employeeDetails")}</CardDescription>
      </CardHeader>
      <CardContent>
        {transfers && transfers.length > 0 ? (
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tCommon("date")}</TableHead>
                <TableHead>{t("previousPosition")}</TableHead>
                <TableHead>{t("newPosition")}</TableHead>
                <TableHead>{t("reason")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(transfers) ? transfers : []).map(
                (transfer: TransferRecord) => (
                  <TableRow
                    key={transfer.id}
                    data-testid={`row-transfer-${transfer.id}`}
                   className="hover:bg-muted/40 transition-colors">
                    <TableCell>{transfer.transferDate}</TableCell>
                    <TableCell>{transfer.fromPositionName || "-"}</TableCell>
                    <TableCell>{transfer.toPositionName}</TableCell>
                    <TableCell>{transfer.reason || "-"}</TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table></div>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            {tCommon("noData")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
