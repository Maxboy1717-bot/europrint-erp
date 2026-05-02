import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, FileText, Eye, ArrowRightLeft, Clock, Send, CheckCircle, XCircle, AlertCircle, RefreshCw, Loader2, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import type { SdQuotation as Quotation, SdQuotationItem as QuotationItem, InsertSdQuotation as InsertQuotation } from "@shared/schema";

const generateQuotationNumber = () => {
  const ts = Date.now().toString().slice(-8);
  const suffix = ts.slice(-3).toUpperCase();
  return `QT-${ts.slice(0, 5)}-${suffix}`;
};
import { z } from "zod";
import { ErrorState } from "@/components/ui/error-state";

const quotationFormSchema = z.object({
  quotationNumber: z.string().optional(),
  customerId: z.string().optional(),
  customerName: z.string().min(1, "Mijoz nomi talab qilinadi"),
  quotationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
  validUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
  status: z.enum(["draft", "sent", "accepted", "rejected", "expired", "converted"]),
  currency: z.string().default("UZS"),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
  netValue: z.coerce.number().nonnegative(),
  taxAmount: z.coerce.number().nonnegative(),
  totalValue: z.coerce.number().nonnegative(),
});

type QuotationFormData = z.infer<typeof quotationFormSchema>;

interface QuotationWithItems extends Quotation {
  items?: QuotationItem[];
  createdByName?: string;
}

