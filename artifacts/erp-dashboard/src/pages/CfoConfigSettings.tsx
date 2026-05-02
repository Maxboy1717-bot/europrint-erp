import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save, RefreshCw } from "lucide-react";

interface CfoConfigRow {
  id: number;
  configKey: string;
  configValue: string;
  description: string | null;
  updatedAt: string;
}

const KEY_LABELS: Record<string, string> = {
  ar_ecl_rate_0_30:    'AR ECL — 0-30 kun',
  ar_ecl_rate_31_60:   'AR ECL — 31-60 kun',
  ar_ecl_rate_61_90:   'AR ECL — 61-90 kun',
  ar_ecl_rate_91_plus: 'AR ECL — 91+ kun',
  default_cost_ratio:  'Standart xarajat nisbati',
  min_cash_reserve_uzs:'Minimal naqd pul rezervi (UZS)',
};

export default function CfoConfigSettings() {
  const { toast } = useToast();
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  const { data: configs = [], isLoading, refetch } = useQuery<CfoConfigRow[]>({
    queryKey: ['/api/finance/cfo-config'],
    queryFn: () => apiRequest('GET', '/api/finance/cfo-config'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: number }) =>
      apiRequest('PUT', `/api/finance/cfo-config/${key}`, { value }),
    onSuccess: (_, vars) => {
      toast({ title: 'Saqlandi', description: `${KEY_LABELS[vars.key] ?? vars.key} yangilandi` });
      setEditValues(prev => { const n = { ...prev }; delete n[vars.key]; return n; });
      queryClient.invalidateQueries({ queryKey: ['/api/finance/cfo-config'] });
    },
    onError: (err: Error) => {
      toast({ title: 'Xatolik', description: err.message, variant: 'destructive' });
    },
  });

  const handleEdit = (key: string, val: string) => {
    setEditValues(prev => ({ ...prev, [key]: val }));
  };

  const handleSave = (key: string) => {
    const raw = editValues[key];
    const num = parseFloat(raw ?? '');
    if (isNaN(num)) {
      toast({ title: 'Xatolik', description: 'Raqam kiriting', variant: 'destructive' });
      return;
    }
    updateMutation.mutate({ key, value: num });
  };

  const isEcl = (key: string) => key.startsWith('ar_ecl_rate');

  const eclKeys = configs.filter(c => isEcl(c.configKey));
  const otherKeys = configs.filter(c => !isEcl(c.configKey));

  const renderRow = (cfg: CfoConfigRow) => {
    const editing = editValues[cfg.configKey] !== undefined;
    const displayVal = editing ? editValues[cfg.configKey] : cfg.configValue;
    const isPct = isEcl(cfg.configKey) || cfg.configKey === 'default_cost_ratio';

    return (
      <div key={cfg.configKey} className="flex items-center justify-between gap-3 py-3 border-b last:border-0">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{KEY_LABELS[cfg.configKey] ?? cfg.configKey}</p>
          <p className="text-xs text-muted-foreground truncate">{cfg.description}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isPct && !editing && (
            <Badge variant="outline" className="text-xs">{(parseFloat(cfg.configValue) * 100).toFixed(1)}%</Badge>
          )}
          <Input
            type="number"
            step={isPct ? '0.01' : '1000'}
            min={0}
            max={isPct ? 1 : undefined}
            className="w-32 h-8 text-xs"
            value={displayVal}
            onChange={e => handleEdit(cfg.configKey, e.target.value)}
          />
          <Button
            size="sm"
            variant={editing ? 'default' : 'outline'}
            className="h-8 px-2"
            onClick={() => handleSave(cfg.configKey)}
            disabled={!editing || updateMutation.isPending}
          >
            <Save className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold">CFO Konfiguratsiyasi</h1>
            <p className="text-sm text-muted-foreground">Moliyaviy koeffitsientlar va ECL stavkalarini boshqarish</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Yangilash
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">AR ECL Stavkalari</CardTitle>
              <CardDescription>Debitorlik qarzlari uchun kutilayotgan kredit yo'qotish stavkalari (0.0 — 1.0)</CardDescription>
            </CardHeader>
            <CardContent>
              {eclKeys.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">ECL stavkalari topilmadi</p>
              ) : (
                eclKeys.map(renderRow)
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Moliyaviy Parametrlar</CardTitle>
              <CardDescription>Umumiy moliyaviy konfiguratsiya qiymatlari</CardDescription>
            </CardHeader>
            <CardContent>
              {otherKeys.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Parametrlar topilmadi</p>
              ) : (
                otherKeys.map(renderRow)
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
