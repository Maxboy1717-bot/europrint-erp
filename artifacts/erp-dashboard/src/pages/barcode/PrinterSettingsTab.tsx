/**
 * @module PrinterSettingsTab
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Printer, Plus, CheckCircle, XCircle, Wifi } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { translations } from "./barcode-types";
import { EPStatusPill } from "@/components/ep";

type TranslationType = typeof translations.uz;

interface PrinterConfig {
  id: number;
  name: string;
  printerIp: string;
  printerPort: number;
  printFormat: string;
  isActive: boolean;
  notes?: string;
}

interface PrinterSettingsTabProps {
  lang: "uz" | "ru";
  t: TranslationType & ((key: string) => string);
}

export function PrinterSettingsTab({ lang, t }: PrinterSettingsTabProps) {
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: "",
    printerIp: "",
    printerPort: 9100,
    printFormat: "ZPL",
    notes: "",
  });

  const [testingId, setTestingId] = useState<number | null>(null);
  const [testResult, setTestResult] = useState<{ id: number; success: boolean; message: string } | null>(null);

  const { data: configData, refetch } = useQuery<{ configs: PrinterConfig[]; active: PrinterConfig | null }>({
    queryKey: ["/api/warehouse/printer-config"],
    queryFn: async () => {
      const res = (await apiRequest('GET', "/api/warehouse/printer-config")) as unknown as Response;
      if (!res.ok) return { configs: [], active: null };
      return res.json();
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', "/api/warehouse/printer-config", {
          name: form.name || "Printer",
          printerIp: form.printerIp,
          printerPort: form.printerPort,
          printFormat: form.printFormat,
          notes: form.notes,
        });
    },
    onSuccess: () => {
      toast({ title: lang === "uz" ? "Printer saqlandi" : "Принтер сохранён" });
      setForm({ name: "", printerIp: "", printerPort: 9100, printFormat: "ZPL", notes: "" });
      refetch();
    },
    onError: (err: Error) => {
      toast({ title: lang === "uz" ? "Xatolik" : "Ошибка", description: err.message, variant: "destructive" });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      return await apiRequest('PATCH', `/api/warehouse/printer-config/${id}`, { isActive });
    },
    onSuccess: () => { refetch(); },
  });

  const handleTest = async (config: PrinterConfig) => {
    setTestingId(config.id);
    setTestResult(null);
    try {
      const data = (await apiRequest('POST', `/api/v2/pos/printer-config/${config.id}/test`)) as Record<string, any>;
      setTestResult({ id: config.id, success: data.success, message: data.message });
    } catch {
      setTestResult({ id: config.id, success: false, message: lang === "uz" ? "Ulanib bo'lmadi" : "Не удалось подключиться" });
    } finally {
      setTestingId(null);
    }
  };

  const configs = configData?.configs ?? [];
  const active  = configData?.active;

  return (
    <div className="space-y-6">
      {active && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              {lang === "uz" ? "Aktiv Printer" : "Активный принтер"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">{t.printerIp}</p>
                <p className="font-mono font-bold">{active.printerIp}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">{t.printerPort}</p>
                <p className="font-mono">{active.printerPort}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">{t.printerFormat}</p>
                <Badge variant="outline">{active.printFormat}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {lang === "uz" ? "Yangi printer qo'shish" : "Добавить принтер"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
          <Label>{t.printerName}</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder={lang === "uz" ? "Zebra ZT230" : "Zebra ZT230"}
                data-testid="input-printer-name"
              />
            </div>
            <div className="space-y-1">
          <Label>{t.printerIp}</Label>
              <Input
                value={form.printerIp}
                onChange={(e) => setForm(f => ({ ...f, printerIp: e.target.value }))}
                placeholder="192.168.1.100"
                data-testid="input-printer-ip"
              />
            </div>
            <div className="space-y-1">
          <Label>{t.printerPort}</Label>
              <Input
                type="number"
                value={form.printerPort}
                onChange={(e) => setForm(f => ({ ...f, printerPort: parseInt(e.target.value) || 9100 }))}
                placeholder="9100"
                data-testid="input-printer-port"
              />
            </div>
            <div className="space-y-1">
          <Label>{t.printerFormat}</Label>
              <Select value={form.printFormat} onValueChange={(v) => setForm(f => ({ ...f, printFormat: v }))}>
                <SelectTrigger data-testid="select-printer-format" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ZPL">{t("zplZebraZplIi")}</SelectItem>
                  <SelectItem value="EPL">{t("eplEltronEpl2")}</SelectItem>
                  <SelectItem value="PDF">PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            className="mt-4 w-full"
            onClick={() => saveMutation.mutate()}
            disabled={!form.printerIp || saveMutation.isPending}
            data-testid="button-save-printer"
          >
            <Printer className="h-4 w-4 mr-2" />
            {t.printerSave}
          </Button>
        </CardContent>
      </Card>

      {configs.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
              {lang === "uz" ? "Saqlangan printerlar" : "Сохранённые принтеры"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(Array.isArray(configs) ? configs : []).map((cfg) => (
              <div
                key={cfg.id}
                className={`p-3 rounded-lg border text-sm flex items-center justify-between gap-3 ${
                  cfg.isActive ? "border-primary/30 bg-primary/5" : "border-border/30 bg-muted/60"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold truncate">{cfg.name}</span>
                    <Badge variant="outline" className="text-xs">{cfg.printFormat}</Badge>
                    {cfg.isActive && (
                      <EPStatusPill tone="success">
                        {lang === "uz" ? "Aktiv" : "Активен"}
                      </EPStatusPill>
                    )}
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">
                    {cfg.printerIp}:{cfg.printerPort}
                  </span>
                  {testResult?.id === cfg.id && (
                    <div className={`mt-1 text-xs flex items-center gap-1 ${testResult.success ? "text-green-400" : "text-red-400"}`}>
                      {testResult.success
                        ? <CheckCircle className="h-3 w-3" />
                        : <XCircle className="h-3 w-3" />}
                      {testResult.message}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTest(cfg)}
                    disabled={testingId === cfg.id}
                    data-testid={`button-test-printer-${cfg.id}`}
                  >
                    <Wifi className="h-3 w-3 mr-1" />
                    {t.printerTest}
                  </Button>
                  <Button
                    variant={cfg.isActive ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => toggleActiveMutation.mutate({ id: cfg.id, isActive: !cfg.isActive })}
                    data-testid={`button-toggle-printer-${cfg.id}`}
                  >
                    {cfg.isActive
                      ? (lang === "uz" ? "O'chirish" : "Выкл.")
                      : (lang === "uz" ? "Yoqish" : "Вкл.")}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {configs.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          <Printer className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>{t.printerNotConfigured}</p>
        </div>
      )}
    </div>
  );
}