export default function SDQuotations() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [openDialog, setOpenDialog] = useState(false);
  const [confirmDeleteQuotationId, setConfirmDeleteQuotationId] = useState<string | null>(null);
  const [confirmConvertOrderId, setConfirmConvertOrderId] = useState<string | null>(null);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);
  const [selectedQuotation, setSelectedQuotation] = useState<QuotationWithItems | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [items, setItems] = useState<{ productId: string; description: string; quantity: number; unitPrice: number; discount: number; }[]>([]);

  const { data: quotations = [], isLoading, error, isError, refetch} = useQuery<Quotation[]>({
    queryKey: ["/api/sd/quotations"],
  });

  const { data: companies = [] } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: ["/api/crm/companies"],
  });

  const { data: products = [] } = useQuery<Array<{ id: string; name: string; basePrice?: number }>>({
    queryKey: ["/api/products"],
  });

  const quotationForm = useForm<QuotationFormData>({
    resolver: zodResolver(quotationFormSchema),
    defaultValues: {
      quotationNumber: "",
      customerId: "",
      customerName: "",
      quotationDate: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: "draft",
      currency: "UZS",
      paymentTerms: "",
      notes: "",
      netValue: 0,
      taxAmount: 0,
      totalValue: 0,
    },
  });

  const saveQuotation = useMutation({
    mutationFn: async (data: QuotationFormData) => {
      const netValue = (Array.isArray(items) ? items : []).reduce((sum, item) => sum + (item.quantity * item.unitPrice * (1 - item.discount / 100)), 0);
      const totalValue = netValue;
      
      const payload = {
        ...data,
        netValue,
        taxAmount: 0,
        totalValue,
        items: (Array.isArray(items) ? items : []).map(item => ({
          productId: item.productId || undefined,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          unit: "dona",
          netValue: item.quantity * item.unitPrice * (1 - item.discount / 100),
        })),
      };

      if (editingQuotation) {
        await apiRequest("PATCH", `/api/sd/quotations/${editingQuotation.id}`, payload);
      } else {
        await apiRequest("POST", "/api/sd/quotations", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sd/quotations"] });
      toast({ description: editingQuotation ? "Taklif yangilandi" : "Taklif yaratildi" });
      setOpenDialog(false);
      quotationForm.reset({
        quotationNumber: generateQuotationNumber(),
        customerId: "",
        customerName: "",
        quotationDate: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: "draft",
        currency: "UZS",
        paymentTerms: "",
        notes: "",
        netValue: 0,
        taxAmount: 0,
        totalValue: 0,
      });
      setItems([]);
      setEditingQuotation(null);
    },
    onError: (error: Error) => {
      toast({ 
        variant: "destructive",
        description: error.message || "Xatolik yuz berdi" 
      });
    },
  });

  const deleteQuotation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/sd/quotations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sd/quotations"] });
      toast({ description: "Taklif o'chirildi" });
    },
  });

  const convertToOrder = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest<{ order: { id: string; documentNumber?: string } }>("POST", `/api/sd/quotations/${id}/convert-to-order`, {});
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sd/quotations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sd/orders"] });
      toast({ description: `Taklif buyurtmaga aylantirildi: ${data?.order?.documentNumber || ""}` });
      setDetailSheetOpen(false);
      navigate("/sd/sales-orders");
    },
    onError: (error: Error) => {
      toast({ 
        variant: "destructive",
        description: error.message || "Xatolik yuz berdi" 
      });
    },
  });

  const handleViewDetails = async (quotation: Quotation) => {
    try {
      const response = await fetch(`/api/sd/quotations/${quotation.id}`, { credentials: "include" });
      const data = await response.json();
      setSelectedQuotation(data);
      setDetailSheetOpen(true);
    } catch (error) {
      toast({ variant: "destructive", description: "Ma'lumotlarni yuklashda xatolik" });
    }
  };

  const handleEdit = (quotation: Quotation) => {
    setEditingQuotation(quotation);
    quotationForm.reset({
      quotationNumber: quotation.quotationNumber,
      customerId: quotation.customerId || "",
      customerName: quotation.customerName,
      quotationDate: quotation.quotationDate,
      validUntil: quotation.validUntil,
      status: quotation.status as QuotationFormData["status"],
      currency: quotation.currency,
      paymentTerms: quotation.paymentTerms || "",
      notes: quotation.notes || "",
      netValue: quotation.netValue,
      taxAmount: quotation.taxAmount,
      totalValue: quotation.totalValue,
    });
    setItems([]);
    setOpenDialog(true);
  };

  const handleDelete = (id: string) => {
    setConfirmDeleteQuotationId(id);
  };

  const handleConvertToOrder = (id: string) => {
    setConfirmConvertOrderId(id);
  };

  const addItem = () => {
    setItems([...items, { productId: "", description: "", quantity: 1, unitPrice: 0, discount: 0 }]);
  };

  const updateItem = (index: number, field: keyof typeof items[number], value: string | number) => {
    const newItems = [...items];
    (newItems[index] as Record<string, string | number>)[field] = value;
    
    if (field === "productId" && value) {
      const product = (Array.isArray(products) ? products : []).find((p) => p.id === value);
      if (product) {
        newItems[index].description = product.name;
        newItems[index].unitPrice = product.basePrice || 0;
      }
    }
    
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems((Array.isArray(items) ? items : []).filter((_, i) => i !== index));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge className="bg-primary-container text-on-primary-container rounded-full px-2.5 py-0.5 text-xs font-semibold border-none"><Clock className="h-3 w-3 mr-1" />Qoralama</Badge>;
      case "sent":
        return <Badge className="bg-primary-container text-on-primary-container rounded-full px-2.5 py-0.5 text-xs font-semibold border-none"><Send className="h-3 w-3 mr-1" />Yuborilgan</Badge>;
      case "accepted":
        return <Badge className="bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold border-none"><CheckCircle className="h-3 w-3 mr-1" />Qabul qilindi</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800 rounded-full px-2.5 py-0.5 text-xs font-semibold border-none"><XCircle className="h-3 w-3 mr-1" />Rad etildi</Badge>;
      case "expired":
        return <Badge className="bg-amber-100 text-amber-800 rounded-full px-2.5 py-0.5 text-xs font-semibold border-none"><AlertCircle className="h-3 w-3 mr-1" />Muddati o'tgan</Badge>;
      case "converted":
        return <Badge className="bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold border-none"><RefreshCw className="h-3 w-3 mr-1" />Aylantirilgan</Badge>;
      default:
        return <Badge className="bg-primary-container text-on-primary-container rounded-full px-2.5 py-0.5 text-xs font-semibold border-none">{status}</Badge>;
    }
  };


  const filteredQuotations = statusFilter === "all" 
    ? quotations 
    : (Array.isArray(quotations) ? quotations : []).filter(q => q.status === statusFilter);

  const statusCounts = {
    draft: (Array.isArray(quotations) ? quotations : []).filter(q => q.status === "draft").length,
    sent: (Array.isArray(quotations) ? quotations : []).filter(q => q.status === "sent").length,
    accepted: (Array.isArray(quotations) ? quotations : []).filter(q => q.status === "accepted").length,
    rejected: (Array.isArray(quotations) ? quotations : []).filter(q => q.status === "rejected").length,
    expired: (Array.isArray(quotations) ? quotations : []).filter(q => q.status === "expired").length,
    converted: (Array.isArray(quotations) ? quotations : []).filter(q => q.status === "converted").length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="loading-spinner">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }


  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2" data-testid="error-state">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-muted-foreground">Ma'lumotlarni yuklashda xatolik yuz berdi</p>
      </div>
    );
  }

  if (!quotations || quotations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2" data-testid="empty-state">
        <Package className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-medium">Hozircha ma'lumot yo'q</p>
        <p className="text-sm text-muted-foreground">Yangi yozuv qo'shish uchun yuqoridagi tugmani bosing</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-surface p-6">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-4xl font-light tracking-tight text-on-surface" data-testid="text-page-title">
            Taklifnomalar <span className="font-bold text-primary">Boshqaruvi</span>
          </h1>
          <p className="text-on-surface-variant mt-1">
            SAP SD - Narx takliflarini boshqarish
          </p>
        </div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingQuotation(null);
              quotationForm.reset({
                quotationNumber: generateQuotationNumber(),
                customerId: "",
                customerName: "",
                quotationDate: new Date().toISOString().split('T')[0],
                validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: "draft",
                currency: "UZS",
                paymentTerms: "",
                notes: "",
                netValue: 0,
                taxAmount: 0,
                totalValue: 0,
              });
              setItems([]);
            }} data-testid="button-create-quotation" className="bg-gradient-to-br from-primary to-primary-dim text-white rounded-lg px-5 py-2.5 text-sm font-semibold">
              <Plus className="h-4 w-4 mr-2" />
              Yangi taklif
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingQuotation ? "Taklifni tahrirlash" : "Yangi taklif yaratish"}
              </DialogTitle>
              <DialogDescription>
                Mijozga narx taklifi yarating
              </DialogDescription>
            </DialogHeader>

            <Form {...quotationForm}>
              <form onSubmit={quotationForm.handleSubmit((data) => saveQuotation.mutate(data))} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={quotationForm.control}
                    name="quotationNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Taklif raqami</FormLabel>
                        <FormControl>
                          <Input {...field} readOnly data-testid="input-quotation-number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={quotationForm.control}
                    name="customerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mijoz (kompaniya)</FormLabel>
                        <Select 
                          value={field.value} 
                          onValueChange={(value) => {
                            field.onChange(value);
                            const company = (Array.isArray(companies) ? companies : []).find(c => c.id === value);
                            if (company) {
                              quotationForm.setValue("customerName", company.name);
                            }
                          }}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-customer">
                              <SelectValue placeholder="Kompaniyani tanlang" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(Array.isArray(companies) ? companies : []).map((company) => (
                              <SelectItem key={company.id} value={company.id}>
                                {company.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={quotationForm.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mijoz nomi</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-customer-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={quotationForm.control}
                    name="quotationDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Taklif sanasi</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-quotation-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={quotationForm.control}
                    name="validUntil"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amal qilish muddati</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-valid-until" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={quotationForm.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valyuta</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger data-testid="select-currency">
                              <SelectValue placeholder="Tanlang" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="UZS">UZS - O'zbek so'mi</SelectItem>
                            <SelectItem value="USD">USD - Dollar</SelectItem>
                            <SelectItem value="EUR">EUR - Evro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={quotationForm.control}
                    name="paymentTerms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>To'lov shartlari</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger data-testid="select-payment-terms">
                              <SelectValue placeholder="Tanlang" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="prepaid">Oldindan to'lov</SelectItem>
                            <SelectItem value="net14">14 kun ichida</SelectItem>
                            <SelectItem value="net30">30 kun ichida</SelectItem>
                            <SelectItem value="net60">60 kun ichida</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={quotationForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Holat</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger data-testid="select-status">
                              <SelectValue placeholder="Tanlang" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="draft">Qoralama</SelectItem>
                            <SelectItem value="sent">Yuborilgan</SelectItem>
                            <SelectItem value="accepted">Qabul qilindi</SelectItem>
                            <SelectItem value="rejected">Rad etildi</SelectItem>
                            <SelectItem value="expired">Muddati o'tgan</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={quotationForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Izohlar</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} data-testid="input-notes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Mahsulotlar</h3>
                    <Button type="button" variant="outline" size="sm" onClick={addItem} data-testid="button-add-item">
                      <Plus className="h-4 w-4 mr-1" />
                      Mahsulot qo'shish
                    </Button>
                  </div>

                  {items.length > 0 && (
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Mahsulot</TableHead>
                            <TableHead>Tavsif</TableHead>
                            <TableHead className="w-24">Miqdor</TableHead>
                            <TableHead className="w-32">Narx</TableHead>
                            <TableHead className="w-24">Chegirma %</TableHead>
                            <TableHead className="w-32">Jami</TableHead>
                            <TableHead className="w-12"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(Array.isArray(items) ? items : []).map((item, index) => (
                            <TableRow key={`k-${index}`}>
                              <TableCell>
                                <Select 
                                  value={item.productId} 
                                  onValueChange={(value) => updateItem(index, "productId", value)}
                                >
                                  <SelectTrigger className="w-full" data-testid={`select-product-${index}`}>
                                    <SelectValue placeholder="Tanlang" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {(Array.isArray(products) ? products : []).map((product) => (
                                      <SelectItem key={product.id} value={product.id}>
                                        {product.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Input 
                                  value={item.description} 
                                  onChange={(e) => updateItem(index, "description", e.target.value)}
                                  data-testid={`input-description-${index}`}
                                />
                              </TableCell>
                              <TableCell>
                                <Input 
                                  type="number" 
                                  value={item.quantity} 
                                  onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value) || 0)}
                                  data-testid={`input-quantity-${index}`}
                                />
                              </TableCell>
                              <TableCell>
                                <Input 
                                  type="number" 
                                  value={item.unitPrice} 
                                  onChange={(e) => updateItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                                  data-testid={`input-unit-price-${index}`}
                                />
                              </TableCell>
                              <TableCell>
                                <Input 
                                  type="number" 
                                  value={item.discount} 
                                  onChange={(e) => updateItem(index, "discount", parseFloat(e.target.value) || 0)}
                                  data-testid={`input-discount-${index}`}
                                />
                              </TableCell>
                              <TableCell className="font-medium">
                                {formatCurrency(item.quantity * item.unitPrice * (1 - item.discount / 100), quotationForm.watch("currency"))}
                              </TableCell>
                              <TableCell>
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => removeItem(index)}
                                  data-testid={`button-remove-item-${index}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <div className="p-4 border-t bg-muted/50">
                        <div className="flex justify-end">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Jami summa</p>
                            <p className="text-xl font-bold" data-testid="text-total-amount">
                              {formatCurrency(
                                (Array.isArray(items) ? items : []).reduce((sum, item) => sum + (item.quantity * item.unitPrice * (1 - item.discount / 100)), 0),
                                quotationForm.watch("currency")
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
                    Bekor qilish
                  </Button>
                  <Button type="submit" disabled={saveQuotation.isPending} data-testid="button-save-quotation">
                    {saveQuotation.isPending ? "Saqlanmoqda..." : editingQuotation ? "Saqlash" : "Yaratish"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-surface-container-lowest rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Qoralama</p>
          <p className="text-4xl font-bold tracking-tight text-on-surface mt-1">{statusCounts.draft}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Yuborilgan</p>
          <p className="text-4xl font-bold tracking-tight text-on-surface mt-1">{statusCounts.sent}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Qabul qilindi</p>
          <p className="text-4xl font-bold tracking-tight text-green-600 mt-1">{statusCounts.accepted}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Rad etildi</p>
          <p className="text-4xl font-bold tracking-tight text-red-600 mt-1">{statusCounts.rejected}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Muddati o'tgan</p>
          <p className="text-4xl font-bold tracking-tight text-amber-600 mt-1">{statusCounts.expired}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Aylantirilgan</p>
          <p className="text-4xl font-bold tracking-tight text-primary mt-1">{statusCounts.converted}</p>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Takliflar ro'yxati</h2>
          <div className="flex items-center gap-2">
            <Button 
              variant={statusFilter === "all" ? "default" : "outline"} 
              size="sm" 
              onClick={() => setStatusFilter("all")}
            >
              Hammasi
            </Button>
            <Button 
              variant={statusFilter === "draft" ? "default" : "outline"} 
              size="sm" 
              onClick={() => setStatusFilter("draft")}
            >
              Qoralama
            </Button>
            <Button 
              variant={statusFilter === "sent" ? "default" : "outline"} 
              size="sm" 
              onClick={() => setStatusFilter("sent")}
            >
              Yuborilgan
            </Button>
            <Button 
              variant={statusFilter === "accepted" ? "default" : "outline"} 
              size="sm" 
              onClick={() => setStatusFilter("accepted")}
            >
              Qabul qilingan
            </Button>
          </div>
        </div>

        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Raqam</TableHead>
                <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Mijoz</TableHead>
                <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Sana</TableHead>
                <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Amal qilish</TableHead>
                <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 text-right">Jami summa</TableHead>
                <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Holat</TableHead>
                <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 text-right">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(filteredQuotations) ? filteredQuotations : []).map((quotation) => (
                <TableRow key={quotation.id} className="hover:bg-surface-container-low transition-colors border-none" data-testid={`row-quotation-${quotation.id}`}>
                  <TableCell className="py-3 px-6 font-medium" data-testid={`text-quotation-number-${quotation.id}`}>
                    {quotation.quotationNumber}
                  </TableCell>
                  <TableCell className="py-3 px-6" data-testid={`text-customer-name-${quotation.id}`}>
                    {quotation.customerName}
                  </TableCell>
                  <TableCell className="py-3 px-6" data-testid={`text-quotation-date-${quotation.id}`}>
                    {quotation.quotationDate}
                  </TableCell>
                  <TableCell className="py-3 px-6" data-testid={`text-valid-until-${quotation.id}`}>
                    {quotation.validUntil}
                  </TableCell>
                  <TableCell className="py-3 px-6 text-right font-bold" data-testid={`text-total-value-${quotation.id}`}>
                    {formatCurrency(quotation.totalValue, quotation.currency)}
                  </TableCell>
                  <TableCell className="py-3 px-6" data-testid={`badge-status-${quotation.id}`}>
                    {getStatusBadge(quotation.status)}
                  </TableCell>
                  <TableCell className="py-3 px-6 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleViewDetails(quotation)}
                        data-testid={`button-view-${quotation.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleEdit(quotation)}
                        disabled={quotation.status === "converted"}
                        data-testid={`button-edit-${quotation.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {(quotation.status === "accepted" || quotation.status === "sent") && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleConvertToOrder(quotation.id)}
                          title="Buyurtmaga aylantirish"
                          data-testid={`button-convert-${quotation.id}`}
                        >
                          <ArrowRightLeft className="h-4 w-4" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(quotation.id)}
                        disabled={quotation.status === "converted"}
                        data-testid={`button-delete-${quotation.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Sheet open={detailSheetOpen} onOpenChange={setDetailSheetOpen}>
        <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Taklif tafsilotlari</SheetTitle>
            <SheetDescription>
              {selectedQuotation?.quotationNumber}
            </SheetDescription>
          </SheetHeader>

          {selectedQuotation && (
            <div className="space-y-6 mt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Mijoz</p>
                  <p className="font-medium">{selectedQuotation.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Holat</p>
                  <div>{getStatusBadge(selectedQuotation.status)}</div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Taklif sanasi</p>
                  <p className="font-medium">{selectedQuotation.quotationDate}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amal qilish muddati</p>
                  <p className="font-medium">{selectedQuotation.validUntil}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valyuta</p>
                  <p className="font-medium">{selectedQuotation.currency}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">To'lov shartlari</p>
                  <p className="font-medium">{selectedQuotation.paymentTerms || "-"}</p>
                </div>
              </div>

              {selectedQuotation.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Izohlar</p>
                  <p className="font-medium">{selectedQuotation.notes}</p>
                </div>
              )}

              {selectedQuotation.items && selectedQuotation.items.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Mahsulotlar</h4>
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mahsulot</TableHead>
                          <TableHead className="text-right">Miqdor</TableHead>
                          <TableHead className="text-right">Narx</TableHead>
                          <TableHead className="text-right">Chegirma</TableHead>
                          <TableHead className="text-right">Jami</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(Array.isArray(selectedQuotation.items) ? selectedQuotation.items : []).map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.productName || item.description}</TableCell>
                            <TableCell className="text-right">{item.quantity} {item.unit}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.unitPrice, selectedQuotation.currency)}</TableCell>
                            <TableCell className="text-right">{item.discount}%</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(item.netValue, selectedQuotation.currency)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <p className="text-lg font-medium">Jami summa</p>
                  <p className="text-2xl font-bold">{formatCurrency(selectedQuotation.totalValue, selectedQuotation.currency)}</p>
                </div>
              </div>

              {(selectedQuotation.status === "accepted" || selectedQuotation.status === "sent") && (
                <Button 
                  className="w-full" 
                  onClick={() => handleConvertToOrder(selectedQuotation.id)}
                  disabled={convertToOrder.isPending}
                  data-testid="button-convert-to-order"
                >
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                  {convertToOrder.isPending ? "Aylantirilmoqda..." : "Buyurtmaga aylantirish"}
                </Button>
              )}

              {selectedQuotation.convertedToOrderId && (
                <div className="bg-muted p-4 rounded-md">
                  <p className="text-sm text-muted-foreground">Bu taklif buyurtmaga aylantirilgan</p>
                  <p className="font-medium">Buyurtma ID: {selectedQuotation.convertedToOrderId}</p>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={confirmDeleteQuotationId !== null}
        onOpenChange={(open) => { if (!open) setConfirmDeleteQuotationId(null); }}
        title="Taklifni o'chirish"
        description="Ushbu taklifnomani o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi."
        confirmText="O'chirish"
        cancelText="Bekor qilish"
        variant="destructive"
        onConfirm={() => { if (confirmDeleteQuotationId !== null) deleteQuotation.mutate(confirmDeleteQuotationId); }}
      />
      <ConfirmDialog
        open={confirmConvertOrderId !== null}
        onOpenChange={(open) => { if (!open) setConfirmConvertOrderId(null); }}
        title="Buyurtmaga aylantirish"
        description="Bu taklifni savdo buyurtmasiga aylantirishni tasdiqlaysizmi?"
        confirmText="Ha, aylantirish"
        cancelText="Bekor qilish"
        variant="default"
        onConfirm={() => { if (confirmConvertOrderId !== null) convertToOrder.mutate(confirmConvertOrderId); }}
      />
    </div>
  );
}
