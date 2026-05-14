/**
 * @module ThreeWayMatchPage
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ModulePage } from "@/components/ui/module-page";
import { Skeleton } from "@/components/ui/skeleton";
import { GitCompare, Search, CheckCircle2, XCircle, AlertCircle, Play } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { EPErrorState } from "@/components/ep";

interface MatchResult {
  id?: string | number;
  poId?: number;
  po_id?: number;
  grId?: number;
  gr_id?: number;
  vendorInvoiceId?: string;
  vendor_invoice_id?: string;
  status?: string;
  variance?: number;
  poAmount?: number;
  po_amount?: number;
  grAmount?: number;
  gr_amount?: number;
  invoiceAmount?: number;
  invoice_amount?: number;
  matchedAt?: string;
  matched_at?: string;
  performedBy?: number;
  performed_by?: number;
}

const MATCH_STATUS: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: React.ReactNode }> = {
  matched:   { label: "Mos keldi",    variant: "default",     icon: <CheckCircle2 className="h-3 w-3" /> },
  partial:   { label: "Qisman",       variant: "secondary",   icon: <AlertCircle  className="h-3 w-3" /> },
  mismatch:  { label: "Mos kelmadi",  variant: "destructive", icon: <XCircle      className="h-3 w-3" /> },
  pending:   { label: "Kutilmoqda",   variant: "outline",     icon: <AlertCircle  className="h-3 w-3" /> },
};

const fmtAmount = (v?: number) =>
  v !== undefined ? Number(v).toLocaleString("uz-UZ") + " so'm" : "—";

export default function ThreeWayMatchPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [showPerform, setShowPerform] = useState(false);
  const [form, setForm] = useState({ poId: "", grId: "", vendorInvoiceId: "" });

  const { data: rawData, isLoading, isError, refetch } = useQuery<MatchResult[] | { data?: MatchResult[] }>({
    queryKey: ["/api/3way-match/results"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/3way-match/results");
      return res.json();
    },
  });

  const results: MatchResult[] = Array.isArray(rawData)
    ? rawData
    : (rawData as { data?: MatchResult[] })?.data ?? [];

  const performMutation = useMutation({
    mutationFn: async (dto: typeof form) => {
      const res = await apiRequest("POST", "/api/3way-match/perform", {
        poId:            parseInt(dto.poId, 10),
        grId:            parseInt(dto.grId, 10),
        vendorInvoiceId: dto.vendorInvoiceId,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/3way-match/results"] });
      toast({ title: "3-tomonlama solishtirish bajarildi" });
      setShowPerform(false);
      setForm({ poId: "", grId: "", vendorInvoiceId: "" });
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Solishtirish bajarishda xatolik", variant: "destructive" });
    },
  });

  if (isError) return <EPErrorState onRetry={refetch} />;

  const filtered = results.filter(r => {
    const inv = r.vendorInvoiceId ?? r.vendor_invoice_id ?? "";
    const poId = String(r.poId ?? r.po_id ?? "");
    return inv.toLowerCase().includes(search.toLowerCase()) || poId.includes(search);
  });

  const canSubmit = form.poId.trim() && form.grId.trim() && form.vendorInvoiceId.trim();

  return (
    <ModulePage
      module="finance"
      title="3-Tomonlama Solishtirish"
      icon={<GitCompare className="h-5 w-5" />}
      actions={
        <Button onClick={() => setShowPerform(true)} data-testid="button-perform-match">
          <Play className="h-4 w-4 mr-2" />
          Solishtirish
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Hisob-faktura yoki PO raqami..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-match"
          />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {([1, 2, 3]).map(i => (
              <Card key={`k-${i}`}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32 rounded-lg" />
                    <Skeleton className="h-3 w-48 rounded-lg" />
                  </div>
                  <Skeleton className="h-6 w-24 rounded-lg" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <GitCompare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {search ? "Qidiruv natijasi topilmadi" : "Solishtirish natijalari yo'q"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((r, idx) => {
              const status = r.status ?? "pending";
              const sc = MATCH_STATUS[status] ?? MATCH_STATUS.pending;
              const invoiceId = r.vendorInvoiceId ?? r.vendor_invoice_id ?? "—";
              const poId = r.poId ?? r.po_id;
              const grId = r.grId ?? r.gr_id;
              const matchedAt = r.matchedAt ?? r.matched_at;
              return (
                <Card key={r.id ?? idx} className="hover:shadow-md transition-shadow" data-testid={`card-match-${r.id ?? idx}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm font-mono">{invoiceId}</span>
                          {poId !== undefined && (
                            <span className="text-xs text-muted-foreground">PO #{poId}</span>
                          )}
                          {grId !== undefined && (
                            <span className="text-xs text-muted-foreground">GR #{grId}</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          {(r.poAmount ?? r.po_amount) !== undefined && (
                            <span>PO: {fmtAmount(r.poAmount ?? r.po_amount)}</span>
                          )}
                          {(r.grAmount ?? r.gr_amount) !== undefined && (
                            <span>GR: {fmtAmount(r.grAmount ?? r.gr_amount)}</span>
                          )}
                          {(r.invoiceAmount ?? r.invoice_amount) !== undefined && (
                            <span>Faktura: {fmtAmount(r.invoiceAmount ?? r.invoice_amount)}</span>
                          )}
                          {r.variance !== undefined && (
                            <span className={r.variance !== 0 ? "text-destructive" : "text-[var(--ep-green)]"}>
                              Farq: {fmtAmount(r.variance)}
                            </span>
                          )}
                        </div>
                        {matchedAt && (
                          <p className="text-xs text-muted-foreground">
                            {new Date(matchedAt).toLocaleString("uz-UZ", { dateStyle: "short", timeStyle: "short" })}
                          </p>
                        )}
                      </div>
                      <Badge variant={sc.variant} className="gap-1 text-xs shrink-0">
                        {sc.icon}{sc.label}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Perform dialog */}
      <Dialog open={showPerform} onOpenChange={setShowPerform}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">Yangi solishtirish</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>PO ID *</Label>
              <Input
                type="number"
                value={form.poId}
                onChange={e => setForm(f => ({ ...f, poId: e.target.value }))}
                placeholder="Xarid buyurtmasi ID"
                data-testid="input-match-po-id"
              />
            </div>
            <div className="space-y-1.5">
              <Label>GR ID *</Label>
              <Input
                type="number"
                value={form.grId}
                onChange={e => setForm(f => ({ ...f, grId: e.target.value }))}
                placeholder="Tovar qabul qilish ID"
                data-testid="input-match-gr-id"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Hisob-faktura raqami *</Label>
              <Input
                value={form.vendorInvoiceId}
                onChange={e => setForm(f => ({ ...f, vendorInvoiceId: e.target.value }))}
                placeholder="INV-2024-001"
                data-testid="input-match-invoice-id"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPerform(false)}>Bekor</Button>
            <Button
              onClick={() => { if (canSubmit) performMutation.mutate(form); }}
              disabled={!canSubmit || performMutation.isPending}
              data-testid="button-confirm-perform-match"
            >
              {performMutation.isPending ? "Bajarilmoqda..." : "Solishtirish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ModulePage>
  );
}
