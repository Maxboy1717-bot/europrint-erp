/**
 * @module RootCausesPage
 * @description QC sabab-katalogi (root cause catalog) — brak/reklamatsiya tahlili uchun
 * qayta ishlatiluvchi sabablar ro'yxati (6M / Ishikawa kategoriyalari bo'yicha).
 * Route: /qc/root-causes
 * GET  /api/qc/root-causes — katalog ro'yxati
 * POST /api/qc/root-causes — yangi sabab ({ name, category?, description? })
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, selectArray } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { DedicatedPageShell, KpiCard, Section } from "@/components/DedicatedPageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { GitBranch, Layers, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ── Types ──────────────────────────────────────────────────────────────────────

interface RootCauseRow {
  id: number;
  name: string | null;
  category: string | null;
  description: string | null;
  status: string | null;
  is_active: boolean | null;
}

// 6M / Ishikawa (fishbone) standart kategoriyalar — taksonomiya, fabrikatsiya emas.
const CATEGORIES: { value: string; label: string }[] = [
  { value: "material",    label: "Material (xom-ashyo)" },
  { value: "operator",    label: "Inson (operator)" },
  { value: "machine",     label: "Mashina (jihoz)" },
  { value: "method",      label: "Usul (jarayon)" },
  { value: "measurement", label: "O'lchov (nazorat)" },
  { value: "environment", label: "Muhit (sharoit)" },
];

const CATEGORY_COLOR: Record<string, string> = {
  material:    "bg-[var(--ep-blue)]/10 text-[var(--ep-blue)] border-[var(--ep-blue)]/30",
  operator:    "bg-[var(--ep-primary)]/10 text-[var(--ep-primary)] border-[var(--ep-primary)]/30",
  machine:     "bg-[var(--ep-yellow)]/10 text-[var(--ep-yellow)] border-[var(--ep-yellow)]/30",
  method:      "bg-[var(--ep-green)]/10 text-[var(--ep-green)] border-[var(--ep-green)]/30",
  measurement: "bg-purple-500/10 text-purple-500 border-purple-500/30",
  environment: "bg-teal-500/10 text-teal-500 border-teal-500/30",
};

function categoryLabel(value: string | null): string {
  if (!value) return "—";
  return CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

// ── Create dialog ──────────────────────────────────────────────────────────────

function CreateRootCauseDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation("qc");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  const mutation = useMutation({
    mutationFn: (dto: Record<string, unknown>) =>
      apiRequest<RootCauseRow>("POST", "/api/qc/root-causes", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/qc/root-causes"] });
      toast({ title: t("rootCauses.saved", "Sabab qo'shildi") });
      setName(""); setCategory(""); setDescription("");
      onClose();
    },
    onError: () => toast({ title: t("rootCauses.saveError", "Saqlash xatoligi"), variant: "destructive" }),
  });

  function handleSubmit() {
    if (name.trim().length < 2) {
      toast({ title: t("rootCauses.nameRequired", "Nom majburiy (kamida 2 belgi)"), variant: "destructive" });
      return;
    }
    const dto: Record<string, unknown> = { name: name.trim() };
    if (category)            dto.category    = category;
    if (description.trim())  dto.description = description.trim();
    mutation.mutate(dto);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-[var(--ep-primary)]" />
            {t("rootCauses.createTitle", "Yangi sabab")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <Label>{t("rootCauses.name", "Sabab nomi")} *</Label>
            <Input
              placeholder={t("rootCauses.namePh", "masalan: Bo'yoq qatlami notekis")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t("rootCauses.category", "Kategoriya (6M)")}</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder={t("rootCauses.selectCategory", "Kategoriyani tanlang")} /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>{t("rootCauses.description", "Tavsif")}</Label>
            <Textarea
              placeholder={t("rootCauses.descriptionPh", "Sabab haqida batafsil...")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("rootCauses.cancel", "Bekor")}</Button>
          <Button
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="bg-[var(--ep-primary)] hover:bg-[var(--ep-primary)]/90 text-white"
          >
            {mutation.isPending ? t("rootCauses.saving", "Saqlanmoqda...") : t("rootCauses.save", "Saqlash")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────────

export default function RootCausesPage() {
  const { t } = useTranslation("qc");
  const [createOpen, setCreateOpen] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["/api/qc/root-causes"],
    queryFn: () => apiRequest("GET", "/api/qc/root-causes"),
  });

  const allRows = selectArray<RootCauseRow>(data, "items");
  const rows = filter === "all" ? allRows : allRows.filter((r) => r.category === filter);

  const byCat = CATEGORIES.map((c) => ({
    ...c,
    count: allRows.filter((r) => r.category === c.value).length,
  }));

  return (
    <DedicatedPageShell
      title={t("rootCauses.title", "Sabablar Katalogi")}
      description={t("rootCauses.desc", "Brak va reklamatsiya tahlili uchun qayta ishlatiluvchi sabablar (6M / Ishikawa)")}
      actions={
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-[var(--ep-primary)] hover:bg-[var(--ep-primary)]/90 text-white"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          {t("rootCauses.create", "Yangi sabab")}
        </Button>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label={t("rootCauses.kpiTotal", "Jami sabablar")}
          value={allRows.length.toLocaleString()}
          icon={<Layers className="h-4 w-4" />}
        />
        <KpiCard
          label={t("rootCauses.kpiCategories", "Kategoriyalar")}
          value={byCat.filter((c) => c.count > 0).length.toLocaleString()}
          icon={<GitBranch className="h-4 w-4" />}
        />
        <KpiCard
          label={t("rootCauses.kpiTopCat", "Eng ko'p")}
          value={byCat.slice().sort((a, b) => b.count - a.count)[0]?.count
            ? categoryLabel(byCat.slice().sort((a, b) => b.count - a.count)[0].value)
            : "—"}
          icon={<Layers className="h-4 w-4" />}
        />
        <KpiCard
          label={t("rootCauses.kpiActive", "Faol")}
          value={allRows.filter((r) => r.is_active !== false).length.toLocaleString()}
          icon={<Layers className="h-4 w-4" />}
          variant="success"
        />
      </div>

      <Section title={t("rootCauses.list", "Katalog")}>
        {/* Category filter */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <Button size="sm" variant={filter === "all" ? "default" : "outline"} className="h-7 text-xs" onClick={() => setFilter("all")}>
            {t("rootCauses.all", "Barchasi")} ({allRows.length})
          </Button>
          {byCat.map((c) => (
            <Button
              key={c.value}
              size="sm"
              variant={filter === c.value ? "default" : "outline"}
              className="h-7 text-xs"
              onClick={() => setFilter(c.value)}
            >
              {c.label} ({c.count})
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-2">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 rounded-lg" />)}</div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">
            {t("rootCauses.empty", "Hali sabablar yo'q")}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left p-3 font-medium">{t("rootCauses.name", "Sabab")}</th>
                  <th className="text-left p-3 font-medium">{t("rootCauses.category", "Kategoriya")}</th>
                  <th className="text-left p-3 font-medium">{t("rootCauses.description", "Tavsif")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-medium">{r.name ?? "—"}</td>
                    <td className="p-3">
                      {r.category ? (
                        <Badge variant="outline" className={CATEGORY_COLOR[r.category] ?? ""}>
                          {categoryLabel(r.category)}
                        </Badge>
                      ) : "—"}
                    </td>
                    <td className="p-3 text-muted-foreground max-w-md truncate">{r.description ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <CreateRootCauseDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </DedicatedPageShell>
  );
}
