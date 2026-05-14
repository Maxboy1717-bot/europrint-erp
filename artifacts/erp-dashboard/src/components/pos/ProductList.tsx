/**
 * @module ProductList
 * @description React UI component.
 */

import { useTranslation } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { PosProduct } from "./types";

interface ProductListProps {
  products: PosProduct[];
  isLoading: boolean;
  onAddProduct: () => void;
}

export function ProductList({
  products,
  isLoading,
  onAddProduct,
}: ProductListProps) {
  const { t } = useTranslation('finance');
  const { t: tCommon } = useTranslation('common');

  return (
    <Card>
      <CardHeader className="p-4 flex flex-row items-center justify-between">
        <CardTitle>{t('products')}</CardTitle>
        <Button size="sm" onClick={onAddProduct} data-testid="button-add-product">
          <Plus className="h-4 w-4 mr-1" /> {tCommon('add')}
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="ep-table-scroll"><Table>
          <TableHeader>
            <TableRow>
              <TableHead>Shtrix-kod</TableHead>
              <TableHead>Nomi</TableHead>
              <TableHead>Kategoriya</TableHead>
              <TableHead className="text-right">Narxi</TableHead>
              <TableHead className="text-right">Zaxira</TableHead>
              <TableHead>Birlik</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">Yuklanmoqda...</TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-[13px] text-muted-foreground">Mahsulotlar mavjud emas</TableCell>
              </TableRow>
            ) : (
              (Array.isArray(products) ? products : []).map((p) => (
                <TableRow key={p.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-mono text-xs">{p.barcode}</TableCell>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.category || "-"}</TableCell>
                  <TableCell className="text-right">{formatCurrency(p.unitPrice)}</TableCell>
                  <TableCell className="text-right">
                    <span className={p.stockQuantity !== null && p.minStock !== null && p.stockQuantity <= p.minStock ? "text-destructive font-bold" : ""}>
                      {p.stockQuantity ?? "-"}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs">{p.unit}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table></div>
      </CardContent>
    </Card>
  );
}
