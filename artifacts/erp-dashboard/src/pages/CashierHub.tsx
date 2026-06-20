/**
 * @module CashierHub
 * @description Finance manager view over the factory CASHIER-HUB read surface:
 *   (a) cashier shifts list (open/closed), (b) the KAS-2 salary-payout approval queue with
 *   Approve / Reject driving the EXISTING POST endpoints, (c) advance-reports list with Approve.
 *   Read endpoints: GET /api/finance/cashier/shifts, /salary-payouts, /advance-reports.
 *   Write endpoints (already existed): POST /salary-payouts/:id/approve|reject,
 *   /advance-reports/:id/approve. useQuery (skeleton) + useMutation (toast + invalidate); reject is
 *   confirmed via ConfirmDialog (Qoida 14). EP design tokens only — no raw colors (Qoida 21).
 * @layer Frontend page (Finance / tz10)
 */

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-request";
import { Banknote, CheckCircle, XCircle, ReceiptText, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDateTime } from "@/lib/format";
import {
  EPPageHeader,
  EPStatusPill,
  EPErrorState,
  EPEmptyState,
  EPSkeletonTable,
  type EPStatusTone,
} from "@/components/ep";

// ─── Row shapes returned by the read endpoints (mirror the BE projections) ──────────────────
interface ShiftRow {
  id: number;
  cashierUserId: number;
  cashierName: string | null;
  openedAt: string | null;
  openedAmount: string | number | null;
  closedAt: string | null;
  closedAmount: string | number | null;
  expectedAmount: string | number | null;
  variance: string | number | null;
  status: string;
}

interface ApprovalRow {
  id: number;
  employeeId: number;
  employeeName: string | null;
  amount: string | number | null;
  reference: string;
  status: string;
  aiCheckedAt: string | null;
  hrApprovedAt: string | null;
  financeApprovedAt: string | null;
  directorApprovedAt: string | null;
  createdAt: string | null;
}

interface AdvanceReportRow {
  id: number;
  employeeId: number;
  employeeName: string | null;
  debtId: number;
  amount: string | number | null;
  receiptRef: string | null;
  approved: boolean;
  reference: string;
  createdAt: string | null;
}

interface ListPage<T> {
  data: T[];
  total: number;
}

// The ordered approval chain — the next un-stamped stage is the one to approve next.
const STAGE_ORDER = ["ai_checked", "hr_approved", "finance_approved", "director_approved"] as const;
type Stage = (typeof STAGE_ORDER)[number];

const STAGE_LABEL: Record<Stage, string> = {
  ai_checked: "AI tekshiruvi",
  hr_approved: "HR tasdig'i",
  finance_approved: "Moliya tasdig'i",
  director_approved: "Direktor tasdig'i",
};

/** The next stage to stamp for a chain (or null when the chain is complete / dead). */
function nextStage(row: ApprovalRow): Stage | null {
  if (row.status === "approved" || row.status === "rejected") return null;
  if (!row.aiCheckedAt) return "ai_checked";
  if (!row.hrApprovedAt) return "hr_approved";
  if (!row.financeApprovedAt) return "finance_approved";
  if (!row.directorApprovedAt) return "director_approved";
  return null;
}

function shiftTone(status: string): EPStatusTone {
  return status === "open" ? "success" : "neutral";
}

function approvalTone(status: string): EPStatusTone {
  if (status === "approved") return "success";
  if (status === "rejected") return "danger";
  return "warning";
}

