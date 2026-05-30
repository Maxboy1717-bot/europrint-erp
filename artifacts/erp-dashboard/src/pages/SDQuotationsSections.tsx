/**
 * @module SDQuotationsSections
 * @description Major section components for the SDQuotations page:
 * status badge helper, default form values factory, status summary cards,
 * and quotation list table.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Clock,
  Send,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  ArrowRightLeft,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { useTranslation } from '@/lib/i18n';
import {
  generateQuotationNumber,
  type QuotationFormData,
  type Quotation,
} from "./SDQuotationsTypes";

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

export function getStatusBadge(status: string, t: ReturnType<typeof useTranslation>["t"]) {
  switch (status) {
    case "draft":
      return (
        <Badge className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold border-none">
          <Clock className="h-3 w-3 mr-1" />{t("draft")}
        </Badge>
      );
    case "sent":
      return (
        <Badge className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold border-none">
          <Send className="h-3 w-3 mr-1" />{t("yuborilgan")}
        </Badge>
      );
    case "accepted":
      return (
        <Badge className="bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold border-none">
          <CheckCircle className="h-3 w-3 mr-1" />{t("qabulQilindi")}
        </Badge>
      );
    case "rejected":
      return (
        <Badge className="bg-red-100 text-red-800 rounded-full px-2.5 py-0.5 text-xs font-semibold border-none">
          <XCircle className="h-3 w-3 mr-1" />{t("radEtildi")}
        </Badge>
      );
    case "expired":
      return (
        <Badge className="bg-amber-100 text-amber-800 rounded-full px-2.5 py-0.5 text-xs font-semibold border-none">
          <AlertCircle className="h-3 w-3 mr-1" />{t("muddatiOtgan")}
        </Badge>
      );
    case "converted":
      return (
        <Badge className="bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold border-none">
          <RefreshCw className="h-3 w-3 mr-1" />{t("aylantirilgan")}
        </Badge>
      );
    default:
      return (
        <Badge className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold border-none">
          {status}
        </Badge>
      );
  }
}

// ---------------------------------------------------------------------------
// Default form values factory
// ---------------------------------------------------------------------------

export function defaultFormValues(): QuotationFormData {
  return {
    quotationNumber: generateQuotationNumber(),
    customerId: "",
    customerName: "",
    quotationDate: new Date().toISOString().split("T")[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    status: "draft",
    currency: "UZS",
    paymentTerms: "",
    notes: "",
    netValue: 0,
    taxAmount: 0,
    totalValue: 0,
  };
}

// ---------------------------------------------------------------------------
// Status summary cards
// ---------------------------------------------------------------------------

export interface StatusCounts {
  draft: number;
  sent: number;
  accepted: number;
  rejected: number;
  expired: number;
  converted: number;
}

export interface QuotationStatusCardsProps {
  statusCounts: StatusCounts;
}

export function QuotationStatusCards({ statusCounts }: QuotationStatusCardsProps) {
  const cards = [
    { label: "Qoralama",       count: statusCounts.draft,     color: "text-foreground" },
    { label: "Yuborilgan",     count: statusCounts.sent,      color: "text-foreground" },
    { label: "Qabul qilindi",  count: statusCounts.accepted,  color: "text-[var(--ep-green)]" },
    { label: "Rad etildi",     count: statusCounts.rejected,  color: "text-[var(--ep-red)]" },
    { label: "Muddati o'tgan", count: statusCounts.expired,   color: "text-[var(--ep-yellow)]" },
    { label: "Aylantirilgan",  count: statusCounts.converted, color: "text-primary" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      {cards.map(({ label, count, color }) => (
        <div key={label} className="bg-card rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className={`text-4xl font-bold tracking-tight mt-1 ${color}`}>{count}</p>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Quotation list table
// ---------------------------------------------------------------------------

export interface QuotationTableProps {
  filteredQuotations: Quotation[];
  statusFilter: string;
  onStatusFilterChange: (filter: string) => void;
  onView: (quotation: Quotation) => void;
  onEdit: (quotation: Quotation) => void;
  onConvert: (id: string) => void;
  onDelete: (id: string) => void;
}

export function QuotationTable({
  filteredQuotations,
  statusFilter,
  onStatusFilterChange,
  onView,
  onEdit,
  onConvert,
  onDelete,
}: QuotationTableProps) {
  const { t } = useTranslation("common");
  const safeQuotations = Array.isArray(filteredQuotations) ? filteredQuotations : [];

  return (
    <div className="bg-card rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t("takliflarRoyxati")}
        </h2>
        <div className="flex items-center gap-2">
          {(["all", "draft", "sent", "accepted"] as const).map((f) => (
            <Button
              key={f}
              variant={statusFilter === f ? "default" : "outline"}
              size="sm"
              onClick={() => onStatusFilterChange(f)}
            >
              {{ all: "Hammasi", draft: "Qoralama", sent: "Yuborilgan", accepted: "Qabul qilingan" }[f]}
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-md border overflow-hidden">
        <div className="ep-table-scroll"><Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-none">
              {["Raqam", "Mijoz", "Sana", "Amal qilish", "Jami summa", "Holat", "Amallar"].map((h) => (
                <TableHead
                  key={h}
                  className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6"
                >
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {safeQuotations.map((quotation) => (
              <TableRow
                key={quotation.id}
                className="hover:bg-muted/40 transition-colors border-none"
                data-testid={`row-quotation-${quotation.id}`}
              >
                <TableCell className="py-3 px-6 font-medium" data-testid={`text-quotation-number-${quotation.id}`}>
                  {quotation.quotationNumber}
                </TableCell>
                <TableCell className="py-3 px-6" data-testid={`text-customer-name-${quotation.id}`}>
                  {quotation.customerName}
                </TableCell>
                <TableCell className="py-3 px-6" data-testid={`text-quotation-date-${quotation.id}`}>
                  {quotation.quotationDate}
                </TableCell>
                <TableCell className="py-3 px-6" data-testid={`text-valid-until-${quotation.id}`}>
                  {quotation.validUntil}
                </TableCell>
                <TableCell className="py-3 px-6 text-right font-bold" data-testid={`text-total-value-${quotation.id}`}>
                  {formatCurrency(quotation.totalValue, quotation.currency)}
                </TableCell>
                <TableCell className="py-3 px-6" data-testid={`badge-status-${quotation.id}`}>
                  {getStatusBadge(quotation.status, t)}
                </TableCell>
                <TableCell className="py-3 px-6 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onView(quotation)}
                      data-testid={`button-view-${quotation.id}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(quotation)}
                      disabled={quotation.status === "converted"}
                      data-testid={`button-edit-${quotation.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {(quotation.status === "accepted" || quotation.status === "sent") && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onConvert(quotation.id)}
                        title={t("buyurtmagaAylantirish")}
                        data-testid={`button-convert-${quotation.id}`}
                      >
                        <ArrowRightLeft className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(quotation.id)}
                      disabled={quotation.status === "converted"}
                      data-testid={`button-delete-${quotation.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table></div>
      </div>
    </div>
  );
}
