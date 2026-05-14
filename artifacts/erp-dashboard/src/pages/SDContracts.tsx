/**
 * @module SDContracts
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, fetchWithAuth } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PageState } from "@/components/ui/page-state";
import { useToast } from "@/hooks/use-toast";
import { FileCheck, Search, CheckCircle, Clock, Eye } from "lucide-react";
import { EPPageHeader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

interface ContractItem {
  id: string;
  contractNumber: string | null;
  orderId: string | null;
  orderNumber: string | null;
  templateType: string | null;
  papkaNo: string | null;
  status: string;
  signedAt: string | null;
  createdAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Qoralama",
  sent: "Yuborildi",
  signed: "Imzolandi",
  cancelled: "Bekor qilindi",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-amber-100 text-amber-800 rounded-full px-2.5 py-0.5 text-xs font-semibold",
  sent: "bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold",
  signed: "bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold",
  cancelled: "bg-red-100 text-red-800 rounded-full px-2.5 py-0.5 text-xs font-semibold",
};

const TEMPLATE_LABELS: Record<string, string> = {
  standard: "Standart",
  vip: "VIP mijoz",
  oneTime: "Bir martalik",
};

export default function SDContracts() {
  const { t } = useTranslation("common");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<ContractItem | null>(null);
  const [signDialog, setSignDialog] = useState<ContractItem | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: contracts = [], isLoading, isError, refetch } = useQuery<ContractItem[]>({
    queryKey: ["/api/sd/contracts", search, statusFilter],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (search) p.append("search", search);
      if (statusFilter !== "all") p.append("status", statusFilter);
      return fetchWithAuth(`/api/sd/contracts?${p}`) as Promise<ContractItem[]>;
    },
  });

  const signMut = useMutation({
    mutationFn: (id: string) =>
      apiRequest("PATCH", `/api/sd/contracts/${id}/sign`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/sd/contracts"] });
      setSignDialog(null);
      toast({ title: "Shartnoma imzolandi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const filtered = (Array.isArray(contracts) ? contracts : []).filter((c) => {
    const q = search.toLowerCase();
    return !q || c.contractNumber?.toLowerCase().includes(q) || c.orderNumber?.toLowerCase().includes(q);
  });

  const stats = {
    total: contracts.length,
    signed: (Array.isArray(contracts) ? contracts : []).filter((c) => c.status === "signed").length,
    pending: (Array.isArray(contracts) ? contracts : []).filter((c) => c.status === "sent" || c.status === "draft").length,
  };

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("shartnomalarBoshqaruvi")}</b></>}
        title={t("shartnomalarBoshqaruvi")}
        subtitle={t("shartnomalarArxiviVaHolatBoshqaruvi")}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("total")}</p>
          <p className="text-4xl font-bold tracking-tight text-foreground mt-1">{stats.total}</p>
        </div>
        <div className="bg-card rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("imzolandi")}</p>
          <p className="text-4xl font-bold tracking-tight text-[var(--ep-green)] mt-1">{stats.signed}</p>
        </div>
        <div className="bg-card rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("Kutilmoqda")}</p>
          <p className="text-4xl font-bold tracking-tight text-[var(--ep-yellow)] mt-1">{stats.pending}</p>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("shartnomaRaqamiYokiBuyurtmaRaqami")}
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
            data-testid="input-search-contracts"
          />
        </div>
        <div className="flex gap-1">
          {(["all", "draft", "sent", "signed", "cancelled"] as const).map(s => (
            <Button
              key={s}
              variant={statusFilter === s ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(s)}
              data-testid={`filter-${s}`}
            >
              {s === "all" ? "Barchasi" : STATUS_LABELS[s]}
            </Button>
          ))}
        </div>
      </div>

      <PageState
        isLoading={isLoading}
        isError={isError}
        isEmpty={filtered.length === 0}
        onRetry={refetch}
        skeleton="table"
        skeletonRows={6}
        skeletonColumns={5}
        errorTitle="Shartnomalar yuklanmadi"
        errorMessage="Server bilan bog'lanishda xatolik. Qayta urinib ko'ring."
        emptyIcon={FileCheck}
        emptyTitle="Shartnomalar topilmadi"
        emptyDescription="Taklifnoma tasdiqlanganida avtomatik yaratiladi."
      >
        <div className="bg-card rounded-xl overflow-hidden border-none">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("shartnoma")}</th>
                <th className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("Buyurtma")}</th>
                <th className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("status28")}</th>
                <th className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("date")}</th>
                <th className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 text-right">{t("Amallar")}</th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(filtered) ? filtered : []).map((c) => (
                <tr key={c.id} className="hover:bg-muted/40 transition-colors cursor-pointer" onClick={() => setSelected(c)} data-testid={`card-contract-${c.id}`}>
                  <td className="py-4 px-6 font-semibold text-foreground">{c.contractNumber || "—"}</td>
                  <td className="py-4 px-6">
                    <div className="text-sm text-foreground font-medium">
                      {c.orderNumber || c.orderId?.slice(0, 8)}
                    </div>
                    {c.templateType && <div className="text-xs text-muted-foreground font-medium">{TEMPLATE_LABELS[c.templateType] || c.templateType}</div>}
                  </td>
                  <td className="py-4 px-6">
                    <span className={STATUS_COLORS[c.status] || ""}>
                      {STATUS_LABELS[c.status] || c.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm">
                    {c.signedAt ? (
                      <span className="text-[var(--ep-green)] flex items-center gap-1 font-semibold">
                        <CheckCircle className="w-3.5 h-3.5" />
                        {new Date(c.signedAt).toLocaleDateString("uz-UZ")}
                      </span>
                    ) : (
                      <span className="text-muted-foreground flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(c.createdAt).toLocaleDateString("uz-UZ")}
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={e => { e.stopPropagation(); setSelected(c); }}
                        data-testid={`btn-view-${c.id}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {c.status !== "signed" && c.status !== "cancelled" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-primary hover:text-primary hover:bg-primary/10"
                          onClick={e => { e.stopPropagation(); setSignDialog(c); }}
                          data-testid={`btn-sign-${c.id}`}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PageState>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">Shartnoma — {selected?.contractNumber}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <Label className="text-muted-foreground text-xs">{t("status28")}</Label>
                  <div className="mt-1">
                    <span className={STATUS_COLORS[selected.status] || ""}>
                      {STATUS_LABELS[selected.status] || selected.status}
                    </span>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">{t("shablonTuri")}</Label>
                  <p className="font-medium mt-1">{TEMPLATE_LABELS[selected.templateType || ''] || selected.templateType}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">{t("Buyurtma")}</Label>
                  <p className="font-medium mt-1">{selected.orderNumber || selected.orderId?.slice(0, 12)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">{t("yaratildi")}</Label>
                  <p className="font-medium mt-1">{new Date(selected.createdAt).toLocaleDateString("uz-UZ")}</p>
                </div>
                {selected.signedAt && (
                  <div>
                    <Label className="text-muted-foreground text-xs">{t("imzolandi")}</Label>
                    <p className="font-medium text-[var(--ep-green)] mt-1">
                      {new Date(selected.signedAt).toLocaleDateString("uz-UZ")}
                    </p>
                  </div>
                )}
              </div>
              {selected.status !== "signed" && selected.status !== "cancelled" && (
                <Button
                  className="w-full"
                  onClick={() => { setSignDialog(selected); setSelected(null); }}
                  data-testid="btn-mark-signed"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {t("imzolandiDebBelgilash")}
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!signDialog} onOpenChange={() => setSignDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">{t("shartnomaniImzolandiDebBelgilash")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            <strong>{signDialog?.contractNumber}</strong> shartnomasi imzolandi deb belgilanadi.
            Bu amalni qaytarib bo'lmaydi.
          </p>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" className="flex-1" onClick={() => setSignDialog(null)}>{t("cancel")}</Button>
            <Button
              className="flex-1"
              onClick={() => signMut.mutate(signDialog?.id || '')}
              disabled={signMut.isPending}
              data-testid="btn-confirm-sign"
            >
              {signMut.isPending ? "Saqlanmoqda..." : "Tasdiqlash"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
