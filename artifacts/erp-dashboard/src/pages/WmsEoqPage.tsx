/**
 * @module WmsEoqPage
 * @description EOQ (Economic Order Quantity) calculator. Route: /wms/eoq
 * Calls POST /api/wms/eoq/calculate — pure math, no DB write.
 */

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { TrendingDown, Plus, Trash2, Calculator } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";

// ── Types ──────────────────────────────────────────────────────────────────────

interface PriceTier {
  minQty: string;
  maxQty: string;
  unitPrice: string;
}

interface EoqResult {
  eoq: number;
  eoqRounded: number;
  totalCost: number;
  orderFrequency: number;
  cycleTimeDays: number;
  selectedTierPrice: number;
  selectedTierMinQty: number;
}

function defaultTier(): PriceTier {
  return { minQty: "0", maxQty: "", unitPrice: "" };
}

// ── Result card ────────────────────────────────────────────────────────────────

function ResultCard({ result }: { result: EoqResult }) {
  const items = [
    { label: "Tavsiya etilgan buyurtma miqdori (EOQ)", value: `${result.eoqRounded.toLocaleString()} dona`, highlight: true },
    { label: "Yillik umumiy narx", value: `${result.totalCost.toLocaleString("uz-UZ", { style: "currency", currency: "UZS", maximumFractionDigits: 0 })}`, highlight: false },
    { label: "Buyurtmalar soni (yiliga)", value: `${result.orderFrequency.toFixed(1)} marta`, highlight: false },
    { label: "Buyurtmalar oralig'i", value: `${result.cycleTimeDays.toFixed(0)} kun`, highlight: false },
    { label: "Tanlangan narx (1 dona)", value: `${Number(result.selectedTierPrice).toLocaleString()} UZS`, highlight: false },
  ];

  return (
    <Card className="border-[var(--ep-green)]/40 bg-[var(--ep-green)]/5 max-w-lg">
      <CardContent className="pt-4 pb-4 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <TrendingDown className="h-4 w-4 text-[var(--ep-green)]" />
          <span className="font-semibold text-sm text-[var(--ep-green)]">Hisoblash natijasi</span>
        </div>
        {items.map(it => (
          <div key={it.label} className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">{it.label}</span>
            {it.highlight ? (
              <Badge variant="outline" className="text-sm px-3 font-bold bg-[var(--ep-green)]/10 text-[var(--ep-green)] border-[var(--ep-green)]/40">
                {it.value}
              </Badge>
            ) : (
              <span className="text-sm font-medium tabular-nums">{it.value}</span>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function WmsEoqPage() {
  const { t } = useTranslation("common");
  const { toast } = useToast();

  const [annualDemand, setAnnualDemand] = useState("1000");
  const [orderingCost, setOrderingCost] = useState("150000");
  const [holdingPct, setHoldingPct] = useState("20");
  const [packSize, setPackSize] = useState("");
  const [tiers, setTiers] = useState<PriceTier[]>([
    { minQty: "0", maxQty: "", unitPrice: "5000" },
  ]);
  const [result, setResult] = useState<EoqResult | null>(null);

  const calcMutation = useMutation({
    mutationFn: (payload: object) =>
      apiRequest("POST", "/api/wms/eoq/calculate", payload),
    onSuccess: (data: unknown) => {
      setResult(data as EoqResult);
    },
    onError: () => toast({ title: t("xatolikYuzBerdi", "Hisoblashda xatolik"), variant: "destructive" }),
  });

  function addTier() {
    setTiers(prev => [...prev, defaultTier()]);
  }

  function removeTier(idx: number) {
    setTiers(prev => prev.filter((_, i) => i !== idx));
  }

  function updateTier(idx: number, patch: Partial<PriceTier>) {
    setTiers(prev => prev.map((t, i) => i === idx ? { ...t, ...patch } : t));
  }

  function handleCompute() {
    const D = parseFloat(annualDemand);
    const S = parseFloat(orderingCost);
    const H = parseFloat(holdingPct) / 100;
    if (isNaN(D) || D <= 0) {
      toast({ title: "Yillik talab musbat son bo'lishi kerak", variant: "destructive" }); return;
    }
    const parsedTiers = tiers.map(t => ({
      minQty: parseFloat(t.minQty) || 0,
      ...(t.maxQty ? { maxQty: parseFloat(t.maxQty) } : {}),
      unitPrice: parseFloat(t.unitPrice),
    }));
    if (parsedTiers.some(t => isNaN(t.unitPrice) || t.unitPrice <= 0)) {
      toast({ title: "Har bir narx darajasi uchun musbat narx kiriting", variant: "destructive" }); return;
    }
    setResult(null);
    calcMutation.mutate({
      annualDemand: D,
      ...(orderingCost && !isNaN(S) && S > 0 ? { orderingCostUzs: S } : {}),
      ...(holdingPct && !isNaN(H) && H > 0 ? { holdingCostPercent: H } : {}),
      ...(packSize && !isNaN(parseFloat(packSize)) && parseFloat(packSize) > 0 ? { packSize: parseFloat(packSize) } : {}),
      priceTiers: parsedTiers,
    });
  }

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-6">
      {/* Header */}
      <div className="flex items-start gap-3 border-b border-border/50 pb-4">
        <div className="p-2 bg-primary/10 rounded-md mt-0.5">
          <TrendingDown className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-semibold text-base">EOQ — Iqtisodiy Buyurtma Miqdori Kalkulyatori</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Wilson formulasi asosida buyurtma xarajatini minimallashtiradigan optimal miqdorni hisoblaydi.
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 max-w-2xl">
        {/* Inputs */}
        <div className="flex-1 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">{t("yillikTablab", "Yillik talab (dona)")} *</Label>
              <Input
                type="number"
                min="1"
                value={annualDemand}
                onChange={e => setAnnualDemand(e.target.value)}
                className="h-8 text-sm mt-1"
                data-testid="input-annual-demand"
              />
            </div>
            <div>
              <Label className="text-xs">{t("packSize", "Qadoq o'lchami")}</Label>
              <Input
                type="number"
                min="1"
                placeholder="1"
                value={packSize}
                onChange={e => setPackSize(e.target.value)}
                className="h-8 text-sm mt-1"
                data-testid="input-pack-size"
              />
            </div>
            <div>
              <Label className="text-xs">Buyurtma xarajati (UZS)</Label>
              <Input
                type="number"
                min="0"
                value={orderingCost}
                onChange={e => setOrderingCost(e.target.value)}
                className="h-8 text-sm mt-1"
                data-testid="input-ordering-cost"
              />
            </div>
            <div>
              <Label className="text-xs">Saqlash xarajati (%/yil)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={holdingPct}
                onChange={e => setHoldingPct(e.target.value)}
                className="h-8 text-sm mt-1"
                data-testid="input-holding-pct"
              />
            </div>
          </div>

          <Separator />

          {/* Price tiers */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs font-semibold">Narx darajalari *</Label>
              <Button size="sm" variant="outline" onClick={addTier} className="h-7 text-xs" data-testid="button-add-tier">
                <Plus className="h-3 w-3 mr-1" />
                Daraja qo'sh
              </Button>
            </div>
            <div className="space-y-2">
              {tiers.map((tier, idx) => (
                <div key={idx} className="flex items-center gap-2" data-testid={`tier-row-${idx}`}>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Min"
                    value={tier.minQty}
                    onChange={e => updateTier(idx, { minQty: e.target.value })}
                    className="h-7 w-20 text-xs"
                    data-testid={`input-tier-min-${idx}`}
                  />
                  <span className="text-xs text-muted-foreground">→</span>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Max"
                    value={tier.maxQty}
                    onChange={e => updateTier(idx, { maxQty: e.target.value })}
                    className="h-7 w-20 text-xs"
                    data-testid={`input-tier-max-${idx}`}
                  />
                  <Input
                    type="number"
                    min="0"
                    placeholder="Narx UZS"
                    value={tier.unitPrice}
                    onChange={e => updateTier(idx, { unitPrice: e.target.value })}
                    className="h-7 flex-1 text-xs"
                    data-testid={`input-tier-price-${idx}`}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => removeTier(idx)}
                    disabled={tiers.length <= 1}
                    data-testid={`button-remove-tier-${idx}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={handleCompute}
            disabled={calcMutation.isPending || !annualDemand}
            className="w-full"
            data-testid="button-compute-eoq"
          >
            <Calculator className="h-4 w-4 mr-2" />
            {calcMutation.isPending ? "Hisoblanmoqda…" : "EOQ Hisoblash"}
          </Button>
        </div>
      </div>

      {result && <ResultCard result={result} />}

      <div className="max-w-lg mt-2">
        <p className="text-xs text-muted-foreground">
          <strong>Wilson formulasi:</strong> EOQ = √(2 × D × S / (H × P)) — D=yillik talab, S=buyurtma xarajati, H=saqlash %, P=birlik narxi.
          Bir nechta narx darajasi bo'lsa, har bir daraja uchun hisoblash amalga oshiriladi va minimal umumiy xarajatli daraja tanlanadi.
          Natija 50M+ UZS bo'lsa xaridor qo'l bilan tasdiqlashi tavsiya etiladi (HITL).
        </p>
      </div>
    </div>
  );
}
