import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Order, InsertOrder, Product } from "@shared/schema";
import { insertOrderSchema } from "@shared/schema";

export function ERPOrdersTab() {
  const { t } = useTranslation('production');
  const { t: tCommon } = useTranslation('common');
  const { toast } = useToast();
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/erp/orders"],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/erp/products"],
  });

  const form = useForm<InsertOrder>({
    resolver: zodResolver(insertOrderSchema),
    defaultValues: {
      orderNumber: "", productId: undefined, quantity: 0,
      customerName: "", dueDate: "", priority: "normal",
      status: "pending", notes: "",
    },
  });

  const save = useMutation({
    mutationFn: async (data: InsertOrder) => {
      if (editingOrder) {
        await apiRequest("PUT", `/api/erp/orders/${editingOrder.id}`, data);
      } else {
        await apiRequest("POST", "/api/erp/orders", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/erp/orders"] });
      toast({ description: editingOrder ? t('orderUpdated') : t('orderAdded') });
      setOpenDialog(false);
      form.reset();
      setEditingOrder(null);
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/erp/orders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/erp/orders"] });
      toast({ description: t('orderDeleted') });
    },
  });

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    form.reset({
      orderNumber: order.orderNumber,
      productId: order.productId || undefined,
      quantity: order.quantity,
      customerName: order.customerName || "",
      dueDate: order.dueDate || "",
      priority: order.priority as "low" | "normal" | "high" | "urgent",
      status: order.status as "pending" | "in_production" | "completed" | "cancelled",
      notes: order.notes || "",
    });
    setOpenDialog(true);
  };

  const handleAdd = () => {
    setEditingOrder(null);
    form.reset();
    setOpenDialog(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('orders')}</CardTitle>
              <CardDescription>{t('productionOrders')}</CardDescription>
            </div>
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogTrigger asChild>
                <Button onClick={handleAdd} data-testid="button-add-order">
                  <Plus className="h-4 w-4 mr-2" />
                  {tCommon('add')}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>{editingOrder ? t('editOrder') : t('newOrderForm')}</DialogTitle>
                  <DialogDescription>{t('enterOrderData')}</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit((data) => save.mutate(data))} className="space-y-4">
                    <FormField control={form.control} name="orderNumber" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('orderNumber')} <span className="text-destructive">*</span></FormLabel>
                        <FormControl><Input {...field} placeholder="ORD-2025-001" data-testid="input-order-number" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="productId" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('product')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger data-testid="select-order-product">
                              <SelectValue placeholder={t('selectProduct')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(Array.isArray(products) ? products : []).map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name} ({product.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="quantity" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('quantity')} <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="1000" onChange={e => field.onChange(parseInt(e.target.value))} data-testid="input-order-quantity" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="customerName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('customerName')}</FormLabel>
                        <FormControl><Input {...field} value={field.value || ""} placeholder="ABC Company" data-testid="input-order-customer" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="dueDate" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('dueDate')}</FormLabel>
                        <FormControl><Input {...field} value={field.value || ""} type="date" data-testid="input-order-due-date" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="priority" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('priorityLabel')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-order-priority">
                              <SelectValue placeholder={t('selectPriority')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">{t('lowPriority')}</SelectItem>
                            <SelectItem value="normal">{t('normalPriority')}</SelectItem>
                            <SelectItem value="high">{t('highPriority')}</SelectItem>
                            <SelectItem value="urgent">{t('urgentPriority')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="status" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tCommon('status')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-order-status">
                              <SelectValue placeholder={t('selectStatus')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pending">{t('pendingStatus')}</SelectItem>
                            <SelectItem value="in_production">{t('inProductionStatus')}</SelectItem>
                            <SelectItem value="completed">{t('completedStatus')}</SelectItem>
                            <SelectItem value="cancelled">{t('cancelledStatus')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="notes" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tCommon('note')}</FormLabel>
                        <FormControl><Textarea {...field} value={field.value || ""} placeholder={t('additionalInfo')} data-testid="input-order-notes" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <DialogFooter>
                      <Button type="submit" disabled={save.isPending} data-testid="button-save-order">
                        {save.isPending ? t('saving') : tCommon('save')}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('orderNumber')}</TableHead>
                  <TableHead>{t('product')}</TableHead>
                  <TableHead>{t('customer')}</TableHead>
                  <TableHead>{t('quantity')}</TableHead>
                  <TableHead>{t('dueDate')}</TableHead>
                  <TableHead>{t('priorityLabel')}</TableHead>
                  <TableHead>{tCommon('status')}</TableHead>
                  <TableHead className="text-right">{tCommon('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {([1, 2, 3, 4, 5]).map((i) => (
                  <TableRow key={`k-${i}`}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">{t('noOrdersFound')}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('orderNumber')}</TableHead>
                  <TableHead>{t('product')}</TableHead>
                  <TableHead>{t('customer')}</TableHead>
                  <TableHead>{t('quantity')}</TableHead>
                  <TableHead>{t('dueDate')}</TableHead>
                  <TableHead>{t('priorityLabel')}</TableHead>
                  <TableHead>{tCommon('status')}</TableHead>
                  <TableHead className="text-right">{tCommon('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(orders) ? orders : []).map((order) => {
                  const product = (Array.isArray(products) ? products : []).find(p => p.id === order.productId);
                  return (
                    <TableRow key={order.id} data-testid={`row-order-${order.id}`}>
                      <TableCell className="font-medium">{order.orderNumber}</TableCell>
                      <TableCell>{product?.name || '-'}</TableCell>
                      <TableCell>{order.customerName || '-'}</TableCell>
                      <TableCell>{order.quantity}</TableCell>
                      <TableCell>{order.dueDate || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={
                          order.priority === "urgent" ? "destructive" :
                          order.priority === "high" ? "default" : "secondary"
                        }>
                          {order.priority === "low" ? t('lowPriority') :
                           order.priority === "normal" ? t('normalPriority') :
                           order.priority === "high" ? t('highPriority') : t('urgentPriority')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          order.status === "completed" ? "default" :
                          order.status === "in_production" ? "secondary" :
                          order.status === "cancelled" ? "destructive" : "outline"
                        }>
                          {order.status === "pending" ? t('pendingStatus') :
                           order.status === "in_production" ? t('inProductionStatus') :
                           order.status === "completed" ? t('completedStatus') : t('cancelledStatus')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(order)} data-testid={`button-edit-order-${order.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(order.id)} data-testid={`button-delete-order-${order.id}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>{t('confirmDeleteOrder')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-order">{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deleteId) { remove.mutate(deleteId); setDeleteId(null); } }}
              data-testid="button-confirm-delete-order"
            >
              {tCommon('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
