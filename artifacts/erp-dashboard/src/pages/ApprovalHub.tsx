/**
 * @module ApprovalHub
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Clock, ClipboardList, Plus } from "lucide-react";
import { EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

import { tLabel } from "@/lib/i18n/tLabel";
interface ApprovalItem {
  id: string | number;
  type: string;
  title: string;
  description?: string;
  requestedBy?: string;
  amount?: number;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  priority?: "high" | "medium" | "low";
}

const TYPE_LABELS: Record<string, string> = {
  budget: "Byudjet",
  purchase_order: "Xarid buyurtmasi",
  payment: "To'lov",
  leave: "Ta'til",
  overtime: "Qo'shimcha ish",
  expense: "Xarajat",
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "destructive",
  medium: "secondary",
  low: "outline",
};

const HITL_TYPES = [
  { value: "purchase_order", label: "Xarid buyurtmasi" },
  { value: "payment", label: "To'lov" },
  { value: "three_way_match", label: "3-tomonlama muvofiqlik" },
  { value: "credit_limit_exceed", label: "Kredit limiti oshishi" },
  { value: "discount_override", label: "Chegirma ustunligi" },
  { value: "employee_tardiness", label: "Xodim kechikishi" },
  { value: "qc_fail_critical", label: "QC kritik xato" },
  { value: "mro_repair_high_value", label: "MRO ta'mirlash (katta)" },
  { value: "employee_termination", label: "Xodimni ishdan bo'shatish" },
  { value: "inventory_writeoff", label: "Inventar o'chirish" },
  { value: "advance_bypass", label: "Avans bypass" },
] as const;

export default function ApprovalHub() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("pending");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newDocType, setNewDocType] = useState("");
  const [newDocNumber, setNewDocNumber] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newCurrency, setNewCurrency] = useState("UZS");
  const [newNotes, setNewNotes] = useState("");

  const { data: approvals = [], isLoading } = useQuery<ApprovalItem[]>({
    queryKey: ["/api/approval-workflow/dashboard"],
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, type }: { id: string | number; type: string }) =>
      apiRequest("POST", `/api/approval-workflow/${type}/${id}/approve`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/approval-workflow/dashboard"],
      });
      toast({ title: "Tasdiqlandi" });
    },
    onError: () =>
      toast({ title: tLabel('common.errorOccurred', "Xatolik yuz berdi"), variant: "destructive" }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, type }: { id: string | number; type: string }) =>
      apiRequest("POST", `/api/approval-workflow/${type}/${id}/reject`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/approval-workflow/dashboard"],
      });
      toast({ title: tLabel('common.radEtildi', "Rad etildi") });
    },
    onError: () =>
      toast({ title: tLabel('common.errorOccurred', "Xatolik yuz berdi"), variant: "destructive" }),
  });

  const createMutation = useMutation({
    mutationFn: (payload: {
      documentType: string;
      documentId: string;
      documentNumber?: string;
      amount: number;
      currency: string;
      notes?: string;
    }) => apiRequest("POST", "/api/director/approvals", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/approval-workflow/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/director/approvals"] });
      setIsCreateOpen(false);
      setNewDocType(""); setNewDocNumber(""); setNewAmount(""); setNewCurrency("UZS"); setNewNotes("");
      toast({ title: "Tasdiqlash so'rovi yuborildi" });
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  function handleCreate() {
    if (!newDocType || !newAmount) {
      toast({ title: "Hujjat turi va summani kiriting", variant: "destructive" });
      return;
    }
    const amt = parseFloat(newAmount);
    if (isNaN(amt) || amt <= 0) {
      toast({ title: "Summa musbat son bo'lishi kerak", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      documentType: newDocType,
      documentId: crypto.randomUUID(),
      documentNumber: newDocNumber.trim() || undefined,
      amount: amt,
      currency: newCurrency || "UZS",
      notes: newNotes.trim() || undefined,
    });
  }

  const pending = (approvals as ApprovalItem[]).filter(
    (a) => a.status === "pending"
  );
  const approved = (approvals as ApprovalItem[]).filter(
    (a) => a.status === "approved"
  );
  const rejected = (approvals as ApprovalItem[]).filter(
    (a) => a.status === "rejected"
  );

  const fmt = (n: number) =>
    n?.toLocaleString("uz-UZ") + " so'm";

  function ApprovalTable({
    items,
    showActions,
  }: {
    items: ApprovalItem[];
    showActions: boolean;
  }) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="ep-table-scroll"><Table>
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow>
                <TableHead>{t("tur")}</TableHead>
                <TableHead>{t("name")}</TableHead>
                <TableHead>{t("sorovchi")}</TableHead>
                <TableHead>{t("quantity")}</TableHead>
                <TableHead>{t("priority")}</TableHead>
                <TableHead>{t("date")}</TableHead>
                {showActions && <TableHead>{t("amal")}</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={showActions ? 7 : 6}
                    className="text-center py-8 text-[13px] text-muted-foreground"
                  >
                    {t("Yuklanmoqda...")}
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={showActions ? 7 : 6}
                    className="text-center py-10 text-[13px] text-muted-foreground"
                  >
                    {t("tasdiqlashSorovlariYoq")}
                  </TableCell>
                </TableRow>
              ) : (
                (Array.isArray(items) ? items : []).map((item) => (
                  <TableRow key={item.id} data-testid={`row-approval-${item.id}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell>
                      <Badge variant="outline">
                        {TYPE_LABELS[item.type] || item.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div>{item.title}</div>
                      {item.description && (
                        <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                          {item.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.requestedBy || "—"}
                    </TableCell>
                    <TableCell className="text-sm font-mono">
                      {item.amount ? fmt(item.amount) : "—"}
                    </TableCell>
                    <TableCell>
                      {item.priority && (
                        <Badge
                          variant={
                            (PRIORITY_COLORS[item.priority] as "destructive" | "secondary" | "outline") ||
                            "outline"
                          }
                        >
                          {item.priority === "high"
                            ? "Yuqori"
                            : item.priority === "medium"
                            ? "O'rta"
                            : "Past"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString("uz-UZ")}
                    </TableCell>
                    {showActions && (
                      <TableCell>
                        <div className="flex gap-1.5">
                          <Button
                            size="sm"
                            variant="default"
                            className="h-7 text-xs bg-green-600 hover:bg-[var(--ep-green)]/90"
                            onClick={() =>
                              approveMutation.mutate({
                                id: item.id,
                                type: item.type,
                              })
                            }
                            disabled={approveMutation.isPending}
                            data-testid={`button-approve-${item.id}`}
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            {t("verify")}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 text-xs"
                            onClick={() =>
                              rejectMutation.mutate({
                                id: item.id,
                                type: item.type,
                              })
                            }
                            disabled={rejectMutation.isPending}
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            {t("rad")}
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="border-b border-border/50 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-4 w-4 text-primary" />
          <h1 className="font-semibold text-base">{t("tasdiqlashMarkazi")}</h1>
          {pending.length > 0 && (
            <EPStatusPill tone="danger">{pending.length} kutmoqda</EPStatusPill>
          )}
        </div>
        <Button size="sm" onClick={() => setIsCreateOpen(true)} data-testid="button-create-approval">
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Yangi so&apos;rov
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {([
            {
              label: "Kutmoqda",
              value: pending.length,
              icon: Clock,
              color: "text-[var(--ep-primary)]",
            },
            {
              label: tLabel('common.approved', "Tasdiqlangan"),
              value: approved.length,
              icon: CheckCircle2,
              color: "text-[var(--ep-green)]",
            },
            {
              label: tLabel('common.rejected', "Rad etilgan"),
              value: rejected.length,
              icon: XCircle,
              color: "text-[var(--ep-red)]",
            },
          ]).map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="pb-1 pt-3 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs text-muted-foreground font-normal">
                    {stat.label}
                  </CardTitle>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <div className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pending" data-testid="tab-pending">
              Kutmoqda ({pending.length})
            </TabsTrigger>
            <TabsTrigger value="approved" data-testid="tab-approved">
              {t("approved")}
            </TabsTrigger>
            <TabsTrigger value="rejected" data-testid="tab-rejected">
              {t("rejected")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            <ApprovalTable items={pending} showActions={true} />
          </TabsContent>
          <TabsContent value="approved" className="mt-4">
            <ApprovalTable items={approved} showActions={false} />
          </TabsContent>
          <TabsContent value="rejected" className="mt-4">
            <ApprovalTable items={rejected} showActions={false} />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">Tasdiqlash so&apos;rovi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Hujjat turi *</Label>
              <Select value={newDocType} onValueChange={setNewDocType}>
                <SelectTrigger data-testid="select-doc-type">
                  <SelectValue placeholder="Hujjat turini tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {HITL_TYPES.map(dt => (
                    <SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Hujjat raqami</Label>
                <Input
                  value={newDocNumber}
                  onChange={e => setNewDocNumber(e.target.value)}
                  placeholder="Masalan: AP-PO-001"
                  data-testid="input-doc-number"
                />
              </div>
              <div>
                <Label>Valyuta</Label>
                <Input
                  value={newCurrency}
                  onChange={e => setNewCurrency(e.target.value)}
                  placeholder="UZS"
                  data-testid="input-currency"
                />
              </div>
            </div>
            <div>
              <Label>Summa (so&apos;m) *</Label>
              <Input
                type="number"
                min="1"
                value={newAmount}
                onChange={e => setNewAmount(e.target.value)}
                placeholder="50000000"
                data-testid="input-amount"
              />
            </div>
            <div>
              <Label>Izoh</Label>
              <Textarea
                value={newNotes}
                onChange={e => setNewNotes(e.target.value)}
                placeholder="Tasdiqlash sababi yoki qo'shimcha ma'lumot..."
                rows={2}
                data-testid="input-notes"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Bekor</Button>
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending || !newDocType || !newAmount}
                data-testid="button-save-approval"
              >
                Yuborish
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
