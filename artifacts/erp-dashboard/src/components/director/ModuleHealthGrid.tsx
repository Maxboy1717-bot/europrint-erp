/**
 * ModuleHealthGrid — 20 modul holati 0-100 progress bar.
 */
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";

import { useTranslation } from '@/lib/i18n';
import { EPLoader } from "@/components/ep";
interface ModuleHealth {
  code:      string;
  name:      string;
  health:    number;
  errors24h: number;
}

export function ModuleHealthGrid() {
  const { t } = useTranslation('common');
  const q = useQuery<ModuleHealth[]>({
    queryKey: ['/api/agents/director/module-health'],
    queryFn: () => apiRequest<ModuleHealth[]>('GET', '/api/agents/director/module-health'),
    refetchInterval: 60_000,
  });

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="h-4 w-4 text-[var(--ep-blue)]" />
        <h3 className="font-bold text-sm">20 modul holati</h3>
        <span className="text-[11px] text-muted-foreground font-normal">{t('realTime')}</span>
      </div>

      {q.isLoading ? (
        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
          <EPLoader className="mr-2" /> Yuklanmoqda...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
          {(Array.isArray(q.data) ? q.data : []).map(m => (
            <div key={m.code} className="border rounded-lg p-2.5 hover:shadow transition-shadow">
              <div className="text-xs font-semibold truncate" title={m.name}>{m.name}</div>
              <div className="flex items-center justify-between mt-1.5">
                <span className={cn(
                  'text-lg font-bold tabular-nums',
                  m.health >= 80 ? 'text-[var(--ep-green)]' : m.health >= 50 ? 'text-[var(--ep-yellow)]' : 'text-[var(--ep-red)]',
                )}>
                  {m.health}
                </span>
                {m.errors24h > 0 && (
                  <span className="text-[10px] text-[var(--ep-red)] font-bold">
                    {m.errors24h} xato
                  </span>
                )}
              </div>
              <div className="mt-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    m.health >= 80 ? 'bg-emerald-500' : m.health >= 50 ? 'bg-amber-500' : 'bg-red-500',
                  )}
                  style={{ width: `${m.health}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
