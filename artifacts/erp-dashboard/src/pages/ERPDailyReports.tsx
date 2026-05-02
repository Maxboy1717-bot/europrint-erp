import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Filter } from "lucide-react";
import { ErrorState } from "@/components/ui/error-state";
import { PageState } from "@/components/ui/page-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface DailyReport {
  id: string;
  reportDate: string;
  userId: string | null;
  userName: string | null;
  shift: string | null;
  workCenterId: string | null;
  workCenterName: string | null;
  productionOrderId: string | null;
  orderNumber: string | null;
  planQty: number;
  factQty: number;
  scrapQty: number;
  downtimeMinutes: number;
  downtimeReasonCode: string | null;
  comment: string | null;
  createdAt: string;
}

const dailyReportFormSchema = z.object({
  reportDate: z.string().min(1, "Sanani kiriting"),
  userId: z.string().min(1, "Xodimni tanlang"),
  shift: z.string().min(1, "Smenani tanlang"),
  workCenterId: z.string().min(1, "Ish markazini tanlang"),
  productionOrderId: z.string().min(1, "Buyurtmani tanlang"),
  planQty: z.number().min(0, "Reja miqdori 0 dan kam bo'lmasligi kerak"),
  factQty: z.number().min(0, "Fakt miqdori 0 dan kam bo'lmasligi kerak"),
  scrapQty: z.number().min(0, "Brak miqdori 0 dan kam bo'lmasligi kerak"),
  downtimeMinutes: z.number().min(0, "To'xtash vaqti 0 dan kam bo'lmasligi kerak"),
  downtimeReasonCode: z.string().max(200, "To'xtash sababi 200 belgidan oshmasligi kerak"),
  comment: z.string().max(1000, "Izoh 1000 belgidan oshmasligi kerak"),
});

type DailyReportFormValues = z.infer<typeof dailyReportFormSchema>;

