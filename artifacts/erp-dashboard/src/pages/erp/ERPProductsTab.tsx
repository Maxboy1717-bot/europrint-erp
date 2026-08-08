/**
 * @module ERPProductsTab
 * @description React page component. Route-level UI.
 */

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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Product, InsertProduct } from "@shared/schema";
import { insertProductSchema } from "@shared/schema";

export function ERPProductsTab() {
  const { t } = useTranslation('production');
  const { t: tCommon } = useTranslation('common');
  const { toast } = useToast();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/erp/products"],
  });

  const form = useForm<InsertProduct>({
    resolver: zodResolver(insertProductSchema),
    defaultValues: {
      code: "", name: "", nameRu: "", category: "",
      unit: "dona", standardCost: undefined, isActive: true,
    },
  });

  const save = useMutation({
    mutationFn: async (data: InsertProduct) => {
      if (editingProduct) {
        await apiRequest("PUT", `/api/erp/products/${editingProduct.id}`, data);
      } else {
        await apiRequest("POST", "/api/erp/products", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/erp/products"] });
      toast({ description: editingProduct ? t('productUpdated') : t('productAdded') });
      setOpenDialog(false);
      form.reset();
      setEditingProduct(null);
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/erp/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/erp/products"] });
      toast({ description: t('productDeleted') });
    },
  });

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    form.reset({
      code: product.code, name: product.name,
      nameRu: product.nameRu || "", category: product.category || "",
      unit: product.unit, standardCost: product.standardCost || undefined,
      isActive: product.isActive,
    });
    setOpenDialog(true);
  };

  const handleAdd = () => {
    setEditingProduct(null);
    form.reset();
    setOpenDialog(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('rawMaterials')}</CardTitle>
              <CardDescription>{t('productsDesc')}</CardDescription>
            </div>
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogTrigger asChild>
                <Button onClick={handleAdd} data-testid="button-add-product">
                  <Plus className="h-4 w-4 mr-2" />
                  {tCommon('add')}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] p-6">
                <DialogHeader>
                  <DialogTitle className="text-[18px] font-semibold">{editingProduct ? t('editProduct') : t('newProduct')}</DialogTitle>
                  <DialogDescription>{t('enterProductData')}</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit((data) => save.mutate(data))} className="space-y-4">
                    <FormField control={form.control} name="code" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tCommon('code')} <span className="text-destructive">*</span></FormLabel>
                        <FormControl><Input {...field} placeholder="PROD001" data-testid="input-product-code" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('nameUz')} <span className="text-destructive">*</span></FormLabel>
                        <FormControl><Input {...field} placeholder={t("kartonQuti")} data-testid="input-product-name" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="nameRu" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('nameRu')}</FormLabel>
                        <FormControl><Input {...field} value={field.value || ""} placeholder={t("untitled")} data-testid="input-product-name-ru" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="category" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tCommon('category')}</FormLabel>
                        <FormControl><Input {...field} value={field.value || ""} placeholder={t("kartonMahsulotlari")} data-testid="input-product-category" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="unit" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('measureUnit')} <span className="text-destructive">*</span></FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-product-unit" className="h-9">
                              <SelectValue placeholder={t('selectUnit')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="dona">dona</SelectItem>
                            <SelectItem value="kg">kg</SelectItem>
                            <SelectItem value="m">metr</SelectItem>
                            <SelectItem value="m2">m²</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="standardCost" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('standardCost')}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            placeholder="5000"
                            value={field.value || ""}
                            onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            data-testid="input-product-cost"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <DialogFooter>
                      <Button type="submit" disabled={save.isPending} data-testid="button-save-product">
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
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tCommon('code')}</TableHead>
                  <TableHead>{tCommon('name')}</TableHead>
                  <TableHead>{tCommon('category')}</TableHead>
                  <TableHead>{t('measure')}</TableHead>
                  <TableHead>{tCommon('price')}</TableHead>
                  <TableHead>{tCommon('status')}</TableHead>
                  <TableHead className="text-right">{tCommon('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {([1, 2, 3, 4, 5]).map((i) => (
                  <TableRow key={`k-${i}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell><Skeleton className="h-4 w-20 rounded-lg" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32 rounded-lg" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24 rounded-lg" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12 rounded-lg" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16 rounded-lg" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto rounded-lg" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 text-[13px] text-muted-foreground">{t('noProductsFound')}</div>
          ) : (
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tCommon('code')}</TableHead>
                  <TableHead>{tCommon('name')}</TableHead>
                  <TableHead>{tCommon('category')}</TableHead>
                  <TableHead>{t('measure')}</TableHead>
                  <TableHead>{tCommon('price')}</TableHead>
                  <TableHead>{tCommon('status')}</TableHead>
                  <TableHead className="text-right">{tCommon('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(products) ? products : []).map((product) => (
                  <TableRow key={product.id} data-testid={`row-product-${product.id}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium">{product.code}</TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.category || '-'}</TableCell>
                    <TableCell>{product.unit}</TableCell>
                    <TableCell>{product.standardCost ? `${product.standardCost.toLocaleString()} so'm` : '-'}</TableCell>
                    <TableCell>
                      <Badge variant={product.isActive ? "default" : "secondary"}>
                        {product.isActive ? tCommon('active') : tCommon('inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(product)} data-testid={`button-edit-product-${product.id}`}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(product.id)} data-testid={`button-delete-product-${product.id}`}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>{t('confirmDeleteProduct')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-product">{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deleteId) { remove.mutate(deleteId); setDeleteId(null); } }}
              data-testid="button-confirm-delete-product"
            >
              {tCommon('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
