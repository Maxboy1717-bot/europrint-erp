import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, selectArray } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Cloud, CloudOff, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface PosTerminal {
  id: number;
  code: string;
  name: string;
  warehouseName: string | null;
  isOnline: boolean;
  lastSyncAt: string | null;
  pendingTransactions: number;
  pendingMovements: number;
}

const STALE_HOURS = 6;

export default function PosSyncPage() {
  const { t } = useTranslation('warehouse');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<{ items: PosTerminal[] }>({
    queryKey: ["/api/pos/sync/status"],
    queryFn: () => apiRequest("GET", "/api/pos/sync/status"),
    refetchInterval: 30_000,
  });

  const items = selectArray<PosTerminal>(data, "items");

  const syncAllMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/pos/sync/all"),
    onSuccess: () => {
      toast({ title: t('posSync.allSynced', 'Barchasi sinxronlandi') });
      void qc.invalidateQueries({ queryKey: ["/api/pos/sync/status"] });
    },
    onError: (err: Error) => {
      toast({ title: t('posSync.failed', 'Xato'), description: err.message, variant: "destructive" });
    },
  });

  const syncOneMutation = useMutation({
    mutationFn: (terminalId: number) =>
      apiRequest("POST", `/api/pos/sync/${terminalId}`),
    onSuccess: (_d, terminalId) => {
      toast({ title: t('posSync.synced', `Terminal ${terminalId} sinxronlandi`) });
      void qc.invalidateQueries({ queryKey: ["/api/pos/sync/status"] });
    },
    onError: (err: Error) => {
      toast({ title: t('posSync.failed', 'Xato'), description: err.message, variant: "destructive" });
    },
  });

  const isStale = (lastSync: string | null): boolean => {
    if (!lastSync) return true;
    const diff = Date.now() - new Date(lastSync).getTime();
    return diff > STALE_HOURS * 60 * 60 * 1000;
  };

  const totalPending = items.reduce(
    (sum, t) => sum + t.pendingTransactions + t.pendingMovements,
    0,
  );
  const onlineCount = items.filter((t) => t.isOnline).length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title={t('posSync.title', 'POS Sinxronizatsiya')}
        description={t('posSync.description', 'Terminallar holati va offline tranzaksiyalar')}
        actions={
          <Button
            disabled={syncAllMutation.isPending}
            onClick={() => syncAllMutation.mutate()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('posSync.syncAll', 'Hammasini sinxronlash')}
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('posSync.terminals', 'Terminallar')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{items.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1">
              <Cloud className="h-4 w-4 text-emerald-600" />
              {t('posSync.online', 'Online')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-600">{onlineCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              {t('posSync.pending', 'Kutilayotgan')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">{totalPending}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('posSync.list', 'Terminallar')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t('posSync.empty', 'Terminallar topilmadi')}
            </p>
          ) : (
            <div className="space-y-2">
              {items.map((term) => {
                const stale = isStale(term.lastSyncAt);
                return (
                  <div
                    key={term.id}
                    className="flex items-center justify-between p-3 border rounded-md"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {term.isOnline ? (
                          <Cloud className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <CloudOff className="h-4 w-4 text-rose-600" />
                        )}
                        <span className="font-medium">{term.name}</span>
                        <Badge variant="outline" className="text-xs">{term.code}</Badge>
                        {stale ? (
                          <Badge variant="destructive" className="text-xs">STALE</Badge>
                        ) : null}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {term.warehouseName ?? '—'} · {t('posSync.pendingItems',
                          `${term.pendingTransactions} txn / ${term.pendingMovements} move`)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {term.lastSyncAt
                          ? `${t('posSync.lastSync', 'Oxirgi sync')}: ${new Date(term.lastSyncAt).toLocaleString()}`
                          : t('posSync.neverSynced', 'Hech qachon sinxronlanmagan')}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={syncOneMutation.isPending}
                      onClick={() => syncOneMutation.mutate(term.id)}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      {t('posSync.sync', 'Sinxronlash')}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
