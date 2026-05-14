/**
 * @module QCApprovalSections
 * @description Major section components for the QC Approval page.
 */

import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, ShieldCheck, Eye, FlaskConical, Send } from "lucide-react";
import { QCOrder, TEST_CATEGORIES } from "./QCApprovalTypes";
import { EPPageHeader } from "@/components/ep";

// ─── Status Badge ──────────────────────────────────────────────────────────────

interface StatusBadgeProps {
  status: string;
}

function StatusBadge({ status }: StatusBadgeProps) {
  if (status === "pending_review") {
    return (
      <span className="bg-blue-100 text-blue-800 rounded-full px-2.5 py-0.5 text-xs font-semibold flex items-center">
        <ShieldCheck className="h-3 w-3 mr-1" />
        Menejer ko'ruvi kutilmoqda
      </span>
    );
  }
  return (
    <span className="bg-amber-100 text-amber-800 rounded-full px-2.5 py-0.5 text-xs font-semibold flex items-center">
      <Clock className="h-3 w-3 mr-1" />
      Inspeksiya kutilmoqda
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
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mahsulot</p>
          <p className="font-medium text-foreground">{order.mahsulotNomi}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Turi</p>
          <p className="font-medium text-foreground">{order.mahsulotTuri || "-"}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Format</p>
          <p className="font-medium text-foreground">{order.formatA} x {order.formatB}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tiraj</p>
          <p className="font-medium text-foreground">{order.tiraj?.toLocaleString()}</p>
        </div>
      </div>

      {order.status === "pending_qc" && (
        <div className="bg-muted/60 p-3 rounded-lg mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Test kategoriyalari:</p>
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
          Ko'rish
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
              Test kiritish
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onInspectorSubmit(order)}
              data-testid={`btn-inspector-submit-${order.id}`}
            >
              <Send className="h-4 w-4 mr-1" />
              Inspeksiyani yakunlash
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
            Menejer tasdiqlash
          </Button>
        )}

        <Button
          variant="destructive"
          size="sm"
          onClick={() => onReject(order)}
          data-testid={`btn-reject-${order.id}`}
        >
          <XCircle className="h-4 w-4 mr-1" />
          Rad etish
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
  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div>
          <EPPageHeader
        breadcrumb={<>Dashboard · <b className="text-foreground">Sifat Tasdiqlash</b></>}
        title="Sifat Tasdiqlash"
        subtitle="Sifat nazorati bo'limi - material testlari va tasdiqlash"
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
  if (orders.length === 0) {
    return (
      <div className="bg-card rounded-xl p-6 text-center">
        <CheckCircle className="h-12 w-12 mx-auto text-[var(--ep-green)] mb-4" />
        <p className="text-lg font-medium text-foreground">Tasdiqlash kutayotgan buyurtmalar yo'q</p>
        <p className="text-muted-foreground">Barcha buyurtmalar ko'rib chiqilgan</p>
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
