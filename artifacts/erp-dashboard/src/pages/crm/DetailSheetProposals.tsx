/**
 * @module DetailSheetProposals
 * @description "Takliflar" tab-content component for the DetailSheet.
 * Renders the proposals and invoices lists for a CRM deal entity.
 */

import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";
import { FileText, Package } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { Proposal, Invoice } from "./crm-types";
import { PROPOSAL_STATUS_LABELS, INVOICE_STATUS_LABELS } from "./DetailSheetTypes";
import { useTranslation } from '@/lib/i18n';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ProposalsInvoicesSectionProps {
  proposals: Proposal[];
  invoices: Invoice[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProposalsInvoicesSection({
  proposals,
  invoices,
}: ProposalsInvoicesSectionProps) {
  const { t } = useTranslation("common");
  return (
    <TabsContent value="tovarlar" className="m-0 space-y-4">
      {/* Proposals */}
      <div>
        <h3 className="text-sm font-semibold mb-3">{t("takliflar")}</h3>
        {proposals.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
            {t("takliflarYoq")}
          </div>
        ) : (
          <div className="space-y-2">
            {proposals.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium text-sm">{p.title || p.number}</p>
                  <p className="text-xs text-muted-foreground">{p.number}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-[var(--ep-purple)]">
                    {formatCurrency(p.totalAmount, p.currency)}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {PROPOSAL_STATUS_LABELS[p.status] || p.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invoices */}
      <div className="border-t pt-4">
        <h3 className="text-sm font-semibold mb-3">{t("fakturalar")}</h3>
        {invoices.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
            {t("fakturalarYoq")}
          </div>
        ) : (
          <div className="space-y-2">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium text-sm">{inv.title || inv.number}</p>
                  <p className="text-xs text-muted-foreground">{inv.number}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-[var(--ep-yellow)]">
                    {formatCurrency(inv.totalAmount, inv.currency)}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {INVOICE_STATUS_LABELS[inv.status] || inv.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </TabsContent>
  );
}
