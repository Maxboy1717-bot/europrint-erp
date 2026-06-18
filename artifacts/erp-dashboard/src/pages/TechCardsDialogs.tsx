/**
 * @module TechCardsDialogs
 * @description Dialog and panel components for the TechCards page:
 * - ViewCardDialog  — full-detail modal for a single tech card
 * - GenerateCardDialog — AI generation confirmation dialog
 * - OptimizeResultPanel — inline optimization result card
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { FileText, Download, TrendingDown, Zap, FlaskConical, Image as ImageIcon } from "lucide-react";
import type { TechCard, OptimizeResult, PapkaOrder, BomRow, RouteRow, VersionRow } from "./TechCardsTypes";
import { OperationsList, MaterialsList } from "./TechCardsLists";
import { GatePills, VersionHistory, BomRoutesPanel } from "./TechCardsMaster";

import { useTranslation } from '@/lib/i18n';
import { EPLoader, EPStatusPill } from "@/components/ep";
import { tLabel } from "@/lib/i18n/tLabel";
// ---------------------------------------------------------------------------
// ViewCardDialog
// ---------------------------------------------------------------------------

interface ViewCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: TechCard | null;
  isOptimizePending: boolean;
  onOptimize: (cardId: string) => void;
  onExport: (card: TechCard) => void;
  /** Phase 1 master detail (child rows + gate handlers). */
  bom?: BomRow[];
  routes?: RouteRow[];
  versions?: VersionRow[];
  isMasterBusy?: boolean;
  onLabApprove?: (cardId: string) => void;
  onMaketApprove?: (cardId: string) => void;
  onAddBom?: (cardId: string, item: { materialCode: string; quantity: number; unit: string; layer?: string }) => void;
  onAddRoute?: (cardId: string, route: { opSeq: number; operation: string; normPerHour?: number; minRazryad?: number }) => void;
}

/** Full-detail modal: meta grid, gates, BOM/routes, version history, operations/materials. */
export function ViewCardDialog({open,
  onOpenChange,
  card,
  isOptimizePending,
  onOptimize,
  onExport,
  bom = [],
  routes = [],
  versions = [],
  isMasterBusy = false,
  onLabApprove,
  onMaketApprove,
  onAddBom,
  onAddRoute,
}: ViewCardDialogProps) {
  const { t } = useTranslation('common');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto p-6">
        {card && (
          <>
            <DialogHeader>
              <DialogTitle
                className="flex items-center gap-2 flex-wrap"
                data-testid="text-view-card-title"
              >
                <FileText className="h-5 w-5" />
                {card.code ? <span className="text-muted-foreground font-mono text-sm">{card.code}</span> : null}
                {card.name}
                {card.version != null && <EPStatusPill tone="info" hideDot>v{card.version}</EPStatusPill>}
                <Badge variant={card.isActive ? "default" : "secondary"}>
                  {card.isActive ? "Faol" : "Nofaol"}
                </Badge>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* 3 gate traffic-lights + approve actions */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <GatePills card={card} hasBom={bom.length > 0} />
                <div className="flex gap-2">
                  {!card.maketApproved && onMaketApprove && (
                    <Button size="sm" variant="outline" onClick={() => onMaketApprove(card.id)} disabled={isMasterBusy} data-testid="btn-maket-approve">
                      <ImageIcon className="h-4 w-4 mr-1" />{tLabel("common.TechCardsMaster.maketTasdiqla", "Maket")}
                    </Button>
                  )}
                  {!card.labApproved && onLabApprove && (
                    <Button size="sm" variant="outline" onClick={() => onLabApprove(card.id)} disabled={isMasterBusy} data-testid="btn-lab-approve">
                      <FlaskConical className="h-4 w-4 mr-1" />{tLabel("common.TechCardsMaster.labTasdiqla", "Lab")}
                    </Button>
                  )}
                </div>
              </div>
              {/* Meta grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border">
                  <p className="text-xs text-muted-foreground mb-1">{t("mahsulotTuri")}</p>
                  <p className="font-medium" data-testid="text-view-product-type">
                    {card.productType}
                  </p>
                </div>
                <div className="p-3 rounded-lg border">
                  <p className="text-xs text-muted-foreground mb-1">{t("format")}</p>
                  <p className="font-medium" data-testid="text-view-format">
                    {card.formatA} x {card.formatB} mm
                  </p>
                </div>
                <div className="p-3 rounded-lg border">
                  <p className="text-xs text-muted-foreground mb-1">{t("davomiylik")}</p>
                  <p className="font-medium" data-testid="text-view-layers">
                    {card.totalDurationMinutes || 0} min
                  </p>
                </div>
                <div className="p-3 rounded-lg border">
                  <p className="text-xs text-muted-foreground mb-1">{t("setupVaqti")}</p>
                  <p className="font-medium" data-testid="text-view-cycle">
                    {card.setupDurationMinutes || 0} min
                  </p>
                </div>
              </div>

              {/* Phase 1 master: BOM + marshrut with add-forms */}
              {(onAddBom || onAddRoute || bom.length > 0 || routes.length > 0) && (
                <>
                  <Separator />
                  <BomRoutesPanel
                    bom={bom}
                    routes={routes}
                    isBusy={isMasterBusy}
                    onAddBom={(item) => onAddBom?.(card.id, item)}
                    onAddRoute={(route) => onAddRoute?.(card.id, route)}
                  />
                </>
              )}

              {/* Version history */}
              <Separator />
              <div>
                <p className="text-sm font-medium mb-2">
                  {tLabel("common.TechCardsMaster.versiyaTarixi", "Versiya tarixi")}
                </p>
                <VersionHistory versions={versions} />
              </div>

              {/* Notes */}
              {card.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-1">{t("Izoh")}</p>
                    <p
                      className="text-sm text-muted-foreground"
                      data-testid="text-view-notes"
                    >
                      {card.notes}
                    </p>
                  </div>
                </>
              )}

              {/* Operations */}
              {card.operations && card.operations.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-2">
                      Operatsiyalar ({card.operations.length})
                    </p>
                    <OperationsList operations={card.operations} />
                  </div>
                </>
              )}

              {/* Materials */}
              {card.materials && card.materials.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-2">
                      Materiallar ({card.materials.length})
                    </p>
                    <MaterialsList materials={card.materials} />
                  </div>
                </>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onOptimize(card.id);
                    onOpenChange(false);
                  }}
                  disabled={isOptimizePending}
                  data-testid="btn-modal-optimize"
                >
                  <TrendingDown className="h-4 w-4 mr-1" />
                  {t("optimallashtirish")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onExport(card)}
                  data-testid="btn-modal-export"
                >
                  <Download className="h-4 w-4 mr-1" />
                  PDF
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// --- GenerateCardDialog ---
interface GenerateCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: PapkaOrder | null;
  isLoading: boolean;
  onConfirm: (order: PapkaOrder) => void;
}