export default function ERPDailyReports() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<DailyReport | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    shift: "",
  });

  const defaultValues: DailyReportFormValues = {
    reportDate: new Date().toISOString().split("T")[0],
    userId: "",
    shift: "1-smena",
    workCenterId: "",
    productionOrderId: "",
    planQty: 0,
    factQty: 0,
    scrapQty: 0,
    downtimeMinutes: 0,
    downtimeReasonCode: "",
    comment: "",
  };

  const form = useForm<DailyReportFormValues>({
    resolver: zodResolver(dailyReportFormSchema),
    defaultValues,
  });

  const { data: reports = [], isLoading, isError, refetch} = useQuery<DailyReport[]>({
    queryKey: ["/api/erp/daily-reports", filters],
  });

  const { data: users = [] } = useQuery<Array<{ id: string; fullName: string }>>({
    queryKey: ["/api/users"],
  });

  const { data: workCenters = [] } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: ["/api/erp/work-centers"],
  });

  const { data: orders = [] } = useQuery<Array<{ id: string; orderNumber: string; productName?: string }>>({
    queryKey: ["/api/erp/orders"],
  });

  const createMutation = useMutation({
    mutationFn: (data: DailyReportFormValues) =>
      apiRequest("POST", "/api/erp/daily-reports", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/erp/daily-reports"] });
      toast({ title: "Hisobot yaratildi" });
      setIsDialogOpen(false);
      form.reset(defaultValues);
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: DailyReportFormValues }) =>
      apiRequest("PATCH", `/api/erp/daily-reports/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/erp/daily-reports"] });
      toast({ title: "Hisobot yangilandi" });
      setIsDialogOpen(false);
      setEditingReport(null);
      form.reset(defaultValues);
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("DELETE", `/api/erp/daily-reports/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/erp/daily-reports"] });
      toast({ title: "Hisobot o'chirildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const handleEdit = (report: DailyReport) => {
    setEditingReport(report);
    form.reset({
      reportDate: report.reportDate,
      userId: report.userId ?? "",
      shift: report.shift ?? "1-smena",
      workCenterId: report.workCenterId ?? "",
      productionOrderId: report.productionOrderId ?? "",
      planQty: report.planQty,
      factQty: report.factQty,
      scrapQty: report.scrapQty,
      downtimeMinutes: report.downtimeMinutes,
      downtimeReasonCode: report.downtimeReasonCode ?? "",
      comment: report.comment ?? "",
    });
    setIsDialogOpen(true);
  };

  const onSubmit = (values: DailyReportFormValues) => {
    if (editingReport) {
      updateMutation.mutate({ id: editingReport.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const getPerformanceColor = (plan: number, fact: number) => {
    if (fact === 0) return "text-muted-foreground";
    const percentage = (fact / plan) * 100;
    if (percentage >= 100) return "text-green-600";
    if (percentage >= 80) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="p-6 space-y-6" data-testid="page-daily-reports">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Kunlik hisobotlar</h1>
          <p className="text-muted-foreground">Smena oxirida ishlab chiqarish hisobotlari</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingReport(null); form.reset(defaultValues); }} data-testid="button-add-report">
              <Plus className="h-4 w-4 mr-2" />
              Hisobot qo'shish
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle data-testid="text-dialog-title">
                {editingReport ? "Hisobotni tahrirlash" : "Yangi kunlik hisobot"}
              </DialogTitle>
              <DialogDescription>
                Smena oxirida ishlab chiqarish natijalarini kiriting
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reportDate">Sana</Label>
                  <Input
                    id="reportDate"
                    type="date"
                    {...form.register("reportDate")}
                    data-testid="input-report-date"
                  />
                  {form.formState.errors.reportDate && (
                    <p className="text-sm text-destructive mt-1">{form.formState.errors.reportDate.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="shift">Smena</Label>
                  <Controller
                    control={form.control}
                    name="shift"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="shift" data-testid="select-shift">
                          <SelectValue placeholder="Smena tanlang" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-smena">1-smena</SelectItem>
                          <SelectItem value="2-smena">2-smena</SelectItem>
                          <SelectItem value="3-smena">3-smena</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {form.formState.errors.shift && (
                    <p className="text-sm text-destructive mt-1">{form.formState.errors.shift.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="userId">Xodim</Label>
                  <Controller
                    control={form.control}
                    name="userId"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="userId" data-testid="select-user">
                          <SelectValue placeholder="Xodim tanlang" />
                        </SelectTrigger>
                        <SelectContent>
                          {(Array.isArray(users) ? users : []).map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.fullName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {form.formState.errors.userId && (
                    <p className="text-sm text-destructive mt-1">{form.formState.errors.userId.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="workCenterId">Ish markazi</Label>
                  <Controller
                    control={form.control}
                    name="workCenterId"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="workCenterId" data-testid="select-work-center">
                          <SelectValue placeholder="Ish markazi tanlang" />
                        </SelectTrigger>
                        <SelectContent>
                          {(Array.isArray(workCenters) ? workCenters : []).map((wc) => (
                            <SelectItem key={wc.id} value={wc.id}>
                              {wc.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {form.formState.errors.workCenterId && (
                    <p className="text-sm text-destructive mt-1">{form.formState.errors.workCenterId.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="productionOrderId">Buyurtma</Label>
                <Controller
                  control={form.control}
                  name="productionOrderId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="productionOrderId" data-testid="select-order">
                        <SelectValue placeholder="Buyurtma tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        {(Array.isArray(orders) ? orders : []).map((order) => (
                          <SelectItem key={order.id} value={order.id}>
                            {order.orderNumber} - {order.productName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.productionOrderId && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.productionOrderId.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="planQty">Reja (dona)</Label>
                  <Input
                    id="planQty"
                    type="number"
                    {...form.register("planQty", { valueAsNumber: true })}
                    data-testid="input-plan-qty"
                  />
                  {form.formState.errors.planQty && (
                    <p className="text-sm text-destructive mt-1">{form.formState.errors.planQty.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="factQty">Fakt (dona)</Label>
                  <Input
                    id="factQty"
                    type="number"
                    {...form.register("factQty", { valueAsNumber: true })}
                    data-testid="input-fact-qty"
                  />
                  {form.formState.errors.factQty && (
                    <p className="text-sm text-destructive mt-1">{form.formState.errors.factQty.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="scrapQty">Brak (dona)</Label>
                  <Input
                    id="scrapQty"
                    type="number"
                    {...form.register("scrapQty", { valueAsNumber: true })}
                    data-testid="input-scrap-qty"
                  />
                  {form.formState.errors.scrapQty && (
                    <p className="text-sm text-destructive mt-1">{form.formState.errors.scrapQty.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="downtimeMinutes">To'xtash (daqiqa)</Label>
                  <Input
                    id="downtimeMinutes"
                    type="number"
                    {...form.register("downtimeMinutes", { valueAsNumber: true })}
                    data-testid="input-downtime"
                  />
                  {form.formState.errors.downtimeMinutes && (
                    <p className="text-sm text-destructive mt-1">{form.formState.errors.downtimeMinutes.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="downtimeReasonCode">To'xtash sababi</Label>
                <Input
                  id="downtimeReasonCode"
                  {...form.register("downtimeReasonCode")}
                  placeholder="Masalan: nosozlik, material yetishmasligi"
                  data-testid="input-downtime-reason"
                />
                {form.formState.errors.downtimeReasonCode && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.downtimeReasonCode.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="comment">Izoh</Label>
                <Textarea
                  id="comment"
                  {...form.register("comment")}
                  placeholder="Qo'shimcha ma'lumotlar"
                  data-testid="input-comment"
                />
                {form.formState.errors.comment && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.comment.message}</p>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} data-testid="button-cancel">
                  Bekor qilish
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save">
                  {createMutation.isPending || updateMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtrlar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="startDate">Boshlanish sanasi</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                data-testid="input-filter-start-date"
              />
            </div>
            <div>
              <Label htmlFor="endDate">Tugash sanasi</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                data-testid="input-filter-end-date"
              />
            </div>
            <div>
              <Label htmlFor="filterShift">Smena</Label>
              <Select
                value={filters.shift || "all"}
                onValueChange={(value) => setFilters({ ...filters, shift: value === "all" ? "" : value })}
              >
                <SelectTrigger id="filterShift" data-testid="select-filter-shift">
                  <SelectValue placeholder="Barcha smenalar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha smenalar</SelectItem>
                  <SelectItem value="1-smena">1-smena</SelectItem>
                  <SelectItem value="2-smena">2-smena</SelectItem>
                  <SelectItem value="3-smena">3-smena</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hisobotlar ro'yxati ({reports.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <PageState
            isLoading={isLoading}
            isError={isError}
            isEmpty={reports.length === 0}
            onRetry={refetch}
            skeleton="table"
            skeletonRows={5}
            skeletonColumns={9}
            errorTitle="Hisobotlar yuklanmadi"
            errorMessage="Server bilan bog'lanishda xatolik. Qayta urinib ko'ring."
            emptyIcon={Filter}
            emptyTitle="Hisobotlar topilmadi"
            emptyDescription="Filtrni o'zgartiring yoki yangi hisobot qo'shing."
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sana</TableHead>
                  <TableHead>Smena</TableHead>
                  <TableHead>Xodim</TableHead>
                  <TableHead>Ish markazi</TableHead>
                  <TableHead>Buyurtma</TableHead>
                  <TableHead className="text-right">Reja</TableHead>
                  <TableHead className="text-right">Fakt</TableHead>
                  <TableHead className="text-right">%</TableHead>
                  <TableHead className="text-right">Brak</TableHead>
                  <TableHead className="text-right">To'xtash</TableHead>
                  <TableHead className="text-center">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(reports) ? reports : []).map((report) => {
                  const percentage = report.planQty > 0 ? (report.factQty / report.planQty * 100).toFixed(1) : "0";
                  return (
                    <TableRow key={report.id} data-testid={`row-report-${report.id}`}>
                      <TableCell>{report.reportDate}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{report.shift}</Badge>
                      </TableCell>
                      <TableCell>{report.userName || "-"}</TableCell>
                      <TableCell>{report.workCenterName || "-"}</TableCell>
                      <TableCell>{report.orderNumber || "-"}</TableCell>
                      <TableCell className="text-right">{report.planQty}</TableCell>
                      <TableCell className="text-right font-semibold">{report.factQty}</TableCell>
                      <TableCell className={`text-right font-bold ${getPerformanceColor(report.planQty, report.factQty)}`}>
                        {percentage}%
                      </TableCell>
                      <TableCell className="text-right text-red-600">{report.scrapQty}</TableCell>
                      <TableCell className="text-right">{report.downtimeMinutes} daq</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(report)}
                            data-testid={`button-edit-${report.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(report.id)}
                            data-testid={`button-delete-${report.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </PageState>
        </CardContent>
      </Card>
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => { if (!v) setDeleteId(null); }}
        title="Hisobotni o'chirish"
        description="Ushbu kunlik hisobotni o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi."
        confirmText="O'chirish"
        variant="destructive"
        onConfirm={() => { if (deleteId) { deleteMutation.mutate(deleteId); setDeleteId(null); } }}
      />
    </div>
  );
}
