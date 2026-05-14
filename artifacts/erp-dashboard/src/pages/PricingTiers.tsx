/**
 * @module PricingTiers
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/format";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, Tag, Calculator } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { EPPageHeader, EPStatusPill } from "@/components/ep";

interface PriceTier {
  id: string;
  productName: string;
  tierName: string;
  minQty: number;
  maxQty: number | null;
  priceUzs: number;
  validFrom: string;
  validTo: string | null;
}

interface PriceCalculationResult {
  productName: string;
  quantity: number;
  date: string;
  priceUzs: number;
  tierName: string;
  totalUzs: number;
  savingsVsListPct: number | null;
}

const DEFAULT_TIER_FORM = {
  productName: "",
  tierName: "",
  minQty: "",
  maxQty: "",
  priceUzs: "",
  validFrom: new Date().toISOString().slice(0, 10),
  validTo: "",
};

export default function PricingTiers() {
  const { t } = useTranslation('finance');
  const qc = useQueryClient();
  const [productSearch, setProductSearch] = useState("");
  const [searchKey, setSearchKey] = useState("");
  const [calcForm, setCalcForm] = useState({ productName: "", quantity: "" });
  const [tierForm, setTierForm] = useState(DEFAULT_TIER_FORM);
  const [showAddForm, setShowAddForm] = useState(false);
  const [calcResult, setCalcResult] = useState<PriceCalculationResult | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [calcError, setCalcError] = useState("");

  const { data: tiers, isLoading: tiersLoading } = useQuery<PriceTier[]>({
    queryKey: ["price-tiers", searchKey],
    queryFn: () => apiRequest("GET", `/api/pricing/tiers/${encodeURIComponent(searchKey)}`),
    enabled: searchKey.length > 0,
    retry: false,
  });

  const handleCalc = async () => {
    if (!calcForm.productName || !calcForm.quantity) return;
    setCalcLoading(true);
    setCalcError("");
    setCalcResult(null);
    try {
      const result = await apiRequest("POST", "/api/pricing/calculate", {
        productName: calcForm.productName,
        quantity:    Number(calcForm.quantity),
      }) as PriceCalculationResult;
      setCalcResult(result);
    } catch (err) {
      setCalcError(String((err as Error)?.message ?? ""));
    } finally {
      setCalcLoading(false);
    }
  };

  const addTierMut = useMutation({
    mutationFn: (body: typeof DEFAULT_TIER_FORM) =>
      apiRequest("POST", "/api/pricing/tiers", {
        productName: body.productName,
        tierName:    body.tierName,
        minQty:      Number(body.minQty),
        maxQty:      body.maxQty ? Number(body.maxQty) : undefined,
        priceUzs:    Number(body.priceUzs),
        validFrom:   body.validFrom,
        validTo:     body.validTo || undefined,
      }),
    onSuccess: () => {
      toast({ title: t('saveBtn') });
      setTierForm(DEFAULT_TIER_FORM);
      setShowAddForm(false);
      qc.invalidateQueries({ queryKey: ["price-tiers"] });
    },
    onError: (err: Error) => {
      toast({ title: "Xato", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="flex flex-col gap-6 p-6">
      <EPPageHeader
        breadcrumb={<>Dashboard · <b className="text-foreground">{t('pricingTiers')}</b></>}
        title={t('pricingTiers')}
        subtitle={t('pricingSubtitle')}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="h-4 w-4" /> {t('viewTiersTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder={t('enterProductName')}
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                onKeyDown={e => e.key === "Enter" && setSearchKey(productSearch.trim())}
              />
              <Button variant="outline" onClick={() => setSearchKey(productSearch.trim())} disabled={!productSearch.trim()}>
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {tiersLoading && <Skeleton className="h-32 w-full rounded-lg" />}

            {tiers && tiers.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">{t('noTiersFound')}</p>
            )}

            {tiers && tiers.length > 0 && (
              <div className="space-y-2">
                {tiers.map(tier => (
                  <div key={tier.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium">{tier.tierName}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {tier.minQty.toLocaleString()} – {tier.maxQty ? tier.maxQty.toLocaleString() : "∞"} dona
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-sm">{formatCurrency(tier.priceUzs)}</div>
                      <div className="text-xs text-muted-foreground">/birlik</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calculator className="h-4 w-4" /> {t('priceCalculationTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>{t('productNameLabel')}</Label>
                <Input
                  placeholder="Offset A4"
                  value={calcForm.productName}
                  onChange={e => setCalcForm(f => ({ ...f, productName: e.target.value }))}
                />
              </div>
              <div>
                <Label>{t('quantityLabel')}</Label>
                <Input
                  type="number"
                  placeholder="1000"
                  value={calcForm.quantity}
                  onChange={e => setCalcForm(f => ({ ...f, quantity: e.target.value }))}
                />
              </div>
            </div>
            <Button
              onClick={handleCalc}
              disabled={!calcForm.productName || !calcForm.quantity || calcLoading}
              className="w-full gap-2"
            >
              <Calculator className="h-4 w-4" />
              {calcLoading ? t('calculatingBtn') : t('priceCalculationTitle')}
            </Button>

            {calcError && <p className="text-sm text-destructive">{calcError}</p>}

            {calcResult && (
              <div className="mt-4 border rounded-lg p-4 bg-muted/20 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t('appliedTierLabel')}</span>
                  <EPStatusPill tone="neutral">{calcResult.tierName}</EPStatusPill>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t('unitPriceLabel')}</span>
                  <span className="font-semibold">{formatCurrency(calcResult.priceUzs)}</span>
                </div>
                {calcResult.savingsVsListPct !== null && calcResult.savingsVsListPct > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{t('savingsLabel')}</span>
                    <span className="text-[var(--ep-green)] font-medium">{calcResult.savingsVsListPct.toFixed(1)}%</span>
                  </div>
                )}
                <div className="flex justify-between items-center border-t pt-3">
                  <span className="font-medium">{t('totalLabel')} ({calcResult.quantity.toLocaleString()} dona)</span>
                  <span className="text-xl font-bold text-[var(--ep-green)]">{formatCurrency(calcResult.totalUzs)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{t('addNewTierTitle')}</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setShowAddForm(!showAddForm)}>
              <Plus className="h-4 w-4 mr-1" />
              {showAddForm ? t('closeBtn') : t('addNewTierTitle')}
            </Button>
          </div>
        </CardHeader>
        {showAddForm && (
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <Label>{t('productNameLabel')} *</Label>
                <Input value={tierForm.productName} onChange={e => setTierForm(f => ({ ...f, productName: e.target.value }))} placeholder="Offset A4" />
              </div>
              <div>
                <Label>{t('tierNameLabel')} *</Label>
                <Input value={tierForm.tierName} onChange={e => setTierForm(f => ({ ...f, tierName: e.target.value }))} placeholder="Ulgurji" />
              </div>
              <div>
                <Label>{t('priceUzsLabel')} *</Label>
                <Input type="number" value={tierForm.priceUzs} onChange={e => setTierForm(f => ({ ...f, priceUzs: e.target.value }))} placeholder="50000" />
              </div>
              <div>
                <Label>{t('minQtyLabel')} *</Label>
                <Input type="number" value={tierForm.minQty} onChange={e => setTierForm(f => ({ ...f, minQty: e.target.value }))} placeholder="1000" />
              </div>
              <div>
                <Label>{t('maxQtyLabel')}</Label>
                <Input type="number" value={tierForm.maxQty} onChange={e => setTierForm(f => ({ ...f, maxQty: e.target.value }))} placeholder="ixtiyorsiz" />
              </div>
              <div>
                <Label>{t('validFromLabel')} *</Label>
                <Input type="date" value={tierForm.validFrom} onChange={e => setTierForm(f => ({ ...f, validFrom: e.target.value }))} />
              </div>
              <div>
                <Label>{t('validToLabel')}</Label>
                <Input type="date" value={tierForm.validTo} onChange={e => setTierForm(f => ({ ...f, validTo: e.target.value }))} />
              </div>
            </div>
            <Button
              onClick={() => addTierMut.mutate(tierForm)}
              disabled={addTierMut.isPending || !tierForm.productName || !tierForm.tierName || !tierForm.priceUzs || !tierForm.minQty}
            >
              {addTierMut.isPending ? t('savingBtn') : t('saveBtn')}
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