/** Confirmation dialog shown before triggering AI tech-card generation for an order. */
export function GenerateCardDialog({
  open,
  onOpenChange,
  order,
  isLoading,
  onConfirm,
}: GenerateCardDialogProps) {
  const { t } = useTranslation("common");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("aiTexnologikKartaYaratish")}</DialogTitle>
        </DialogHeader>

        {order && (
          <div className="space-y-4">
            <div className="bg-muted/50 p-3 rounded-md text-sm">
              <p><strong>{t("buyurtma3")}</strong> {order.papkaNo}</p>
              <p><strong>{t("mijoz")}</strong> {order.mijozNomi}</p>
              <p><strong>{t("mahsulot")}</strong> {order.mahsulotNomi}</p>
              <p><strong>{t("format1")}</strong> {order.formatA || "?"} x {order.formatB || "?"} mm</p>
              <p><strong>{t("tiraj")}</strong> {order.tiraj?.toLocaleString() || "?"} dona</p>
            </div>
            <p className="text-sm text-muted-foreground">
              AI avtomatik ravishda format, qatlamlar soni, tsikl vaqti va material
              normalari asosida texnologik karta yaratadi.
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button
            onClick={() => order && onConfirm(order)}
            disabled={isLoading}
            data-testid="btn-confirm-generate"
          >
            {isLoading ? (
              <>
                <EPLoader className="mr-2" />
                {t("generatsiya1")}
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                {t("aiBilanYaratish")}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --- OptimizeResultPanel ---
interface OptimizeResultPanelProps {
  result: OptimizeResult;
}

/** Inline panel rendered below the cards grid when an optimization result is ready. */
export function OptimizeResultPanel({ result }: OptimizeResultPanelProps) {
  const { t } = useTranslation("common");
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-[var(--ep-green)]" />
          Optimizatsiya: {result.cardName}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold" data-testid="text-opt-score">
              {result.optimizationScore}%
            </p>
            <p className="text-sm text-muted-foreground">{t("samaradorlikBali")}</p>
          </div>
          <div className="text-center">
            <p
              className="text-2xl font-bold text-[var(--ep-green)]"
              data-testid="text-opt-saving"
            >
              {(result.estimatedSaving / 1000).toFixed(0)}K
            </p>
            <p className="text-sm text-muted-foreground">{t("tejamkorlikUzs")}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold" data-testid="text-opt-materials">
              {result.materialCount}
            </p>
            <p className="text-sm text-muted-foreground">{"Material turlari"}</p>
          </div>
        </div>

        {result.optimizationSuggestions.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">{t("tavsiyalar")}</p>
            {(Array.isArray(result.optimizationSuggestions)
              ? result.optimizationSuggestions
              : []
            ).map((s, i) => (
              <div
                key={`sug-${i}`}
                className="text-sm bg-muted/50 rounded-md p-2"
                data-testid={`text-suggestion-${i}`}
              >
                <span className="font-medium">{s.material}</span>: Chiqindi{" "}
                {s.currentWastage}% → {s.suggestedWastage}% (tejam:{" "}
                {(s.saving / 1000).toFixed(0)}K UZS)
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--ep-green)]">
            {t("kartaAllaqachonOptimallashtirilgan")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
