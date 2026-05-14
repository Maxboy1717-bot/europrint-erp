/**
 * @module SecurityDashboardManagement
 * @description Incidents, PPE inspection, access-zone, and fire/gas sensor
 * tab-content sections for the Security Dashboard. All data and action
 * callbacks are injected by the parent orchestrator; no server-state lives
 * here.
 */

import { AlertTriangle, HardHat, Flame, ClipboardList, Plus, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AccessZoneCard, FireSensorCard } from "./SecurityDashboardCards";
import {
  INCIDENT_TYPE_LABEL,
  SEVERITY_VARIANT,
  EVACUATION_STEPS,
  type SecurityIncident,
  type PPECheck,
  type AccessZone,
  type FireSensor,
} from "./SecurityDashboardTypes";

/** Shared table-header cell class used across all security tables. */
const TH = "bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6";

// ---------------------------------------------------------------------------
// Incidents (Tab 3)
// ---------------------------------------------------------------------------

interface IncidentsTabProps {
  incidents: SecurityIncident[];
  onAdd: () => void;
}

export function IncidentsTab({ incidents, onAdd }: IncidentsTabProps) {
  return (
    <TabsContent value="incidents" className="space-y-4">
      <div className="bg-card rounded-xl p-6">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[var(--ep-primary)]" />Xavfsizlik Hodisalari
            </h2>
            <p className="text-sm text-muted-foreground">Barcha qayd etilgan xavfsizlik hodisalari</p>
          </div>
          <Button onClick={onAdd} data-testid="button-add-incident">
            <Plus className="w-4 h-4 mr-2" />Hodisa Qayd Et
          </Button>
        </div>
        <div className="ep-table-scroll"><Table>
          <TableHeader>
            <TableRow className="border-none hover:bg-transparent">
              <TableHead className={`${TH} rounded-l-lg`}>Turi</TableHead>
              <TableHead className={TH}>Tavsif</TableHead>
              <TableHead className={TH}>Joylasuv</TableHead>
              <TableHead className={TH}>Darajasi</TableHead>
              <TableHead className={TH}>Qayd etgan</TableHead>
              <TableHead className={TH}>Vaqt</TableHead>
              <TableHead className={`${TH} rounded-r-lg`}>Holat</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(Array.isArray(incidents) ? incidents : []).map((i) => (
              <TableRow key={i.id} data-testid={`row-incident-${i.id}`} className="border-none hover:bg-muted/40 transition-colors">
                <TableCell className="px-6">
                  <Badge variant="outline" className="border-border text-muted-foreground">
                    {INCIDENT_TYPE_LABEL[i.type] || i.type}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[200px] truncate px-6 text-foreground">{i.description}</TableCell>
                <TableCell className="px-6 text-foreground">{i.location}</TableCell>
                <TableCell className="px-6">
                  <Badge variant={SEVERITY_VARIANT[i.severity] || "secondary"}>
                    {i.severity === "high" ? "Yuqori" : i.severity === "medium" ? "O'rta" : "Past"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm px-6 text-muted-foreground">{i.reportedBy}</TableCell>
                <TableCell className="text-sm px-6 text-muted-foreground">
                  {new Date(i.createdAt).toLocaleString("uz-UZ")}
                </TableCell>
                <TableCell className="px-6">
                  <Badge variant={i.status === "open" ? "destructive" : "secondary"}>
                    {i.status === "open" ? "Ochiq" : "Yopilgan"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table></div>
        {!incidents.length && (
          <div className="text-center py-8 text-[13px] text-muted-foreground">Hodisalar yo'q</div>
        )}
      </div>
    </TabsContent>
  );
}

// ---------------------------------------------------------------------------
// PPE (Tab 4)
// ---------------------------------------------------------------------------

interface PPETabProps {
  ppeChecks: PPECheck[];
  onAdd: () => void;
}

export function PPETab({ ppeChecks, onAdd }: PPETabProps) {
  return (
    <TabsContent value="ppe" className="space-y-4">
      <div className="bg-card rounded-xl p-6">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <HardHat className="w-5 h-5 text-primary" />Shaxsiy Himoya Vositalari (PPE)
            </h2>
            <p className="text-sm text-muted-foreground">Xodimlarning PPE tekshiruvi natijalari</p>
          </div>
          <Button onClick={onAdd} data-testid="button-add-ppe">
            <Plus className="w-4 h-4 mr-2" />Tekshiruv Qo'shish
          </Button>
        </div>
        <div className="ep-table-scroll"><Table>
          <TableHeader>
            <TableRow className="border-none hover:bg-transparent">
              <TableHead className={`${TH} rounded-l-lg`}>Xodim</TableHead>
              <TableHead className={TH}>Bo'lim</TableHead>
              <TableHead className={TH}>Kask</TableHead>
              <TableHead className={TH}>Vest</TableHead>
              <TableHead className={TH}>Qo'lqop</TableHead>
              <TableHead className={TH}>Botinka</TableHead>
              <TableHead className={TH}>Vaqt</TableHead>
              <TableHead className={`${TH} rounded-r-lg`}>Izoh</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(Array.isArray(ppeChecks) ? ppeChecks : []).map((p) => {
              const allOk = p.helmetOk && p.vestOk && p.glovesOk && p.bootsOk;
              return (
                <TableRow key={p.id} data-testid={`row-ppe-${p.id}`} className="border-none hover:bg-muted/40 transition-colors">
                  <TableCell className="font-medium px-6 text-foreground">{p.employeeName}</TableCell>
                  <TableCell className="px-6 text-foreground">{p.department}</TableCell>
                  <TableCell className="px-6">{p.helmetOk ? <CheckCircle className="w-4 h-4 text-[var(--ep-green)]" /> : <XCircle className="w-4 h-4 text-[var(--ep-red)]" />}</TableCell>
                  <TableCell className="px-6">{p.vestOk ? <CheckCircle className="w-4 h-4 text-[var(--ep-green)]" /> : <XCircle className="w-4 h-4 text-[var(--ep-red)]" />}</TableCell>
                  <TableCell className="px-6">{p.glovesOk ? <CheckCircle className="w-4 h-4 text-[var(--ep-green)]" /> : <XCircle className="w-4 h-4 text-[var(--ep-red)]" />}</TableCell>
                  <TableCell className="px-6">{p.bootsOk ? <CheckCircle className="w-4 h-4 text-[var(--ep-green)]" /> : <XCircle className="w-4 h-4 text-[var(--ep-red)]" />}</TableCell>
                  <TableCell className="text-sm px-6 text-muted-foreground">
                    {new Date(p.createdAt).toLocaleTimeString("uz-UZ")}
                  </TableCell>
                  <TableCell className="px-6">
                    <Badge variant={allOk ? "secondary" : "destructive"} className="shadow-none">
                      {allOk ? "OK" : "Xato"}
                    </Badge>
                    {p.notes && <span className="text-xs text-muted-foreground ml-1">{p.notes}</span>}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table></div>
        {!ppeChecks.length && (
          <div className="text-center py-8 text-[13px] text-muted-foreground">PPE tekshiruvlari yo'q</div>
        )}
      </div>
    </TabsContent>
  );
}

// ---------------------------------------------------------------------------
// Access zones (Tab 5)
// ---------------------------------------------------------------------------

interface ZonesTabProps {
  accessZones: AccessZone[];
}

export function ZonesTab({ accessZones }: ZonesTabProps) {
  return (
    <TabsContent value="zones" className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(Array.isArray(accessZones) ? accessZones : []).map((z) => (
          <AccessZoneCard key={z.id} zone={z} />
        ))}
      </div>
    </TabsContent>
  );
}

// ---------------------------------------------------------------------------
// Fire / gas sensors (Tab 6)
// ---------------------------------------------------------------------------

interface FireTabProps {
  fireSensors: FireSensor[];
}

export function FireTab({ fireSensors }: FireTabProps) {
  return (
    <TabsContent value="fire" className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-[var(--ep-primary)]" />Yong'in va Gaz Monitoring
          </CardTitle>
          <CardDescription>Hamma sensor va signal qurilmalari holati</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(Array.isArray(fireSensors) ? fireSensors : []).map((fa) => (
              <FireSensorCard key={fa.id} sensor={fa} />
            ))}
          </div>
          <div className="mt-6 p-4 bg-muted/30 rounded-md">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />Evakuatsiya Protokoli
            </h3>
            <div className="space-y-2 text-sm">
              {EVACUATION_STEPS.map((step, i) => (
                <div key={`step-${i}`} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-[var(--ep-green)] mt-0.5 shrink-0" />
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
