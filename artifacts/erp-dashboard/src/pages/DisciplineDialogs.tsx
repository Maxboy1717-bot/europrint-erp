/**
 * @module DisciplineDialogs
 * @description Create-record dialog and Employee-history dialog for Discipline.
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { History } from "lucide-react";
import { formatDate } from "@/lib/format";
import type { User as UserType } from "@shared/schema";
import type { DisciplineWithUser, DialogType } from "./DisciplineTypes";

// ─── CreateRecordDialog ───────────────────────────────────────────────────────

interface CreateRecordDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  dialogType: DialogType;
  employees: UserType[];
  selectedEmployee: string;
  onEmployeeChange: (v: string) => void;
  warningType: string;
  onWarningTypeChange: (v: string) => void;
  amount: string;
  onAmountChange: (v: string) => void;
  reason: string;
  onReasonChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
  oralLabel: string;
  writtenLabel: string;
  finalLabel: string;
  sumLabel: string;
  tCommon: (key: string) => string;
  t: (key: string) => string;
}

export function CreateRecordDialog({ isOpen, onOpenChange, dialogType, employees, selectedEmployee, onEmployeeChange, warningType, onWarningTypeChange, amount, onAmountChange, reason, onReasonChange, onSave, onCancel, isSaving, oralLabel, writtenLabel, finalLabel, sumLabel, tCommon, t, }: CreateRecordDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold"> {dialogType === "warning" && tCommon("warning")}
            {dialogType === "penalty" && t("fine")}
            {dialogType === "reward"  && t("reward")}
            {dialogType === "act"     && t("documents")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>{t("employees")}</Label>
            <Select value={selectedEmployee} onValueChange={onEmployeeChange}>
              <SelectTrigger data-testid="select-employee" className="h-9">
                <SelectValue placeholder={t("employees")} />
              </SelectTrigger>
              <SelectContent>
                {(Array.isArray(employees) ? employees : []).map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {dialogType === "warning" && (
            <div>
              <Label>{tCommon("type")}</Label>
              <Select value={warningType} onValueChange={onWarningTypeChange}>
                <SelectTrigger data-testid="select-warning-type" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="oral">{oralLabel}</SelectItem>
                  <SelectItem value="written">{writtenLabel}</SelectItem>
                  <SelectItem value="final">{finalLabel}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {(dialogType === "penalty" || dialogType === "reward") && (
            <div>
              <Label>{tCommon("amount")} ({sumLabel})</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => onAmountChange(e.target.value)}
                placeholder="100000"
                data-testid="input-amount"
              />
            </div>
          )}

          <div>
            <Label>{tCommon("description")}</Label>
            <Textarea
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder={tCommon("description")}
              rows={4}
              data-testid="input-reason"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onCancel} data-testid="button-cancel">
              {tCommon("cancel")}
            </Button>
            <Button
              onClick={onSave}
              disabled={!selectedEmployee || !reason || isSaving}
              data-testid="button-save"
            >
              {tCommon("save")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── EmployeeHistoryDialog ────────────────────────────────────────────────────

interface EmployeeHistoryDialogProps {
  selectedEmployeeHistory: string | null;
  onClose: () => void;
  employees: UserType[];
  employeeHistoryRecords: DisciplineWithUser[];
  getTypeBadge: (type: string) => React.ReactNode;
  sumLabel: string;
  tCommon: (key: string) => string;
  t: (key: string) => string;
}

export function EmployeeHistoryDialog({
  selectedEmployeeHistory, onClose,
  employees, employeeHistoryRecords,
  getTypeBadge, sumLabel, tCommon, t,
}: EmployeeHistoryDialogProps) {
  const employeeName = (Array.isArray(employees) ? employees : []).find(
    (e) => e.id === selectedEmployeeHistory,
  )?.fullName;

  return (
    <Dialog open={!!selectedEmployeeHistory} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-4 w-4" />
            {t("employeeDetails")}: {employeeName}
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-96 overflow-y-auto">
          <div className="ep-table-scroll"><Table>
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow>
                <TableHead>{tCommon("date")}</TableHead>
                <TableHead>{tCommon("type")}</TableHead>
                <TableHead>{tCommon("amount")}</TableHead>
                <TableHead>{tCommon("description")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(employeeHistoryRecords) ? employeeHistoryRecords : []).map((record) => (
                <TableRow key={record.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell>{formatDate(record.createdAt)}</TableCell>
                  <TableCell>{getTypeBadge(record.type)}</TableCell>
                  <TableCell>
                    {record.amount ? (
                      <span className={record.type === "penalty" ? "text-[var(--ep-red)]" : "text-[var(--ep-green)]"}>
                        {record.type === "penalty" ? "-" : "+"}{record.amount.toLocaleString()} {sumLabel}
                      </span>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>{record.reason}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
