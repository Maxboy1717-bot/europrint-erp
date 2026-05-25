/**
 * @module ProductCatalog
 * @description React UI component.
 */

import { useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScanBarcode, Search } from "lucide-react";
import { PosProduct } from "./types";
import { useToast } from "@/hooks/use-toast";

interface ProductCatalogProps {
  products: PosProduct[];
  searchProducts: {
    data: PosProduct[] | undefined;
  };
  productSearch: string;
  setProductSearch: (search: string) => void;
  addToCart: (product: PosProduct) => void;
  barcodeInput: string;
  setBarcodeInput: (input: string) => void;
  handleBarcodeScan: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  barcodeRef: React.RefObject<HTMLInputElement | null>;
}

export function ProductCatalog({
  products,
  searchProducts,
  productSearch,
  setProductSearch,
  addToCart,
  barcodeInput,
  setBarcodeInput,
  handleBarcodeScan,
  barcodeRef,
}: ProductCatalogProps) {
  const { t } = useTranslation('finance');
  const { toast } = useToast();
  const [showProductGrid, setShowProductGrid] = useState(false);

  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={barcodeRef}
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={handleBarcodeScan}
              placeholder={t("shtrixKodniSkanerlangYokiKiriting")}
              className="pl-9"
              autoFocus
              data-testid="input-barcode-scanner"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowProductGrid(!showProductGrid)}
            data-testid="button-toggle-product-grid"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {showProductGrid && (
          <div className="mt-3 border-t pt-3">
            <Input
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder={t("mahsulotQidirish")}
              className="mb-2"
              data-testid="input-product-search"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
              {(productSearch ? searchProducts.data || [] : products)
                .filter((p) => p.isActive)
                .slice(0, 20)
                .map((product) => (
                  <Button
                    key={product.id}
                    variant="outline"
                    className="h-auto flex flex-col items-start p-2 text-left"
                    onClick={() => {
                      addToCart(product);
                      toast({ title: `${product.name} qo'shildi` });
                    }}
                    data-testid={`button-product-quick-${product.id}`}
                  >
                    <span className="text-xs font-medium truncate w-full">{product.name}</span>
                    <span className="text-xs text-muted-foreground">{formatCurrency(product.unitPrice)}</span>
                  </Button>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