export default function CashierHub() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rejectId, setRejectId] = useState<number | null>(null);

  // ─── (a) shifts list (open + closed, newest first) ────────────────────────────────────────
  const shiftsQuery = useQuery<ListPage<ShiftRow>>({
    queryKey: ["/api/finance/cashier/shifts"],
    queryFn: () => apiRequest("GET", "/api/finance/cashier/shifts"),
  });

  // ─── (b) salary-payout approval queue (pending by default) ────────────────────────────────
  const approvalsQuery = useQuery<ListPage<ApprovalRow>>({
    queryKey: ["/api/finance/cashier/salary-payouts", { status: "pending" }],
    queryFn: () => apiRequest("GET", "/api/finance/cashier/salary-payouts?status=pending"),
  });

  // ─── (c) advance reports (pending by default) ─────────────────────────────────────────────
  const reportsQuery = useQuery<ListPage<AdvanceReportRow>>({
    queryKey: ["/api/finance/cashier/advance-reports", { status: "pending" }],
    queryFn: () => apiRequest("GET", "/api/finance/cashier/advance-reports?status=pending"),
  });

  const shifts = Array.isArray(shiftsQuery.data?.data) ? shiftsQuery.data.data : [];
  const approvals = Array.isArray(approvalsQuery.data?.data) ? approvalsQuery.data.data : [];
  const reports = Array.isArray(reportsQuery.data?.data) ? reportsQuery.data.data : [];

  const openShiftCount = useMemo(() => shifts.filter((s) => s.status === "open").length, [shifts]);

  // ─── mutations (drive the EXISTING POST endpoints) ────────────────────────────────────────
  const approveStageMutation = useMutation({
    mutationFn: (vars: { id: number; stage: Stage }) =>
      apiRequest("POST", `/api/finance/cashier/salary-payouts/${vars.id}/approve`, { stage: vars.stage }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finance/cashier/salary-payouts"] });
      toast({ title: "Bosqich tasdiqlandi" });
    },
    onError: () => toast({ title: "Xatolik", description: "Tasdiqlab bo'lmadi", variant: "destructive" }),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest("POST", `/api/finance/cashier/salary-payouts/${id}/reject`, {
        reason: "Menejer tomonidan rad etildi",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finance/cashier/salary-payouts"] });
      toast({ title: "Zanjir rad etildi" });
    },
    onError: () => toast({ title: "Xatolik", description: "Rad etib bo'lmadi", variant: "destructive" }),
  });

  const approveReportMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest("POST", `/api/finance/cashier/advance-reports/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finance/cashier/advance-reports"] });
      toast({ title: "Avans hisoboti tasdiqlandi" });
    },
    onError: () => toast({ title: "Xatolik", description: "Tasdiqlab bo'lmadi", variant: "destructive" }),
  });

  const refreshAll = () => {
    void shiftsQuery.refetch();
    void approvalsQuery.refetch();
    void reportsQuery.refetch();
  };

  if (shiftsQuery.isError && approvalsQuery.isError && reportsQuery.isError) {
    return <EPErrorState onRetry={refreshAll} />;
  }

  return (
    <div className="flex flex-col h-full gap-5 p-4">
      <EPPageHeader
        data-testid="text-page-title"
        icon={<Banknote className="h-5 w-5" />}
        title="Kassir markazi"
        subtitle="Smenalar, ish haqi to'lovi tasdiqlash navbati va avans hisobotlari"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <EPStatusPill tone="info" data-testid="badge-open-shifts">
              Ochiq smenalar: {openShiftCount}
            </EPStatusPill>
            <Button variant="ghost" size="sm" onClick={refreshAll} title="Yangilash" data-testid="button-refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="approvals" className="flex-1 flex flex-col">
        <TabsList data-testid="tabs-cashier-hub">
          <TabsTrigger value="approvals" data-testid="tab-approvals">
            <CheckCircle className="h-4 w-4 mr-1" /> Tasdiq navbati ({approvals.length})
          </TabsTrigger>
          <TabsTrigger value="shifts" data-testid="tab-shifts">
            <Banknote className="h-4 w-4 mr-1" /> Smenalar ({shifts.length})
          </TabsTrigger>
          <TabsTrigger value="reports" data-testid="tab-reports">
            <ReceiptText className="h-4 w-4 mr-1" /> Avans hisobotlari ({reports.length})
          </TabsTrigger>
        </TabsList>

        {/* (b) Salary-payout approval queue */}
        <TabsContent value="approvals" className="mt-3">
          {approvalsQuery.isLoading ? (
            <EPSkeletonTable rows={6} />
          ) : approvals.length === 0 ? (
            <EPEmptyState icon={CheckCircle} title="Tasdiq navbati bo'sh" description="Hozircha kutilayotgan ish haqi to'lovi yo'q." />
          ) : (
            <Table data-testid="table-approvals">
              <TableHeader>
                <TableRow>
                  <TableHead>Xodim</TableHead>
                  <TableHead>Summa</TableHead>
                  <TableHead>Holat</TableHead>
                  <TableHead>Keyingi bosqich</TableHead>
                  <TableHead className="text-right">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvals.map((row) => {
                  const next = nextStage(row);
                  return (
                    <TableRow key={row.id} data-testid={`row-approval-${row.id}`}>
                      <TableCell>
                        <div className="font-medium">{row.employeeName ?? `#${row.employeeId}`}</div>
                        <div className="text-[12px] text-muted-foreground">{row.reference}</div>
                      </TableCell>
                      <TableCell>{formatCurrency(Number(row.amount ?? 0))}</TableCell>
                      <TableCell>
                        <EPStatusPill tone={approvalTone(row.status)}>{row.status}</EPStatusPill>
                      </TableCell>
                      <TableCell className="text-[13px] text-muted-foreground">
                        {next ? STAGE_LABEL[next] : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            disabled={!next || approveStageMutation.isPending}
                            onClick={() => next && approveStageMutation.mutate({ id: row.id, stage: next })}
                            data-testid={`button-approve-${row.id}`}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" /> Tasdiqlash
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={row.status === "approved" || row.status === "rejected" || rejectMutation.isPending}
                            onClick={() => setRejectId(row.id)}
                            data-testid={`button-reject-${row.id}`}
                          >
                            <XCircle className="h-4 w-4 mr-1" /> Rad etish
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        {/* (a) Shifts list */}
        <TabsContent value="shifts" className="mt-3">
          {shiftsQuery.isLoading ? (
            <EPSkeletonTable rows={6} />
          ) : shifts.length === 0 ? (
            <EPEmptyState icon={Banknote} title="Smena yo'q" description="Hozircha ochilgan kassir smenasi yo'q." />
          ) : (
            <Table data-testid="table-shifts">
              <TableHeader>
                <TableRow>
                  <TableHead>Smena</TableHead>
                  <TableHead>Kassir</TableHead>
                  <TableHead>Ochilgan</TableHead>
                  <TableHead>Ochilish summasi</TableHead>
                  <TableHead>Kutilgan balans</TableHead>
                  <TableHead>Holat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shifts.map((row) => (
                  <TableRow key={row.id} data-testid={`row-shift-${row.id}`}>
                    <TableCell className="font-medium">#{row.id}</TableCell>
                    <TableCell>{row.cashierName ?? `#${row.cashierUserId}`}</TableCell>
                    <TableCell className="text-[13px] text-muted-foreground">
                      {row.openedAt ? formatDateTime(row.openedAt) : "—"}
                    </TableCell>
                    <TableCell>{formatCurrency(Number(row.openedAmount ?? 0))}</TableCell>
                    <TableCell>
                      {row.expectedAmount != null ? formatCurrency(Number(row.expectedAmount)) : "—"}
                    </TableCell>
                    <TableCell>
                      <EPStatusPill tone={shiftTone(row.status)}>{row.status}</EPStatusPill>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        {/* (c) Advance reports list */}
        <TabsContent value="reports" className="mt-3">
          {reportsQuery.isLoading ? (
            <EPSkeletonTable rows={6} />
          ) : reports.length === 0 ? (
            <EPEmptyState icon={ReceiptText} title="Avans hisoboti yo'q" description="Hozircha kutilayotgan avans hisoboti yo'q." />
          ) : (
            <Table data-testid="table-reports">
              <TableHeader>
                <TableRow>
                  <TableHead>Xodim</TableHead>
                  <TableHead>Summa</TableHead>
                  <TableHead>Chek</TableHead>
                  <TableHead>Holat</TableHead>
                  <TableHead className="text-right">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((row) => (
                  <TableRow key={row.id} data-testid={`row-report-${row.id}`}>
                    <TableCell>
                      <div className="font-medium">{row.employeeName ?? `#${row.employeeId}`}</div>
                      <div className="text-[12px] text-muted-foreground">{row.reference}</div>
                    </TableCell>
                    <TableCell>{formatCurrency(Number(row.amount ?? 0))}</TableCell>
                    <TableCell className="text-[13px] text-muted-foreground">{row.receiptRef ?? "—"}</TableCell>
                    <TableCell>
                      <EPStatusPill tone={row.approved ? "success" : "warning"}>
                        {row.approved ? "Tasdiqlangan" : "Kutilmoqda"}
                      </EPStatusPill>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="default"
                        disabled={row.approved || approveReportMutation.isPending}
                        onClick={() => approveReportMutation.mutate(row.id)}
                        data-testid={`button-approve-report-${row.id}`}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" /> Tasdiqlash
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={rejectId !== null}
        onOpenChange={(open) => {
          if (!open) setRejectId(null);
        }}
        title="To'lovni rad etishni tasdiqlang"
        description="Rad etilgan tasdiq zanjirini qayta tiklab bo'lmaydi va to'lov amalga oshmaydi."
        confirmText="Rad etish"
        cancelText="Bekor qilish"
        variant="destructive"
        onConfirm={() => {
          if (rejectId !== null) {
            rejectMutation.mutate(rejectId);
            setRejectId(null);
          }
        }}
      />
    </div>
  );
}
