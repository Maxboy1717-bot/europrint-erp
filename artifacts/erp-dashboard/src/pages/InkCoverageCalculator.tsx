import { useState, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Printer, Droplets, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";

import { EPLoader } from "@/components/ep";
interface InkResult {
  tac: number;
  tacMax: number;
  tacWithinLimit: boolean;
  inkGrams: { c: number; m: number; y: number; k: number };
  totalInkGrams: number;
}

async function calcInkCoverage(payload: object): Promise<InkResult> {
  return apiRequest("POST", "/api/print/ink-coverage", payload);
}

export default function InkCoverageCalculator() {
  const { t } = useTranslation('print');

  const PAPER_TYPES = useMemo(() => [
    { value: "newspaper", label: `${t('paperNewspaper')} (TAC: 240%)` },
    { value: "book",      label: `${t('paperBook')} (TAC: 280%)` },
    { value: "premium",   label: `${t('paperPremium')} (TAC: 320%)` },
  ], [t]);

  const CMYK_COLORS = useMemo(() => ({
    c: { label: t('channelCyan'),    color: "#00b4d8" },
    m: { label: t('channelMagenta'), color: "#e040fb" },
    y: { label: t('channelYellow'),  color: "#ffd600" },
    k: { label: t('channelBlack'),   color: "#212121" },
  }), [t]);
  const { toast } = useToast();
  const [cmyk, setCmyk] = useState({ c: 0.35, m: 0.25, y: 0.20, k: 0.15 });
  const [sheets, setSheets] = useState(10000);
  const [sheetAreaM2, setSheetAreaM2] = useState(0.72);
  const [paperType, setPaperType] = useState("book");
  const [result, setResult] = useState<InkResult | null>(null);

  const mutation = useMutation({
    mutationFn: () => calcInkCoverage({ ...cmyk, sheets, sheetAreaM2, paperType }),
    onSuccess: (data) => setResult(data),
    onError: (e: Error) => toast({ title: t('calculate'), description: e.message, variant: "destructive" }),
  });

  const tac = Object.values(cmyk).reduce((s, v) => s + v, 0) * 100;
  const tacMaxByType: Record<string, number> = { newspaper: 240, book: 280, premium: 320 };
  const tacMax = tacMaxByType[paperType] ?? 280;
  const tacPct = Math.min((tac / tacMax) * 100, 100);

  const setCh = (ch: keyof typeof cmyk, v: string) => {
    const n = Math.max(0, Math.min(1, parseFloat(v) || 0));
    setCmyk(prev => ({ ...prev, [ch]: n }));
  };

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="flex items-center gap-3">
        <Printer className="w-7 h-7 text-[var(--ep-blue)]" />
        <div>
          <h1 className="text-2xl font-bold">{t('inkCoverage')}</h1>
          <p className="text-muted-foreground text-sm">{t('inkCoverageDesc')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">{t('cmykInput')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {(Object.entries(CMYK_COLORS) as [keyof typeof cmyk, typeof CMYK_COLORS.c][]).map(([ch, meta]) => (
              <div key={ch} className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label style={{ color: meta.color }} className="font-semibold">{meta.label}</Label>
                  <span className="text-sm font-mono">{(cmyk[ch] * 100).toFixed(0)}%</span>
                </div>
                <div className="flex gap-3 items-center">
                  <input
                    type="range" min={0} max={1} step={0.01}
                    value={cmyk[ch]}
                    onChange={e => setCh(ch, e.target.value)}
                    className="flex-1"
                    style={{ accentColor: meta.color }}
                  />
                  <Input
                    type="number" min={0} max={1} step={0.01}
                    value={cmyk[ch]}
                    onChange={e => setCh(ch, e.target.value)}
                    className="w-20 text-right text-sm"
                  />
                </div>
              </div>
            ))}

            <div className="border-t pt-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-sm">{t('tacTotal')}</span>
                <Badge variant={tac > tacMax ? "destructive" : tac > tacMax * 0.9 ? "secondary" : "default"}>
                  {tac.toFixed(1)}% / {tacMax}%
                </Badge>
              </div>
              <Progress value={tacPct} className="h-3" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{t('sheets')}</Label>
                <Input type="number" min={1} value={sheets} onChange={e => setSheets(Number(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label>{t('sheetAreaLabel')}</Label>
                <Input type="number" min={0.01} step={0.01} value={sheetAreaM2} onChange={e => setSheetAreaM2(Number(e.target.value))} />
              </div>
            </div>

            <div className="space-y-1">
              <Label>{t('paperType')}</Label>
              <Select value={paperType} onValueChange={setPaperType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAPER_TYPES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || tac > tacMax} className="w-full">
              {mutation.isPending ? <EPLoader className="w-4 h-4 mr-2" /> : <Droplets className="w-4 h-4 mr-2" />}
              {mutation.isPending ? t('calculating') : t('calculate')}
            </Button>
            {tac > tacMax && (
              <p className="text-destructive text-xs flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {t('tacExceedMessage')}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {result ? (result.tacWithinLimit ? <CheckCircle className="w-4 h-4 text-[var(--ep-green)]" /> : <AlertTriangle className="w-4 h-4 text-[var(--ep-red)]" />) : null}
              {t('result')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!result ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                {t('fillForm')}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">TAC</p>
                    <p className="text-2xl font-bold">{result.tac}%</p>
                    <p className="text-xs text-muted-foreground">maks: {result.tacMax}%</p>
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">{t('totalInk')}</p>
                    <p className="text-2xl font-bold">{result.totalInkGrams.toFixed(0)} g</p>
                    <p className="text-xs text-muted-foreground">{(result.totalInkGrams / 1000).toFixed(2)} kg</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold">{t('inkByChannel')}</p>
                  {(Object.entries(CMYK_COLORS) as [keyof typeof CMYK_COLORS, typeof CMYK_COLORS.c][]).map(([ch, meta]) => (
                    <div key={ch} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: meta.color }} />
                        <span className="text-sm">{meta.label}</span>
                      </div>
                      <span className="font-mono text-sm">{result.inkGrams[ch].toFixed(1)} g</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground border-t pt-3">
                  <span>{t('sheetsLabel')}: {sheets.toLocaleString()}</span>
                  <span>{t('areaLabel')}: {sheetAreaM2} m²</span>
                  <span>{t('paperTypeLabel')}: {paperType}</span>
                  <span>{t('statusLabel')}: <span className={result.tacWithinLimit ? "text-[var(--ep-green)]" : "text-[var(--ep-red)]"}>{result.tacWithinLimit ? `✓ ${t('withinNorm')}` : `✗ ${t('exceedsNorm')}`}</span></span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
