import { Badge } from "@/components/ui/badge";
import { HRRequest } from "./types";

interface HRRequestsHistoryProps {
  requests: HRRequest[];
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new:       { label: "Yangi",       color: "bg-blue-500"  },
  in_review: { label: "Ko'rilmoqda", color: "bg-amber-500" },
  approved:  { label: "Tasdiqlandi", color: "bg-green-500" },
  rejected:  { label: "Rad etildi",  color: "bg-red-500"   },
};

const TYPE_LABELS: Record<string, string> = {
  new_hire: "Yangi xodim", 
  replacement: "Almashtirish",
  additional: "Qo'shimcha", 
  transfer: "Ko'chirish", 
  promotion: "Lavozim ko'tarilishi",
};

export function HRRequestsHistory({ requests }: HRRequestsHistoryProps) {
  if (requests.length === 0) return null;

  return (
    <div className="border-t pt-4">
      <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
        HR So'rovlar tarixi
      </h4>
      <div className="flex flex-col gap-2">
        {(Array.isArray(requests) ? requests : []).map(r => {
          const st = STATUS_LABELS[r.status] ?? { label: r.status, color: "bg-gray-500" };
          return (
            <div key={r.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border/40 bg-surface-container-low text-xs">
              <div className={`w-2 h-2 rounded-full shrink-0 ${st.color}`} />
              <div className="flex-1 min-w-0">
                <span className="font-medium">{TYPE_LABELS[r.request_type] ?? r.request_type}</span>
                {r.comment && <p className="text-muted-foreground truncate">{r.comment}</p>}
              </div>
              <div className="text-right shrink-0">
                <Badge variant="outline" className="text-[9px] mb-0.5">{st.label}</Badge>
                <p className="text-[9px] text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString("uz-UZ")}
                </p>
              </div>
              {r.priority === "urgent" && (
                <Badge className="bg-red-500 text-white text-[9px] shrink-0">Shoshilinch</Badge>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
