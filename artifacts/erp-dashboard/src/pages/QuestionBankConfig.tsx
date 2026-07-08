/**
 * @module QuestionBankConfig
 * @description AI-IMTIHON SAVOLLAR BANKI (EP-ORG-046) boshqaruv sahifasi — `hr_question_bank` CRUD.
 *   Bu ro'yxat `AiExamController.assignToCard` (POST /api/ai-exam/assign-card) o'qiydigan savol
 *   havzasi: karta-turi (org_function_id) + razryad (razryad_level_id, ixtiyoriy) bo'yicha filtrlanadi.
 *
 * Route: /org-structure/question-bank
 * Wraps: GET/POST /api/org-structure/question-bank · PATCH/DELETE /api/org-structure/question-bank/:id
 *   - GET ?orgFunctionId= bo'lsa faqat o'sha karta-turi savollari; ?all=true arxivlanganlar ham.
 *
 * ⭐ JADVAL BO'SH tug'iladi (Q-40) — savollarni shu sahifa orqali EGASI/HR kiritadi (avval
 * jadval FAQAT o'qilardi — AI-imtihon tayinlash uchun yozuvchi controller yo'q edi).
 * F1 (loading skeleton) + F2 (onError toast) + Q-14 (ConfirmDialog) + Qoida 21 (EP token).
 * Mirrors RazryadLevelConfig.tsx (page skeleton) + ErrorCatalogConfig.tsx (create/delete CRUD shape).
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { HelpCircle, Pencil, Check, X, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EPStatusPill } from "@/components/ep/EPStatusPill";
import { apiRequest } from "@/lib/api-request";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";

// ── Types ──────────────────────────────────────────────────────────────────────

const CATEGORIES = ["technical", "behavioral", "iq", "leadership", "tool", "origin", "replication"] as const;
type Category = (typeof CATEGORIES)[number];

interface QuestionBankItem {
  id: number;
  org_function_id: number | null;
  category: Category;
  question_uz: string;
  question_ru: string | null;
  expected_keywords: string[];
  difficulty: number;
  lang: string;
  razryad_level_id: number | null;
  is_active: boolean;
}

interface QuestionBankPayload {
  orgFunctionId?: number | null;
  category?: Category;
  questionUz?: string;
  questionRu?: string | null;
  expectedKeywords?: string[];
  difficulty?: number;
  lang?: string;
  razryadLevelId?: number | null;
}

interface OrgFunctionOption {
  id: string;
  name: string;
  departmentName?: string | null;
}

interface RazryadLevelOption {
  id: number;
  level: number;
  name: string;
}

function parseKeywords(s: string): string[] {
  return s.split(",").map((k) => k.trim()).filter(Boolean);
}

// ── Create / edit form fields (shared by CreateDialog + inline row-edit) ───────

function QuestionFields({
  orgFunctionId, setOrgFunctionId,
  category, setCategory,
  questionUz, setQuestionUz,
  questionRu, setQuestionRu,
  keywords, setKeywords,
  difficulty, setDifficulty,
  razryadLevelId, setRazryadLevelId,
  orgFunctions, razryadLevels,
  idPrefix,
}: {
  orgFunctionId: string; setOrgFunctionId: (v: string) => void;
  category: Category; setCategory: (v: Category) => void;
  questionUz: string; setQuestionUz: (v: string) => void;
  questionRu: string; setQuestionRu: (v: string) => void;
  keywords: string; setKeywords: (v: string) => void;
  difficulty: string; setDifficulty: (v: string) => void;
  razryadLevelId: string; setRazryadLevelId: (v: string) => void;
  orgFunctions: OrgFunctionOption[];
  razryadLevels: RazryadLevelOption[];
  idPrefix: string;
}) {
  const { t } = useTranslation("common");
  return (
    <div className="grid gap-3 py-2">
      <div className="grid gap-1.5">
        <Label htmlFor={`${idPrefix}-uz`}>{t("qbSavolUz", "Savol (uz) *")}</Label>
        <Textarea id={`${idPrefix}-uz`} value={questionUz} rows={2}
          placeholder={t("qbSavolUzPlaceholder", "Masalan: Gofra qog'oz qalinligi qanday o'lchanadi?")}
          onChange={(e) => setQuestionUz(e.target.value)} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor={`${idPrefix}-ru`}>{t("qbSavolRu", "Savol (ru)")}</Label>
        <Textarea id={`${idPrefix}-ru`} value={questionRu} rows={2}
          placeholder={t("qbSavolRuPlaceholder", "Русский перевод (ixtiyoriy)")}
          onChange={(e) => setQuestionRu(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor={`${idPrefix}-cat`}>{t("qbKategoriya", "Kategoriya *")}</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
            <SelectTrigger id={`${idPrefix}-cat`}><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`${idPrefix}-diff`}>{t("qbQiyinlik", "Qiyinlik (1-5)")}</Label>
          <Input id={`${idPrefix}-diff`} type="number" min="1" max="5" value={difficulty}
            placeholder="3" onChange={(e) => setDifficulty(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor={`${idPrefix}-fn`}>{t("qbKartaTuriIxtiyoriy", "Karta-turi (ixtiyoriy)")}</Label>
          <Select value={orgFunctionId} onValueChange={setOrgFunctionId}>
            <SelectTrigger id={`${idPrefix}-fn`}><SelectValue placeholder={t("qbUmumiyHammaKartaga", "Umumiy (hamma kartaga)")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">{t("qbUmumiyHammaKartaga", "Umumiy (hamma kartaga)")}</SelectItem>
              {orgFunctions.map((f) => (
                <SelectItem key={f.id} value={f.id}>{f.name}{f.departmentName ? ` — ${f.departmentName}` : ""}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`${idPrefix}-rz`}>{t("qbRazryadIxtiyoriy", "Razryad (ixtiyoriy)")}</Label>
          <Select value={razryadLevelId} onValueChange={setRazryadLevelId}>
            <SelectTrigger id={`${idPrefix}-rz`}><SelectValue placeholder={t("qbHammasi", "Hammasi")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">{t("qbHammasi", "Hammasi")}</SelectItem>
              {razryadLevels.map((r) => (
                <SelectItem key={r.id} value={String(r.id)}>{r.level}-razryad ({r.name})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor={`${idPrefix}-kw`}>{t("qbTayanchKalitSozlar", "Tayanch kalit-so'zlar (vergul bilan)")}</Label>
        <Input id={`${idPrefix}-kw`} value={keywords} placeholder={t("qbKalitSozlarPlaceholder", "qalinlik, gramm, mm")}
          onChange={(e) => setKeywords(e.target.value)} />
      </div>
    </div>
  );
}

// ── Create dialog ────────────────────────────────────────────────────────────────

function CreateDialog({
  open, onOpenChange, onCreate, orgFunctions, razryadLevels,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (payload: QuestionBankPayload) => Promise<unknown>;
  orgFunctions: OrgFunctionOption[];
  razryadLevels: RazryadLevelOption[];
}) {
  const { toast } = useToast();
  const { t } = useTranslation("common");
  const [orgFunctionId, setOrgFunctionId] = useState("__none__");
  const [category, setCategory] = useState<Category>("technical");
  const [questionUz, setQuestionUz] = useState("");
  const [questionRu, setQuestionRu] = useState("");
  const [keywords, setKeywords] = useState("");
  const [difficulty, setDifficulty] = useState("3");
  const [razryadLevelId, setRazryadLevelId] = useState("__none__");
  const [busy, setBusy] = useState(false);

  function reset() {
    setOrgFunctionId("__none__"); setCategory("technical"); setQuestionUz(""); setQuestionRu("");
    setKeywords(""); setDifficulty("3"); setRazryadLevelId("__none__");
  }

  async function handleCreate() {
    if (questionUz.trim() === "") {
      toast({ title: t("qbSavolMatniMajburiy", "Savol matni (uz) majburiy"), variant: "destructive" });
      return;
    }
    const diff = parseInt(difficulty, 10);
    if (difficulty !== "" && (isNaN(diff) || diff < 1 || diff > 5)) {
      toast({ title: t("qbQiyinlikOraligi", "Qiyinlik 1-5 oralig'ida bo'lishi kerak"), variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      await onCreate({
        orgFunctionId: orgFunctionId === "__none__" ? null : Number(orgFunctionId),
        category,
        questionUz: questionUz.trim(),
        questionRu: questionRu.trim() === "" ? null : questionRu.trim(),
        expectedKeywords: parseKeywords(keywords),
        difficulty: difficulty !== "" && !isNaN(diff) ? diff : undefined,
        razryadLevelId: razryadLevelId === "__none__" ? null : Number(razryadLevelId),
      });
      reset();
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("qbYangiSavolQoshish", "Yangi savol qo'shish")}</DialogTitle>
          <DialogDescription>
            {t("qbYangiSavolTavsif", "AI-imtihon savollar banki. Karta-turi tanlansa faqat o'sha kartaga tayinlanganda ko'rinadi.")}
          </DialogDescription>
        </DialogHeader>
        <QuestionFields
          orgFunctionId={orgFunctionId} setOrgFunctionId={setOrgFunctionId}
          category={category} setCategory={setCategory}
          questionUz={questionUz} setQuestionUz={setQuestionUz}
          questionRu={questionRu} setQuestionRu={setQuestionRu}
          keywords={keywords} setKeywords={setKeywords}
          difficulty={difficulty} setDifficulty={setDifficulty}
          razryadLevelId={razryadLevelId} setRazryadLevelId={setRazryadLevelId}
          orgFunctions={orgFunctions} razryadLevels={razryadLevels}
          idPrefix="qb-new"
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>{t("bekor", "Bekor")}</Button>
          <Button onClick={() => void handleCreate()} disabled={busy}>{t("qoshish", "Qo'shish")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Inline-edit row ──────────────────────────────────────────────────────────────

function QuestionRow({
  row, onSave, onDelete, orgFunctions, razryadLevels,
}: {
  row: QuestionBankItem;
  onSave: (id: number, patch: QuestionBankPayload) => Promise<unknown>;
  onDelete: (id: number) => void;
  orgFunctions: OrgFunctionOption[];
  razryadLevels: RazryadLevelOption[];
}) {
  const { toast } = useToast();
  const { t } = useTranslation("common");
  const [editing, setEditing] = useState(false);
  const [orgFunctionId, setOrgFunctionId] = useState(row.org_function_id != null ? String(row.org_function_id) : "__none__");
  const [category, setCategory] = useState<Category>(row.category);
  const [questionUz, setQuestionUz] = useState(row.question_uz ?? "");
  const [questionRu, setQuestionRu] = useState(row.question_ru ?? "");
  const [keywords, setKeywords] = useState((row.expected_keywords ?? []).join(", "));
  const [difficulty, setDifficulty] = useState(row.difficulty != null ? String(row.difficulty) : "3");
  const [razryadLevelId, setRazryadLevelId] = useState(row.razryad_level_id != null ? String(row.razryad_level_id) : "__none__");
  const [busy, setBusy] = useState(false);

  function startEdit() {
    setOrgFunctionId(row.org_function_id != null ? String(row.org_function_id) : "__none__");
    setCategory(row.category);
    setQuestionUz(row.question_uz ?? "");
    setQuestionRu(row.question_ru ?? "");
    setKeywords((row.expected_keywords ?? []).join(", "));
    setDifficulty(row.difficulty != null ? String(row.difficulty) : "3");
    setRazryadLevelId(row.razryad_level_id != null ? String(row.razryad_level_id) : "__none__");
    setEditing(true);
  }

  async function handleSave() {
    if (questionUz.trim() === "") {
      toast({ title: t("qbSavolMatniBoshBolmasin", "Savol matni (uz) bo'sh bo'lishi mumkin emas"), variant: "destructive" });
      return;
    }
    const diff = parseInt(difficulty, 10);
    if (difficulty !== "" && (isNaN(diff) || diff < 1 || diff > 5)) {
      toast({ title: t("qbQiyinlikOraligi", "Qiyinlik 1-5 oralig'ida bo'lishi kerak"), variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      await onSave(row.id, {
        orgFunctionId: orgFunctionId === "__none__" ? null : Number(orgFunctionId),
        category,
        questionUz: questionUz.trim(),
        questionRu: questionRu.trim() === "" ? null : questionRu.trim(),
        expectedKeywords: parseKeywords(keywords),
        difficulty: difficulty !== "" && !isNaN(diff) ? diff : undefined,
        razryadLevelId: razryadLevelId === "__none__" ? null : Number(razryadLevelId),
      });
      setEditing(false);
    } finally {
      setBusy(false);
    }
  }

  if (editing) {
    return (
      <TableRow>
        <TableCell colSpan={7} className="bg-muted/30">
          <QuestionFields
            orgFunctionId={orgFunctionId} setOrgFunctionId={setOrgFunctionId}
            category={category} setCategory={setCategory}
            questionUz={questionUz} setQuestionUz={setQuestionUz}
            questionRu={questionRu} setQuestionRu={setQuestionRu}
            keywords={keywords} setKeywords={setKeywords}
            difficulty={difficulty} setDifficulty={setDifficulty}
            razryadLevelId={razryadLevelId} setRazryadLevelId={setRazryadLevelId}
            orgFunctions={orgFunctions} razryadLevels={razryadLevels}
            idPrefix={`qb-${row.id}`}
          />
          <div className="flex gap-1 justify-end pb-1">
            <Button size="sm" variant="ghost" className="text-[var(--ep-green)]"
              onClick={() => void handleSave()} disabled={busy}>
              <Check className="h-4 w-4 mr-1" /> {t("saqlash", "Saqlash")}
            </Button>
            <Button size="sm" variant="ghost" className="text-muted-foreground"
              onClick={() => setEditing(false)} disabled={busy}>
              <X className="h-4 w-4 mr-1" /> {t("bekor", "Bekor")}
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  const orgFnName = row.org_function_id != null
    ? orgFunctions.find((f) => Number(f.id) === row.org_function_id)?.name ?? `#${row.org_function_id}`
    : null;
  const razryadLabel = row.razryad_level_id != null
    ? razryadLevels.find((r) => r.id === row.razryad_level_id)?.level
    : null;

  return (
    <TableRow className={row.is_active ? "" : "opacity-50"}>
      <TableCell className="min-w-64 text-sm">
        <span className="font-medium">{row.question_uz}</span>
        {row.question_ru ? <div className="text-xs text-muted-foreground mt-0.5">{row.question_ru}</div> : null}
      </TableCell>
      <TableCell className="w-32 text-sm">
        <EPStatusPill tone="info" hideDot>{row.category}</EPStatusPill>
      </TableCell>
      <TableCell className="w-20 text-center text-sm tabular-nums">{row.difficulty}</TableCell>
      <TableCell className="w-40 text-sm text-muted-foreground">{orgFnName ?? t("qbUmumiy", "Umumiy")}</TableCell>
      <TableCell className="w-24 text-center text-sm">{razryadLabel != null ? `${razryadLabel}-razryad` : t("qbHammasi", "Hammasi")}</TableCell>
      <TableCell className="w-48 text-xs text-muted-foreground">
        {(row.expected_keywords ?? []).join(", ") || "—"}
      </TableCell>
      <TableCell className="w-28 text-right">
        <div className="flex gap-1 justify-end">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={startEdit} aria-label={t("tahrirlash", "Tahrirlash")}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-[var(--ep-red)]"
            onClick={() => onDelete(row.id)} aria-label={t("qbArxivlash", "Arxivlash")} disabled={!row.is_active}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function QuestionBankConfig() {
  const { toast } = useToast();
  const { t } = useTranslation("common");
  const queryClient = useQueryClient();
  const QKEY = "/api/org-structure/question-bank?all=true";

  const [createOpen, setCreateOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const { data, isLoading } = useQuery<{ items: QuestionBankItem[] }>({
    queryKey: [QKEY],
    queryFn: () => apiRequest<{ items: QuestionBankItem[] }>("GET", QKEY),
  });

  const { data: orgFunctionsData } = useQuery<OrgFunctionOption[]>({
    queryKey: ["/api/org-functions?limit=500"],
    queryFn: () => apiRequest<OrgFunctionOption[]>("GET", "/api/org-functions?limit=500"),
  });

  const { data: razryadData } = useQuery<{ items: RazryadLevelOption[] }>({
    queryKey: ["/api/org-structure/razryad-levels"],
    queryFn: () => apiRequest<{ items: RazryadLevelOption[] }>("GET", "/api/org-structure/razryad-levels"),
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: [QKEY] });
    queryClient.invalidateQueries({ queryKey: ["/api/org-structure/question-bank"] });
  }

  const createMutation = useMutation({
    mutationFn: (payload: QuestionBankPayload) =>
      apiRequest<QuestionBankItem>("POST", "/api/org-structure/question-bank", payload),
    onSuccess: () => { invalidate(); toast({ title: t("qbSavolQoshildi", "Savol qo'shildi") }); },
    onError: () => toast({ title: t("qbQoshishdaXatolik", "Qo'shishda xatolik"), variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: QuestionBankPayload }) =>
      apiRequest<QuestionBankItem>("PATCH", `/api/org-structure/question-bank/${id}`, patch),
    onSuccess: () => { invalidate(); toast({ title: t("saqlandi", "Saqlandi") }); },
    onError: () => toast({ title: t("qbSaqlashXatoligi", "Saqlash xatoligi"), variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest<unknown>("DELETE", `/api/org-structure/question-bank/${id}`),
    onSuccess: () => { invalidate(); toast({ title: t("qbArxivlandi", "Arxivlandi") }); },
    onError: () => toast({ title: t("qbArxivlashdaXatolik", "Arxivlashda xatolik"), variant: "destructive" }),
  });

  async function handleSave(id: number, patch: QuestionBankPayload) {
    await updateMutation.mutateAsync({ id, patch });
  }

  const items: QuestionBankItem[] = Array.isArray(data?.items) ? data.items : [];
  const orgFunctions: OrgFunctionOption[] = Array.isArray(orgFunctionsData) ? orgFunctionsData : [];
  const razryadLevels: RazryadLevelOption[] = Array.isArray(razryadData?.items) ? razryadData.items : [];

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      {/* Header */}
      <div className="border-b border-border/50 pb-3 flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-md">
          <HelpCircle className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="font-semibold text-base">{t("qbSarlavha", "AI-imtihon Savollar Banki")}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("qbTavsif", "Karta-turi (org_function_id) + razryad bo'yicha savol havzasi — AI-imtihon tayinlashda (assign-card) shu ro'yxatdan tanlanadi.")}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="shrink-0">
          <Plus className="h-4 w-4 mr-1.5" /> {t("qbYangiSavol", "Yangi savol")}
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-64">{t("qbSavol", "Savol")}</TableHead>
              <TableHead className="w-32">{t("qbKategoriyaColumn", "Kategoriya")}</TableHead>
              <TableHead className="w-20 text-center">{t("qbQiyinlikColumn", "Qiyinlik")}</TableHead>
              <TableHead className="w-40">{t("qbKartaTuriColumn", "Karta-turi")}</TableHead>
              <TableHead className="w-24 text-center">{t("qbRazryadColumn", "Razryad")}</TableHead>
              <TableHead className="w-48">{t("qbKalitSozlarColumn", "Kalit-so'zlar")}</TableHead>
              <TableHead className="w-28 text-right">{t("qbAmal", "Amal")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  {t("qbBoshHolat", "Savollar banki bo'sh — \"Yangi savol\" tugmasi orqali birinchi savolni qo'shing.")}
                </TableCell>
              </TableRow>
            ) : (
              items.map((row) => (
                <QuestionRow key={row.id} row={row} onSave={handleSave} onDelete={setConfirmId}
                  orgFunctions={orgFunctions} razryadLevels={razryadLevels} />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground max-w-2xl">
        {t("qbFooterIzoh", "Karta-turi tanlanmasa (Umumiy) savol hamma AI-imtihonda ko'rinishi mumkin. Razryad tanlanmasa (Hammasi) barcha razryad darajasidagi xodimlarga tayinlanishi mumkin. Arxivlangan savollar (o'chirilgan) imtihon havzasida ko'rinmaydi, lekin bu yerda kulrang holatda saqlanadi.")}
      </p>

      <CreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={(payload) => createMutation.mutateAsync(payload)}
        orgFunctions={orgFunctions}
        razryadLevels={razryadLevels}
      />

      <ConfirmDialog
        open={confirmId !== null}
        onOpenChange={(open) => { if (!open) setConfirmId(null); }}
        title={t("qbSavolniArxivlash", "Savolni arxivlash")}
        description={t("qbArxivlashTavsif", "Bu savol AI-imtihon havzasidan olib tashlanadi (soft-delete). Davom etilsinmi?")}
        confirmText={t("qbArxivlash", "Arxivlash")}
        cancelText={t("bekor", "Bekor")}
        variant="destructive"
        onConfirm={() => {
          if (confirmId != null) deleteMutation.mutate(confirmId);
          setConfirmId(null);
        }}
      />
    </div>
  );
}
