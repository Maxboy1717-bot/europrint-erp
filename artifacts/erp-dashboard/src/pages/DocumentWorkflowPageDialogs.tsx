/** @module DocumentWorkflowPageDialogs @description Admin-only workflow route configuration panel: add-route form, existing routes table, and document-type reference grid. */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TabsContent } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DOC_TYPES_KEYS, ROUTE_TYPES, RouteConfig, RouteForm } from "./DocumentWorkflowPageTypes";
import { docTypeLabel } from "./DocumentWorkflowPageHelpers";
import { useTranslation } from "@/lib/i18n";

type TFn = (key: string) => string;

// ---------------------------------------------------------------------------
// AdminRoutingTab
// ---------------------------------------------------------------------------

interface AdminRoutingTabProps {
  routeForm: RouteForm;
  routeConfigs: RouteConfig[] | undefined;
  createIsPending: boolean;
  t: TFn;
  tCommon: TFn;
  onRouteFormChange: (patch: Partial<RouteForm>) => void;
  onCreateRoute: () => void;
  onToggleRoute: (id: number) => void;
  onDeleteRoute: (id: number) => void;
}

export function AdminRoutingTab({ routeForm, routeConfigs, createIsPending, t, tCommon, onRouteFormChange, onCreateRoute, onToggleRoute, onDeleteRoute, }: AdminRoutingTabProps) {
  return (
    <TabsContent value="admin" className="mt-4">
      <div className="space-y-6">

        {/* Add route form */}
        <Card className="bg-card border-purple-800">
          <CardHeader>
            <CardTitle className="text-foreground text-base">
              ➕ {tCommon("add")} {t("approvalStep")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-muted-foreground text-xs">{t("documentType")}</Label>
                <Select value={routeForm.document_type} onValueChange={v => onRouteFormChange({ document_type: v })}>
                  <SelectTrigger className="bg-input border-border mt-1 text-xs h-9"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {DOC_TYPES_KEYS.map(dt => (
                      <SelectItem key={dt.value} value={dt.value} className="text-xs">{t(dt.key)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-muted-foreground text-xs">Qadam tartibi</Label>
                <Input type="number" min={1}
                  value={routeForm.step_order}
                  onChange={e => onRouteFormChange({ step_order: parseInt(e.target.value) || 1 })}
                  className="bg-input border-border mt-1 h-8 text-xs" />
              </div>

              <div>
                <Label className="text-muted-foreground text-xs">Marshrutlash turi</Label>
                <Select value={routeForm.route_type} onValueChange={v => onRouteFormChange({ route_type: v })}>
                  <SelectTrigger className="bg-input border-border mt-1 text-xs h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROUTE_TYPES.map(r => (
                      <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-muted-foreground text-xs">Daraja (yuqoriga)</Label>
                <Input type="number" min={1} max={5}
                  value={routeForm.levels_up}
                  onChange={e => onRouteFormChange({ levels_up: parseInt(e.target.value) || 1 })}
                  className="bg-input border-border mt-1 h-8 text-xs" />
              </div>

              <div>
                <Label className="text-muted-foreground text-xs">{t("department")}</Label>
                <Input
                  value={routeForm.target_department}
                  onChange={e => onRouteFormChange({ target_department: e.target.value })}
                  placeholder={tCommon("optional")}
                  className="bg-input border-border mt-1 h-8 text-xs" />
              </div>

              <div>
                <Label className="text-muted-foreground text-xs">{t("position")} (positions.name)</Label>
                <Input
                  value={routeForm.target_role_code}
                  onChange={e => onRouteFormChange({ target_role_code: e.target.value })}
                  placeholder="Masalan: HR Menejer, Direktor, Bosh buxgalter"
                  className="bg-input border-border mt-1 h-8 text-xs" />
              </div>

              <div>
                <Label className="text-muted-foreground text-xs">Muddat (soat)</Label>
                <Input type="number" min={1}
                  value={routeForm.deadline_hours}
                  onChange={e => onRouteFormChange({ deadline_hours: parseInt(e.target.value) || 24 })}
                  className="bg-input border-border mt-1 h-8 text-xs" />
              </div>

              <div>
                <Label className="text-muted-foreground text-xs">1-eslatma (soat qolgunicha)</Label>
                <Input type="number" min={1}
                  value={routeForm.reminder_hours_1}
                  onChange={e => onRouteFormChange({ reminder_hours_1: parseInt(e.target.value) || 4 })}
                  className="bg-input border-border mt-1 h-8 text-xs" />
              </div>

              <div>
                <Label className="text-muted-foreground text-xs">2-eslatma (soat qolgunicha)</Label>
                <Input type="number" min={1}
                  value={routeForm.reminder_hours_2}
                  onChange={e => onRouteFormChange({ reminder_hours_2: parseInt(e.target.value) || 2 })}
                  className="bg-input border-border mt-1 h-8 text-xs" />
              </div>
            </div>

            <Button
              onClick={onCreateRoute}
              disabled={createIsPending}
              className="mt-4 bg-[var(--ep-purple)] hover:bg-[var(--ep-purple)]/90 text-white text-sm"
            >
              {createIsPending ? tCommon("saving") + "..." : "💾 " + tCommon("save")}
            </Button>
          </CardContent>
        </Card>

        {/* Existing routes */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground text-base">📋 {t("approvalHistory")}</CardTitle>
          </CardHeader>
          <CardContent>
            {routeConfigs && routeConfigs.length > 0 ? (
              <div className="space-y-2">
                {(Array.isArray(routeConfigs) ? routeConfigs : []).map((r) => (
                  <div key={r.id} className="flex items-center gap-3 bg-muted rounded p-3 flex-wrap">
                    <Badge className="bg-muted text-muted-foreground text-xs shrink-0">#{r.step_order}</Badge>
                    <div className="flex-1 min-w-0">
                      <div className="text-foreground text-sm font-medium">
                        {docTypeLabel(r.document_type, t)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {r.route_type} · {r.deadline_hours} soat muddat · {r.levels_up} daraja
                        {r.target_department ? ` · ${t("department")}: ${r.target_department}` : ""}
                        {r.target_role_code ? ` · ${t("position")}: ${r.target_role_code}` : ""}
                        {Array.isArray(r.reminder_hours) ? ` · Eslatma: ${r.reminder_hours[0]}h / ${r.reminder_hours[1]}h` : ""}
                      </div>
                    </div>
                    <Badge className={r.is_active ? "bg-green-800 text-white text-xs" : "bg-slate-600 text-white text-xs"}>
                      {r.is_active ? t("active") : t("inactive")}
                    </Badge>
                    <div className="flex gap-1 shrink-0">
                      <Button size="sm" onClick={() => onToggleRoute(r.id)}
                        className="bg-muted hover:bg-muted text-foreground text-xs h-7 px-2">
                        {r.is_active ? "⏸" : "▶"}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" className="bg-red-800 hover:bg-[var(--ep-red)]/90 text-white text-xs h-7 px-2">🗑</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Marshrutni o'chirishni tasdiqlang</AlertDialogTitle>
                            <AlertDialogDescription>
                              Bu marshrut qoidasi butunlay o'chiriladi. Bu amalni bekor qilib bo'lmaydi.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDeleteRoute(r.id)}
                              className="bg-red-600 hover:bg-[var(--ep-red)]/90">
                              O'chirish
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Hali marshrutlash qoidasi yo'q. Yuqoridagi forma orqali qo'shing.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Doc types reference */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground text-base">
              📁 {t("documentType")} ({DOC_TYPES_KEYS.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {DOC_TYPES_KEYS.map(dt => (
                <div key={dt.value} className="flex items-center gap-2 bg-muted rounded p-2">
                  <div>
                    <div className="text-foreground text-xs font-medium">{t(dt.key)}</div>
                    <div className="text-muted-foreground text-xs font-mono">{dt.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </TabsContent>
  );
}
