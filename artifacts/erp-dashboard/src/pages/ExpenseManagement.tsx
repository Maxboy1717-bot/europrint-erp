import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ErrorState } from "@/components/ui/error-state";
import { PageState } from "@/components/ui/page-state";
import { Wallet, CheckCircle, XCircle, Clock, Send, DollarSign, FileText, Plus, Receipt, CreditCard, LucideIcon } from "lucide-react";

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
      <div className="p-4 md:p-6">
        <ErrorState onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6" data-testid="page-expense-management">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Kassa Nazorat va Xarajatlar</h1>
          <p className="text-muted-foreground">Multi-level tasdiqlash + xarajat monitoring</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-expense"><Plus className="w-4 h-4 mr-1" />Yangi so'rov</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yangi xarajat so'rovi</DialogTitle>
              <DialogDescription>Xarajat uchun so'rov yarating</DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
              <div>
                <Label>Kategoriya</Label>
                <Select onValueChange={(v) => form.setValue("category", v)}>
                  <SelectTrigger data-testid="select-category"><SelectValue placeholder="Tanlang" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="office_supplies">Ofis jihozlari</SelectItem>
                    <SelectItem value="production">Ishlab chiqarish</SelectItem>
                    <SelectItem value="transport">Transport</SelectItem>
                    <SelectItem value="maintenance">Ta'mirlash</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="other">Boshqa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Maqsad</Label>
                <Input {...form.register("purpose")} placeholder="Xarajat maqsadini kiriting" data-testid="input-purpose" />
              </div>
              <div>
                <Label>Summa (UZS)</Label>
                <Input {...form.register("amount")} type="number" placeholder="0" data-testid="input-amount" />
              </div>
              <div>
                <Label>Bo'lim</Label>
                <Input {...form.register("department")} placeholder="Bo'lim nomi" data-testid="input-department" />
              </div>
              <div>
                <Label>Izoh</Label>
                <Textarea {...form.register("notes")} placeholder="Qo'shimcha ma'lumot" data-testid="input-notes" />
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-expense">Yuborish</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900"><Send className="w-5 h-5 text-blue-600" /></div><div><p className="text-sm text-muted-foreground">Yuborilgan</p><p className="text-2xl font-bold">{totalSubmitted}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-md bg-green-100 dark:bg-green-900"><CheckCircle className="w-5 h-5 text-green-600" /></div><div><p className="text-sm text-muted-foreground">Tasdiqlangan</p><p className="text-2xl font-bold">{totalApproved}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-md bg-purple-100 dark:bg-purple-900"><DollarSign className="w-5 h-5 text-purple-600" /></div><div><p className="text-sm text-muted-foreground">Jami summa</p><p className="text-2xl font-bold">{(totalAmount / 1000000).toFixed(1)}M</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-md bg-orange-100 dark:bg-orange-900"><Receipt className="w-5 h-5 text-orange-600" /></div><div><p className="text-sm text-muted-foreground">Avans to'lovlar</p><p className="text-2xl font-bold">{(advancePayments || []).length}</p></div></div></CardContent></Card>
      </div>

      <Tabs defaultValue="requests" className="w-full">
        <TabsList>
          <TabsTrigger value="requests" data-testid="tab-requests">Xarajat so'rovlari</TabsTrigger>
          <TabsTrigger value="advances" data-testid="tab-advances">Avans to'lovlar</TabsTrigger>
        </TabsList>
        <TabsContent value="requests">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-lg">So'rovlar</CardTitle>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36" data-testid="select-status-filter"><SelectValue placeholder="Holat" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barchasi</SelectItem>
                  <SelectItem value="submitted">Yuborilgan</SelectItem>
                  <SelectItem value="approved">Tasdiqlangan</SelectItem>
                  <SelectItem value="rejected">Rad etilgan</SelectItem>
                  <SelectItem value="disbursed">To'langan</SelectItem>
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Raqam</TableHead>
                      <TableHead>So'rovchi</TableHead>
                      <TableHead>Kategoriya</TableHead>
                      <TableHead>Summa</TableHead>
                      <TableHead>Holat</TableHead>
                      <TableHead>Amallar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Array.isArray(requests) ? requests : []).map((r) => (
                      <TableRow key={r.id} data-testid={`row-expense-${r.id}`}>
                        <TableCell className="font-mono text-sm">{r.requestNumber}</TableCell>
                        <TableCell>{r.requester?.fullName || "-"}</TableCell>
                        <TableCell><Badge variant="outline">{r.category}</Badge></TableCell>
                        <TableCell className="font-mono">{Number(r.amount).toLocaleString()} {r.currency}</TableCell>
                        <TableCell>{statusBadge(r.status)}</TableCell>
                        <TableCell>
                          {r.status === "submitted" && (
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" onClick={() => approveMutation.mutate({ id: r.id, action: "approve" })} data-testid={`button-approve-${r.id}`}>
                                <CheckCircle className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => approveMutation.mutate({ id: r.id, action: "reject" })} data-testid={`button-reject-${r.id}`}>
                                <XCircle className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </PageState>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="advances">
          <Card>
            <CardHeader><CardTitle className="text-lg">Avans to'lovlar</CardTitle></CardHeader>
            <CardContent>
              {(advancePayments || []).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Hali avans to'lov mavjud emas</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Raqam</TableHead>
                      <TableHead>Turi</TableHead>
                      <TableHead>Taminotchi/Xodim</TableHead>
                      <TableHead>Summa</TableHead>
                      <TableHead>Holat</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(advancePayments || []).map((p) => (
                      <TableRow key={p.id} data-testid={`row-advance-${p.id}`}>
                        <TableCell className="font-mono">{p.requestNumber}</TableCell>
                        <TableCell><Badge variant="outline">{p.paymentType}</Badge></TableCell>
                        <TableCell>{p.vendor?.name || p.employee?.fullName || "-"}</TableCell>
                        <TableCell className="font-mono">{Number(p.amount).toLocaleString()} {p.currency}</TableCell>
                        <TableCell>{statusBadge(p.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
