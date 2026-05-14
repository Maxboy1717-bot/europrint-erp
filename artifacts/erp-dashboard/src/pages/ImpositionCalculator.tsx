/**
 * @module ImpositionCalculator
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LayoutGrid, Plus, Trash2, CheckCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";

import { EPLoader } from "@/components/ep";
interface PlacedItem {
  id: string;
  copyIndex: number;
  sheetIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImpositionResult {
  placed: PlacedItem[];
  unplaced: string[];
  sheets: number;
  utilization: number;
  wastePercent: number;
  sheetArea: number;
  usedArea: number;
  svg: string[];
}

interface ProductRow {
  id: string;
  width: string;
  height: string;
  quantity: string;
}

async function calcImposition(payload: object): Promise<ImpositionResult> {
  return apiRequest("POST", "/api/print/imposition", payload);
}

export default function ImpositionCalculator() {
  const { t } = useTranslation('print');
  const { toast } = useToast();
  const [sheetWidth, setSheetWidth]   = useState("420");
  const [sheetHeight, setSheetHeight] = useState("594");
  const [activeSvg, setActiveSvg]     = useState(0);
  const [products, setProducts] = useState<ProductRow[]>([
    { id: "ProductA", width: "100", height: "80",  quantity: "5" },
    { id: "ProductB", width: "200", height: "150", quantity: "3" },
  ]);

  const mutation = useMutation<ImpositionResult, Error, void>({
    mutationFn: () => calcImposition({
      items: products.map(p => ({
        id:       p.id,
        width:    parseFloat(p.width)    || 0,
        height:   parseFloat(p.height)   || 0,
        quantity: parseInt(p.quantity)   || 1,
      })),
      sheetWidth:  parseFloat(sheetWidth)  || 420,
      sheetHeight: parseFloat(sheetHeight) || 594,
    }),
    onSuccess: () => { setActiveSvg(0); },
    onError: (err) => toast({ title: t('error'), description: err.message, variant: "destructive" }),
  });

  const addRow = () => setProducts(p => [...p, { id: `Item${p.length + 1}`, width: "100", height: "80", quantity: "1" }]);
  const removeRow = (i: number) => setProducts(p => p.filter((_, idx) => idx !== i));
  const updateRow = (i: number, field: keyof ProductRow, val: string) =>
    setProducts(p => p.map((r, idx) => idx === i ? { ...r, [field]: val } : r));

  const res = mutation.data;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <LayoutGrid className="h-7 w-7 text-[var(--ep-blue)]" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('imposition')}</h1>
          <p className="text-sm text-slate-500">{t('impositionDesc')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('sheetSettings')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>{t('sheetWidth')}</Label>
                <Input value={sheetWidth} onChange={e => setSheetWidth(e.target.value)} placeholder="420" />
              </div>
              <div>
                <Label>{t('sheetHeight')}</Label>
                <Input value={sheetHeight} onChange={e => setSheetHeight(e.target.value)} placeholder="594" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{t('products')}</CardTitle>
                <Button size="sm" variant="outline" onClick={addRow}>
                  <Plus className="h-4 w-4 mr-1" />{t('addProduct')}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {products.map((p, i) => (
                <div key={p.id || `row-${i}`} className="grid grid-cols-2 lg:grid-cols-5 gap-1 items-center text-xs">
                  <Input
                    className="col-span-2 h-7 text-xs" placeholder="ID"
                    value={p.id} onChange={e => updateRow(i, "id", e.target.value)}
                  />
                  <Input
                    className="h-7 text-xs" placeholder="W"
                    value={p.width} onChange={e => updateRow(i, "width", e.target.value)}
                  />
                  <Input
                    className="h-7 text-xs" placeholder="H"
                    value={p.height} onChange={e => updateRow(i, "height", e.target.value)}
                  />
                  <div className="flex gap-1">
                    <Input
                      className="h-7 text-xs w-10" placeholder="Qty"
                      value={p.quantity} onChange={e => updateRow(i, "quantity", e.target.value)}
                    />
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => removeRow(i)}>
                      <Trash2 className="h-3 w-3 text-[var(--ep-red)]" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Button
            className="w-full"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? <EPLoader className="mr-2" /> : <LayoutGrid className="h-4 w-4 mr-2" />}
            {mutation.isPending ? t('calculating') : t('calculate')}
          </Button>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {res && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-4 gap-3">
                <Card className="text-center p-3">
                  <p className="text-xs text-slate-500">{t('sheets')}</p>
                  <p className="text-2xl font-bold text-[var(--ep-blue)]">{res.sheets}</p>
                </Card>
                <Card className="text-center p-3">
                  <p className="text-xs text-slate-500">{t('utilization')}</p>
                  <p className="text-2xl font-bold text-[var(--ep-green)]">{res.utilization.toFixed(1)}%</p>
                </Card>
                <Card className="text-center p-3">
                  <p className="text-xs text-slate-500">{t('waste')}</p>
                  <p className="text-2xl font-bold text-[var(--ep-primary)]">{res.wastePercent.toFixed(1)}%</p>
                </Card>
                <Card className={`text-center p-3 ${res.unplaced.length > 0 ? "border-red-300" : "border-green-300"}`}>
                  <p className="text-xs text-slate-500">{t('unplaced')}</p>
                  <p className={`text-2xl font-bold ${res.unplaced.length > 0 ? "text-[var(--ep-red)]" : "text-[var(--ep-green)]"}`}>
                    {res.unplaced.length}
                  </p>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      {res.utilization >= 70
                        ? <CheckCircle className="h-4 w-4 text-[var(--ep-green)]" />
                        : <AlertTriangle className="h-4 w-4 text-[var(--ep-primary)]" />}
                      {t('utilizationLabel')}
                    </CardTitle>
                    <Badge variant={res.utilization >= 70 ? "default" : "destructive"}>
                      {res.utilization >= 70 ? t('utilizationGood') : t('utilizationNeedsWork')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Progress value={res.utilization} className="h-3" />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>{t('usedArea')}: {res.usedArea.toFixed(0)} mm²</span>
                    <span>{t('totalArea')}: {res.sheetArea * res.sheets} mm²</span>
                  </div>
                </CardContent>
              </Card>

              {res.svg && res.svg.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{t('layoutDiagram')}</CardTitle>
                      <div className="flex gap-1">
                        {res.svg.map((_, i) => (
                          <Button
                            key={`sheet-${i}`}
                            size="sm"
                            variant={activeSvg === i ? "default" : "outline"}
                            className="h-7 px-2 text-xs"
                            onClick={() => setActiveSvg(i)}
                          >
                            {t('sheet')} {i + 1}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <img
                      src={`data:image/svg+xml;base64,${btoa(res.svg[activeSvg] ?? "")}`}
                      alt={`${t('layoutDiagram')} ${activeSvg + 1}`}
                      className="w-full rounded border"
                    />
                  </CardContent>
                </Card>
              )}

              {res.unplaced.length > 0 && (
                <Card className="border-red-200 bg-red-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-[var(--ep-red)]">{t('unplaced')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {res.unplaced.map(id => (
                        <Badge key={id} variant="destructive">{id}</Badge>
                      ))}
                    </div>
                    <p className="text-xs text-[var(--ep-red)] mt-2">{t('unplacedHint')}</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {!res && !mutation.isPending && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center h-48 text-slate-400 gap-2">
                <LayoutGrid className="h-10 w-10" />
                <p className="text-sm">{t('fillForm')}</p>
              </CardContent>
            </Card>
          )}

          {mutation.isPending && (
            <Card>
              <CardContent className="flex items-center justify-center h-48 gap-3 text-slate-500">
                <EPLoader size={24} />
                <p>{t('calculating')}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
