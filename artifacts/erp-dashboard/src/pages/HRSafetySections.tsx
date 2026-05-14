/**
 * HRSafetySections.tsx
 * Section/panel components for HRSafety tabs.
 */
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import type { SafetyIncident, PpeRecord, SafetyTraining, HazardZone, SafetySummary } from "./HRSafetyTypes";
import { RISK_COLORS } from "./HRSafetyTypes";
import { AlertTriangle, HardHat, BookOpen, ShieldAlert } from "lucide-react";

// ─── Summary cards ────────────────────────────────────────────────────────────
export function SafetySummaryCards({ summary }: { summary: SafetySummary | undefined }) {
  const cards = [
    { label: "Bu oydagi hodisalar", value: summary?.incidentsThisMonth ?? "—", color: "text-[var(--ep-red)]", icon: AlertTriangle },
    { label: "PPE Compliance", value: summary?.ppeCompliancePercent !== undefined ? `${summary.ppeCompliancePercent}%` : "—", color: "text-[var(--ep-green)]", icon: HardHat },
    { label: "Muddati tugayotgan treninglar", value: summary?.expiringTrainings ?? "—", color: "text-[var(--ep-primary)]", icon: BookOpen },
    { label: "Ochiq hodisalar", value: summary?.openIncidents ?? "—", color: "text-[var(--ep-blue)]", icon: ShieldAlert },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((s) => (
        <Card key={s.label}>
          <CardContent className="pt-4 pb-3 flex items-start justify-between">
            <div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </div>
            <s.icon className={`h-5 w-5 ${s.color} mt-1`} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Incidents tab ────────────────────────────────────────────────────────────
interface IncidentsSectionProps {
  incidents: SafetyIncident[];
  loading: boolean;
  onDeleteRequest: (id: number) => void;
}
export function IncidentsSection({ incidents, loading, onDeleteRequest }: IncidentsSectionProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="ep-table-scroll"><Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tur</TableHead>
              <TableHead>Jiddiylik</TableHead>
              <TableHead>Tavsif</TableHead>
              <TableHead>Joylashuv</TableHead>
              <TableHead>Sana</TableHead>
              <TableHead>Holat</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-4 text-[13px] text-muted-foreground">Yuklanmoqda...</TableCell></TableRow>
            ) : incidents.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-6 text-[13px] text-muted-foreground">Hodisalar yo'q</TableCell></TableRow>
            ) : (Array.isArray(incidents) ? incidents : []).map((inc) => (
              <TableRow key={inc.id} data-testid={`row-safety-incident-${inc.id}`} className="hover:bg-muted/40 transition-colors">
                <TableCell>{inc.incidentType || "—"}</TableCell>
                <TableCell>
                  <Badge variant={inc.severity === "critical" || inc.severity === "major" ? "destructive" : "secondary"}>
                    {inc.severity || "—"}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[150px] truncate text-sm">{inc.description || "—"}</TableCell>
                <TableCell className="text-muted-foreground">{inc.location || "—"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {inc.incidentDate ? new Date(inc.incidentDate).toLocaleDateString("uz-UZ") : "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={inc.status === "closed" ? "default" : "outline"}>{inc.status || "open"}</Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-7 w-7"
                    onClick={() => onDeleteRequest(inc.id)}
                    data-testid={`button-delete-incident-${inc.id}`}>
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table></div>
      </CardContent>
    </Card>
  );
}

// ─── PPE tab ──────────────────────────────────────────────────────────────────
interface PpeSectionProps { ppeRecords: PpeRecord[]; loading: boolean; }
export function PpeSection({ ppeRecords, loading }: PpeSectionProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="ep-table-scroll"><Table>
          <TableHeader>
            <TableRow>
              <TableHead>Xodim ID</TableHead>
              <TableHead>PPE Turi</TableHead>
              <TableHead>Holat</TableHead>
              <TableHead>Berilgan sana</TableHead>
              <TableHead>Muddati</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-4 text-[13px] text-muted-foreground">Yuklanmoqda...</TableCell></TableRow>
            ) : ppeRecords.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-6 text-[13px] text-muted-foreground">PPE yozuvlari yo'q</TableCell></TableRow>
            ) : ppeRecords.map((p) => (
              <TableRow key={p.id} data-testid={`row-ppe-${p.id}`} className="hover:bg-muted/40 transition-colors">
                <TableCell>{p.userId || "—"}</TableCell>
                <TableCell>{p.ppeType || "—"}</TableCell>
                <TableCell>
                  <Badge variant={p.status === "compliant" ? "default" : "destructive"}>
                    {p.status === "compliant" ? "Mos" : "Mos emas"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {p.issuedDate ? new Date(p.issuedDate).toLocaleDateString("uz-UZ") : "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {p.expiryDate ? new Date(p.expiryDate).toLocaleDateString("uz-UZ") : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table></div>
      </CardContent>
    </Card>
  );
}

// ─── Trainings tab ────────────────────────────────────────────────────────────
interface TrainingsSectionProps { trainings: SafetyTraining[]; loading: boolean; }
export function TrainingsSection({ trainings, loading }: TrainingsSectionProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="ep-table-scroll"><Table>
          <TableHeader>
            <TableRow>
              <TableHead>Xodim ID</TableHead>
              <TableHead>Trening nomi</TableHead>
              <TableHead>Holat</TableHead>
              <TableHead>Rejalashtirilgan</TableHead>
              <TableHead>Muddati</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-4 text-[13px] text-muted-foreground">Yuklanmoqda...</TableCell></TableRow>
            ) : trainings.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-6 text-[13px] text-muted-foreground">Treninglar yo'q</TableCell></TableRow>
            ) : trainings.map((t) => (
              <TableRow key={t.id} data-testid={`row-training-${t.id}`} className="hover:bg-muted/40 transition-colors">
                <TableCell>{t.userId || "—"}</TableCell>
                <TableCell className="font-medium">{t.trainingName || "—"}</TableCell>
                <TableCell>
                  <Badge variant={t.status === "completed" ? "default" : "outline"}>{t.status || "pending"}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {t.scheduledDate ? new Date(t.scheduledDate).toLocaleDateString("uz-UZ") : "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {t.expiryDate ? new Date(t.expiryDate).toLocaleDateString("uz-UZ") : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table></div>
      </CardContent>
    </Card>
  );
}

// ─── Hazard Zones tab ─────────────────────────────────────────────────────────
interface ZonesSectionProps { zones: HazardZone[]; loading: boolean; }
export function ZonesSection({ zones, loading }: ZonesSectionProps) {
  const activeZones = (Array.isArray(zones) ? zones : []).filter(z => z.isActive !== false);
  return (
    <Card>
      <CardContent className="p-0">
        <div className="ep-table-scroll"><Table>
          <TableHeader>
            <TableRow>
              <TableHead>Zona nomi</TableHead>
              <TableHead>Joylashuv</TableHead>
              <TableHead>Xavf turi</TableHead>
              <TableHead>Xavf darajasi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-4 text-[13px] text-muted-foreground">Yuklanmoqda...</TableCell></TableRow>
            ) : activeZones.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-6 text-[13px] text-muted-foreground">Xavfli zonalar yo'q</TableCell></TableRow>
            ) : activeZones.map((z) => (
              <TableRow key={z.id} data-testid={`row-zone-${z.id}`} className="hover:bg-muted/40 transition-colors">
                <TableCell className="font-medium">{z.zoneName || "—"}</TableCell>
                <TableCell className="text-muted-foreground">{z.location || "—"}</TableCell>
                <TableCell>{z.hazardType || "—"}</TableCell>
                <TableCell>
                  <span className={`font-medium ${RISK_COLORS[z.riskLevel || ""] || "text-muted-foreground"}`}>
                    {z.riskLevel || "—"}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table></div>
      </CardContent>
    </Card>
  );
}
