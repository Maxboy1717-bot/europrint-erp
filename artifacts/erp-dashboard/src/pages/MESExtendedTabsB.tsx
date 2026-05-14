/** @module MESExtendedTabsB @description Zones/Tasks tab and Maintenance tab content for the MES Extended page. */

import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, ClipboardList, Wrench, Plus } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { type MESTask, type MaintenanceRequest, type MESMachine } from "./MESExtendedTypes";

// ─── Zones / Tasks Tab ───────────────────────────────────────────────────────

interface ZonesTabProps {
  mesTasks: MESTask[];
  isLoading: boolean;
}

/** Tab content: Ishlab Chiqarish Vazifalari */
export function ZonesTab({ mesTasks, isLoading }: ZonesTabProps) {
  const tasks = Array.isArray(mesTasks) ? mesTasks : [];
  const stats = [
    { l: "Jami vazifalar",  v: tasks.length,                                                c: "text-primary"   },
    { l: "Bajarilmoqda",    v: tasks.filter((t: MESTask) => t.status === "in_progress").length, c: "text-[var(--ep-blue)]"  },
    { l: "Bajarildi",       v: tasks.filter((t: MESTask) => t.status === "completed").length,   c: "text-[var(--ep-green)]" },
  ];

  return (
    <TabsContent value="zones" className="mt-0 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Ishlab Chiqarish Vazifalari</h2>
        <Button
          variant="outline" size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/mes/tasks"] })}
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Yangilash
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map(s => (
          <Card key={s.l}>
            <CardContent className="pt-4 pb-3">
              <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
              <div className="text-xs text-muted-foreground">{s.l}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vazifa</TableHead>
                <TableHead>Stanoq</TableHead>
                <TableHead>Miqdor</TableHead>
                <TableHead>Holati</TableHead>
                <TableHead>Sana</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-[13px] text-muted-foreground">
                    Yuklanmoqda...
                  </TableCell>
                </TableRow>
              ) : tasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-[13px] text-muted-foreground">
                    <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    Vazifalar yo'q
                  </TableCell>
                </TableRow>
              ) : (
                tasks.slice(0, 15).map((t: MESTask) => (
                  <TableRow key={t.id} data-testid={`row-task-${t.id}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium">
                      {t.orderNumber || t.taskName || `Vazifa #${t.id}`}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {t.machineId || t.machineName || "—"}
                    </TableCell>
                    <TableCell>{t.plannedQuantity || t.quantity || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={
                        t.status === "completed"  ? "default"   :
                        t.status === "in_progress"? "secondary" : "outline"
                      }>
                        {t.status === "completed"   ? "Bajarildi"   :
                         t.status === "in_progress" ? "Jarayonda"   :
                         t.status === "pending"     ? "Kutilmoqda"  :
                         t.status || "Noma'lum"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {t.scheduledDate
                        ? new Date(t.scheduledDate).toLocaleDateString("uz-UZ")
                        : t.createdAt
                          ? new Date(t.createdAt).toLocaleDateString("uz-UZ")
                          : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table></div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}

// ─── Maintenance Tab ─────────────────────────────────────────────────────────

interface MaintenanceTabProps {
  maintenanceRequests: MaintenanceRequest[];
  isLoading: boolean;
  onRefetch: () => void;
  onOpenDialog: () => void;
}

/** Tab content: Texnik Xizmat So'rovlari (table only — dialog is rendered by parent) */
export function MaintenanceTab({
  maintenanceRequests,
  isLoading,
  onRefetch,
  onOpenDialog,
}: MaintenanceTabProps) {
  const requests = Array.isArray(maintenanceRequests) ? maintenanceRequests : [];
  const stats = [
    { l: "Jami so'rovlar",  v: requests.length,                                                       c: "text-primary"    },
    { l: "Bajarilmoqda",    v: requests.filter((r: MaintenanceRequest) => r.status === "in_progress").length, c: "text-[var(--ep-blue)]"   },
    { l: "Kutilmoqda",      v: requests.filter((r: MaintenanceRequest) => r.status === "pending").length,     c: "text-[var(--ep-primary)]" },
  ];

  return (
    <TabsContent value="maintenance" className="mt-0 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Texnik Xizmat So'rovlari</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onRefetch}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Yangilash
          </Button>
          <Button size="sm" onClick={onOpenDialog} data-testid="button-add-maintenance">
            <Plus className="h-3.5 w-3.5 mr-1.5" />So'rov Yaratish
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map(s => (
          <Card key={s.l}>
            <CardContent className="pt-4 pb-3">
              <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
              <div className="text-xs text-muted-foreground">{s.l}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow>
                <TableHead>Stanoq</TableHead>
                <TableHead>Muammo</TableHead>
                <TableHead>Ustuvorlik</TableHead>
                <TableHead>Holati</TableHead>
                <TableHead>Sana</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-[13px] text-muted-foreground">
                    Yuklanmoqda...
                  </TableCell>
                </TableRow>
              ) : requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-[13px] text-muted-foreground">
                    <Wrench className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    So'rovlar yo'q
                  </TableCell>
                </TableRow>
              ) : (
                requests.slice(0, 10).map((r: MaintenanceRequest) => (
                  <TableRow key={r.id} data-testid={`row-maint-${r.id}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium">{r.machineId || r.equipmentId || "—"}</TableCell>
                    <TableCell className="max-w-[180px] truncate">{r.issue || r.description || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={
                        r.priority === "high" || r.priority === "critical" ? "destructive" :
                        r.priority === "medium" ? "secondary" : "outline"
                      }>
                        {r.priority === "high" || r.priority === "critical" ? "Kritik" :
                         r.priority === "medium" ? "O'rta" : "Past"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        r.status === "completed"   ? "default"   :
                        r.status === "in_progress" ? "secondary" : "outline"
                      }>
                        {r.status === "completed"   ? "Bajarildi"     :
                         r.status === "in_progress" ? "Bajarilmoqda"  : "Kutilmoqda"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString("uz-UZ") : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table></div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}

