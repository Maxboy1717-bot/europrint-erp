/**
 * @module DetailSheetCustomer360
 * @description "Mijoz 360°" tab-content component for the DetailSheet.
 * Shows aggregate statistics and recent activities for contact / company
 * entities, plus full contact or company field listings.
 */

import { TabsContent } from "@/components/ui/tabs";
import { Phone, Mail, User, Building2, CheckCircle, AlertCircle, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/format";
import type { Contact, Company, Proposal, EntityData } from "./crm-types";
import type { CrmActivity, SdOrder } from "./DetailSheetTypes";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Customer360SectionProps {
  entity: EntityData | undefined;
  entityType: string;
  sdOrders: SdOrder[];
  activities: CrmActivity[];
  proposals: Proposal[];
  historyData: unknown[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Customer360Section({
  entity,
  entityType,
  sdOrders,
  activities,
  proposals,
  historyData,
}: Customer360SectionProps) {
  return (
    <TabsContent value="360" className="m-0 space-y-4">
      {/* Header card */}
      <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
        <h3 className="font-semibold text-purple-800 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Mijoz 360° Ko'rinishi
        </h3>
        <p className="text-xs text-[var(--ep-purple)] mt-1">To'liq mijoz ma'lumotlari va tarix</p>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3 bg-blue-50 rounded-lg text-center">
          <p className="text-2xl font-bold text-[var(--ep-blue)]">{sdOrders.length}</p>
          <p className="text-xs text-muted-foreground">Buyurtmalar</p>
        </div>
        <div className="p-3 bg-green-50 rounded-lg text-center">
          <p className="text-2xl font-bold text-[var(--ep-green)]">{activities.length}</p>
          <p className="text-xs text-muted-foreground">Faoliyatlar</p>
        </div>
        <div className="p-3 bg-purple-50 rounded-lg text-center">
          <p className="text-2xl font-bold text-[var(--ep-purple)]">{proposals.length}</p>
          <p className="text-xs text-muted-foreground">Takliflar</p>
        </div>
        <div className="p-3 bg-amber-50 rounded-lg text-center">
          <p className="text-2xl font-bold text-[var(--ep-yellow)]">{historyData.length}</p>
          <p className="text-xs text-muted-foreground">Amallar</p>
        </div>
      </div>

      {/* Recent activities */}
      <div>
        <h4 className="text-sm font-semibold mb-2">Oxirgi faoliyatlar</h4>
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-3">Faoliyatlar yo'q</p>
        ) : (
          <div className="space-y-2">
            {activities.slice(0, 5).map((act) => (
              <div key={act.id} className="flex items-start gap-2 p-2 border rounded text-sm">
                {act.isDone ? (
                  <CheckCircle className="h-4 w-4 text-[var(--ep-green)] mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-[var(--ep-primary)] mt-0.5 shrink-0" />
                )}
                <div>
                  <p className="font-medium">{act.subject}</p>
                  <p className="text-xs text-muted-foreground">
                    {act.type} •{" "}
                    {act.dueDate ? format(new Date(act.dueDate), "dd.MM.yyyy") : "—"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contact details */}
      {entityType === "contacts" && entity && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold mb-2">Kontakt ma'lumotlari</h4>
          <div className="space-y-2 text-sm">
            {(entity as Contact).post && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{(entity as Contact).post}</span>
              </div>
            )}
            {(Array.isArray((entity as Contact).phones) ? (entity as Contact).phones : []).map(
              (p, i) => (
                <div key={`ph-${i}`} className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-[var(--ep-blue)]" />
                  <span>{p.value}</span>
                </div>
              ),
            )}
            {(Array.isArray((entity as Contact).emails) ? (entity as Contact).emails : []).map(
              (e, i) => (
                <div key={`em-${i}`} className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-[var(--ep-green)]" />
                  <span>{e.value}</span>
                </div>
              ),
            )}
          </div>
        </div>
      )}

      {/* Company details */}
      {entityType === "companies" && entity && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold mb-2">Kompaniya ma'lumotlari</h4>
          <div className="space-y-2 text-sm">
            {(entity as Company).industry && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>{(entity as Company).industry}</span>
              </div>
            )}
            {(entity as Company).address && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">📍</span>
                <span>{(entity as Company).address}</span>
              </div>
            )}
            {(Array.isArray((entity as Company).phones) ? (entity as Company).phones : []).map(
              (p, i) => (
                <div key={`cph-${i}`} className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-[var(--ep-blue)]" />
                  <span>{p.value}</span>
                </div>
              ),
            )}
          </div>
        </div>
      )}
    </TabsContent>
  );
}
