/**
 * @module SDQuotationDialog
 * @description Add / Edit quotation dialog with the full form and line-items table.
 */

import type { UseFormReturn } from "react-hook-form";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { QuotationFormData, QuotationLineItem } from "./SDQuotationsTypes";
import { QuotationFormFields } from "./SDQuotationFormFields";
import { useTranslation } from '@/lib/i18n';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AddEditQuotationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditing: boolean;
  form: UseFormReturn<QuotationFormData>;
  items: QuotationLineItem[];
  companies: Array<{ id: string; name: string }>;
  products: Array<{ id: string; name: string; basePrice?: number }>;
  isSavePending: boolean;
  onSave: (data: QuotationFormData) => void;
  onAddItem: () => void;
  onUpdateItem: (index: number, field: keyof QuotationLineItem, value: string | number) => void;
  onRemoveItem: (index: number) => void;
  onNewClick: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AddEditQuotationDialog({
  open,
  onOpenChange,
  isEditing,
  form,
  items,
  companies,
  products,
  isSavePending,
  onSave,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  onNewClick,
}: AddEditQuotationDialogProps) {
  const { t } = useTranslation("common");
  const currency = form.watch("currency");
  const safeItems = Array.isArray(items) ? items : [];
  const safeProducts = Array.isArray(products) ? products : [];

  const lineTotal = safeItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice * (1 - item.discount / 100),
    0,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          onClick={onNewClick}
          data-testid="button-create-quotation"
          className="bg-primary text-white rounded-lg px-5 py-2.5 text-sm font-semibold gap-2"
        >
          <Plus className="h-4 w-4" />
          {t("yangiTaklif")}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold"> {isEditing ? "Taklifni tahrirlash" : "Yangi taklif yaratish"}</DialogTitle>
          <DialogDescription>{t("mijozgaNarxTaklifiYarating")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
            {/* Header metadata fields */}
            <QuotationFormFields form={form} companies={companies} />

            {/* Line items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{t("mahsulotlar")}</h3>
                <Button type="button" variant="outline" size="sm" onClick={onAddItem} data-testid="button-add-item">
                  <Plus className="h-4 w-4 mr-1" />
                  {t("mahsulotQoshish")}
                </Button>
              </div>

              {safeItems.length > 0 && (
                <div className="border rounded-md">
                  <div className="ep-table-scroll"><Table>
                    <TableHeader className="sticky top-0 z-10 bg-card">
                      <TableRow>
                        <TableHead>{t("Mahsulot")}</TableHead>
                        <TableHead>{t("progress.description")}</TableHead>
                        <TableHead className="w-24">{t("quantity")}</TableHead>
                        <TableHead className="w-32">{t("price")}</TableHead>
                        <TableHead className="w-24">{t("chegirma2")}</TableHead>
                        <TableHead className="w-32">{t("total")}</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {safeItems.map((item, index) => (
                        <TableRow key={`k-${index}`} className="hover:bg-muted/40 transition-colors">
                          <TableCell>
                            <Select
                              value={item.productId}
                              onValueChange={(value) => onUpdateItem(index, "productId", value)}
                            >
                              <SelectTrigger className="w-full h-9" data-testid={`select-product-${index}`}>
                                <SelectValue placeholder={t("tanlang")} />
                              </SelectTrigger>
                              <SelectContent>
                                {safeProducts.map((product) => (
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
                              onChange={(e) => onUpdateItem(index, "description", e.target.value)}
                              data-testid={`input-description-${index}`}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => onUpdateItem(index, "quantity", parseFloat(e.target.value) || 0)}
                              data-testid={`input-quantity-${index}`}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => onUpdateItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                              data-testid={`input-unit-price-${index}`}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.discount}
                              onChange={(e) => onUpdateItem(index, "discount", parseFloat(e.target.value) || 0)}
                              data-testid={`input-discount-${index}`}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(
                              item.quantity * item.unitPrice * (1 - item.discount / 100),
                              currency,
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => onRemoveItem(index)}
                              data-testid={`button-remove-item-${index}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table></div>
                  <div className="p-4 border-t bg-muted/50">
                    <div className="flex justify-end">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">{t("jamiSumma")}</p>
                        <p className="text-xl font-bold" data-testid="text-total-amount">
                          {formatCurrency(lineTotal, currency)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isSavePending} data-testid="button-save-quotation">
                {isSavePending ? "Saqlanmoqda..." : isEditing ? "Saqlash" : "Yaratish"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
