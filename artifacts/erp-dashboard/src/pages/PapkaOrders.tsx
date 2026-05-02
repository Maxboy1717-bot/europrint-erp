import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Search, FileText, CheckCircle, Clock, Pencil, Trash2, MoreVertical, Loader2, AlertCircle, Package } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUndoDelete } from "@/components/undo-toast";
import type { PapkaOrder } from "@shared/schema";
import { ErrorState } from "@/components/ui/error-state";

const formSchema = z.object({
  papkaNo: z.string().min(1, "Papka raqami kiritilishi kerak"),
  mijozNomi: z.string().min(1, "Mijoz nomi kiritilishi kerak"),
  mahsulotNomi: z.string().min(1, "Mahsulot nomi kiritilishi kerak"),
  mahsulotTuri: z.string().optional(),
  tiraj: z.coerce.number().min(1, "Tiraj kiritilishi kerak"),
  listSoni: z.coerce.number().optional(),
  formatA: z.coerce.number().optional(),
  formatB: z.coerce.number().optional(),
  status: z.string().default("new"),
  sana: z.string().optional(),
  tayyorBolishSanasi: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function PapkaOrders() {
  const { toast } = useToast();
  const { showUndoToast } = useUndoDelete();
  const [lang, setLang] = useState<"uz" | "ru">("uz");
  const [showDialog, setShowDialog] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PapkaOrder | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: ordersResponse, isLoading, error, isError, refetch} = useQuery<{
    items: PapkaOrder[];
    total: number;
  }>({
    queryKey: ["/api/papka-orders", { search: searchQuery || undefined, status: statusFilter === "all" ? undefined : statusFilter }],
  });

  const orders = ordersResponse?.items || [];

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      papkaNo: "",
      mijozNomi: "",
      mahsulotNomi: "",
      mahsulotTuri: "",
      tiraj: 0,
      listSoni: 0,
      formatA: 0,
      formatB: 0,
      status: "new",
      sana: new Date().toISOString().split("T")[0],
      tayyorBolishSanasi: "",
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => apiRequest("POST", "/api/papka-orders", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/papka-orders"] });
      setShowDialog(false);
      form.reset();
      toast({ title: lang === "uz" ? "Buyurtma yaratildi" : "Заказ создан" });
    },
    onError: (error: Error & { errorDetails?: { uz: string; ru: string } }) => {
      let errorMessage = lang === "uz" ? "Xatolik" : "Ошибка";
      
      if (error.errorDetails) {
        errorMessage = lang === "uz" ? error.errorDetails.uz : error.errorDetails.ru;
        
        if (errorMessage.toLowerCase().includes("papka raqami") || errorMessage.toLowerCase().includes("номер папки")) {
          form.setError("papkaNo", {
            type: "manual",
            message: errorMessage
          });
        }
      }

      toast({ 
        variant: "destructive", 
        title: lang === "uz" ? "Xatolik" : "Ошибка",
        description: errorMessage
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FormData }) =>
      apiRequest("PATCH", `/api/papka-orders/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/papka-orders"] });
      setShowDialog(false);
      setEditingOrder(null);
      form.reset();
      toast({ title: lang === "uz" ? "Buyurtma yangilandi" : "Заказ обновлен" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/papka-orders/${id}`);
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["/api/papka-orders"] });
      const order = (Array.isArray(orders) ? orders : []).find(o => o.id === id);
      showUndoToast("papka_orders", id, order?.papkaNo || id, () => {
        queryClient.invalidateQueries({ queryKey: ["/api/papka-orders"] });
      });
    },
  });

  const handleEdit = (order: PapkaOrder) => {
    setEditingOrder(order);
    form.reset({
      papkaNo: order.papkaNo || "",
      mijozNomi: order.mijozNomi || "",
      mahsulotNomi: order.mahsulotNomi || "",
      mahsulotTuri: order.mahsulotTuri || "",
      tiraj: order.tiraj || 0,
      listSoni: order.listSoni || 0,
      formatA: order.formatA || 0,
      formatB: order.formatB || 0,
      status: order.status || "new",
      sana: order.sana || "",
      tayyorBolishSanasi: order.tayyorBolishSanasi || "",
      notes: order.notes || "",
    });
    setShowDialog(true);
  };

  const onSubmit = (data: FormData) => {
    if (editingOrder) {
      updateMutation.mutate({ id: editingOrder.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleNewOrder = () => {
    setEditingOrder(null);
    form.reset({
      papkaNo: "",
      mijozNomi: "",
      mahsulotNomi: "",
      mahsulotTuri: "",
      tiraj: 0,
      listSoni: 0,
      formatA: 0,
      formatB: 0,
      status: "new",
      sana: new Date().toISOString().split("T")[0],
      tayyorBolishSanasi: "",
      notes: "",
    });
    setShowDialog(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; labelRu: string; className: string }> = {
      new: { label: "Yangi", labelRu: "Новый", className: "bg-primary-container text-on-primary-container" },
      planning: { label: "Rejalashtirish", labelRu: "Планирование", className: "bg-amber-100 text-amber-800" },
      production: { label: "Ishlab chiqarish", labelRu: "Производство", className: "bg-blue-100 text-blue-800" },
      completed: { label: "Bajarildi", labelRu: "Завершен", className: "bg-green-100 text-green-800" },
      cancelled: { label: "Bekor qilindi", labelRu: "Отменен", className: "bg-red-100 text-red-800" },
    };
    const config = statusConfig[status] || statusConfig.new;
    return (
      <Badge className={`${config.className} rounded-full border-none px-2.5 py-0.5 text-xs font-semibold`}>
        {lang === "uz" ? config.label : config.labelRu}
      </Badge>
    );
  };

  const t = {
    uz: {
      title: "Papka Buyurtmalari",
      addOrder: "Yangi Buyurtma",
      search: "Qidirish...",
      status: "Holati",
      all: "Hammasi",
      new: "Yangi",
      planning: "Rejalashtirish",
      production: "Ishlab chiqarish",
      completed: "Bajarildi",
      cancelled: "Bekor qilindi",
      papkaNo: "Papka №",
      product: "Mahsulot",
      client: "Mijoz",
      tiraj: "Tiraj",
      orderDate: "Buyurtma sanasi",
      deadline: "Tayyor bo'lish",
      actions: "Amallar",
      noOrders: "Buyurtmalar topilmadi",
      createOrder: "Yangi Buyurtma",
      editOrder: "Buyurtmani Tahrirlash",
      save: "Saqlash",
      cancel: "Bekor qilish",
      notes: "Izohlar",
      productType: "Mahsulot turi",
      format: "Format (A x B)",
      totalOrders: "Jami Buyurtmalar",
      activeOrders: "Faol Buyurtmalar",
      completedOrders: "Bajarilgan",
    },
    ru: {
      title: "Заказы Папок",
      addOrder: "Новый Заказ",
      search: "Поиск...",
      status: "Статус",
      all: "Все",
      new: "Новый",
      planning: "Планирование",
      production: "Производство",
      completed: "Завершенные",
      cancelled: "Отмененные",
      papkaNo: "Папка №",
      product: "Продукт",
      client: "Клиент",
      tiraj: "Тираж",
      orderDate: "Дата заказа",
      deadline: "Срок",
      actions: "Действия",
      noOrders: "Заказы не найдены",
      createOrder: "Новый Заказ",
      editOrder: "Редактировать Заказ",
      save: "Сохранить",
      cancel: "Отмена",
      notes: "Примечания",
      productType: "Тип продукта",
      format: "Формат (A x B)",
      totalOrders: "Всего Заказов",
      activeOrders: "Активных",
      completedOrders: "Завершенных",
    },
  };

  const activeCount = (Array.isArray(orders) ? orders : []).filter((o) => ["new", "planning", "production"].includes(o.status)).length;
  const completedCount = (Array.isArray(orders) ? orders : []).filter((o) => o.status === "completed").length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface" data-testid="loading-spinner">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  return (
    <div className="flex-1 overflow-auto bg-surface p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-4xl font-light tracking-tight text-on-surface">
            {t[lang].title.split(' ')[0]} <span className="font-bold text-primary">{t[lang].title.split(' ')[1]}</span>
          </h1>
          <p className="text-on-surface-variant mt-1">Ofset bosma, papka va qadoqlash buyurtmalarini boshqaring</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-surface-container-low p-1 rounded-lg border border-outline-variant/30">
            <Button variant="ghost" size="sm" onClick={() => setLang("uz")} className={`rounded-md px-3 ${lang === "uz" ? "bg-primary text-white" : "text-on-surface-variant"}`} data-testid="button-lang-uz">UZ</Button>
            <Button variant="ghost" size="sm" onClick={() => setLang("ru")} className={`rounded-md px-3 ${lang === "ru" ? "bg-primary text-white" : "text-on-surface-variant"}`} data-testid="button-lang-ru">RU</Button>
          </div>
          <Button onClick={handleNewOrder} data-testid="button-add-order" className="bg-gradient-to-br from-primary to-primary-dim text-white rounded-lg px-6 shadow-sm">
            <Plus className="h-4 w-4 mr-2" />
            {t[lang].addOrder}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-surface-container-lowest rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t[lang].totalOrders}</p>
          <p className="text-4xl font-bold tracking-tight text-on-surface mt-1">{orders.length}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t[lang].activeOrders}</p>
          <p className="text-4xl font-bold tracking-tight text-on-surface mt-1">{activeCount}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t[lang].completedOrders}</p>
          <p className="text-4xl font-bold tracking-tight text-green-600 mt-1">{completedCount}</p>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
          <h2 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Buyurtmalar Ro'yxati</h2>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
              <Input
                placeholder={t[lang].search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64 bg-surface-container-low border-outline-variant rounded-lg"
                data-testid="input-search"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-surface-container-low border-outline-variant rounded-lg" data-testid="filter-status">
                <SelectValue placeholder={t[lang].status} />
              </SelectTrigger>
              <SelectContent className="bg-surface border-outline-variant">
                <SelectItem value="all">{t[lang].all}</SelectItem>
                <SelectItem value="new">{t[lang].new}</SelectItem>
                <SelectItem value="planning">{t[lang].planning}</SelectItem>
                <SelectItem value="production">{t[lang].production}</SelectItem>
                <SelectItem value="completed">{t[lang].completed}</SelectItem>
                <SelectItem value="cancelled">{t[lang].cancelled}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-md border overflow-hidden">
          {orders.length === 0 ? (
            <div className="text-center py-12 text-on-surface-variant italic bg-transparent">
              {t[lang].noOrders}
            </div>
          ) : (
            <Table data-testid="table-papka-orders">
              <TableHeader>
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{t[lang].papkaNo}</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{t[lang].product}</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{t[lang].client}</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{t[lang].tiraj}</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{t[lang].orderDate}</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{t[lang].deadline}</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{t[lang].status}</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 text-right">{t[lang].actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(orders) ? orders : []).map((order) => (
                  <TableRow key={order.id} data-testid={`row-order-${order.id}`} className="hover:bg-surface-container-low transition-colors border-none group">
                    <TableCell className="py-4 px-6 font-mono text-xs font-bold text-primary border-none">
                      {order.papkaNo}
                    </TableCell>
                    <TableCell className="py-4 px-6 font-bold text-on-surface border-none">{order.mahsulotNomi}</TableCell>
                    <TableCell className="py-4 px-6 text-sm text-on-surface border-none">{order.mijozNomi}</TableCell>
                    <TableCell className="py-4 px-6 font-bold text-on-surface border-none">{order.tiraj?.toLocaleString()}</TableCell>
                    <TableCell className="py-4 px-6 text-sm text-on-surface-variant border-none">
                      {order.sana ? format(new Date(order.sana), "dd.MM.yyyy") : "-"}
                    </TableCell>
                    <TableCell className="py-4 px-6 text-sm text-on-surface-variant border-none">
                      {order.tayyorBolishSanasi ? format(new Date(order.tayyorBolishSanasi), "dd.MM.yyyy") : "-"}
                    </TableCell>
                    <TableCell className="py-4 px-6 border-none">{getStatusBadge(order.status || "new")}</TableCell>
                    <TableCell className="py-4 px-6 text-right border-none">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(order)}
                          data-testid={`action-edit-${order.id}`}
                          className="h-8 w-8 text-on-surface-variant hover:text-primary hover:bg-primary/10"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <DeleteConfirmDialog
                          title={t[lang].cancelled}
                          description="Bu amalni qaytarib bo'lmaydi."
                          onConfirm={() => deleteMutation.mutate(order.id)}
                          isPending={deleteMutation.isPending}
                        >
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-on-surface-variant hover:text-red-500 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </DeleteConfirmDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-surface border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-on-surface">
              {editingOrder ? t[lang].editOrder : t[lang].createOrder}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
              <FormField
                control={form.control}
                name="papkaNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-on-surface">{t[lang].papkaNo}</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        data-testid="input-papka-no" 
                        className="rounded-lg border-outline-variant bg-surface-container-low"
                        onChange={(e) => {
                          field.onChange(e);
                          if (form.formState.errors.papkaNo) {
                            form.clearErrors("papkaNo");
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mahsulotNomi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-on-surface">{t[lang].product}</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-product-name" className="rounded-lg border-outline-variant bg-surface-container-low" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mijozNomi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-on-surface">{t[lang].client}</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-client-name" className="rounded-lg border-outline-variant bg-surface-container-low" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="mahsulotTuri"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-on-surface">{t[lang].productType}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-product-type" className="rounded-lg border-outline-variant bg-surface-container-low">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-surface border-outline-variant">
                          <SelectItem value="gofra">Gofra</SelectItem>
                          <SelectItem value="gladkiy">Gladkiy</SelectItem>
                          <SelectItem value="laminated">Laminated</SelectItem>
                          <SelectItem value="other">Boshqa</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tiraj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-on-surface">{t[lang].tiraj}</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} data-testid="input-tiraj" className="rounded-lg border-outline-variant bg-surface-container-low" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)} className="rounded-lg border-outline-variant text-on-surface">
                  {t[lang].cancel}
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save" className="bg-primary text-white rounded-lg px-6">
                  {t[lang].save}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
