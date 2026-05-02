import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, X, Clock, ChevronDown, ChevronUp, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ChecklistAlert {
  entry_id: number;
  candidate_name: string;
  candidate_phone: string;
  funnel_stage: string;
  key: string;
  label: string;
  step: number;
  overdue_hours: number;
}

interface AlertsResponse {
  data: ChecklistAlert[];
}

const STEP_LABEL: Record<number, string> = {
  4: "TEZ ISHLASH",
  5: "BAHOLASH",
  6: "KIRISH",
  7: "KUCHAYTIRISH",
};

const STEP_COLOR: Record<number, string> = {
  4: "bg-blue-100 text-blue-700",
  5: "bg-amber-100 text-amber-700",
  6: "bg-green-100 text-green-700",
  7: "bg-purple-100 text-purple-700",
};

export function HRAlertBanner({ className }: { className?: string }) {
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const { data, isLoading } = useQuery<AlertsResponse>({
    queryKey: ["/api/hr/recruitment/checklist-alerts"],
    staleTime: 120_000,
    refetchInterval: 300_000,
  });

  const alerts = data?.data ?? [];

  if (dismissed || isLoading || alerts.length === 0) {
    if (!isLoading && alerts.length === 0) {
      return (
        <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-md bg-green-50 border border-green-200 text-xs text-green-700", className)}>
          <Bell className="w-3.5 h-3.5" />
          Barcha cheklist bandlari muddatida bajarilmoqda
        </div>
      );
    }
    return null;
  }

  const critical = (Array.isArray(alerts) ? alerts : []).filter(a => a.overdue_hours > 48);
  const warning = (Array.isArray(alerts) ? alerts : []).filter(a => a.overdue_hours <= 48);

  return (
    <div className={cn("rounded-lg border overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border-b border-red-200">
        <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
        <span className="text-sm font-semibold text-red-700 flex-1">
          Cheklist ogohlantirishlari
          <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-700 text-xs font-bold">
            {alerts.length}
          </span>
          {critical.length > 0 && (
            <span className="ml-1 text-xs font-normal text-red-500">
              ({critical.length} kritik)
            </span>
          )}
        </span>
        <button
          onClick={() => setExpanded(v => !v)}
          className="text-red-400 hover:text-red-600 transition-colors"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="text-red-300 hover:text-red-500 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Alert list */}
      {expanded && (
        <div className="bg-white max-h-56 overflow-y-auto divide-y divide-slate-100">
          {/* Critical first */}
          {critical.length > 0 && (
            <div className="px-3 py-1 bg-red-50 text-xs font-semibold text-red-600">
              Kritik (48+ soat kechikkan)
            </div>
          )}
          {(Array.isArray(critical) ? critical : []).map((alert, i) => (
            <AlertRow key={`c-${i}`} alert={alert} critical />
          ))}
          {warning.length > 0 && (
            <div className="px-3 py-1 bg-amber-50 text-xs font-semibold text-amber-600">
              Ogohlantirish
            </div>
          )}
          {(Array.isArray(warning) ? warning : []).map((alert, i) => (
            <AlertRow key={`w-${i}`} alert={alert} critical={false} />
          ))}
        </div>
      )}
    </div>
  );
}

function AlertRow({ alert, critical }: { alert: ChecklistAlert; critical: boolean }) {
  return (
    <div className={cn("px-3 py-2 flex items-start gap-2", critical ? "bg-red-50/40" : "")}>
      <Clock className={cn("w-3.5 h-3.5 mt-0.5 shrink-0", critical ? "text-red-400" : "text-amber-400")} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-slate-800 truncate">{alert.candidate_name}</span>
          <Badge variant="outline" className={cn("text-[10px] py-0 px-1", STEP_COLOR[alert.step])}>
            {STEP_LABEL[alert.step]}
          </Badge>
        </div>
        <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{alert.label}</p>
        <p className={cn("text-[10px] mt-0.5 font-medium", critical ? "text-red-500" : "text-amber-500")}>
          {alert.overdue_hours}h kechikmoqda
        </p>
      </div>
      {alert.candidate_phone && (
        <a
          href={`tel:${alert.candidate_phone}`}
          className="text-[10px] text-blue-500 hover:underline whitespace-nowrap"
        >
          {alert.candidate_phone}
        </a>
      )}
    </div>
  );
}

export default HRAlertBanner;
