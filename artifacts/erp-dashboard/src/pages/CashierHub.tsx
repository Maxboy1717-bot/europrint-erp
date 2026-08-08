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
import { Banknote, CheckCircle, XCircle, ReceiptText, RefreshCw, LogIn, LogOut, Plus, Wallet, AlertTriangle, ArrowDownCircle, ArrowUpCircle, FileDown } from "lucide-react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import { tLabel } from "@/lib/i18n/tLabel";
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
  /** Storage key of the uploaded receipt (viewed at /api/storage/<key>) or null. */
  receiptFilePath: string | null;
  /** AI-OCR summa mosligi: true/false; null = AI hukmi yo'q (ODAM baribir yakuniy tasdiqlaydi). */
  ocrMatch: boolean | null;
  approved: boolean;
  reference: string;
  createdAt: string | null;
}

/** Expense category row from GET /api/finance-extended/finance-categories. */
interface FinanceCategoryRow {
  id: number;
  code: string;
  name: string;
  categoryType: string;
  isActive: boolean;
}

interface ListPage<T> {
  data: T[];
  total: number;
}

// ─── Naqd-ledger (X/Z cash ledger) shape — mirrors CashierLedger from the BE getShiftLedger ──
interface LedgerLine {
  id: number;
  type: string;
  amount: number;
  signedAmount: number;
  runningBalance: number;
  reference: string;
  description: string | null;
  pinVerified: boolean;
  createdAt: string | null;
}
interface CashierLedger {
  shiftId: number;
  status: string;
  openingAmount: number;
  cashIn: number;
  cashOut: number;
  balance: number;
  dailyCashLimit: number | null;
  limitExceeded: boolean;
  lines: LedgerLine[];
}

const MV_TYPE_LABEL: Record<string, string> = {
  cash_in: tLabel("finance.cashierHub.mvCashIn", "Kirim"),
  cash_out: tLabel("finance.cashierHub.mvCashOut", "Chiqim"),
  salary_payout: tLabel("finance.cashierHub.mvSalary", "Ish haqi"),
  advance: tLabel("finance.cashierHub.mvAdvance", "Avans"),
  expense: tLabel("finance.cashierHub.mvExpense", "Xarajat"),
};

// The ordered approval chain — the next un-stamped stage is the one to approve next.
const STAGE_ORDER = ["ai_checked", "hr_approved", "finance_approved", "director_approved"] as const;
type Stage = (typeof STAGE_ORDER)[number];

