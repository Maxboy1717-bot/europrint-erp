/**
 * @module ExpenseManagement
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageState } from "@/components/ui/page-state";
import { Wallet, CheckCircle, XCircle, Clock, Send, DollarSign, FileText, Plus, Receipt, CreditCard, LucideIcon } from "lucide-react";
import { EPErrorState } from "@/components/ep";

import { useTranslation } from '@/lib/i18n';
interface ExpenseRequest {
  id: string;
  requestNumber: string;
  category: string;
  purpose: string;
  amount: number | string;
  currency: string;
  department: string;
  status: string;
  requester: { fullName: string } | null;
}

interface ExpenseStat {
  status: string;
  count: number;
  totalAmount: number | string;
}

interface ExpenseStats {
  byStatus: ExpenseStat[];
  byCategory: { category: string; count: number }[];
}

interface AdvancePayment {
  id: string;
  requestNumber: string;
  paymentType: string;
  amount: number | string;
  currency: string;
  status: string;
  vendor: { name: string } | null;
  employee: { fullName: string } | null;
}

interface ExpenseRequestsResponse {
  requests: ExpenseRequest[];
  total: number;
}

type StatusIconType = LucideIcon;

const expenseFormSchema = z.object({
  category: z.string().min(1, "Kategoriya tanlang"),
  purpose: z.string().min(1, "Maqsadni kiriting").max(500, "Maqsad 500 belgidan oshmasligi kerak"),
  amount: z.string().min(1, "Summani kiriting").refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Summa musbat bo'lishi kerak"),
  department: z.string().min(1, "Bo'limni kiriting").max(200, "Bo'lim 200 belgidan oshmasligi kerak"),
  notes: z.string().max(1000, "Izoh 1000 belgidan oshmasligi kerak").optional().or(z.literal("")),
});

export default function ExpenseManagement() {
  const { t } = useTranslation('common');
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const form = useForm({ resolver: zodResolver(expenseFormSchema), defaultValues: { category: "", purpose: "", amount: "", department: "", notes: "" } });

  const { data: requestsData, isLoading, isError, refetch } = useQuery<ExpenseRequestsResponse>({
    queryKey: ["/api/integration/expense/expense-requests", statusFilter],
  });

  const { data: stats } = useQuery<ExpenseStats>({
    queryKey: ["/api/integration/expense/expense-stats"],
  });

  const { data: advancePayments } = useQuery<AdvancePayment[]>({
    queryKey: ["/api/integration/expense/advance-payments"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { category: string; purpose: string; amount: string; department: string; notes?: string }) => {
      const res = await apiRequest("POST", "/api/integration/expense/expense-requests", { ...data, amount: parseFloat(data.amount) });
      return res;
    },
    onSuccess: () => {
      toast({ title: "Xarajat so'rovi yaratildi" });
      queryClient.invalidateQueries({ queryKey: ["/api/integration/expense"] });
      setDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Xatolik", variant: "destructive" });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) => {
      const res = await apiRequest("PUT", `/api/integration/expense-requests/${id}/approve`, { action, comments: "" });
      return res;
    },
    onSuccess: (_, vars) => {
      toast({ title: vars.action === "approve" ? "Tasdiqlandi" : "Rad etildi" });
      queryClient.invalidateQueries({ queryKey: ["/api/integration/expense"] });
    },
  });

  const requests = requestsData?.requests || [];

  const statusBadge = (status: string) => {
    const map: Record<string, { color: string; label: string; icon: StatusIconType }> = {
      submitted: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", label: "Yuborilgan", icon: Send },
      approved: { color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", label: "Tasdiqlangan", icon: CheckCircle },
      rejected: { color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", label: "Rad etilgan", icon: XCircle },
      disbursed: { color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200", label: "To'langan", icon: CreditCard },
      pending: { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", label: "Kutilmoqda", icon: Clock },
    };
    const s = map[status] || map.pending;
    const Icon = s.icon;
    return <Badge className={s.color}><Icon className="w-3 h-3 mr-1" />{s.label}</Badge>;
  };

  const totalSubmitted = stats?.byStatus?.find(s => s.status === "submitted")?.count || 0;
  const totalApproved = stats?.byStatus?.find(s => s.status === "approved")?.count || 0;
  const totalAmount = stats?.byStatus?.reduce((sum, s) => sum + (parseFloat(String(s.totalAmount)) || 0), 0) || 0;

  if (isError) {
    return (
      <div>
        <EPErrorState onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="page-expense-management">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">{t("kassaNazoratVaXarajatlar")}</h1>
          <p className="text-muted-foreground">{t("multiLevelTasdiqlashXarajatMonitoring")}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-expense"><Plus className="w-4 h-4 mr-1" />{t("yangiSorov")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-[18px] font-semibold">{t("yangiXarajatSorovi")}</DialogTitle>
              <DialogDescription>{t("xarajatUchunSorovYarating")}</DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
              <div>
                <Label>{t("category")}</Label>
                <Select onValueChange={(v) => form.setValue("category", v)}>
                  <SelectTrigger data-testid="select-category" className="h-9"><SelectValue placeholder={t("tanlang")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="office_supplies">{t("ofisJihozlari")}</SelectItem>
                    <SelectItem value="production">{t("ishlabChiqarish2")}</SelectItem>
                    <SelectItem value="transport">{t("transport")}</SelectItem>
                    <SelectItem value="maintenance">{t("tamirlash")}</SelectItem>
                    <SelectItem value="marketing">{t('marketing')}</SelectItem>
                    <SelectItem value="other">{t("boshqa")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("Maqsad")}</Label>
                <Input {...form.register("purpose")} placeholder={t("xarajatMaqsadiniKiriting")} data-testid="input-purpose" />
              </div>
              <div>
                <Label>Summa (UZS)</Label>
                <Input {...form.register("amount")} type="number" placeholder="0" data-testid="input-amount" />
              </div>
              <div>
                <Label>{t("bolim1")}</Label>
                <Input {...form.register("department")} placeholder={t("bolimNomi")} data-testid="input-department" />
              </div>
              <div>
                <Label>{t("Izoh")}</Label>
                <Textarea {...form.register("notes")} placeholder={t("qoshimchaMalumot1")} data-testid="input-notes" />
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-expense">{t("submitBtn")}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900"><Send className="w-5 h-5 text-[var(--ep-blue)]" /></div><div><p className="text-sm text-muted-foreground">{t("yuborilgan")}</p><p className="text-2xl font-bold">{totalSubmitted}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-md bg-green-100 dark:bg-green-900"><CheckCircle className="w-5 h-5 text-[var(--ep-green)]" /></div><div><p className="text-sm text-muted-foreground">{t("approved")}</p><p className="text-2xl font-bold">{totalApproved}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-md bg-purple-100 dark:bg-purple-900"><DollarSign className="w-5 h-5 text-[var(--ep-purple)]" /></div><div><p className="text-sm text-muted-foreground">{t("jamiSumma")}</p><p className="text-2xl font-bold">{(totalAmount / 1000000).toFixed(1)}M</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-md bg-orange-100 dark:bg-orange-900"><Receipt className="w-5 h-5 text-[var(--ep-primary)]" /></div><div><p className="text-sm text-muted-foreground">{t("avansTolovlar")}</p><p className="text-2xl font-bold">{(advancePayments || []).length}</p></div></div></CardContent></Card>
      </div>

      <Tabs defaultValue="requests" className="w-full">
        <TabsList>
          <TabsTrigger value="requests" data-testid="tab-requests">{t("xarajatSorovlari")}</TabsTrigger>
          <TabsTrigger value="advances" data-testid="tab-advances">{t("avansTolovlar")}</TabsTrigger>
        </TabsList>
        <TabsContent value="requests">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-[14px] font-semibold">{t("sorovlar")}</CardTitle>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 h-9" data-testid="select-status-filter"><SelectValue placeholder={t("status28")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("Barchasi")}</SelectItem>
                  <SelectItem value="submitted">{t("yuborilgan")}</SelectItem>
                  <SelectItem value="approved">{t("approved")}</SelectItem>
                  <SelectItem value="rejected">{t("rejected")}</SelectItem>
                  <SelectItem value="disbursed">{t("tolangan")}</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <PageState
                isLoading={isLoading}
                isError={isError}
                isEmpty={requests.length === 0}
                onRetry={refetch}
                skeleton="table"
                skeletonRows={5}
                skeletonColumns={6}
                errorTitle="So'rovlar yuklanmadi"
                errorMessage="Server bilan bog'lanishda xatolik."
                emptyIcon={Wallet}
                emptyTitle="Hali so'rov mavjud emas"
                emptyDescription="Yangi xarajat so'rovini yarating."
              >
                <div className="ep-table-scroll"><Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("raqam")}</TableHead>
                      <TableHead>{t("sorovchi")}</TableHead>
                      <TableHead>{t("category")}</TableHead>
                      <TableHead>{t("summa")}</TableHead>
                      <TableHead>{t("status28")}</TableHead>
                      <TableHead>{t("Amallar")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Array.isArray(requests) ? requests : []).map((r) => (
                      <TableRow key={r.id} data-testid={`row-expense-${r.id}`} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="font-mono text-sm">{r.requestNumber}</TableCell>
                        <TableCell>{r.requester?.fullName || "-"}</TableCell>
                        <TableCell><Badge variant="outline">{r.category}</Badge></TableCell>
                        <TableCell className="font-mono">{Number(r.amount).toLocaleString()} {r.currency}</TableCell>
                        <TableCell>{statusBadge(r.status)}</TableCell>
                        <TableCell>
                          {r.status === "submitted" && (
                            <div className="flex gap-1">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="outline" data-testid={`button-approve-${r.id}`}>
                                    <CheckCircle className="w-3 h-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>{t("confirm.approve")}</AlertDialogTitle>
                                    <AlertDialogDescription>So'rov {r.requestNumber} tasdiqlanadi.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => approveMutation.mutate({ id: r.id, action: "approve" })}>{t("verify")}</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="outline" data-testid={`button-reject-${r.id}`}>
                                    <XCircle className="w-3 h-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>{t("radEtishniXohlaysizmi")}</AlertDialogTitle>
                                    <AlertDialogDescription>So'rov {r.requestNumber} rad etiladi.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => approveMutation.mutate({ id: r.id, action: "reject" })}>{t("reject")}</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table></div>
              </PageState>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="advances">
          <Card>
            <CardHeader><CardTitle className="text-[14px] font-semibold">{t("avansTolovlar")}</CardTitle></CardHeader>
            <CardContent>
              {(advancePayments || []).length === 0 ? (
                <div className="text-center py-8 text-[13px] text-muted-foreground">{t("haliAvansTolovMavjudEmas")}</div>
              ) : (
                <div className="ep-table-scroll"><Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("raqam")}</TableHead>
                      <TableHead>{t("type")}</TableHead>
                      <TableHead>Taminotchi/Xodim</TableHead>
                      <TableHead>{t("summa")}</TableHead>
                      <TableHead>{t("status28")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(advancePayments || []).map((p) => (
                      <TableRow key={p.id} data-testid={`row-advance-${p.id}`} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="font-mono">{p.requestNumber}</TableCell>
                        <TableCell><Badge variant="outline">{p.paymentType}</Badge></TableCell>
                        <TableCell>{p.vendor?.name || p.employee?.fullName || "-"}</TableCell>
                        <TableCell className="font-mono">{Number(p.amount).toLocaleString()} {p.currency}</TableCell>
                        <TableCell>{statusBadge(p.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table></div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
