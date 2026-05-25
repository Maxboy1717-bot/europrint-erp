/**
 * CustomerCard — CRM Customer 360 (5 tab).
 * Spec: Umumiy / Buyurtmalar / Moliya / Muloqot / AI tavsiyalar
 */
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, ShoppingBag, Wallet, MessageSquare, Sparkles, Mail, Phone, Calendar, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

import { EPLoader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
import { tLabel } from '@/lib/i18n/tLabel';
interface Customer360 {
  customer: Record<string, any> | null;
  deals:    Array<Record<string, any>>;
  payments: Array<Record<string, any>>;
}

interface ChurnRes {
  risk:      'low' | 'medium' | 'high';
  reasonsUz: string[];
}

export function CustomerCard({ customerId }: { customerId: number }) {
  const { t } = useTranslation("common");
  const c360 = useQuery<Customer360>({
    queryKey: ['/api/agents/crm/customer360', customerId],
    queryFn: () => apiRequest<Customer360>('GET', `/api/agents/crm/customer360/${customerId}`),
  });

  const churn = useQuery<ChurnRes>({
    queryKey: ['/api/agents/crm/churn', customerId],
    queryFn: () => apiRequest<ChurnRes>('GET', `/api/agents/crm/churn/${customerId}`),
  });

  const customer = c360.data?.customer ?? {};
  const customerName = customer.name ?? customer.title ?? `Mijoz #${customerId}`;

  if (c360.isLoading) {
    return (
      <Card className="p-12 text-center">
        <EPLoader size={24} className="mx-auto" />
        <p className="text-sm text-muted-foreground mt-2">{t("Yuklanmoqda...")}</p>
      </Card>
    );
  }

  if (!c360.data?.customer) {
    return (
      <Card className="p-12 text-center text-muted-foreground">
        <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-[var(--ep-yellow)]" />
        <p>Mijoz #{customerId} topilmadi</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="border-b p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-[var(--ep-blue)] text-white flex items-center justify-center text-xl font-bold">
              {customerName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold">{customerName}</h2>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> ID #{customerId}</span>
                {customer.email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {customer.email}</span>}
                {customer.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {customer.phone}</span>}
              </div>
            </div>
          </div>
          {churn.data && (
            <div className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase ${
              churn.data.risk === 'high' ? 'bg-red-100 text-red-800' :
              churn.data.risk === 'medium' ? 'bg-amber-100 text-amber-800' :
              'bg-emerald-100 text-emerald-800'
            }`}>
              Churn: {churn.data.risk}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="p-5">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="overview"><Building2 className="h-3.5 w-3.5 mr-1.5" />{t("umumiy")}</TabsTrigger>
          <TabsTrigger value="orders"><ShoppingBag className="h-3.5 w-3.5 mr-1.5" />{t("buyurtmalar")}</TabsTrigger>
          <TabsTrigger value="finance"><Wallet className="h-3.5 w-3.5 mr-1.5" />{t("moliya")}</TabsTrigger>
          <TabsTrigger value="messages"><MessageSquare className="h-3.5 w-3.5 mr-1.5" />{t("muloqot")}</TabsTrigger>
          <TabsTrigger value="ai"><Sparkles className="h-3.5 w-3.5 mr-1.5" />{tLabel('common.CustomerCard.aiTavsiyalar', "AI tavsiyalar")}</TabsTrigger>
        </TabsList>

        {/* Umumiy */}
        <TabsContent value="overview" className="space-y-3 mt-4">
          <h3 className="text-xs font-bold uppercase text-muted-foreground">{t("asosiyMalumotlar")}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <Field label={t("name")}      value={customer.name ?? customer.title} />
            <Field label={t("address")}    value={customer.address} />
            <Field label="INN"       value={customer.inn} />
            <Field label={t("Yaratilgan")} value={customer.created_at ? new Date(customer.created_at).toLocaleDateString('uz-UZ') : '—'} />
          </div>
        </TabsContent>

        {/* Buyurtmalar */}
        <TabsContent value="orders" className="mt-4">
          <h3 className="text-xs font-bold uppercase text-muted-foreground mb-3">So'nggi 12 oy buyurtmalari ({c360.data.deals.length})</h3>
          {c360.data.deals.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">{t("buyurtmalarYoq")}</p>
          ) : (
            <div className="space-y-2">
              {c360.data.deals.slice(0, 10).map((d, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-semibold text-sm">{d.title ?? `Deal #${d.id}`}</div>
                    <div className="text-xs text-muted-foreground">
                      {d.created_at ? new Date(d.created_at).toLocaleDateString('uz-UZ') : '—'} · {d.stage_id ?? '—'}
                    </div>
                  </div>
                  <div className="font-bold tabular-nums">
                    {Number(d.opportunity ?? 0).toLocaleString()} so'm
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Moliya */}
        <TabsContent value="finance" className="mt-4">
          <h3 className="text-xs font-bold uppercase text-muted-foreground mb-3">To'lovlar tarixi ({c360.data.payments.length})</h3>
          {c360.data.payments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">{t("tolovlarYoq")}</p>
          ) : (
            <div className="space-y-2">
              {c360.data.payments.slice(0, 10).map((p, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{p.paid_at ? new Date(p.paid_at).toLocaleDateString('uz-UZ') : '—'}</span>
                  </div>
                  <div className="font-bold tabular-nums text-[var(--ep-green)]">
                    +{Number(p.amount ?? 0).toLocaleString()} so'm
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Muloqot */}
        <TabsContent value="messages" className="mt-4">
          <p className="text-sm text-muted-foreground text-center py-6">
            {t("timelineKelajakdaCrmActivitiesJadvalidan")}
          </p>
        </TabsContent>

        {/* AI tavsiyalar */}
        <TabsContent value="ai" className="mt-4 space-y-3">
          {churn.isLoading ? <EPLoader /> : churn.data && (
            <div className={`p-4 border rounded-lg ${
              churn.data.risk === 'high' ? 'bg-red-50 border-red-200' :
              churn.data.risk === 'medium' ? 'bg-amber-50 border-amber-200' :
              'bg-emerald-50 border-emerald-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4" />
                <h4 className="font-bold text-sm">{t("churnXavfiTahlili")}</h4>
              </div>
              <div className="text-2xl font-bold uppercase mb-2">{churn.data.risk}</div>
              <ul className="text-xs space-y-1">
                {churn.data.reasonsUz.map((r, i) => <li key={i}>• {r}</li>)}
              </ul>
            </div>
          )}
          <p className="text-xs text-muted-foreground italic text-center mt-4">
            Keyingi bosqich: getNextBestAction (Claude) — bu mijoz uchun hozir nima qilish kerak
          </p>
        </TabsContent>
      </Tabs>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string | number | boolean | null | undefined }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value ?? '—'}</div>
    </div>
  );
}
