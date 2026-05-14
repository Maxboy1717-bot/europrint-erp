/**
 * @module DetailSheetSections
 * @description "Umumiy" (General) tab-content section component for the
 * DetailSheet. Shows core entity fields, phone, email, SD orders, and
 * activity summary.
 *
 * Related files:
 *   - DetailSheetProposals.tsx  — "Takliflar" tab
 *   - DetailSheetCustomer360.tsx — "Mijoz 360°" tab
 *   - DetailSheetTabs.tsx       — "Tarix" and "AI Tahlil" tabs
 */

import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";
import { Phone, Mail, Clock, ShoppingCart, User, Building2 } from "lucide-react";
import { format } from "date-fns";
import { uz } from "date-fns/locale";
import { formatCurrency } from "@/lib/format";
import type { Lead, Deal, Contact, Company, Proposal, Invoice, EntityData } from "./crm-types";
import type { CrmActivity, SdOrder } from "./DetailSheetTypes";
import { useTranslation } from '@/lib/i18n';
import {
  INVOICE_STATUS_LABELS,
  getEntityTitle,
  getEntityPhone,
  getEntityEmail,
} from "./DetailSheetTypes";
import { EPStatusPill } from "@/components/ep";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface GeneralSectionProps {
  entity: EntityData | undefined;
  entityType: string;
  isLoading: boolean;
  sdOrders: SdOrder[];
  activities: CrmActivity[];
}

// ---------------------------------------------------------------------------
// GeneralSection — "Umumiy" tab
// ---------------------------------------------------------------------------

export function GeneralSection({entity,
  entityType,
  isLoading,
  sdOrders,
  activities,
}: GeneralSectionProps) {
  const { t } = useTranslation('common');
  const phone = getEntityPhone(entity);
  const email = getEntityEmail(entity);
  const title = getEntityTitle(entity, entityType);

  return (
    <TabsContent value="umumiy" className="m-0 space-y-6">
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-full rounded-lg" />
          <Skeleton className="h-8 w-full rounded-lg" />
          <Skeleton className="h-8 w-full rounded-lg" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">{t("name")}</label>
              <div className="font-medium">{title}</div>
            </div>

            {entityType === "deals" && entity && (
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">{t("summa")}</label>
                <div className="font-bold text-[var(--ep-green)] text-lg">
                  {formatCurrency((entity as Deal).opportunity, (entity as Deal).currencyId)}
                </div>
                {(entity as Deal).probability !== undefined && (
                  <div className="text-xs text-muted-foreground">
                    Ehtimollik: {(entity as Deal).probability}%
                  </div>
                )}
              </div>
            )}

            {entityType === "leads" && entity && (
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">{t("holati")}</label>
                <Badge
                  style={{
                    backgroundColor:
                      ({
                        NEW: "#4CAF50",
                        IN_PROGRESS: "#2196F3",
                        ANALYSIS: "#FF9800",
                        FINAL: "#9C27B0",
                        CONVERTED: "#22C55E",
                        WON: "#16A34A",
                        LOST: "#EF4444",
                      } as Record<string, string>)[(entity as Lead).statusId] || "#888",
                    color: "white",
                  }}
                >
                  {(entity as Lead).statusId}
                </Badge>
              </div>
            )}

            {entityType === "proposals" && entity && (
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">{t("summa")}</label>
                <div className="font-bold text-[var(--ep-purple)]">
                  {formatCurrency(
                    (entity as Proposal).totalAmount,
                    (entity as Proposal).currency,
                  )}
                </div>
              </div>
            )}

            {entityType === "invoices" && entity && (
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">{t("tolovHolati")}</label>
                <div>
                  <div className="font-bold text-[var(--ep-yellow)]">
                    {formatCurrency(
                      (entity as Invoice).paidAmount,
                      (entity as Invoice).currency,
                    )}{" "}
                    /{" "}
                    {formatCurrency(
                      (entity as Invoice).totalAmount,
                      (entity as Invoice).currency,
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs mt-1">
                    {INVOICE_STATUS_LABELS[(entity as Invoice).status] ||
                      (entity as Invoice).status}
                  </Badge>
                </div>
              </div>
            )}
          </div>

          {phone && (
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">{t("phone")}</label>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-[var(--ep-blue)]" />
                <a href={`tel:${phone}`} className="text-[var(--ep-blue)] hover:underline">{phone}</a>
              </div>
            </div>
          )}

          {email && (
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">{t('email1')}</label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-[var(--ep-green)]" />
                <a href={`mailto:${email}`} className="text-[var(--ep-green)] hover:underline">{email}</a>
              </div>
            </div>
          )}

          {entityType === "contacts" && entity && (entity as Contact).post && (
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">{t("lavozim1")}</label>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{(entity as Contact).post}</span>
              </div>
            </div>
          )}

          {entityType === "companies" && entity && (entity as Company).industry && (
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">{t("soha")}</label>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>{(entity as Company).industry}</span>
              </div>
            </div>
          )}

          {entityType === "companies" && entity && (entity as Company).address && (
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">{t("address")}</label>
              <div className="text-sm">{(entity as Company).address}</div>
            </div>
          )}

          {entity?.dateCreate && (
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">{t("Yaratilgan")}</label>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  {format(new Date(entity.dateCreate), "dd MMMM yyyy, HH:mm", { locale: uz })}
                </span>
              </div>
            </div>
          )}

          {entityType === "deals" && sdOrders.length > 0 && (
            <div className="space-y-2 border-t pt-4">
              <label className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                <ShoppingCart className="h-3.5 w-3.5" />
                SD Buyurtmalar ({sdOrders.length})
              </label>
              <div className="space-y-2">
                {sdOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200 text-sm"
                  >
                    <span className="font-medium text-[var(--ep-green)]">{order.documentNumber}</span>
                    <Badge variant="outline" className="text-xs">{order.overallStatus}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activities.length > 0 && (
            <div className="space-y-1 border-t pt-4">
              <label className="text-xs text-muted-foreground">{t("faoliyatlar")}</label>
              <div className="flex items-center gap-2">
                <EPStatusPill tone="neutral">
                  {activities.filter((a) => !a.isDone).length} ta aktiv
                </EPStatusPill>
                <Badge variant="outline">
                  {activities.filter((a) => a.isDone).length} ta bajarilgan
                </Badge>
              </div>
            </div>
          )}
        </div>
      )}
    </TabsContent>
  );
}
