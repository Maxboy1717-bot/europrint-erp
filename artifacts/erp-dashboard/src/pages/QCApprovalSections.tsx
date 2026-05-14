/**
 * @module QCApprovalSections
 * @description Major section components for the QC Approval page.
 */

import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, ShieldCheck, Eye, FlaskConical, Send } from "lucide-react";
import { QCOrder, TEST_CATEGORIES } from "./QCApprovalTypes";
import { EPPageHeader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

// ─── Status Badge ──────────────────────────────────────────────────────────────

interface StatusBadgeProps {
  status: string;
}

function StatusBadge({ status }: StatusBadgeProps) {
  const { t } = useTranslation("common");
  if (status === "pending_review") {
    return (
      <span className="bg-blue-100 text-blue-800 rounded-full px-2.5 py-0.5 text-xs font-semibold flex items-center">
        <ShieldCheck className="h-3 w-3 mr-1" />
        {t("menejerKoruviKutilmoqda")}
      </span>
    );
  }
  return (
    <span className="bg-amber-100 text-amber-800 rounded-full px-2.5 py-0.5 text-xs font-semibold flex items-center">
      <Clock className="h-3 w-3 mr-1" />
      {t("inspeksiyaKutilmoqda")}
    </span>
  );
}

// ─── Order Card ────────────────────────────────────────────────────────────────

interface OrderCardProps {
  order: QCOrder;
  onView: (order: QCOrder) => void;
  onTest: (order: QCOrder) => void;
  onInspectorSubmit: (order: QCOrder) => void;
  onApprove: (order: QCOrder) => void;
  onReject: (order: QCOrder) => void;
}

function OrderCard({ order, onView, onTest, onInspectorSubmit, onApprove, onReject }: OrderCardProps) {
  const { t } = useTranslation("common");
  return (
    <div className="bg-card rounded-xl p-6" data-testid={`order-card-${order.id}`}>
      <div className="flex flex-row items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{order.papkaNo}</h3>
          <p className="text-sm text-muted-foreground">{order.mijozNomi}</p>
        </div>
        <div className="flex gap-2">
          <StatusBadge status={order.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("Mahsulot")}</p>
          <p className="font-medium text-foreground">{order.mahsulotNomi}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("type")}</p>
          <p className="font-medium text-foreground">{order.mahsulotTuri || "-"}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("format")}</p>
          <p className="font-medium text-foreground">{order.formatA} x {order.formatB}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("Tiraj")}</p>
          <p className="font-medium text-foreground">{order.tiraj?.toLocaleString()}</p>
        </div>
      </div>

      {order.status === "pending_qc" && (
        <div className="bg-muted/60 p-3 rounded-lg mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{t("testKategoriyalari")}</p>
          <div className="flex flex-wrap gap-2">
            {(Array.isArray(TEST_CATEGORIES) ? TEST_CATEGORIES : []).map(cat => (
              <span key={cat.id} className="bg-muted text-foreground rounded-full px-2.5 py-0.5 text-xs font-semibold">
                {cat.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onView(order)}
          data-testid={`btn-view-${order.id}`}
        >
          <Eye className="h-4 w-4 mr-1" />
          {t("view")}
        </Button>

        {order.status === "pending_qc" && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onTest(order)}
              data-testid={`btn-test-${order.id}`}
            >
              <FlaskConical className="h-4 w-4 mr-1" />
              {t("testKiritish")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onInspectorSubmit(order)}
              data-testid={`btn-inspector-submit-${order.id}`}
            >
              <Send className="h-4 w-4 mr-1" />
              {t("inspeksiyaniYakunlash1")}
            </Button>
          </>
        )}

        {order.status === "pending_review" && (
          <Button
            size="sm"
            onClick={() => onApprove(order)}
            data-testid={`btn-approve-${order.id}`}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            {t("menejerTasdiqlash")}
          </Button>
        )}

        <Button
          variant="destructive"
          size="sm"
          onClick={() => onReject(order)}
          data-testid={`btn-reject-${order.id}`}
        >
          <XCircle className="h-4 w-4 mr-1" />
          {t("reject")}
        </Button>
      </div>
    </div>
  );
}

// ─── Page Header ───────────────────────────────────────────────────────────────

interface PageHeaderProps {
  pendingQcCount: number;
  pendingReviewCount: number;
}

export function QCApprovalHeader({ pendingQcCount, pendingReviewCount }: PageHeaderProps) {
  const { t } = useTranslation("common");
  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div>
          <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("sifatTasdiqlash")}</b></>}
        title={t("sifatTasdiqlash")}
        subtitle={t("sifatNazoratiBolimiMaterialTestlari")}
      />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="bg-primary/10 text-primary rounded-full px-4 py-1 text-sm font-semibold flex items-center">
          <Clock className="h-4 w-4 mr-2" />
          Inspeksiyada: {pendingQcCount} | Menejer ko'ruvida: {pendingReviewCount}
        </div>
      </div>
    </>
  );
}

// ─── Orders List ───────────────────────────────────────────────────────────────

interface OrdersListProps {
  orders: QCOrder[];
  onView: (order: QCOrder) => void;
  onTest: (order: QCOrder) => void;
  onInspectorSubmit: (order: QCOrder) => void;
  onApprove: (order: QCOrder) => void;
  onReject: (order: QCOrder) => void;
}

export function QCOrdersList({ orders, onView, onTest, onInspectorSubmit, onApprove, onReject }: OrdersListProps) {
  const { t } = useTranslation("common");
  if (orders.length === 0) {
    return (
      <div className="bg-card rounded-xl p-6 text-center">
        <CheckCircle className="h-12 w-12 mx-auto text-[var(--ep-green)] mb-4" />
        <p className="text-lg font-medium text-foreground">{t("tasdiqlashKutayotganBuyurtmalarYoq")}</p>
        <p className="text-muted-foreground">{t("barchaBuyurtmalarKoribChiqilgan")}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {(Array.isArray(orders) ? orders : []).map((order: QCOrder) => (
        <OrderCard
          key={order.id}
          order={order}
          onView={onView}
          onTest={onTest}
          onInspectorSubmit={onInspectorSubmit}
          onApprove={onApprove}
          onReject={onReject}
        />
      ))}
    </div>
  );
}
