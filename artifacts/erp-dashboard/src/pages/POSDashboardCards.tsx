/**
 * @module POSDashboardCards
 * @description KPI stat-card components displayed in the Reports tab of the
 * POS Dashboard. Each card shows a single daily metric with an icon badge.
 */

import { Receipt, DollarSign, TrendingUp, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatUZS, type DailySaleSummary } from "./POSDashboardTypes";
import { useTranslation } from '@/lib/i18n';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SaleCountCardProps {
  loading: boolean;
  summary: DailySaleSummary | undefined;
}

interface RevenueCardProps {
  loading: boolean;
  summary: DailySaleSummary | undefined;
}

interface AvgSaleCardProps {
  loading: boolean;
  summary: DailySaleSummary | undefined;
}

interface LowStockCardProps {
  count: number;
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

/** Bugungi sotuvlar (sale count) card. */
export function SaleCountCard({ loading, summary }: SaleCountCardProps) {
  const { t } = useTranslation("common");
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Receipt className="h-5 w-5 text-[var(--ep-blue)]" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{t("bugungiSotuvlar")}</p>
            <p className="text-2xl font-bold">
              {loading ? "..." : (summary?.saleCount ?? 0)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** Bugungi daromad (total revenue) card. */
export function RevenueCard({ loading, summary }: RevenueCardProps) {
  const { t } = useTranslation("common");
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <DollarSign className="h-5 w-5 text-[var(--ep-green)]" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{t("bugungiDaromad")}</p>
            <p className="text-lg font-bold">
              {loading ? "..." : formatUZS(summary?.totalRevenue ?? 0)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** O'rtacha sotuv (average sale) card. */
export function AvgSaleCard({ loading, summary }: AvgSaleCardProps) {
  const { t } = useTranslation("common");
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-[var(--ep-purple)]" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{t("ortachaSotuv")}</p>
            <p className="text-lg font-bold">
              {loading ? "..." : formatUZS(summary?.avgSale ?? 0)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** Kam qoldiq (low-stock) card. */
export function LowStockCard({ count }: LowStockCardProps) {
  const { t } = useTranslation("common");
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-[var(--ep-yellow)]" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{t("kamQoldiq")}</p>
            <p className="text-2xl font-bold text-[var(--ep-red)]">{count}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
