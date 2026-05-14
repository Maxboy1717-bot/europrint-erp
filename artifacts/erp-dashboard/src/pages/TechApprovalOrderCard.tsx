/**
 * @module TechApprovalOrderCard
 * @description Single order card component for the TechApproval pending-orders list.
 *              Displays order metadata and action buttons: view history, view detail,
 *              generate tech card (QCheck), reject, and approve.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Eye, FileText, History } from "lucide-react";
import type { TechOrderData } from "./TechApprovalTypes";

interface TechApprovalOrderCardProps {
  order: TechOrderData;
  techCardLabel: string;
  isPrepressPending: boolean;
  onHistory: (order: TechOrderData) => void;
  onTechCard: (order: TechOrderData) => void;
  onReject: (order: TechOrderData) => void;
  onApprove: (order: TechOrderData) => void;
}

export function TechApprovalOrderCard({
  order,
  techCardLabel,
  isPrepressPending,
  onHistory,
  onTechCard,
  onReject,
  onApprove,
}: TechApprovalOrderCardProps) {
  return (
    <Card
      className="bg-card rounded-lg border-none shadow-none"
      data-testid={`order-card-${order.id}`}
    >
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
        <div>
          <CardTitle className="text-[14px] font-semibold text-foreground">{order.papkaNo}</CardTitle>
          <p className="text-sm text-muted-foreground">{order.mijozNomi}</p>
        </div>
        <Badge className="bg-amber-100 text-amber-800 no-default-hover-elevate rounded-full px-2.5 py-0.5 text-xs font-semibold">
          <Clock className="h-3 w-3 mr-1" />
          Texnolog kutilmoqda
        </Badge>
      </CardHeader>

      <CardContent>
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
            <p className="font-medium text-foreground">{order.formatA} × {order.formatB} mm</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tiraj</p>
            <p className="font-medium text-foreground">{order.tiraj?.toLocaleString()}</p>
          </div>
        </div>

        <div className="flex gap-2 justify-end flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onHistory(order)}
            data-testid={`btn-history-${order.id}`}
          >
            <History className="h-4 w-4 mr-1" />
            Tarix
          </Button>
          <Button variant="outline" size="sm" data-testid={`btn-view-${order.id}`}>
            <Eye className="h-4 w-4 mr-1" />
            Ko'rish
          </Button>
          <Button
            variant="outline"
            size="sm"
            data-testid={`btn-tech-card-${order.id}`}
            disabled={isPrepressPending}
            onClick={() => onTechCard(order)}
          >
            <FileText className="h-4 w-4 mr-1" />
            {techCardLabel}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onReject(order)}
            data-testid={`btn-reject-${order.id}`}
          >
            <XCircle className="h-4 w-4 mr-1" />
            Rad etish
          </Button>
          <Button
            size="sm"
            onClick={() => onApprove(order)}
            data-testid={`btn-approve-${order.id}`}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Tasdiqlash
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
