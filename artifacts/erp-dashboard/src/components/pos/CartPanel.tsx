import { useTranslation } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Minus, Plus, ScanBarcode } from "lucide-react";
import { CartItem } from "./types";

interface CartPanelProps {
  cart: CartItem[];
  setCart: (cart: CartItem[]) => void;
  updateQuantity: (productId: string, delta: number) => void;
  removeFromCart: (productId: string) => void;
}

export function CartPanel({
  cart,
  setCart,
  updateQuantity,
  removeFromCart,
}: CartPanelProps) {
  const { t } = useTranslation('finance');
  const { t: tCommon } = useTranslation('common');

  return (
    <Card className="flex-1 flex flex-col min-h-0">
      <CardHeader className="p-3 pb-2 flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-sm">
          {t('products')} ({cart.length})
        </CardTitle>
        {cart.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCart([])}
            data-testid="button-clear-cart"
          >
            <Trash2 className="h-3 w-3 mr-1" /> {tCommon('delete')}
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-auto">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
            <ScanBarcode className="h-12 w-12 mb-2 opacity-30" />
            <p className="text-sm">Shtrix-kodni skanerlang</p>
            <p className="text-xs">Scan barcode to add products</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('products')}</TableHead>
                <TableHead className="text-center w-32">{t('quantity')}</TableHead>
                <TableHead className="text-right">{t('amount')}</TableHead>
                <TableHead className="text-right">{tCommon('total')}</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(cart) ? cart : []).map((item) => (
                <TableRow key={item.productId} data-testid={`row-cart-item-${item.productId}`}>
                  <TableCell>
                    <div>
                      <span className="font-medium text-sm">{item.name}</span>
                      <span className="text-xs text-muted-foreground block">{item.barcode}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.productId, -1)}
                        data-testid={`button-qty-minus-${item.productId}`}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-medium" data-testid={`text-qty-${item.productId}`}>
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.productId, 1)}
                        data-testid={`button-qty-plus-${item.productId}`}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-xs">
                    {formatCurrency(item.unitPrice)}
                  </TableCell>
                  <TableCell className="text-right font-medium text-sm">
                    {formatCurrency(item.total)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => removeFromCart(item.productId)}
                      data-testid={`button-remove-item-${item.productId}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
