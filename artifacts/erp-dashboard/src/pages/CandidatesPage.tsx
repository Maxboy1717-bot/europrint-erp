/**
 * @module CandidatesPage
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ModulePage } from "@/components/ui/module-page";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPlus, Search, Trash2, Mail, Phone, Briefcase } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { EPErrorState } from "@/components/ep";

import { useTranslation } from '@/lib/i18n';
interface Candidate {
  id: string;
  fullName?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  position?: string;
  status?: string;
  appliedAt?: string;
  applied_at?: string;
  source?: string;
}

const STATUS_MAP: Record<string, { labelKey: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  new:        { labelKey: "yangiStatus",   variant: "secondary" },
  screening:  { labelKey: "koribChiqish",  variant: "default" },
  interview:  { labelKey: "suhbatStatus",  variant: "default" },
  offer:      { labelKey: "taklifStatus",  variant: "default" },
  hired:      { labelKey: "qabulQilindi",  variant: "default" },
  rejected:   { labelKey: "radEtildi",     variant: "destructive" },
};

export default function CandidatesPage() {
  const { t } = useTranslation('common');
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", position: "", status: "new" });

  const { data: rawData, isLoading, isError, error, refetch } = useQuery<Candidate[] | { data?: Candidate[]; candidates?: Candidate[] }>({
    queryKey: ["/api/candidates"],
  });

  const candidates: Candidate[] = Array.isArray(rawData)
    ? rawData
    : (rawData as { data?: Candidate[] })?.data
      ?? (rawData as { candidates?: Candidate[] })?.candidates
      ?? [];

  const createMutation = useMutation({
    mutationFn: async (dto: typeof form) => {
      return await apiRequest("POST", "/api/candidates", dto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
      toast({ title: t("nomzodQoshildi") });
      setShowCreate(false);
      setForm({ fullName: "", email: "", phone: "", position: "", status: "new" });
    },
    onError: () => {
      toast({ title: t("xatolik"), description: t("nomzodQoshishdaXatolik"), variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/candidates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
      toast({ title: t("nomzodOchirildi") });
      setDeleteId(null);
    },
    onError: () => {
      toast({ title: t("xatolik"), description: t("nomzodniOchirishdaXatolik"), variant: "destructive" });
    },
  });

  if (isError) return <EPErrorState onRetry={refetch}  error={error} />;

  const filtered = candidates.filter(c => {
    const name = c.fullName ?? c.full_name ?? "";
    const pos  = c.position ?? "";
    return name.toLowerCase().includes(search.toLowerCase()) || pos.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <ModulePage
      module="hr"
      title={t("nomzodlar")}
      icon={<UserPlus className="h-5 w-5" />}
      actions={
        <Button onClick={() => setShowCreate(true)} data-testid="button-add-candidate">
          <UserPlus className="h-4 w-4 mr-2" />
          {t("nomzodQoshish")}
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("nomzodQidirish")}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-candidates"
          />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {([1, 2, 3]).map(i => (
              <Card key={`k-${i}`}>
                <CardContent className="p-4 flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-32 rounded-lg" />
                    <Skeleton className="h-3 w-24 rounded-lg" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-lg" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <UserPlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {search ? t("qidiruvNatijasiTopilmadi") : t("nomzodlarMavjudEmas")}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map(c => {
              const name   = c.fullName ?? c.full_name ?? "—";
              const status = c.status ?? "new";
              const sc     = STATUS_MAP[status] ?? STATUS_MAP.new;
              return (
                <Card key={c.id} className="hover:shadow-md transition-shadow" data-testid={`card-candidate-${c.id}`}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0 text-sm font-semibold">
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{name}</p>
                      <div className="flex flex-wrap gap-3 mt-0.5">
                        {c.position && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Briefcase className="h-3 w-3" />{c.position}
                          </span>
                        )}
                        {c.email && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" />{c.email}
                          </span>
                        )}
                        {c.phone && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />{c.phone}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={sc.variant} className="text-xs">{t(sc.labelKey)}</Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteId(c.id)}
                        data-testid={`button-delete-candidate-${c.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">{t("yangiNomzod")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>{t("ismFamilya1")}</Label>
              <Input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} placeholder={t("ismFamilya")} data-testid="input-candidate-name" />
            </div>
            <div className="space-y-1.5">
              <Label>{t("lavozim1")}</Label>
              <Input value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} placeholder={t('juniorDeveloper')} data-testid="input-candidate-position" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t('email1')}</Label>
                <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder={t("emailExampleCom")} data-testid="input-candidate-email" />
              </div>
              <div className="space-y-1.5">
                <Label>{t("phone")}</Label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+998901234567" data-testid="input-candidate-phone" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t("status28")}</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger data-testid="select-candidate-status" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_MAP).map(([key, { labelKey }]) => (
                    <SelectItem key={key} value={key}>{t(labelKey)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>{t("Bekor")}</Button>
            <Button
              onClick={() => { if (form.fullName.trim()) createMutation.mutate(form); }}
              disabled={!form.fullName.trim() || createMutation.isPending}
              data-testid="button-confirm-add-candidate"
            >
              {createMutation.isPending ? t("saqlanmoqda") : t("nomzodQoshish")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent data-testid="dialog-confirm-delete-candidate">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("ochirishniTasdiqlash")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("haqiqatanHamBuNomzodniOchirmoqchimisiz")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Bekor")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deleteId) deleteMutation.mutate(deleteId); }}
              data-testid="button-confirm-delete-candidate"
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ModulePage>
  );
}
