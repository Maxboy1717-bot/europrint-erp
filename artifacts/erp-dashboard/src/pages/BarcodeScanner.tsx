/**
 * @module BarcodeScanner
 * @description React page component. Route-level UI.
 */

import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Scan, Package, CheckCircle2, AlertCircle, RotateCcw } from "lucide-react";
import { EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

interface ScanResult {
  material?: {
    id: string | number;
    name: string;
    code: string;
    unit: string;
  };
  warehouse?: string;
  currentStock?: number;
  action?: string;
  success?: boolean;
  message?: string;
}

const ACTIONS = [
  { value: "RECEIVE", label: "Qabul qilish" },
  { value: "ISSUE", label: "Chiqarish" },
  { value: "LOOKUP", label: "Qidirish" },
  { value: "TRANSFER", label: "O'tkazish" },
];

export default function BarcodeScanner() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [action, setAction] = useState("LOOKUP");
  const [warehouseId, setWarehouseId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [history, setHistory] = useState<Array<{ code: string; action: string; result: ScanResult; time: string }>>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const scanMutation = useMutation({
    mutationFn: (scanCode: string) =>
      apiRequest("POST", "/api/wms/barcode/scan", {
        code: scanCode,
        action,
        warehouseId: warehouseId || undefined,
        quantity: action !== "LOOKUP" ? Number(quantity) : undefined,
      }),
    onSuccess: (data: ScanResult) => {
      setLastResult(data);
      setHistory((prev) => [
        {
          code,
          action,
          result: data,
          time: new Date().toLocaleTimeString("uz-UZ"),
        },
        ...prev.slice(0, 9),
      ]);
      setCode("");
      inputRef.current?.focus();
      toast({
        title: data.success !== false ? "Muvaffaqiyatli" : "Topilmadi",
        description: String(data.message) ?? data.material?.name,
        variant: data.success !== false ? "default" : "destructive",
      });
    },
    onError: () => {
      toast({
        title: "Kod topilmadi",
        description: "Iltimos, kodni tekshiring",
        variant: "destructive",
      });
    },
  });

  function handleScan() {
    if (!code.trim()) return;
    scanMutation.mutate(code.trim());
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleScan();
  }

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="border-b border-border/50 px-6 py-3 flex items-center gap-3">
        <Scan className="h-5 w-5 text-primary" />
        <h1 className="font-semibold text-base">{t("barcodeSkaneri")}</h1>
        <EPStatusPill tone="neutral">WMS</EPStatusPill>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{t("skanerlashSozlamalari")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("amal")}</Label>
                  <Select value={action} onValueChange={setAction}>
                    <SelectTrigger className="h-9" data-testid="select-action">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Array.isArray(ACTIONS) ? ACTIONS : []).map((a) => (
                        <SelectItem key={a.value} value={a.value}>
                          {a.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {action !== "LOOKUP" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">{t("quantity")}</Label>
                    <Input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="h-9"
                      data-testid="input-quantity"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">{t("barcodeQrKod")}</Label>
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t("kodniKiritingYokiSkanerlang")}
                    className="h-10 text-base font-mono"
                    autoFocus
                    data-testid="input-barcode"
                  />
                  <Button
                    onClick={handleScan}
                    disabled={!code.trim() || scanMutation.isPending}
                    className="h-10 px-4"
                    data-testid="button-scan"
                  >
                    <Scan className="h-4 w-4 mr-1.5" />
                    {scanMutation.isPending ? "..." : "Skanerlash"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("barcodeSkaneriniUlangKodAvtomatik")}
                </p>
              </div>
            </CardContent>
          </Card>

          {lastResult && (
            <Card
              className={
                lastResult.success !== false
                  ? "border-green-200 bg-green-50/50"
                  : "border-red-200 bg-red-50/50"
              }
            >
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-3">
                  {lastResult.success !== false ? (
                    <CheckCircle2 className="h-4 w-4 text-[var(--ep-green)] mt-0.5 shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-[var(--ep-red)] mt-0.5 shrink-0" />
                  )}
                  <div className="space-y-1">
                    {lastResult.material ? (
                      <>
                        <div className="font-medium">
                          {lastResult.material.name}
                        </div>
                        <div className="text-sm text-muted-foreground flex gap-4">
                          <span>{t("kod")}<span className="font-mono">{lastResult.material.code}</span></span>
                          {lastResult.currentStock !== undefined && (
                            <span>
                              Qoldiq:{" "}
                              <span className="font-medium">
                                {lastResult.currentStock} {lastResult.material.unit}
                              </span>
                            </span>
                          )}
                          {lastResult.warehouse && (
                            <span>Ombor: {lastResult.warehouse}</span>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="text-sm">{lastResult.message ?? "Natija"}</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {history.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{t("songgiSkanerlashlar")}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setHistory([])}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    {t("tozalash")}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {(Array.isArray(history) ? history : []).map((item, i) => (
                    <div
                      key={`k-${i}`}
                      className="px-4 py-2.5 flex items-center gap-3 text-sm"
                    >
                      <Package className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="font-mono text-xs">{item.code}</span>
                      <Badge variant="outline" className="text-xs">
                        {(Array.isArray(ACTIONS) ? ACTIONS : []).find((a) => a.value === item.action)?.label}
                      </Badge>
                      <span className="text-muted-foreground truncate flex-1">
                        {item.result.material?.name ?? item.result.message ?? "—"}
                      </span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {item.time}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
