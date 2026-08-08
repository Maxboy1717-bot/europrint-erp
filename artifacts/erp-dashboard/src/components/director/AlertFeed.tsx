/**
 * AlertFeed — agent alertlari real-time (30s polling).
 * Har biri uchun "Hal qilish" tugmasi (markRead) + alert.actions amal-tugmalari
 * (dispatchAlertAction — real navigatsiya/scroll, Q-40: fabrikatsiya yo'q).
 */
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, AlertTriangle, AlertCircle, Info, Check, RefreshCw } from "lucide-react";
import { useAgentAlerts, type AgentAlert } from "@/hooks/useAgentAlerts";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

import { EPLoader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
const SEVERITY_ICON = {
  urgent:   <AlertTriangle className="h-4 w-4" />,
  critical: <AlertCircle   className="h-4 w-4" />,
  warning:  <AlertCircle   className="h-4 w-4" />,
  info:     <Info          className="h-4 w-4" />,
};

const SEVERITY_TONE = {
  urgent:   'border-l-4 border-red-500    bg-red-50/60',
  critical: 'border-l-4 border-orange-500 bg-orange-50/60',
  warning:  'border-l-4 border-amber-500  bg-amber-50/60',
  info:     'border-l-4 border-blue-500   bg-blue-50/40',
};

const SEVERITY_TEXT = {
  urgent:   'text-[var(--ep-red)]',
  critical: 'text-[var(--ep-primary)]',
  warning:  'text-[var(--ep-yellow)]',
  info:     'text-[var(--ep-blue)]',
};

/**
 * Alert-amal tugmasi dispatch — nomlangan `act.action`ni real UI-amalga bog'laydi.
 * Faqat FE-navigatsiya/scroll (backend-yozuvsiz) — chunki alert payload'da
 * material/miqdor kabi biznes-ma'lumot yo'q (Q-40: fabrikatsiya taqiq; POST
 * /api/mm/purchase-requisitions title+items talab qiladi, alert bunday
 * ma'lumotni tashimaydi — shuning uchun avtomatik yaratish o'rniga real
 * sahifaga yo'naltiradi).
 * - open_dashboard          → dashboard tepasiga scroll (AlertFeed shu sahifada, DirectorDashboard.tsx)
 * - open_advisor            → AIAdvisor panelga scroll (DirectorDashboard.tsx:155, yonma-yon joylashgan)
 * - create_purchase_request → /planning (MRP + xarid-so'rovlari real sahifasi, PlanningBoard.tsx)
 * Noma'lum/kelajakdagi action — no-op (avvalgi "faqat Hal qildim" xatti-harakati saqlanadi, regress emas).
 */
function dispatchAlertAction(action: string, setLocation: (path: string) => void): void {
  switch (action) {
    case 'open_dashboard':
      window.scrollTo({ top: 0, behavior: 'smooth' });
      break;
    case 'open_advisor':
      document.getElementById('ai-advisor-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      break;
    case 'create_purchase_request':
      setLocation('/planning');
      break;
    default:
      break;
  }
}

export function AlertFeed({ limit = 15 }: { limit?: number }) {
  const { t } = useTranslation("common");
  const { alerts, unread, isLoading, refetch, markRead } = useAgentAlerts(limit);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-[var(--ep-blue)]" />
          <h3 className="font-bold text-sm">{t("agentOgohlantirishlari")}</h3>
          {unread > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-100 text-[var(--ep-red)] text-xs font-bold">
              {unread} yangi
            </span>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={() => refetch()} className="h-7 px-2">
          {isLoading ? <EPLoader size={14} /> : <RefreshCw className="h-3.5 w-3.5" />}
        </Button>
      </div>

      {isLoading && alerts.length === 0 ? (
        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
          <EPLoader className="mr-2" /> {t("Yuklanmoqda...")}
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">
          {t("hozirchaOgohlantirishYoq")}
        </div>
      ) : (
        <div className="space-y-2 max-h-[480px] overflow-y-auto">
          {alerts.map(a => <AlertRow key={a.id} alert={a} onResolve={() => markRead(a.id)} />)}
        </div>
      )}
    </Card>
  );
}

function AlertRow({ alert, onResolve }: { alert: AgentAlert; onResolve: () => void }) {
  const { t } = useTranslation("common");
  const [, setLocation] = useLocation();
  return (
    <div className={cn('rounded-lg p-3 transition-opacity', SEVERITY_TONE[alert.severity], alert.isRead && 'opacity-60')}>
      <div className="flex items-start gap-2">
        <span className={SEVERITY_TEXT[alert.severity]}>{SEVERITY_ICON[alert.severity]}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('text-xs font-bold uppercase tracking-wider', SEVERITY_TEXT[alert.severity])}>
              {alert.severity}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {alert.agentName} · {alert.module ?? '—'} · {new Date(alert.createdAt).toLocaleTimeString('uz-UZ')}
            </span>
          </div>
          <div className="font-semibold text-sm mt-0.5">{alert.title}</div>
          <p className="text-xs text-slate-700 mt-1">{alert.message}</p>
        </div>
      </div>
      {!alert.isRead && (
        <div className="flex justify-end mt-2 gap-2">
          {alert.actionRequired && alert.actions && alert.actions.length > 0 ? (
            alert.actions.map((act) => (
              <Button key={act.action} size="sm" variant="outline" className="h-7 text-xs"
                      onClick={() => { dispatchAlertAction(act.action, setLocation); onResolve(); }}>
                {act.label}
              </Button>
            ))
          ) : null}
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onResolve}>
            <Check className="h-3 w-3 mr-1" /> {t("halQildim")}
          </Button>
        </div>
      )}
    </div>
  );
}