const STAGE_LABEL: Record<Stage, string> = {
  ai_checked: tLabel("finance.cashierHub.stageAiChecked", "AI tekshiruvi"),
  hr_approved: tLabel("finance.cashierHub.stageHrApproved", "HR tasdig'i"),
  finance_approved: tLabel("finance.cashierHub.stageFinanceApproved", "Moliya tasdig'i"),
  director_approved: tLabel("finance.cashierHub.stageDirectorApproved", "Direktor tasdig'i"),
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
  const { t } = useTranslation("finance");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [showOpenShift, setShowOpenShift] = useState(false);
  const [openingAmount, setOpeningAmount] = useState("");
  const [closeShiftId, setCloseShiftId] = useState<number | null>(null);
  const [closedAmount, setClosedAmount] = useState("");
  const [closeNotes, setCloseNotes] = useState("");
  const [recordMoveShiftId, setRecordMoveShiftId] = useState<number | null>(null);
  const [mvType, setMvType] = useState("cash_in");
  const [mvAmount, setMvAmount] = useState("");
  const [mvRef, setMvRef] = useState("");
  const [mvDesc, setMvDesc] = useState("");
  const [mvPin, setMvPin] = useState("");
  const [showIssueAdvance, setShowIssueAdvance] = useState(false);
  const [advEmployeeId, setAdvEmployeeId] = useState("");
  const [advAmount, setAdvAmount] = useState("");
  const [advRef, setAdvRef] = useState("");
  const [advReason, setAdvReason] = useState("");
  const [advCategoryId, setAdvCategoryId] = useState("");
  const [advPin, setAdvPin] = useState("");

  const [showCreatePayout, setShowCreatePayout] = useState(false);
  const [payoutEmpId, setPayoutEmpId] = useState("");
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutRef, setPayoutRef] = useState("");
  const [payoutNotes, setPayoutNotes] = useState("");

  const [showSubmitReport, setShowSubmitReport] = useState(false);
  const [reportDebtId, setReportDebtId] = useState("");
  const [reportAmount, setReportAmount] = useState("");
  const [reportReceiptRef, setReportReceiptRef] = useState("");
  const [reportRef, setReportRef] = useState("");
  const [reportNotes, setReportNotes] = useState("");
  const [reportFile, setReportFile] = useState<File | null>(null);

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

  // ─── expense categories (avans kategoriyasi select uchun — EXISTING endpoint) ─────────────
  const categoriesQuery = useQuery<{ data: FinanceCategoryRow[] }>({
    queryKey: ["/api/finance-extended/finance-categories", { limit: 100 }],
    queryFn: () => apiRequest("GET", "/api/finance-extended/finance-categories?limit=100"),
    retry: false, // finance-extended rollari 'cashier'ni o'z ichiga olmaydi — 403 da qayta urinmaymiz (select bo'sh qoladi, kategoriya ixtiyoriy)
  });
  const expenseCategories = Array.isArray(categoriesQuery.data?.data)
    ? categoriesQuery.data.data.filter((c) => c.categoryType === "expense" && c.isActive !== false)
    : [];

  const shifts = Array.isArray(shiftsQuery.data?.data) ? shiftsQuery.data.data : [];
  const approvals = Array.isArray(approvalsQuery.data?.data) ? approvalsQuery.data.data : [];
  const reports = Array.isArray(reportsQuery.data?.data) ? reportsQuery.data.data : [];

  const openShiftCount = useMemo(() => shifts.filter((s) => s.status === "open").length, [shifts]);
  const openShiftId = useMemo(() => shifts.find((s) => s.status === "open")?.id ?? null, [shifts]);

  // ─── (d) naqd-ledger of the currently-open shift (kirim/chiqim + running saldo + limit) ───
  const ledgerQuery = useQuery<CashierLedger>({
    queryKey: ["/api/finance/cashier/shifts", openShiftId, "ledger"],
    queryFn: () => apiRequest("GET", `/api/finance/cashier/shifts/${openShiftId}/ledger`),
    enabled: openShiftId !== null,
  });
  const ledger = ledgerQuery.data ?? null;
  const ledgerLines = Array.isArray(ledger?.lines) ? ledger.lines : [];

  // ─── mutations (drive the EXISTING POST endpoints) ────────────────────────────────────────
  const approveStageMutation = useMutation({
    mutationFn: (vars: { id: number; stage: Stage }) =>
      apiRequest("POST", `/api/finance/cashier/salary-payouts/${vars.id}/approve`, { stage: vars.stage }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finance/cashier/salary-payouts"] });
      toast({ title: t("cashierHub.stageApproved", "Bosqich tasdiqlandi") });
    },
    onError: () => toast({ title: t("error", "Xatolik"), description: t("cashierHub.approveFailed", "Tasdiqlab bo'lmadi"), variant: "destructive" }),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest("POST", `/api/finance/cashier/salary-payouts/${id}/reject`, {
        reason: t("cashierHub.rejectReason", "Menejer tomonidan rad etildi"),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finance/cashier/salary-payouts"] });
      toast({ title: t("cashierHub.chainRejected", "Zanjir rad etildi") });
    },
    onError: () => toast({ title: t("error", "Xatolik"), description: t("cashierHub.rejectFailed", "Rad etib bo'lmadi"), variant: "destructive" }),
  });

  const approveReportMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest("POST", `/api/finance/cashier/advance-reports/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finance/cashier/advance-reports"] });
      toast({ title: t("cashierHub.advanceReportApproved", "Avans hisoboti tasdiqlandi") });
    },
    onError: () => toast({ title: t("error", "Xatolik"), description: t("cashierHub.approveFailed", "Tasdiqlab bo'lmadi"), variant: "destructive" }),
  });

  const issueAdvanceMutation = useMutation({
    mutationFn: (vars: { shiftId: number; employeeId: number; amount: number; reference: string; reason?: string; categoryId?: number; pin: string }) =>
      apiRequest("POST", "/api/finance/cashier/advances", vars),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finance/cashier/advance-reports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance/cashier/shifts"] });
      setShowIssueAdvance(false);
      setAdvEmployeeId(""); setAdvAmount(""); setAdvRef(""); setAdvReason(""); setAdvCategoryId(""); setAdvPin("");
      toast({ title: t("cashierHub.advanceIssued", "Avans berildi") });
    },
    onError: () => toast({ title: t("error", "Xatolik"), description: t("cashierHub.advanceIssueFailed", "Avans berib bo'lmadi"), variant: "destructive" }),
  });

  const createPayoutMutation = useMutation({
    mutationFn: (vars: { employeeId: number; amount: number; reference: string; notes?: string }) =>
      apiRequest("POST", "/api/finance/cashier/salary-payouts", vars),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finance/cashier/salary-payouts"] });
      toast({ title: t("cashierHub.payoutRequested", "Maosh so'rovi yaratildi") });
      setShowCreatePayout(false); setPayoutEmpId(""); setPayoutAmount(""); setPayoutRef(""); setPayoutNotes("");
    },
    onError: () => toast({ title: t("error", "Xatolik"), variant: "destructive" }),
  });

  const submitReportMutation = useMutation({
    mutationFn: async (vars: { debtId: number; amount: number; receiptRef: string; reference: string; notes?: string }) => {
      // Chek faylini MAVJUD storage-upload orqali yuklaymiz (PUT /api/storage/upload — chat/kanban
      // bilan bir xil FormData naqshi), keyin storage kalitini receiptFilePath sifatida beramiz.
      let receiptFilePath: string | undefined;
      if (reportFile) {
        const safeName = reportFile.name.replace(/[^\w.\-]+/g, "_");
        const key = `podotchet/${Date.now()}-${safeName}`;
        const fd = new FormData();
        fd.append("file", reportFile, reportFile.name);
        await apiRequest(
          "PUT",
          `/api/storage/upload?key=${encodeURIComponent(key)}&mime=${encodeURIComponent(reportFile.type || "application/octet-stream")}`,
          fd,
        );
        receiptFilePath = key;
      }
      return apiRequest("POST", "/api/finance/cashier/advance-reports", {
        ...vars,
        ...(receiptFilePath && { receiptFilePath }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finance/cashier/advance-reports"] });
      toast({ title: t("cashierHub.reportSubmitted", "Hisobot yuborildi") });
      setShowSubmitReport(false); setReportDebtId(""); setReportAmount(""); setReportReceiptRef(""); setReportRef(""); setReportNotes(""); setReportFile(null);
    },
    onError: () => toast({ title: t("error", "Xatolik"), variant: "destructive" }),
  });

  const openShiftMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/finance/cashier/shifts/open", { openingAmount: Number(openingAmount) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finance/cashier/shifts"] });
      toast({ title: t("cashierHub.shiftOpened", "Smena ochildi") });
      setShowOpenShift(false);
      setOpeningAmount("");
    },
    onError: () => toast({ title: t("error", "Xatolik"), variant: "destructive" }),
  });

  const closeShiftMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest("POST", `/api/finance/cashier/shifts/${id}/close`, {
        closedAmount: Number(closedAmount),
        notes: closeNotes.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finance/cashier/shifts"] });
      toast({ title: t("cashierHub.shiftClosed", "Smena yopildi") });
      setCloseShiftId(null);
      setClosedAmount("");
      setCloseNotes("");
    },
    onError: () => toast({ title: t("error", "Xatolik"), variant: "destructive" }),
  });

  const PIN_REQUIRED = new Set(["cash_out", "salary_payout", "advance", "expense"]);

  const recordMoveMutation = useMutation({
    mutationFn: (shiftId: number) =>
      apiRequest("POST", `/api/finance/cashier/shifts/${shiftId}/movements`, {
        type: mvType,
        amount: Number(mvAmount),
        reference: mvRef.trim(),
        ...(mvDesc.trim() && { description: mvDesc.trim() }),
        ...(mvPin && { pin: mvPin }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finance/cashier/shifts"] });
      toast({ title: t("cashierHub.movementRecorded", "Harakat qayd etildi") });
      setRecordMoveShiftId(null);
      setMvType("cash_in"); setMvAmount(""); setMvRef(""); setMvDesc(""); setMvPin("");
    },
    onError: () => toast({ title: t("error", "Xatolik"), variant: "destructive" }),
  });

  const downloadDailyReport = (shiftId: number) => {
    window.open(`/api/finance/cashier/shifts/${shiftId}/pdf`, "_blank");
  };

  const refreshAll = () => {
    void shiftsQuery.refetch();
    void approvalsQuery.refetch();
    void reportsQuery.refetch();
    if (openShiftId !== null) void ledgerQuery.refetch();
  };

  if (shiftsQuery.isError && approvalsQuery.isError && reportsQuery.isError) {
    return <EPErrorState onRetry={refreshAll} />;
  }

  return (
    <div className="flex flex-col h-full gap-5 p-4">
      <EPPageHeader
        data-testid="text-page-title"
        icon={<Banknote className="h-5 w-5" />}
        title={t("cashierHub.title", "Kassir markazi")}
        subtitle={t("cashierHub.subtitle", "Smenalar, ish haqi to'lovi tasdiqlash navbati va avans hisobotlari")}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <EPStatusPill tone="info" data-testid="badge-open-shifts">
              {t("cashierHub.openShifts", "Ochiq smenalar")}: {openShiftCount}
            </EPStatusPill>
            <Button variant="ghost" size="sm" onClick={refreshAll} title={t("refresh", "Yangilash")} data-testid="button-refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="approvals" className="flex-1 flex flex-col">
        <TabsList data-testid="tabs-cashier-hub">
          <TabsTrigger value="approvals" data-testid="tab-approvals">
            <CheckCircle className="h-4 w-4 mr-1" /> {t("cashierHub.tabApprovals", "Tasdiq navbati")} ({approvals.length})
          </TabsTrigger>
          <TabsTrigger value="shifts" data-testid="tab-shifts">
            <Banknote className="h-4 w-4 mr-1" /> {t("cashierHub.tabShifts", "Smenalar")} ({shifts.length})
          </TabsTrigger>
          <TabsTrigger value="reports" data-testid="tab-reports">
            <ReceiptText className="h-4 w-4 mr-1" /> {t("cashierHub.tabReports", "Avans hisobotlari")} ({reports.length})
          </TabsTrigger>
          <TabsTrigger value="ledger" data-testid="tab-ledger">
            <Wallet className="h-4 w-4 mr-1" /> {t("cashierHub.tabLedger", "Naqd ledger")} ({ledgerLines.length})
          </TabsTrigger>
        </TabsList>

        {/* (b) Salary-payout approval queue */}
        <TabsContent value="approvals" className="mt-3">
          <div className="flex justify-end mb-3">
            <Button size="sm" variant="secondary" onClick={() => setShowCreatePayout(true)} data-testid="button-create-payout">
              <Plus className="h-4 w-4 mr-1" />
              {t("cashierHub.requestPayoutBtn", "Maosh so'rovi")}
            </Button>
          </div>
          {approvalsQuery.isLoading ? (
            <EPSkeletonTable rows={6} />
          ) : approvals.length === 0 ? (
            <EPEmptyState icon={CheckCircle} title={t("cashierHub.approvalsEmptyTitle", "Tasdiq navbati bo'sh")} description={t("cashierHub.approvalsEmptyDesc", "Hozircha kutilayotgan ish haqi to'lovi yo'q.")} />
          ) : (
            <Table data-testid="table-approvals">
              <TableHeader>
                <TableRow>
                  <TableHead>{t("cashierHub.colEmployee", "Xodim")}</TableHead>
                  <TableHead>{t("amount", "Summa")}</TableHead>
                  <TableHead>{t("cashierHub.colStatus", "Holat")}</TableHead>
                  <TableHead>{t("cashierHub.colNextStage", "Keyingi bosqich")}</TableHead>
                  <TableHead className="text-right">{t("cashierHub.colActions", "Amallar")}</TableHead>
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
                            <CheckCircle className="h-4 w-4 mr-1" /> {t("approve", "Tasdiqlash")}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={row.status === "approved" || row.status === "rejected" || rejectMutation.isPending}
                            onClick={() => setRejectId(row.id)}
                            data-testid={`button-reject-${row.id}`}
                          >
                            <XCircle className="h-4 w-4 mr-1" /> {t("cashierHub.reject", "Rad etish")}
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
        <TabsContent value="shifts" className="mt-3 space-y-3">
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => { setShowOpenShift(true); setOpeningAmount(""); }}
              data-testid="button-open-shift"
            >
              <LogIn className="h-4 w-4 mr-1" />
              {t("cashierHub.openShiftBtn", "Smena ochish")}
            </Button>
          </div>
          {shiftsQuery.isLoading ? (
            <EPSkeletonTable rows={6} />
          ) : shifts.length === 0 ? (
            <EPEmptyState icon={Banknote} title={t("cashierHub.shiftsEmptyTitle", "Smena yo'q")} description={t("cashierHub.shiftsEmptyDesc", "Hozircha ochilgan kassir smenasi yo'q.")} />
          ) : (
            <Table data-testid="table-shifts">
              <TableHeader>
                <TableRow>
                  <TableHead>{t("cashierHub.colShift", "Smena")}</TableHead>
                  <TableHead>{t("cashierHub.colCashier", "Kassir")}</TableHead>
                  <TableHead>{t("cashierHub.colOpened", "Ochilgan")}</TableHead>
                  <TableHead>{t("cashierHub.colOpenAmount", "Ochilish summasi")}</TableHead>
                  <TableHead>{t("cashierHub.colExpectedBalance", "Kutilgan balans")}</TableHead>
                  <TableHead>{t("cashierHub.colStatus", "Holat")}</TableHead>
                  <TableHead className="text-right">{t("cashierHub.colActions", "Amallar")}</TableHead>
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
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {row.status === "open" && (
                          <>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => { setRecordMoveShiftId(row.id); setMvType("cash_in"); setMvAmount(""); setMvRef(""); setMvDesc(""); setMvPin(""); }}
                              data-testid={`button-record-move-${row.id}`}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              {t("cashierHub.recordMoveBtn", "Harakat")}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={closeShiftMutation.isPending}
                              onClick={() => { setCloseShiftId(row.id); setClosedAmount(""); setCloseNotes(""); }}
                              data-testid={`button-close-shift-${row.id}`}
                            >
                              <LogOut className="h-4 w-4 mr-1" />
                              {t("cashierHub.closeShiftBtn", "Yopish")}
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => downloadDailyReport(row.id)}
                          title={t("cashierHub.dailyReportPdf", "Kunlik hisobot (PDF)")}
                          data-testid={`button-daily-pdf-${row.id}`}
                        >
                          <FileDown className="h-4 w-4 mr-1" />
                          {t("cashierHub.pdfBtn", "PDF")}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        {/* (c) Advance reports list */}
        <TabsContent value="reports" className="mt-3">
          <div className="flex justify-end mb-3">
            <Button
              size="sm"
              variant="secondary"
              disabled={!openShiftId}
              onClick={() => setShowIssueAdvance(true)}
              data-testid="button-issue-advance"
            >
              <Plus className="h-4 w-4 mr-1" />
              {t("cashierHub.issueAdvanceBtn", "Avans berish")}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowSubmitReport(true)} data-testid="button-submit-report">
              <Plus className="h-4 w-4 mr-1" />
              {t("cashierHub.submitReportBtn", "Hisobot topshirish")}
            </Button>
          </div>
          {reportsQuery.isLoading ? (
            <EPSkeletonTable rows={6} />
          ) : reports.length === 0 ? (
            <EPEmptyState icon={ReceiptText} title={t("cashierHub.reportsEmptyTitle", "Avans hisoboti yo'q")} description={t("cashierHub.reportsEmptyDesc", "Hozircha kutilayotgan avans hisoboti yo'q.")} />
          ) : (
            <Table data-testid="table-reports">
              <TableHeader>
                <TableRow>
                  <TableHead>{t("cashierHub.colEmployee", "Xodim")}</TableHead>
                  <TableHead>{t("amount", "Summa")}</TableHead>
                  <TableHead>{t("cashierHub.colReceipt", "Chek")}</TableHead>
                  <TableHead>{t("cashierHub.colStatus", "Holat")}</TableHead>
                  <TableHead className="text-right">{t("cashierHub.colActions", "Amallar")}</TableHead>
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
                    <TableCell className="text-[13px] text-muted-foreground">
                      <div>{row.receiptRef ?? "—"}</div>
                      {row.receiptFilePath && (
                        <a
                          href={`/api/storage/${row.receiptFilePath}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[12px] underline text-primary"
                          data-testid={`link-receipt-file-${row.id}`}
                        >
                          {t("cashierHub.receiptFileLink", "Chek faylini ko'rish")}
                        </a>
                      )}
                      {/* AI-OCR signal (vizyon: AI o'qiydi + solishtiradi, ODAM yakuniy tasdiqlaydi) */}
                      {row.ocrMatch === true && (
                        <div className="mt-1"><EPStatusPill tone="success">{t("cashierHub.ocrMatch", "AI: summa mos")}</EPStatusPill></div>
                      )}
                      {row.ocrMatch === false && (
                        <div className="mt-1"><EPStatusPill tone="danger">{t("cashierHub.ocrMismatch", "AI: summa mos emas")}</EPStatusPill></div>
                      )}
                    </TableCell>
                    <TableCell>
                      <EPStatusPill tone={row.approved ? "success" : "warning"}>
                        {row.approved ? t("cashierHub.statusApproved", "Tasdiqlangan") : t("cashierHub.statusPending", "Kutilmoqda")}
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
                        <CheckCircle className="h-4 w-4 mr-1" /> {t("approve", "Tasdiqlash")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        {/* (d) Naqd ledger — kirim/chiqim ro'yxat + running saldo + limit-warning */}
        <TabsContent value="ledger" className="mt-3 space-y-3">
          {openShiftId === null ? (
            <EPEmptyState
              icon={Wallet}
              title={t("cashierHub.ledgerNoShiftTitle", "Ochiq smena yo'q")}
              description={t("cashierHub.ledgerNoShiftDesc", "Naqd ledgerni ko'rish uchun avval kassir smenasini oching.")}
            />
          ) : ledgerQuery.isLoading ? (
            <EPSkeletonTable rows={6} />
          ) : (
            <>
              {/* Saldo summary strip — opening / kirim / chiqim / current balance */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-lg border p-3" data-testid="ledger-opening">
                  <div className="text-[12px] text-muted-foreground">{t("cashierHub.ledgerOpening", "Boshlang'ich")}</div>
                  <div className="text-base font-semibold">{formatCurrency(Number(ledger?.openingAmount ?? 0))}</div>
                </div>
                <div className="rounded-lg border p-3" data-testid="ledger-cash-in">
                  <div className="text-[12px] text-muted-foreground flex items-center gap-1"><ArrowDownCircle className="h-3.5 w-3.5" /> {t("cashierHub.ledgerCashIn", "Kirim")}</div>
                  <div className="text-base font-semibold">{formatCurrency(Number(ledger?.cashIn ?? 0))}</div>
                </div>
                <div className="rounded-lg border p-3" data-testid="ledger-cash-out">
                  <div className="text-[12px] text-muted-foreground flex items-center gap-1"><ArrowUpCircle className="h-3.5 w-3.5" /> {t("cashierHub.ledgerCashOut", "Chiqim")}</div>
                  <div className="text-base font-semibold">{formatCurrency(Number(ledger?.cashOut ?? 0))}</div>
                </div>
                <div className="rounded-lg border p-3" data-testid="ledger-balance">
                  <div className="text-[12px] text-muted-foreground">{t("cashierHub.ledgerBalance", "Saldo")}</div>
                  <div className="text-base font-semibold">{formatCurrency(Number(ledger?.balance ?? 0))}</div>
                </div>
              </div>

              {/* Limit warning — shown only when a positive ceiling is set and the drawer exceeds it */}
              {ledger?.limitExceeded && (
                <div
                  className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
                  data-testid="ledger-limit-warning"
                >
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    {t("cashierHub.ledgerLimitExceeded", "Kassadagi naqd kunlik limitdan oshdi")}
                    {ledger.dailyCashLimit != null && ` — ${t("cashierHub.ledgerLimit", "Limit")}: ${formatCurrency(Number(ledger.dailyCashLimit))}`}
                  </span>
                </div>
              )}

              {ledgerLines.length === 0 ? (
                <EPEmptyState
                  icon={Wallet}
                  title={t("cashierHub.ledgerEmptyTitle", "Harakatlar yo'q")}
                  description={t("cashierHub.ledgerEmptyDesc", "Bu smenada hali naqd kirim/chiqim qayd etilmagan.")}
                />
              ) : (
                <Table data-testid="table-ledger">
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("cashierHub.colMvType", "Tur")}</TableHead>
                      <TableHead>{t("cashierHub.colReference", "Mos yozuv")}</TableHead>
                      <TableHead className="text-right">{t("cashierHub.colSigned", "Summa (±)")}</TableHead>
                      <TableHead className="text-right">{t("cashierHub.colRunning", "Saldo")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ledgerLines.map((line) => {
                      const inflow = line.signedAmount >= 0;
                      return (
                        <TableRow key={line.id} data-testid={`row-ledger-${line.id}`}>
                          <TableCell>
                            <EPStatusPill tone={inflow ? "success" : "warning"}>
                              {MV_TYPE_LABEL[line.type] ?? line.type}
                            </EPStatusPill>
                          </TableCell>
                          <TableCell>
                            <div className="text-[13px]">{line.reference}</div>
                            {line.description && <div className="text-[12px] text-muted-foreground">{line.description}</div>}
                          </TableCell>
                          <TableCell className={`text-right font-medium ${inflow ? "text-emerald-600" : "text-destructive"}`}>
                            {inflow ? "+" : "−"}{formatCurrency(Math.abs(Number(line.amount)))}
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(Number(line.runningBalance))}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={rejectId !== null}
        onOpenChange={(open) => {
          if (!open) setRejectId(null);
        }}
        title={t("cashierHub.confirmRejectTitle", "To'lovni rad etishni tasdiqlang")}
        description={t("cashierHub.confirmRejectDesc", "Rad etilgan tasdiq zanjirini qayta tiklab bo'lmaydi va to'lov amalga oshmaydi.")}
        confirmText={t("cashierHub.reject", "Rad etish")}
        cancelText={t("cancel", "Bekor qilish")}
        variant="destructive"
        onConfirm={() => {
          if (rejectId !== null) {
            rejectMutation.mutate(rejectId);
            setRejectId(null);
          }
        }}
      />

      {/* Open shift dialog */}
      <Dialog open={showOpenShift} onOpenChange={(open) => { if (!open) { setShowOpenShift(false); setOpeningAmount(""); } }}>
        <DialogContent className="max-w-sm p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              {t("cashierHub.openShiftTitle", "Yangi smena ochish")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="opening-amount">{t("cashierHub.openingAmount", "Boshlang'ich summa (so'm)")} <span className="text-destructive">*</span></Label>
              <Input
                id="opening-amount"
                type="number"
                min="0"
                step="1000"
                value={openingAmount}
                onChange={e => setOpeningAmount(e.target.value)}
                placeholder="0"
                data-testid="input-opening-amount"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setShowOpenShift(false); setOpeningAmount(""); }} data-testid="button-cancel-open-shift">
                {t("cancel", "Bekor")}
              </Button>
              <Button
                onClick={() => openShiftMutation.mutate()}
                disabled={!openingAmount || Number(openingAmount) < 0 || openShiftMutation.isPending}
                data-testid="button-confirm-open-shift"
              >
                <LogIn className="h-4 w-4 mr-1" />
                {openShiftMutation.isPending ? t("cashierHub.opening", "Ochilmoqda...") : t("cashierHub.openShiftBtn", "Smena ochish")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create salary-payout request dialog — POST /api/finance/cashier/salary-payouts */}
      <Dialog open={showCreatePayout} onOpenChange={setShowCreatePayout}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("cashierHub.requestPayoutTitle", "Maosh to'lovi so'rovi")}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>{t("cashierHub.employeeId", "Xodim ID")} <span className="text-destructive">*</span></Label>
              <Input type="number" min="1" value={payoutEmpId} onChange={e => setPayoutEmpId(e.target.value)} placeholder="1" />
            </div>
            <div className="space-y-1.5">
              <Label>{t("amount", "Summa (so'm)")} <span className="text-destructive">*</span></Label>
              <Input type="number" min="1" step="1000" value={payoutAmount} onChange={e => setPayoutAmount(e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label>{t("cashierHub.reference", "Havola")} <span className="text-destructive">*</span></Label>
              <Input value={payoutRef} onChange={e => setPayoutRef(e.target.value)} placeholder="SAL-2026-..." maxLength={120} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("cashierHub.notes", "Izoh")}</Label>
              <Textarea value={payoutNotes} onChange={e => setPayoutNotes(e.target.value)} className="min-h-[60px]" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreatePayout(false)}>{t("cancel", "Bekor")}</Button>
              <Button
                disabled={!payoutEmpId || Number(payoutEmpId) < 1 || !payoutAmount || Number(payoutAmount) <= 0 || !payoutRef.trim() || createPayoutMutation.isPending}
                onClick={() => createPayoutMutation.mutate({ employeeId: Number(payoutEmpId), amount: Number(payoutAmount), reference: payoutRef.trim(), ...(payoutNotes.trim() && { notes: payoutNotes.trim() }) })}
              >
                {createPayoutMutation.isPending ? t("cashierHub.requesting", "Yuborilmoqda...") : t("cashierHub.submitPayoutBtn", "Yuborish")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Submit advance report dialog — POST /api/finance/cashier/advance-reports */}
      <Dialog open={showSubmitReport} onOpenChange={(v) => { setShowSubmitReport(v); if (!v) setReportFile(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("cashierHub.submitReportTitle", "Avans hisobotini topshirish")}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>{t("cashierHub.debtId", "Qarz ID")} <span className="text-destructive">*</span></Label>
              <Input type="number" min="1" value={reportDebtId} onChange={e => setReportDebtId(e.target.value)} placeholder="1" />
            </div>
            <div className="space-y-1.5">
              <Label>{t("amount", "Summa (so'm)")} <span className="text-destructive">*</span></Label>
              <Input type="number" min="1" step="1000" value={reportAmount} onChange={e => setReportAmount(e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label>{t("cashierHub.receiptDocNum", "Kvitansiya / Hujjat raqami")} <span className="text-destructive">*</span></Label>
              <Input value={reportReceiptRef} onChange={e => setReportReceiptRef(e.target.value)} placeholder="RCP-..." maxLength={200} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="report-file">{t("cashierHub.receiptFile", "Chek fayli (rasm/PDF — AI tekshiradi, ixtiyoriy)")}</Label>
              <Input
                id="report-file"
                type="file"
                accept="image/png,image/jpeg,image/webp,.pdf"
                onChange={e => setReportFile(e.target.files?.[0] ?? null)}
                data-testid="input-report-file"
              />
              {reportFile && (
                <p className="text-[12px] text-muted-foreground">
                  {reportFile.name} — {Math.ceil(reportFile.size / 1024)} KB
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>{t("cashierHub.reference", "Havola")} <span className="text-destructive">*</span></Label>
              <Input value={reportRef} onChange={e => setReportRef(e.target.value)} placeholder="RPT-2026-..." maxLength={120} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("cashierHub.notes", "Izoh")}</Label>
              <Textarea value={reportNotes} onChange={e => setReportNotes(e.target.value)} className="min-h-[60px]" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setShowSubmitReport(false); setReportFile(null); }}>{t("cancel", "Bekor")}</Button>
              <Button
                disabled={!reportDebtId || Number(reportDebtId) < 1 || !reportAmount || Number(reportAmount) <= 0 || !reportReceiptRef.trim() || !reportRef.trim() || submitReportMutation.isPending}
                onClick={() => submitReportMutation.mutate({ debtId: Number(reportDebtId), amount: Number(reportAmount), receiptRef: reportReceiptRef.trim(), reference: reportRef.trim(), ...(reportNotes.trim() && { notes: reportNotes.trim() }) })}
              >
                {submitReportMutation.isPending ? t("cashierHub.submitting", "Yuborilmoqda...") : t("cashierHub.submitReportBtn", "Topshirish")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Record movement dialog — POST /api/finance/cashier/shifts/:id/movements */}
      <Dialog open={recordMoveShiftId !== null} onOpenChange={(open) => { if (!open) { setRecordMoveShiftId(null); setMvType("cash_in"); setMvAmount(""); setMvRef(""); setMvDesc(""); setMvPin(""); } }}>
        <DialogContent className="max-w-sm p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              {t("cashierHub.recordMoveTitle", "Kassir harakati")} — smena #{recordMoveShiftId}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="mv-type">{t("cashierHub.mvType", "Harakat turi")} <span className="text-destructive">*</span></Label>
              <select
                id="mv-type"
                value={mvType}
                onChange={e => { setMvType(e.target.value); setMvPin(""); }}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                data-testid="select-mv-type"
              >
                <option value="cash_in">{t("cashierHub.mvCashIn", "Kirim")} (cash_in)</option>
                <option value="cash_out">{t("cashierHub.mvCashOut", "Chiqim")} (cash_out) — PIN</option>
                <option value="salary_payout">{t("cashierHub.mvSalary", "Ish haqi")} (salary_payout) — PIN</option>
                <option value="advance">{t("cashierHub.mvAdvance", "Avans")} (advance) — PIN</option>
                <option value="expense">{t("cashierHub.mvExpense", "Xarajat")} (expense) — PIN</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mv-amount">{t("amount", "Summa (so'm)")} <span className="text-destructive">*</span></Label>
              <Input
                id="mv-amount"
                type="number"
                min="0.01"
                step="1000"
                value={mvAmount}
                onChange={e => setMvAmount(e.target.value)}
                placeholder="0"
                data-testid="input-mv-amount"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mv-ref">{t("cashierHub.mvRef", "Mos yozuv (reference)")} <span className="text-destructive">*</span></Label>
              <Input
                id="mv-ref"
                value={mvRef}
                onChange={e => setMvRef(e.target.value)}
                maxLength={120}
                placeholder="KIRIM-001"
                data-testid="input-mv-ref"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mv-desc">{t("cashierHub.mvDesc", "Izoh (ixtiyoriy)")}</Label>
              <Textarea
                id="mv-desc"
                value={mvDesc}
                onChange={e => setMvDesc(e.target.value)}
                placeholder={t("cashierHub.mvDescPlaceholder", "Harakat tavsifi...")}
                className="min-h-[60px]"
                data-testid="input-mv-desc"
              />
            </div>
            {PIN_REQUIRED.has(mvType) && (
              <div className="space-y-1.5">
                <Label htmlFor="mv-pin">{t("cashierHub.mvPin", "Kassir PIN (4 raqam)")} <span className="text-destructive">*</span></Label>
                <Input
                  id="mv-pin"
                  type="password"
                  inputMode="numeric"
                  pattern="\d{4}"
                  maxLength={4}
                  value={mvPin}
                  onChange={e => setMvPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="••••"
                  data-testid="input-mv-pin"
                />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setRecordMoveShiftId(null); }} data-testid="button-cancel-mv">
                {t("cancel", "Bekor")}
              </Button>
              <Button
                onClick={() => { if (recordMoveShiftId !== null) recordMoveMutation.mutate(recordMoveShiftId); }}
                disabled={
                  !mvAmount || Number(mvAmount) <= 0 ||
                  !mvRef.trim() ||
                  (PIN_REQUIRED.has(mvType) && mvPin.length !== 4) ||
                  recordMoveMutation.isPending
                }
                data-testid="button-confirm-mv"
              >
                <Plus className="h-4 w-4 mr-1" />
                {recordMoveMutation.isPending ? t("cashierHub.recording", "Saqlanmoqda...") : t("cashierHub.recordMoveBtn", "Qayd etish")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Close shift dialog */}
      <Dialog open={closeShiftId !== null} onOpenChange={(open) => { if (!open) { setCloseShiftId(null); setClosedAmount(""); setCloseNotes(""); } }}>
        <DialogContent className="max-w-sm p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5" />
              {t("cashierHub.closeShiftTitle", "Smenani yopish")} #{closeShiftId}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="closed-amount">{t("cashierHub.closedAmount", "Kassadagi faktik summa (so'm)")} <span className="text-destructive">*</span></Label>
              <Input
                id="closed-amount"
                type="number"
                min="0"
                step="1000"
                value={closedAmount}
                onChange={e => setClosedAmount(e.target.value)}
                placeholder="0"
                data-testid="input-closed-amount"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="close-notes">{t("cashierHub.closeNotes", "Izoh (ixtiyoriy)")}</Label>
              <Textarea
                id="close-notes"
                value={closeNotes}
                onChange={e => setCloseNotes(e.target.value)}
                placeholder={t("cashierHub.closeNotesPlaceholder", "Smena yakunlash bo'yicha izoh...")}
                className="min-h-[60px]"
                data-testid="input-close-notes"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setCloseShiftId(null); setClosedAmount(""); setCloseNotes(""); }} data-testid="button-cancel-close-shift">
                {t("cancel", "Bekor")}
              </Button>
              <Button
                variant="destructive"
                onClick={() => { if (closeShiftId !== null) closeShiftMutation.mutate(closeShiftId); }}
                disabled={!closedAmount || Number(closedAmount) < 0 || closeShiftMutation.isPending}
                data-testid="button-confirm-close-shift"
              >
                <LogOut className="h-4 w-4 mr-1" />
                {closeShiftMutation.isPending ? t("cashierHub.closing", "Yopilmoqda...") : t("cashierHub.closeShiftBtn", "Yopish")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Issue Advance dialog */}
      <Dialog open={showIssueAdvance} onOpenChange={(v) => { if (!v) { setShowIssueAdvance(false); setAdvEmployeeId(""); setAdvAmount(""); setAdvRef(""); setAdvReason(""); setAdvCategoryId(""); setAdvPin(""); } }}>
        <DialogContent className="max-w-sm p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              {t("cashierHub.issueAdvanceTitle", "Avans berish")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>{t("cashierHub.employeeId", "Xodim ID")} <span className="text-destructive">*</span></Label>
              <Input type="number" min="1" value={advEmployeeId} onChange={e => setAdvEmployeeId(e.target.value)} placeholder="1" data-testid="input-adv-employee-id" />
            </div>
            <div className="space-y-1.5">
              <Label>{t("amount", "Summa (so'm)")} <span className="text-destructive">*</span></Label>
              <Input type="number" min="1" step="1000" value={advAmount} onChange={e => setAdvAmount(e.target.value)} placeholder="0" data-testid="input-adv-amount" />
            </div>
            <div className="space-y-1.5">
              <Label>{t("cashierHub.reference", "Havola/Izoh")} <span className="text-destructive">*</span></Label>
              <Input value={advRef} onChange={e => setAdvRef(e.target.value)} placeholder="ADV-2026-..." maxLength={100} data-testid="input-adv-ref" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="adv-category">{t("cashierHub.advCategory", "Xarajat kategoriyasi (ixtiyoriy)")}</Label>
              <select
                id="adv-category"
                value={advCategoryId}
                onChange={e => setAdvCategoryId(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                data-testid="select-adv-category"
              >
                <option value="">{t("cashierHub.advCategoryNone", "Tanlanmagan")}</option>
                {expenseCategories.map((c) => (
                  <option key={c.id} value={String(c.id)}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("cashierHub.advReason", "Sabab (ixtiyoriy)")}</Label>
              <Textarea value={advReason} onChange={e => setAdvReason(e.target.value)} placeholder={t("cashierHub.advReasonPlaceholder", "Avans sababi...")} className="min-h-[60px]" data-testid="input-adv-reason" />
            </div>
            <div className="space-y-1.5">
              <Label>{t("cashierHub.pin", "PIN (4 raqam)")} <span className="text-destructive">*</span></Label>
              <Input type="password" inputMode="numeric" maxLength={4} value={advPin} onChange={e => setAdvPin(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="••••" data-testid="input-adv-pin" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowIssueAdvance(false)} data-testid="button-cancel-issue-advance">{t("cancel", "Bekor")}</Button>
              <Button
                onClick={() => {
                  if (!openShiftId) return;
                  issueAdvanceMutation.mutate({ shiftId: openShiftId, employeeId: Number(advEmployeeId), amount: Number(advAmount), reference: advRef.trim(), ...(advReason.trim() && { reason: advReason.trim() }), ...(advCategoryId && { categoryId: Number(advCategoryId) }), pin: advPin });
                }}
                disabled={!advEmployeeId || Number(advEmployeeId) < 1 || !advAmount || Number(advAmount) <= 0 || !advRef.trim() || advPin.length !== 4 || issueAdvanceMutation.isPending}
                data-testid="button-confirm-issue-advance"
              >
                {issueAdvanceMutation.isPending ? t("cashierHub.issuing", "Berilmoqda...") : t("cashierHub.issueAdvanceBtn", "Avans berish")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
