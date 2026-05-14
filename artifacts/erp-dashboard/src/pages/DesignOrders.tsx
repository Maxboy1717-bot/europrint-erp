/**
 * @module DesignOrders
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Search, Package, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/lib/i18n";
import { EPErrorState, EPPageHeader } from "@/components/ep";
interface DesignOrder {
  order: {
    id: string;
    orderNumber: string;
    dealId: string | null;
    clientName: string;
    clientCompany: string | null;
    productType: string;
    productName: string;
    brandName: string | null;
    quantity: number;
    status: string;
    priority: string;
    deadline: string | null;
    createdAt: Date;
  };
  designer: {
    id: string;
    fullName: string;
  } | null;
}

const designOrderSchema = z.object({
  clientName: z.string().min(1, "Mijoz ismi majburiy"),
  clientCompany: z.string().optional(),
  clientPhone: z.string().optional(),
  clientEmail: z.string().optional(),
  productType: z.string().min(1, "Mahsulot turini tanlang"),
  productName: z.string().min(1, "Mahsulot nomi majburiy"),
  brandName: z.string().optional(),
  quantity: z.coerce.number().min(1).default(1000),
  description: z.string().optional(),
  requirements: z.string().optional(),
  priority: z.string().default("normal"),
  deadline: z.string().optional(),
});

type DesignOrderFormData = z.infer<typeof designOrderSchema>;

export default function DesignOrders() {
  const { toast } = useToast();
  const { t } = useTranslation('common');
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const form = useForm<DesignOrderFormData>({
    resolver: zodResolver(designOrderSchema),
    defaultValues: {
      clientName: "", clientCompany: "", clientPhone: "", clientEmail: "",
      productType: "", productName: "", brandName: "",
      quantity: 1000, description: "", requirements: "", priority: "normal", deadline: "",
    },
  });

  const { data: orders = [], isLoading, isError, refetch} = useQuery<DesignOrder[]>({
    queryKey: ["/api/design/orders"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: DesignOrderFormData) => apiRequest('POST', '/api/design/orders', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/design/orders"] });
      setIsCreateOpen(false);
      form.reset();
      toast({ title: t('createdSuccessfully'), description: "Yangi dizayn buyurtmasi muvaffaqiyatli yaratildi" });
    },
    onError: () => {
      toast({ title: t('error'), description: t('operationFailed'), variant: "destructive" });
    },
  });

  const onSubmit = (values: DesignOrderFormData) => {
    createMutation.mutate(values);
  };

  const filteredOrders = (Array.isArray(orders) ? orders : []).filter(item =>
    item.order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.order.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.order.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const STATUS_LABELS: Record<string, string> = {
    new: "Yangi",
    ai_generated: "AI Generatsiya",
    designer_review: "Dizayner ko'rmoqda",
    waiting_customer_approval: "Mijoz tasdig'i",
    revision_requested: "Tahrirlash",
    approved: "Tasdiqlangan",
    rejected: "Rad etilgan",
    archived: "Arxiv",
    // Eski UZ statuses (backward compat)
    yangi: "Yangi",
    jarayonda: "Jarayonda",
    "tasdiq-kutilmoqda": "Tasdiq kutilmoqda",
    tasdiqlangan: "Tasdiqlangan",
    "ishlab-chiqarish": "Ishlab chiqarish",
    yakunlangan: "Yakunlangan",
    "rad-etilgan": "Rad etilgan",
  };
  const STATUS_CLASSES: Record<string, string> = {
    new: "bg-slate-100 text-slate-700",
    ai_generated: "bg-purple-100 text-[var(--ep-purple)]",
    designer_review: "bg-blue-100 text-[var(--ep-blue)]",
    waiting_customer_approval: "bg-yellow-100 text-[var(--ep-yellow)]",
    revision_requested: "bg-orange-100 text-[var(--ep-primary)]",
    approved: "bg-green-100 text-[var(--ep-green)]",
    rejected: "bg-red-100 text-[var(--ep-red)]",
    archived: "bg-gray-100 text-gray-500",
    yangi: "bg-slate-100 text-slate-700",
    jarayonda: "bg-amber-100 text-[var(--ep-yellow)]",
    "tasdiq-kutilmoqda": "bg-yellow-100 text-[var(--ep-yellow)]",
    tasdiqlangan: "bg-green-100 text-[var(--ep-green)]",
    "ishlab-chiqarish": "bg-blue-100 text-[var(--ep-blue)]",
    yakunlangan: "bg-green-100 text-[var(--ep-green)]",
    "rad-etilgan": "bg-red-100 text-[var(--ep-red)]",
  };
  const getStatusBadge = (status: string) => {
    return `${STATUS_CLASSES[status] || 'bg-muted text-muted-foreground'} rounded-full px-2.5 py-0.5 text-xs font-semibold`;
  };
  const getStatusLabel = (status: string) => STATUS_LABELS[status] || status;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }


  if (isError) {
    return <EPErrorState onRetry={refetch} />;
  }
  return (
    <div className="space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <EPPageHeader
        breadcrumb={<>Dashboard · <b className="text-foreground">Dizayn Buyurtmalari</b></>}
        title="Dizayn Buyurtmalari"
        subtitle="Barcha dizayn buyurtmalarini boshqarish va kuzatish"
      />
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-order">
                <Plus className="mr-2 h-4 w-4" /> {t('create')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
              <DialogHeader>
                <DialogTitle className="text-[18px] font-semibold">Yangi Dizayn Buyurtmasi</DialogTitle>
                <DialogDescription>Yangi dizayn buyurtmasini yaratish uchun ma'lumotlarni kiriting</DialogDescription>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="clientName">Mijoz Ismi *</Label>
                    <Input id="clientName" {...form.register("clientName")} data-testid="input-client-name" />
                    {form.formState.errors.clientName && <p className="text-sm text-destructive mt-1">{form.formState.errors.clientName.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="clientCompany">{t('company')}</Label>
                    <Input id="clientCompany" {...form.register("clientCompany")} data-testid="input-client-company" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="clientPhone">{t('phone')}</Label>
                    <Input id="clientPhone" {...form.register("clientPhone")} data-testid="input-client-phone" />
                  </div>
                  <div>
                    <Label htmlFor="clientEmail">{t('email')}</Label>
                    <Input id="clientEmail" type="email" {...form.register("clientEmail")} data-testid="input-client-email" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Mahsulot {t('type')} *</Label>
                    <Controller control={form.control} name="productType" render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger data-testid="select-product-type" className="h-9"><SelectValue placeholder={t('select')} /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="stakan">Stakan</SelectItem>
                          <SelectItem value="quti">Quti</SelectItem>
                          <SelectItem value="plakat">Plakat</SelectItem>
                          <SelectItem value="qadoq">Qadoq</SelectItem>
                          <SelectItem value="korrugirovanniy-quti">Korrugirovanniy Quti</SelectItem>
                          <SelectItem value="tibbiy-qadoq">Tibbiy Qadoq</SelectItem>
                        </SelectContent>
                      </Select>
                    )} />
                    {form.formState.errors.productType && <p className="text-sm text-destructive mt-1">{form.formState.errors.productType.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="productName">Mahsulot {t('name')} *</Label>
                    <Input id="productName" {...form.register("productName")} data-testid="input-product-name" />
                    {form.formState.errors.productName && <p className="text-sm text-destructive mt-1">{form.formState.errors.productName.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="brandName">Brend {t('name')}</Label>
                    <Input id="brandName" {...form.register("brandName")} data-testid="input-brand-name" />
                  </div>
                  <div>
                    <Label htmlFor="quantity">{t('quantity')}</Label>
                    <Input id="quantity" type="number" {...form.register("quantity", { valueAsNumber: true })} data-testid="input-quantity" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">{t('description')}</Label>
                  <Textarea id="description" {...form.register("description")} rows={3} data-testid="input-description" />
                </div>

                <div>
                  <Label htmlFor="requirements">Maxsus Talablar</Label>
                  <Textarea id="requirements" {...form.register("requirements")} rows={3} data-testid="input-requirements" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>{t('priority')}</Label>
                    <Controller control={form.control} name="priority" render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger data-testid="select-priority" className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">{t('low')}</SelectItem>
                          <SelectItem value="normal">{t('medium')}</SelectItem>
                          <SelectItem value="high">{t('high')}</SelectItem>
                          <SelectItem value="urgent">Shoshilinch</SelectItem>
                        </SelectContent>
                      </Select>
                    )} />
                  </div>
                  <div>
                    <Label htmlFor="deadline">Muddati</Label>
                    <Input id="deadline" type="date" {...form.register("deadline")} data-testid="input-deadline" />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => { setIsCreateOpen(false); form.reset(); }} data-testid="button-cancel">
                    {t('cancel')}
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit">
                    {createMutation.isPending ? t('loading') : t('create')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buyurtma raqami, mijoz yoki mahsulot nomi bo'yicha qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              data-testid="input-search"
            />
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <Card className="bg-card rounded-xl border-none shadow-none">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t('noResults')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {(Array.isArray(filteredOrders) ? filteredOrders : []).map((item) => (
              <Link key={item.order.id} href={`/design-orders/${item.order.id}`}>
                <Card className="bg-card rounded-xl border-none shadow-none hover:bg-muted/40 transition-colors cursor-pointer" data-testid={`card-order-${item.order.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-[14px] font-semibold text-foreground">{item.order.orderNumber}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{item.order.clientName}</p>
                        {item.order.clientCompany && (
                          <p className="text-xs text-muted-foreground">{item.order.clientCompany}</p>
                        )}
                      </div>
                      <span className={getStatusBadge(item.order.status)}>
                        {getStatusLabel(item.order.status)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                  <div className="space-y-2 text-sm text-foreground">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mahsulot:</span>
                      <span className="font-medium">{item.order.productName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('type')}:</span>
                      <span className="capitalize">{item.order.productType}</span>
                    </div>
                    {item.order.brandName && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Brend:</span>
                        <span>{item.order.brandName}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('quantity')}:</span>
                      <span>{item.order.quantity.toLocaleString()}</span>
                    </div>
                    {item.designer && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Dizayner:</span>
                        <span>{item.designer.fullName}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('priority')}:</span>
                      <Badge variant="outline" className="capitalize text-xs">{item.order.priority}</Badge>
                    </div>
                    {item.order.deadline && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Muddat:</span>
                        <span>{item.order.deadline}</span>
                      </div>
                    )}
                    {item.order.dealId && (
                      <div className="flex justify-between items-center pt-2 border-t border-surface-container">
                        <span className="text-muted-foreground">{t('crmDeal')}</span>
                        <Badge variant="outline" className="text-xs">
                          <ExternalLink className="h-3 w-3" />
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
