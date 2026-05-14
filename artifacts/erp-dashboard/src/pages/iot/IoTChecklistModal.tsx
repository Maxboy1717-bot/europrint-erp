/**
 * @module IoTChecklistModal
 * @description React page component. Route-level UI.
 */

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Play, Barcode, Package, Users, CheckCircle, Clock, ScanLine, ClipboardCheck } from "lucide-react";
import { UseMutationResult } from "@tanstack/react-query";
import { ChecklistMaterial, Employee, CrewAssignment, ProductionSession, IotLang } from "./iot-types";
import { EPStatusPill, EPLoader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

interface IoTChecklistModalProps {
  lang: IotLang;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checklistKitBarcode: string;
  checklistMaterials: ChecklistMaterial[];
  crewAssignment: CrewAssignment;
  setCrewAssignment: (v: CrewAssignment) => void;
  employees: Employee[];
  scanningItemId: string | null;
  scanMaterial: UseMutationResult<string, Error, string, unknown>;
  startProductionFromChecklist: UseMutationResult<ProductionSession, Error, void, unknown>;
  activeSession: ProductionSession | null;
}

export function IoTChecklistModal({
  lang, open, onOpenChange, checklistKitBarcode, checklistMaterials, crewAssignment,
  setCrewAssignment, employees, scanningItemId, scanMaterial, startProductionFromChecklist, activeSession,
}: IoTChecklistModalProps) {
  const { t } = useTranslation("common");
  const t = (uz: string, ru: string) => lang === "uz" ? uz : ru;
  const allScanned = (Array.isArray(checklistMaterials) ? checklistMaterials : []).every(m => m.isScanned);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && activeSession) onOpenChange(false); }}>
      <DialogContent className="max-w-2xl max-h-[95vh] overflow-hidden flex flex-col p-6">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-primary" />
            {t("Ishlab chiqarish oldi chek-listi", "Предпроизводственный чек-лист")}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 pb-4">
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Barcode className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{t("To'plam kodi", "Код набора")}:</span>
                  </div>
                  <span className="font-mono text-lg font-bold tracking-wider">{checklistKitBarcode}</span>
                </div>
                <div className="mt-2 h-10 bg-card flex items-center justify-center rounded">
                  <div className="flex gap-[1px]">
                    {(checklistKitBarcode || "000000").split("").slice(0, 12).map((char, i) => (
                      <div key={`k-${i}`} className={`h-8 ${parseInt(char, 36) % 2 === 0 ? "w-1 bg-black" : "w-0.5 bg-black"}`} />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Package className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">{t("Materiallarni skanerlash", "Сканирование материалов")}</h3>
                <Badge variant={allScanned ? "secondary" : "outline"}>
                  {(Array.isArray(checklistMaterials) ? checklistMaterials : []).filter(m => m.isScanned).length}/{checklistMaterials.length}
                </Badge>
              </div>
              <div className="space-y-2">
                {(Array.isArray(checklistMaterials) ? checklistMaterials : []).map((material) => (
                  <Card
                    key={material.id}
                    className={`transition-colors ${material.isScanned ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800" : "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800"}`}
                    data-testid={`card-material-${material.id}`}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {material.isScanned ? (
                            <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                              <CheckCircle className="h-5 w-5 text-white" />
                            </div>
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-yellow-500 flex items-center justify-center flex-shrink-0">
                              <Clock className="h-5 w-5 text-white" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{material.materialName}</p>
                            <p className="text-sm text-muted-foreground">{material.requiredQuantity.toFixed(2)} {material.unit}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {material.isScanned ? (
                            <EPStatusPill tone="success">{t("Skanlangan", "Отсканирован")}</EPStatusPill>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => scanMaterial.mutate(material.id)}
                              disabled={scanningItemId === material.id}
                              className="min-w-[100px]"
                              data-testid={`button-scan-${material.id}`}
                            >
                              {scanningItemId === material.id ? <EPLoader className="mr-1" /> : <ScanLine className="h-4 w-4 mr-1" />}
                              {t("Skanerlash", "Сканировать")}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="mt-3">
                <Progress value={((Array.isArray(checklistMaterials) ? checklistMaterials : []).filter(m => m.isScanned).length / Math.max(checklistMaterials.length, 1)) * 100} className="h-2" data-testid="progress-materials" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-lg">{t("Jamoa tayinlash", "Назначение команды")}</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {([
                  { key: "masterId" as const, label: t("Master", "Мастер"), required: true },
                  { key: "polmasterId" as const, label: t("Polmaster", "Полмастер"), required: false },
                  { key: "shogirdId" as const, label: t("Shogird", "Ученик"), required: false },
                  { key: "roklerId" as const, label: t("Roklerchi", "Роклерчи"), required: false },
                ]).map(({ key, label, required }) => (
                  <div key={key} className="space-y-2">
                    <Label className="flex items-center gap-1">
                      {label}
                      {required && <span className="text-[var(--ep-red)]">*</span>}
                    </Label>
                    <Select
                      value={crewAssignment[key] || (required ? "" : "none")}
                      onValueChange={(v) => setCrewAssignment({ ...crewAssignment, [key]: v === "none" ? null : v || null })}
                    >
                      <SelectTrigger
                        className={required && !crewAssignment[key] ? "border-red-300 dark:border-red-700" : required && crewAssignment[key] ? "border-green-300 dark:border-green-700" : ""}
                        data-testid={`select-${key}`}
                      >
                        <SelectValue placeholder={required ? t("Masterni tanlang", "Выберите мастера") : t("Ixtiyoriy", "Опционально")} />
                      </SelectTrigger>
                      <SelectContent>
                        {!required && <SelectItem value="none">{t("Tanlanmagan", "Не выбран")}</SelectItem>}
                        {(Array.isArray(employees) ? employees : []).filter(e => {
                            const taken = ([crewAssignment.masterId, crewAssignment.polmasterId, crewAssignment.shogirdId, crewAssignment.roklerId]).filter(Boolean);
                            return e.id === crewAssignment[key] || !taken.includes(e.id);
                          })
                          .map(emp => (
                            <SelectItem key={emp.id} value={emp.id}>{emp.fullName} ({emp.employeeId})</SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground">{t("Materiallar", "Материалы")}</p>
                    <p className={`text-xl font-bold ${allScanned ? "text-[var(--ep-green)]" : "text-[var(--ep-yellow)]"}`}>
                      {(Array.isArray(checklistMaterials) ? checklistMaterials : []).filter(m => m.isScanned).length} / {checklistMaterials.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("Jamoa", "Команда")}</p>
                    <p className={`text-xl font-bold ${crewAssignment.masterId ? "text-[var(--ep-green)]" : "text-[var(--ep-red)]"}`}>
                      {([crewAssignment.masterId, crewAssignment.polmasterId, crewAssignment.shogirdId, crewAssignment.roklerId]).filter(Boolean).length} / 4
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        <div className="pt-4 border-t">
          <Button
            className="w-full h-14 text-lg"
            onClick={() => startProductionFromChecklist.mutate()}
            disabled={!allScanned || !crewAssignment.masterId || startProductionFromChecklist.isPending}
            data-testid="button-start-production"
          >
            {startProductionFromChecklist.isPending ? <EPLoader size={20} className="mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {t("ISHLAB CHIQARISHNI BOSHLASH", "НАЧАТЬ ПРОИЗВОДСТВО")}
          </Button>
          {(!allScanned || !crewAssignment.masterId) && (
            <p className="text-sm text-center text-muted-foreground mt-2">
              {!allScanned && !crewAssignment.masterId
                ? t("Barcha materiallarni skanerlang va Masterni tayinlang", "Отсканируйте все материалы и назначьте мастера")
                : !allScanned
                  ? t("Barcha materiallarni skanerlang", "Отсканируйте все материалы")
                  : t("Masterni tayinlang", "Назначьте мастера")}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
