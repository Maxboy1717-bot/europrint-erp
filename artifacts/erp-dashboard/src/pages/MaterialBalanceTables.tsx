/**
 * @module MaterialBalanceTables
 * @description Requests and Production tab-content sections for the Material
 * Balance page. Also exports the statusBadge helper used in the Requests
 * table.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { safeArray } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/format";
import {
  CheckCircle,
  ArrowDownToLine,
  ClipboardList,
  Package,
} from "lucide-react";
import { SkeletonRows } from "./MaterialBalanceSections";
import { useTranslation } from '@/lib/i18n';
import type {
  InternalRequest,
  InternalRequestsResponse,
  ProductionStock,
} from "./MaterialBalanceTypes";

// ---------------------------------------------------------------------------
// statusBadge helper
// ---------------------------------------------------------------------------

export function statusBadge(status: string) {
  const { t } = useTranslation('common');
  const labelMap: Record<string, string> = {
    pending: "Kutmoqda",
    approved: "Tasdiqlangan",
    issued: "Berildi",
    rejected: "Rad etildi",
    cancelled: "Bekor",
  };
  const variantMap: Record<string, "default" | "secondary" | "destructive"> = {
    pending: "secondary",
    approved: "default",
    issued: "default",
    rejected: "destructive",
    cancelled: "destructive",
  };
  return (
    <Badge
      variant={variantMap[status] || "secondary"}
      data-testid={`badge-status-${status}`}
    >
      {labelMap[status] || status}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// RequestsSection
// ---------------------------------------------------------------------------

interface RequestsSectionProps {
  requests: InternalRequestsResponse | undefined;
  requestsLoading: boolean;
  onApprove: (id: string) => void;
  onIssue: (id: string) => void;
  approvePending: boolean;
  issuePending: boolean;
}

export function RequestsSection({ requests, requestsLoading, onApprove, onIssue, approvePending, issuePending, }: RequestsSectionProps) {
  const { t } = useTranslation('common');
  const rows = safeArray<InternalRequest>(requests, "data");

  return (
    <div className="mt-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            Ichki material so'rovlar
          </CardTitle>
        </CardHeader>
        <CardContent>
          {requestsLoading ? (
            <SkeletonRows />
          ) : (
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Holat</TableHead>
                  <TableHead>{t('Material')}</TableHead>
                  <TableHead className="text-right">Miqdor</TableHead>
                  <TableHead>So'rovchi</TableHead>
                  <TableHead>Maqsad</TableHead>
                  <TableHead>Muhimlik</TableHead>
                  <TableHead>Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id} data-testid={`row-request-${r.id}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell>{statusBadge(r.status)}</TableCell>
                    <TableCell className="font-medium">
                      {r.materialName}
                    </TableCell>
                    <TableCell className="text-right">
                      {r.quantity} {r.unitOfMeasure}
                    </TableCell>
                    <TableCell className="text-sm">
                      {r.requesterName || r.requestedBy}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">
                      {r.purpose || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          r.priority === "urgent" ? "destructive" : "secondary"
                        }
                      >
                        {r.priority === "urgent"
                          ? "Shoshilinch"
                          : r.priority === "high"
                          ? "Yuqori"
                          : "Oddiy"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {r.status === "pending" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            data-testid={`button-approve-${r.id}`}
                            onClick={() => onApprove(r.id)}
                            disabled={approvePending}
                          >
                            <CheckCircle className="w-4 h-4 text-[var(--ep-green)]" />
                          </Button>
                        )}
                        {r.status === "approved" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            data-testid={`button-issue-${r.id}`}
                            onClick={() => onIssue(r.id)}
                            disabled={issuePending}
                          >
                            <ArrowDownToLine className="w-4 h-4 text-[var(--ep-blue)]" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground py-8"
                    >
                      So'rovlar mavjud emas
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table></div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ProductionSection
// ---------------------------------------------------------------------------

interface ProductionSectionProps {
  production: { success: boolean; data: ProductionStock[] } | undefined;
  productionLoading: boolean;
}

export function ProductionSection({ production, productionLoading, }: ProductionSectionProps) {
  const { t } = useTranslation('common');
  return (
    <div className="mt-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="w-5 h-5" />
            Ishlab chiqarish uchun materiallar
          </CardTitle>
        </CardHeader>
        <CardContent>
          {productionLoading ? (
            <SkeletonRows />
          ) : (
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kod</TableHead>
                  <TableHead>{t('Material')}</TableHead>
                  <TableHead className="text-right">Joriy qoldiq</TableHead>
                  <TableHead className="text-right">Min zaxira</TableHead>
                  <TableHead>O'lchov</TableHead>
                  <TableHead>Ombor</TableHead>
                  <TableHead className="text-right">Narx</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {production?.data?.map((m) => (
                  <TableRow
                    key={m.materialId}
                    data-testid={`row-prod-${m.materialId}`}
                   className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-mono text-sm">{m.kod}</TableCell>
                    <TableCell className="font-medium">{m.xomAshyo}</TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          m.currentStock <= 0
                            ? "text-[var(--ep-red)] dark:text-red-400 font-bold"
                            : m.currentStock < m.minStock
                            ? "text-[var(--ep-yellow)] dark:text-yellow-400 font-semibold"
                            : ""
                        }
                      >
                        {m.currentStock}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {m.minStock}
                    </TableCell>
                    <TableCell>{m.unitOfMeasure}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {m.warehouseName || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {m.unitPrice ? formatCurrency(m.unitPrice) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
                {(production?.data?.length ?? 0) === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground py-8"
                    >
                      Ma'lumot topilmadi
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table></div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
