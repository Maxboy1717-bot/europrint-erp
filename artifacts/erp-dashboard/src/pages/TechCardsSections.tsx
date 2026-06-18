/**
 * @module TechCardsSections
 * @description Section-level UI components for the TechCards page:
 * StatsBar, PendingOrdersPanel, SingleTechCard, CardsGrid (list + empty state).
 * Each component receives only the props it needs and carries no own async state.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { FileText, Zap, Search, Download, TrendingDown, Eye } from "lucide-react";
import type { TechCard, PapkaOrder } from "./TechCardsTypes";
import { EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

// ---------------------------------------------------------------------------
// StatsBar
// ---------------------------------------------------------------------------

interface StatsBarProps {
  totalCards: number;
  activeCards: number;
  pendingOrders: number;
}

/** Displays three KPI chips: total cards, active cards, pending technologist orders. */
export function StatsBar({ totalCards, activeCards, pendingOrders }: StatsBarProps) {
  const { t } = useTranslation("common");
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="bg-card rounded-lg border-none shadow-none p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("jamiKartalar")}
        </p>
        <p
          className="text-4xl font-bold tracking-tight text-foreground"
          data-testid="text-total-cards"
        >
          {totalCards}
        </p>
      </Card>

      <Card className="bg-card rounded-lg border-none shadow-none p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("active")}
        </p>
        <p
          className="text-4xl font-bold tracking-tight text-primary"
          data-testid="text-active-cards"
        >
          {activeCards}
        </p>
      </Card>

      <Card className="bg-card rounded-lg border-none shadow-none p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("texnologKutilmoqda")}
        </p>
        <p
          className="text-4xl font-bold tracking-tight text-[var(--ep-yellow)]"
          data-testid="text-pending-orders"
        >
          {pendingOrders}
        </p>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PendingOrdersPanel
// ---------------------------------------------------------------------------

interface PendingOrdersPanelProps {
  orders: PapkaOrder[];
  onGenerateClick: (order: PapkaOrder) => void;
}

/** Renders the list of orders waiting for an AI-generated tech card. */
export function PendingOrdersPanel({ orders, onGenerateClick }: PendingOrdersPanelProps) {
  const { t } = useTranslation("common");
  if (orders.length === 0) return null;

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3 text-foreground">
        {t("aiKartaGeneratsiyaQilish")}
      </h2>
      <div className="grid gap-2">
        {(Array.isArray(orders) ? orders : []).map((order) => (
          <Card
            key={order.id}
            className="bg-card rounded-lg border-none shadow-none"
            data-testid={`order-tech-${order.id}`}
          >
            <CardContent className="py-3 flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="font-medium text-foreground">
                  {order.papkaNo} — {order.mijozNomi}
                </p>
                <p className="text-sm text-muted-foreground">
                  {order.mahsulotNomi} · Format: {order.formatA || "-"} x{" "}
                  {order.formatB || "-"} mm
                </p>
              </div>
              <Button
                size="sm"
                className="bg-primary text-white rounded-lg px-5 py-2.5 text-sm font-semibold"
                onClick={() => onGenerateClick(order)}
                data-testid={`btn-generate-card-${order.id}`}
              >
                <Zap className="h-4 w-4 mr-1" />
                {t("aiKartaYaratish")}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SingleTechCard
// ---------------------------------------------------------------------------

interface SingleTechCardProps {
  card: TechCard;
  isOptimizePending: boolean;
  onView: (card: TechCard) => void;
  onOptimize: (cardId: string) => void;
  onExport: (card: TechCard) => void;
}

/** A single card tile inside the grid. */
export function SingleTechCard({
  card,
  isOptimizePending,
  onView,
  onOptimize,
  onExport,
}: SingleTechCardProps) {
  const { t } = useTranslation("common");
  return (
    <Card
      className="bg-card rounded-lg border-none shadow-none"
      data-testid={`card-tech-${card.id}`}
    >
      <CardHeader className="pb-2 flex flex-row items-start justify-between gap-4">
        <div className="min-w-0">
          <CardTitle className="text-base text-foreground flex items-center gap-2 flex-wrap">
            {card.code && <span className="font-mono text-xs text-muted-foreground">{card.code}</span>}
            {card.name}
            {card.version != null && (
              <span className="text-xs text-muted-foreground font-normal">v{card.version}</span>
            )}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{card.productType}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <EPStatusPill tone={card.isActive ? "success" : "neutral"}>
            {card.isActive ? "Faol" : "Nofaol"}
          </EPStatusPill>
          {card.status && card.status !== "draft" && (
            <EPStatusPill tone={card.status === "approved" ? "info" : "warning"} hideDot>
              {card.status}
            </EPStatusPill>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm mb-3">
          <div>
            <span className="text-muted-foreground">{t("format1")}</span>
            <span className="font-medium text-foreground">
              {card.formatA || "-"} x {card.formatB || "-"}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">{t("davomiylik1")}</span>
            <span className="font-medium text-foreground">
              {card.totalDurationMinutes || "-"} min
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">AI: </span>
            <span className="font-medium text-foreground">
              {card.calculatedByAI ? "Ha" : "Yo'q"}
            </span>
          </div>
        </div>

        <div className="flex gap-2 justify-end flex-wrap">
          <Button
            size="sm"
            variant="outline"
            className="bg-muted/60 text-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-muted border-none"
            onClick={() => onView(card)}
            data-testid={`btn-view-${card.id}`}
          >
            <Eye className="h-4 w-4 mr-1" />
            {t("view")}
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="bg-muted/60 text-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-muted border-none"
            onClick={() => onOptimize(card.id)}
            disabled={isOptimizePending}
            data-testid={`btn-optimize-${card.id}`}
          >
            <TrendingDown className="h-4 w-4 mr-1" />
            {t("optimallashtirish")}
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="bg-muted/60 text-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-muted border-none"
            onClick={() => onExport(card)}
            data-testid={`btn-export-${card.id}`}
          >
            <Download className="h-4 w-4 mr-1" />
            PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// CardsGrid
// ---------------------------------------------------------------------------

interface CardsGridProps {
  cards: TechCard[];
  search: string;
  onSearchChange: (value: string) => void;
  isOptimizePending: boolean;
  onView: (card: TechCard) => void;
  onOptimize: (cardId: string) => void;
  onExport: (card: TechCard) => void;
}

/** Search bar + responsive 2-column grid of tech cards (or empty state). */
export function CardsGrid({
  cards,
  search,
  onSearchChange,
  isOptimizePending,
  onView,
  onOptimize,
  onExport,
}: CardsGridProps) {
  const { t } = useTranslation("common");
  const filtered = (Array.isArray(cards) ? cards : []).filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.productType?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <h2 className="text-lg font-semibold text-foreground">{t("barchaKartalar")}</h2>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("Qidirish...")}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 bg-card border-none"
            data-testid="input-search-cards"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="bg-card rounded-lg border-none shadow-none">
          <CardContent className="py-10 text-center">
            <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground" data-testid="text-no-cards">
              {t("texnologikKartalarTopilmadi")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((card) => (
            <SingleTechCard
              key={card.id}
              card={card}
              isOptimizePending={isOptimizePending}
              onView={onView}
              onOptimize={onOptimize}
              onExport={onExport}
            />
          ))}
        </div>
      )}
    </div>
  );
}
