import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, ShoppingCart, FileText, TruckIcon, DollarSign, Package, Loader2, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import { useUndoDelete } from "@/components/undo-toast";
import { useForm } from "react-hook-form";
import { cn } from "@/lib/utils";
import type { SalesOrder } from "@shared/schema";
import { insertSalesOrderSchema, type InsertSalesOrder } from "@shared/schema";
import { useTranslation } from "@/lib/i18n";
import { ErrorState } from "@/components/ui/error-state";

export default function SalesOrders() {
  const { toast } = useToast();
  const { showUndoToast } = useUndoDelete();
  const { t } = useTranslation('finance');
  const { t: tCommon } = useTranslation('common');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingOrder, setEditingOrder] = useState<SalesOrder | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);

  const { data: salesOrders = [], isLoading, error, isError, refetch} = useQuery<SalesOrder[]>({
    queryKey: ["/api/sap/sales-orders"],
  });

  const { data: customers = [] } = useQuery<Array<{ id: string; firstName: string; lastName: string; company: string; companyName?: string; contactPerson?: string }>>({
    queryKey: ["/api/crm/contacts"],
  });

  const { data: deals = [] } = useQuery<Array<{ id: string; title: string }>>({
    queryKey: ["/api/crm/deals"],
  });

  const salesOrderForm = useForm<InsertSalesOrder>({
    resolver: zodResolver(insertSalesOrderSchema),
    defaultValues: {
      documentType: "OR",
      salesOrg: "EURO",
      distributionChannel: "10",
      division: "00",
      customerId: "",
      soldToParty: "",
      shipToParty: "",
      billToParty: "",
      orderDate: new Date().toISOString().split('T')[0],
      requestedDeliveryDate: "",
      pricingDate: new Date().toISOString().split('T')[0],
      currency: "UZS",
      paymentTerms: "0014",
      overallStatus: "IN_PROCESS",
      deliveryStatus: "NOT_DELIVERED",
      billingStatus: "NOT_BILLED",
      netValue: 0,
      taxAmount: 0,
      totalValue: 0,
      quotationId: "",
      crmDealId: "",
      createdBy: "",
    },
  });

  const saveSalesOrder = useMutation({
    mutationFn: async (data: InsertSalesOrder) => {
      if (editingOrder) {
        await apiRequest("PATCH", `/api/sap/sales-orders/${editingOrder.id}`, data);
      } else {
        await apiRequest("POST", "/api/sap/sales-orders", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sap/sales-orders"] });
      toast({ description: editingOrder ? tCommon('updatedSuccessfully') : tCommon('createdSuccessfully') });
      setOpenDialog(false);
      salesOrderForm.reset();
      setEditingOrder(null);
    },
    onError: (error: Error) => {
      toast({ 
        variant: "destructive",
        description: error.message || tCommon('operationFailed') 
      });
    },
  });

  const deleteSalesOrder = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/sap/sales-orders/${id}`);
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sap/sales-orders"] });
      const order = (Array.isArray(salesOrders) ? salesOrders : []).find(o => o.id === id);
      showUndoToast("sales_orders", id, order?.documentNumber || id, () => {
        queryClient.invalidateQueries({ queryKey: ["/api/sap/sales-orders"] });
      });
    },
  });

  const handleEdit = (order: SalesOrder) => {
    setEditingOrder(order);
    salesOrderForm.reset({
      documentType: order.documentType as "OR" | "TA" | "CR",
      salesOrg: order.salesOrg,
      distributionChannel: order.distributionChannel,
      division: order.division,
      customerId: order.customerId || undefined,
      soldToParty: order.soldToParty || undefined,
      shipToParty: order.shipToParty || undefined,
      billToParty: order.billToParty || undefined,
      orderDate: order.orderDate,
      requestedDeliveryDate: order.requestedDeliveryDate || undefined,
      pricingDate: order.pricingDate,
      currency: order.currency as "UZS" | "USD" | "EUR",
      paymentTerms: order.paymentTerms || undefined,
      overallStatus: order.overallStatus as InsertSalesOrder['overallStatus'],
      deliveryStatus: order.deliveryStatus as InsertSalesOrder['deliveryStatus'],
      billingStatus: order.billingStatus as InsertSalesOrder['billingStatus'],
      netValue: order.netValue,
      taxAmount: order.taxAmount,
      totalValue: order.totalValue,
      quotationId: order.quotationId || undefined,
      crmDealId: order.crmDealId || undefined,
      createdBy: order.createdBy || undefined,
    });
    setOpenDialog(true);
  };

  const handleDelete = (id: string) => {
    deleteSalesOrder.mutate(id);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "IN_PROCESS":
        return <Badge className="bg-primary-container text-on-primary-container rounded-full border-none px-3 text-xs font-semibold">{tCommon('inProgress')}</Badge>;
      case "COMPLETED":
        return <Badge className="bg-green-100 text-green-800 rounded-full border-none px-3 text-xs font-semibold">{tCommon('completed')}</Badge>;
      case "CANCELLED":
        return <Badge className="bg-red-100 text-red-800 rounded-full border-none px-3 text-xs font-semibold">{tCommon('cancelled') || tCommon('deleted')}</Badge>;
      case "NOT_DELIVERED":
        return <Badge className="bg-amber-100 text-amber-800 rounded-full border-none px-3 text-xs font-semibold">{t('unpaid')}</Badge>;
      case "PARTIALLY_DELIVERED":
        return <Badge className="bg-amber-100 text-amber-800 rounded-full border-none px-3 text-xs font-semibold">{t('partiallyPaid')}</Badge>;
      case "FULLY_DELIVERED":
        return <Badge className="bg-green-100 text-green-800 rounded-full border-none px-3 text-xs font-semibold">{t('paid')}</Badge>;
      case "NOT_BILLED":
        return <Badge className="bg-amber-100 text-amber-800 rounded-full border-none px-3 text-xs font-semibold">{t('unpaid')}</Badge>;
      case "PARTIALLY_BILLED":
        return <Badge className="bg-amber-100 text-amber-800 rounded-full border-none px-3 text-xs font-semibold">{t('partiallyPaid')}</Badge>;
      case "FULLY_BILLED":
        return <Badge className="bg-green-100 text-green-800 rounded-full border-none px-3 text-xs font-semibold">{t('paid')}</Badge>;
      default:
        return <Badge className="bg-surface-container text-on-surface-variant rounded-full px-3 text-xs font-semibold border-none">{status}</Badge>;
    }
  };

  const getCustomerName = (customerId: string | null) => {
    if (!customerId) return "-";
    const customer = (Array.isArray(customers) ? customers : []).find(c => c.id === customerId);
    return customer?.companyName || customer?.contactPerson || customer?.company || "-";
  };

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
            Buyurtmalar <span className="font-bold text-primary">Ro'yxati</span>
          </h1>
          <p className="text-on-surface-variant mt-1">Sotuv va tarqatish - buyurtmalar boshqaruvi</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => {
                  setEditingOrder(null);
                  salesOrderForm.reset();
                }} 
                data-testid="button-create-sales-order"
                className="bg-gradient-to-br from-primary to-primary-dim text-white rounded-lg px-6 shadow-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                {tCommon('create')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-surface border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-on-surface">
                  {editingOrder ? tCommon('edit') : tCommon('create')}
                </DialogTitle>
                <DialogDescription className="text-on-surface-variant">
                  SAP SD - {t('sales')}
                </DialogDescription>
              </DialogHeader>

              <Form {...salesOrderForm}>
                <form onSubmit={salesOrderForm.handleSubmit((data) => saveSalesOrder.mutate(data))} className="space-y-6 pt-4">
                  <div className="grid grid-cols-2 gap-6">
                    <FormField
                      control={salesOrderForm.control}
                      name="documentType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-on-surface">{t('documentNumber')}</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger data-testid="select-document-type" className="rounded-lg border-outline-variant bg-surface-container-low">
                                <SelectValue placeholder={tCommon('select')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-surface border-outline-variant">
                              <SelectItem value="OR">OR - Standard</SelectItem>
                              <SelectItem value="RO">RO - {t('refund')}</SelectItem>
                              <SelectItem value="CS">CS - {t('cash')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={salesOrderForm.control}
                      name="customerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-on-surface">{t('customerName') || tCommon('name')}</FormLabel>
                          <Select value={field.value ?? undefined} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger data-testid="select-customer" className="rounded-lg border-outline-variant bg-surface-container-low">
                                <SelectValue placeholder={tCommon('select')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-surface border-outline-variant">
                              {(Array.isArray(customers) ? customers : []).map((customer) => (
                                <SelectItem key={customer.id} value={customer.id}>
                                  {customer.companyName || customer.contactPerson || customer.company}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={salesOrderForm.control}
                      name="crmDealId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-on-surface">CRM ({tCommon('optional')})</FormLabel>
                          <Select value={field.value ?? "none"} onValueChange={(val) => field.onChange(val === "none" ? null : val)}>
                            <FormControl>
                              <SelectTrigger data-testid="select-crm-deal" className="rounded-lg border-outline-variant bg-surface-container-low">
                                <SelectValue placeholder={tCommon('select')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-surface border-outline-variant">
                              <SelectItem value="none">{tCommon('none')}</SelectItem>
                              {(Array.isArray(deals) ? deals : []).map((deal) => (
                                <SelectItem key={deal.id} value={deal.id}>
                                  {deal.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={salesOrderForm.control}
                      name="orderDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-on-surface">{tCommon('date')}</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-order-date" className="rounded-lg border-outline-variant bg-surface-container-low" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={salesOrderForm.control}
                      name="requestedDeliveryDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-on-surface">{t('dueDate')}</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-delivery-date" className="rounded-lg border-outline-variant bg-surface-container-low" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={salesOrderForm.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-on-surface">{t('currency')}</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger data-testid="select-currency" className="rounded-lg border-outline-variant bg-surface-container-low">
                                <SelectValue placeholder={tCommon('select')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-surface border-outline-variant">
                              <SelectItem value="UZS">{t('uzs')}</SelectItem>
                              <SelectItem value="USD">{t('usd')}</SelectItem>
                              <SelectItem value="EUR">{t('eur')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={salesOrderForm.control}
                      name="netValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-on-surface">{t('amount')}</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              data-testid="input-net-value" 
                              className="rounded-lg border-outline-variant bg-surface-container-low"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={salesOrderForm.control}
                      name="taxAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-on-surface">{t('tax')}</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              data-testid="input-tax-amount" 
                              className="rounded-lg border-outline-variant bg-surface-container-low"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={salesOrderForm.control}
                      name="totalValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-on-surface">{tCommon('total')}</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              data-testid="input-total-value" 
                              className="rounded-lg border-outline-variant bg-surface-container-low"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={salesOrderForm.control}
                      name="paymentTerms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-on-surface">{t('paymentTerms') || t('payment')}</FormLabel>
                          <Select value={field.value ?? undefined} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger data-testid="select-payment-terms" className="rounded-lg border-outline-variant bg-surface-container-low">
                                <SelectValue placeholder={tCommon('select')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-surface border-outline-variant">
                              <SelectItem value="0001">0001 - {t('prepayment')}</SelectItem>
                              <SelectItem value="0014">0014 - 14 kun</SelectItem>
                              <SelectItem value="0030">0030 - 30 kun</SelectItem>
                              <SelectItem value="0060">0060 - 60 kun</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={salesOrderForm.control}
                      name="overallStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-on-surface">{tCommon('status')}</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger data-testid="select-overall-status" className="rounded-lg border-outline-variant bg-surface-container-low">
                                <SelectValue placeholder={tCommon('select')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-surface border-outline-variant">
                              <SelectItem value="IN_PROCESS">{tCommon('inProgress')}</SelectItem>
                              <SelectItem value="COMPLETED">{tCommon('completed')}</SelectItem>
                              <SelectItem value="CANCELLED">{tCommon('cancel')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={salesOrderForm.control}
                      name="deliveryStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-on-surface">{t('deliveryStatus') || tCommon('status')}</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger data-testid="select-delivery-status" className="rounded-lg border-outline-variant bg-surface-container-low">
                                <SelectValue placeholder={tCommon('select')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-surface border-outline-variant">
                              <SelectItem value="NOT_DELIVERED">{t('unpaid')}</SelectItem>
                              <SelectItem value="PARTIALLY_DELIVERED">{t('partiallyPaid')}</SelectItem>
                              <SelectItem value="FULLY_DELIVERED">{t('paid')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={salesOrderForm.control}
                      name="billingStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-on-surface">{t('invoice')}</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger data-testid="select-billing-status" className="rounded-lg border-outline-variant bg-surface-container-low">
                                <SelectValue placeholder={tCommon('select')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-surface border-outline-variant">
                              <SelectItem value="NOT_BILLED">{t('unpaid')}</SelectItem>
                              <SelectItem value="PARTIALLY_BILLED">{t('partiallyPaid')}</SelectItem>
                              <SelectItem value="FULLY_BILLED">{t('paid')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <DialogFooter className="gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setOpenDialog(false)} className="rounded-lg border-outline-variant text-on-surface">
                      {tCommon('cancel')}
                    </Button>
                    <Button type="submit" disabled={saveSalesOrder.isPending} data-testid="button-save-sales-order" className="bg-primary text-white rounded-lg px-6">
                      {saveSalesOrder.isPending ? tCommon('loading') : editingOrder ? tCommon('save') : tCommon('create')}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-surface-container-lowest rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{tCommon('total')}</p>
          <p className="text-4xl font-bold tracking-tight text-on-surface mt-1">{salesOrders.length}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{tCommon('inProgress')}</p>
          <p className="text-4xl font-bold tracking-tight text-on-surface mt-1">{(Array.isArray(salesOrders) ? salesOrders : []).filter(o => o.overallStatus === "IN_PROCESS").length}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t('paid')}</p>
          <p className="text-4xl font-bold tracking-tight text-on-surface mt-1">{(Array.isArray(salesOrders) ? salesOrders : []).filter(o => o.deliveryStatus === "FULLY_DELIVERED").length}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t('calculated')}</p>
          <p className="text-4xl font-bold tracking-tight text-on-surface mt-1">{(Array.isArray(salesOrders) ? salesOrders : []).filter(o => o.billingStatus === "FULLY_BILLED").length}</p>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl p-6">
        <div className="rounded-md border overflow-hidden">
          <Table data-testid="table-sales-orders">
            <TableHeader>
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{t('documentNumber')}</TableHead>
                <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{t('customerName') || tCommon('name')}</TableHead>
                <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{tCommon('date')}</TableHead>
                <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{t('amount')}</TableHead>
                <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{tCommon('status')}</TableHead>
                <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{t('payment')}</TableHead>
                <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{t('invoice')}</TableHead>
                <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 text-right">{tCommon('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salesOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-on-surface-variant bg-transparent">
                    {tCommon('noData')}
                  </TableCell>
                </TableRow>
              ) : (
                (Array.isArray(salesOrders) ? salesOrders : []).map((order) => (
                  <TableRow key={order.id} data-testid={`row-sales-order-${order.id}`} className="hover:bg-surface-container-low transition-colors border-none">
                    <TableCell className="py-4 px-6 font-medium border-none">{order.documentNumber || "-"}</TableCell>
                    <TableCell className="py-4 px-6 border-none">{getCustomerName(order.customerId)}</TableCell>
                    <TableCell className="py-4 px-6 border-none">{order.orderDate}</TableCell>
                    <TableCell className="py-4 px-6 border-none font-bold">
                      {formatCurrency(order.totalValue, order.currency)}
                    </TableCell>
                    <TableCell className="py-4 px-6 border-none">{getStatusBadge(order.overallStatus)}</TableCell>
                    <TableCell className="py-4 px-6 border-none">{getStatusBadge(order.deliveryStatus)}</TableCell>
                    <TableCell className="py-4 px-6 border-none">{getStatusBadge(order.billingStatus)}</TableCell>
                    <TableCell className="py-4 px-6 text-right border-none">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEdit(order)}
                          data-testid={`button-edit-${order.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <DeleteConfirmDialog
                          title={tCommon('confirmDelete')}
                          description={tCommon('deleteWarning')}
                          onConfirm={() => handleDelete(order.id)}
                        >
                          <Button 
                            variant="ghost" 
                            size="icon"
                            data-testid={`button-delete-${order.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </DeleteConfirmDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
