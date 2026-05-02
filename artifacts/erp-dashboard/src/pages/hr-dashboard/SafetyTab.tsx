import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, ShieldAlert, Brain, Flame, CheckCircle2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";

interface SafetySummary {
  incidentsThisMonth: number;
  ppeCompliancePercent: number;
  expiringTrainings: number;
  openIncidents: number;
}

interface SafetyIncident {
  id: string;
  userName?: string;
  incidentType: string;
  severity: string;
  incidentDate: string;
  status: string;
}

interface SafetyTabProps {
  safetySummary?: SafetySummary;
  incidents: SafetyIncident[];
}

export function SafetyTab({ safetySummary, incidents }: SafetyTabProps) {
  const kpis = [
    { label: "Bu oydagi hodisalar", value: safetySummary?.incidentsThisMonth ?? "—", Icon: AlertTriangle, accent: "text-red-500", bg: "bg-red-50" },
    { label: "PPE Compliance", value: safetySummary?.ppeCompliancePercent !== undefined ? `${safetySummary.ppeCompliancePercent}%` : "—", Icon: ShieldAlert, accent: "text-green-500", bg: "bg-green-50" },
    { label: "Muddati tugayotgan treninglar", value: safetySummary?.expiringTrainings ?? "—", Icon: Brain, accent: "text-orange-500", bg: "bg-orange-50" },
    { label: "Ochiq hodisalar", value: safetySummary?.openIncidents ?? "—", Icon: Flame, accent: "text-blue-500", bg: "bg-blue-50" },
  ];

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api"] })} className="sr-only" aria-label="Yangilash"><RefreshCw className="h-4 w-4" /></Button>
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(Array.isArray(kpis) ? kpis : []).map((item, i) => (
          <div key={`k-${i}`} className={`${item.bg} rounded-lg p-5`} data-testid={`safety-stat-${i}`}>
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{item.label}</p>
            <p className="text-3xl font-bold tracking-tight text-on-surface mt-1">{item.value}</p>
            <item.Icon className={`w-4 h-4 ${item.accent} mt-2`} />
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            So'nggi Xavfsizlik Hodisalari
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {(["Xodim", "Tur", "Og'irlik", "Sana", "Holat"]).map(h => (
                  <TableHead key={h} className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-on-surface-variant text-sm">
                    <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
                    Xavfsizlik hodisalari qayd etilmagan
                  </TableCell>
                </TableRow>
              ) : (Array.isArray(incidents) ? incidents : []).slice(0, 10).map((inc, idx) => (
                <TableRow key={inc.id || idx} className="hover:bg-surface-container-low transition-colors" data-testid={`safety-incident-row-${inc.id}`}>
                  <TableCell className="text-sm font-medium text-on-surface px-6">{inc.userName || "—"}</TableCell>
                  <TableCell className="px-6">
                    <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold bg-surface-container text-on-surface-variant">
                      {inc.incidentType === "injury" ? "Jarohat" : inc.incidentType === "near_miss" ? "Deyarli hodisa" : "Qoidabuzarlik"}
                    </span>
                  </TableCell>
                  <TableCell className="px-6">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      inc.severity === "critical" ? "bg-red-100 text-red-800" :
                      inc.severity === "major" ? "bg-amber-100 text-amber-800" :
                      "bg-green-100 text-green-800"
                    }`}>
                      {inc.severity === "critical" ? "Kritik" : inc.severity === "major" ? "Jiddiy" : "Kichik"}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-on-surface-variant px-6">{inc.incidentDate}</TableCell>
                  <TableCell className="px-6">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      inc.status === "closed" ? "bg-green-100 text-green-800" :
                      inc.status === "investigating" ? "bg-blue-100 text-blue-800" :
                      "bg-amber-100 text-amber-800"
                    }`}>
                      {inc.status === "closed" ? "Yopildi" : inc.status === "investigating" ? "Ko'rilmoqda" : "Ochiq"}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
    </>
  );
}
