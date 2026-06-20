/**
 * Yangi hujjat modali — 4 qadam:
 *   1. Hujjat turini tanlash
 *   2. AI intervyu (savol-javob)
 *   3. Ko'rib chiqish (AI yaratgan matn + izoh)
 *   4. PIN imzolash + yuborish
 *      4a. Agar PIN o'rnatilmagan bo'lsa — PIN o'rnatish sub-qadami
 *      4b. PIN o'rnatilgan bo'lsa — imzolash maydoni
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, FileText, ArrowRight, ArrowLeft, Sparkles, ShieldCheck } from "lucide-react";

import { EPLoader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
type Step = 1 | 2 | 3 | 4;

interface Template {
  id: string; code: string; nameUz: string; nameRu: string; category: string;
  defaultPriority: 'low' | 'normal' | 'high' | 'urgent';
}

interface AiQuestion {
  key: string; qUz: string; qRu: string; required: boolean;
  type: 'text' | 'choice' | 'date' | 'number'; choices?: string[];
}

interface AiSessionState {
  sessionId: string; templateId: string; language: 'uz' | 'ru';
  index: number; total: number; isCompleted: boolean;
  draftDocumentId: string | null;
  currentQuestion: AiQuestion | null;
  answers: Record<string, unknown>;
}

export function NewDocumentModal({ open, onOpenChange, onCreated }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (documentId: string) => void;
}) {
  const { t } = useTranslation("common");
  const qc = useQueryClient();
  const { toast } = useToast();
  const [step, setStep]               = useState<Step>(1);
  const [tmplId, setTmplId]           = useState<string | null>(null);
  const [sessionId, setSessionId]     = useState<string | null>(null);
  const [answer, setAnswer]           = useState("");
  const [reviewBody, setReviewBody]   = useState("");
  const [reviewSubject, setReviewSubject] = useState("");
  const [draftDocId, setDraftDocId]   = useState<string | null>(null);
  const [pin, setPin]                 = useState("");
  // PIN o'rnatish sub-qadami uchun
  const [newPin, setNewPin]           = useState("");
  const [newPinConfirm, setNewPinConfirm] = useState("");

  // Templates
  const tmplsQ = useQuery<Template[]>({
    queryKey: ["/api/cc/templates"],
    queryFn: async () => {
      try { return await apiRequest<Template[]>("GET", "/api/cc/templates"); }
      catch { return [] as Template[]; }
    },
    enabled: open && step === 1,
  });

  // AI session state (refetched after each answer)
  const sessQ = useQuery<AiSessionState>({
    queryKey: [`/api/cc/ai/sessions/${sessionId}`],
    queryFn: () => apiRequest<AiSessionState>("GET", `/api/cc/ai/sessions/${sessionId}`),
    enabled: !!sessionId && step === 2,
  });

  // Start AI session
  const startAi = useMutation<{ sessionId: string }, Error, string>({
    mutationFn: (templateId) =>
      apiRequest<{ sessionId: string }>("POST", "/api/cc/ai/start", { templateId }),
    onSuccess: (r) => { setSessionId(r.sessionId); setStep(2); },
    onError: (e) => toast({ title: "Xatolik", description: e.message, variant: "destructive" }),
  });

  const sendAnswer = useMutation<{ isCompleted: boolean }, Error, string>({
    mutationFn: (value) =>
      apiRequest<{ isCompleted: boolean }>("POST", `/api/cc/ai/sessions/${sessionId}/answer`, { value }),
    onSuccess: async (r) => {
      setAnswer("");
      await qc.invalidateQueries({ queryKey: [`/api/cc/ai/sessions/${sessionId}`] });
      if (r.isCompleted) finalize.mutate();
    },
    onError: (e) => toast({ title: "Xatolik", description: e.message, variant: "destructive" }),
  });

  const finalize = useMutation<{ draftDocumentId: string; aiBody: string; subject: string }, Error, void>({
    mutationFn: () =>
      apiRequest<{ draftDocumentId: string; aiBody: string; subject: string }>(
        "POST", `/api/cc/ai/sessions/${sessionId}/finalize`, {},
      ),
    onSuccess: (r) => {
      setDraftDocId(r.draftDocumentId); setReviewBody(r.aiBody); setReviewSubject(r.subject); setStep(3);
    },
    onError: (e) => toast({ title: "AI xatosi", description: e.message, variant: "destructive" }),
  });

  // PIN holati: step 4 da yuklanadi
  const pinStatusQ = useQuery<{ hasPin: boolean }>({
    queryKey: ["/api/cc/pin/status"],
    queryFn: () => apiRequest<{ hasPin: boolean }>("GET", "/api/cc/pin/status"),
    enabled: open && step === 4,
    staleTime: 0,
  });

  // PIN o'rnatish mutatsiyasi
  const setPinMut = useMutation<unknown, Error, void>({
    mutationFn: () => apiRequest("POST", "/api/cc/pin", { pin: newPin }),
    onSuccess: () => {
      toast({ title: "PIN muvaffaqiyatli o'rnatildi" });
      setNewPin("");
      setNewPinConfirm("");
      qc.invalidateQueries({ queryKey: ["/api/cc/pin/status"] });
    },
    onError: (e: Error) => {
      toast({ title: "PIN o'rnatish xatosi", description: e.message, variant: "destructive" });
    },
  });

  const sendDoc = useMutation<unknown, Error, void>({
    mutationFn: () => apiRequest("POST", `/api/cc/documents/${draftDocId}/send`, { pin }),
    onSuccess: () => {
      setPin('');
      toast({ title: "Hujjat yuborildi" });
      qc.invalidateQueries({ queryKey: ["/api/cc/baskets/inbox"] });
      qc.invalidateQueries({ queryKey: ["/api/cc/baskets/outbox"] });
      qc.invalidateQueries({ queryKey: ["/api/cc/baskets/summary"] });
      if (draftDocId) onCreated(draftDocId);
    },
    onError: (e: Error) => {
      setPin('');
      toast({ title: "Yuborish xatosi", description: e.message, variant: "destructive" });
    },
  });

  // Reset on close
  useEffect(() => {
    if (!open) {
      setStep(1); setTmplId(null); setSessionId(null);
      setAnswer(""); setReviewBody(""); setReviewSubject("");
      setDraftDocId(null); setPin("");
      setNewPin(""); setNewPinConfirm("");
    }
  }, [open]);

  // ── UI ──────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles size={16} className="text-[var(--ep-yellow)]" />
            {t("yangiHujjat")}
          </DialogTitle>
          <DialogDescription>Qadam {step}/4</DialogDescription>
        </DialogHeader>

        {/* STEP 1 — tur tanlash */}
        {step === 1 && (
          <div className="space-y-3 py-2">
            {tmplsQ.isLoading ? (
              <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                <Loader2 className="animate-spin mr-2" size={16} />
                {t("shablonlarYuklanmoqda")}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto">
                {(Array.isArray(tmplsQ.data) ? tmplsQ.data : []).map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTmplId(t.id)}
                    className={`p-3 rounded-lg text-left text-sm flex flex-col gap-1 border transition ${
                      tmplId === t.id
                        ? "bg-blue-50 border-blue-300 text-blue-900"
                        : "bg-card border-border hover:border-foreground/30"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-[var(--ep-blue)]" />
                      <span className="font-semibold">{t.nameUz}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{t.code} · {t.category}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 2 — AI intervyu */}
        {step === 2 && (
          <div className="space-y-3 py-2">
            {sessQ.isLoading ? (
              <EPLoader className="mx-auto" />
            ) : !sessQ.data?.currentQuestion ? (
              <div className="text-sm text-center py-6 text-muted-foreground">
                <EPLoader className="mx-auto mb-2" />
                AI hujjat matnini tayyorlamoqda...
              </div>
            ) : (
              <>
                <div className="text-xs text-muted-foreground">
                  Savol {sessQ.data.index + 1} / {sessQ.data.total}
                </div>
                <div className="text-sm font-medium">{sessQ.data.currentQuestion.qUz}</div>
                {sessQ.data.currentQuestion.type === 'choice' && sessQ.data.currentQuestion.choices ? (
                  <select
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    className="w-full px-3 py-2 rounded-md text-sm border bg-background"
                  >
                    <option value="">— tanlang</option>
                    {sessQ.data.currentQuestion.choices.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                ) : (
                  <Textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder={t("javobingizniYozing")}
                    className="min-h-[80px]"
                  />
                )}
              </>
            )}
          </div>
        )}

        {/* STEP 3 — Review */}
        {step === 3 && (
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">{t("mavzu")}</label>
              <Input value={reviewSubject} disabled />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                AI tayyorlagan matn (faqat ko'rish)
              </label>
              <Textarea
                value={reviewBody}
                disabled
                className="min-h-[260px] font-mono text-xs"
              />
            </div>
          </div>
        )}

        {/* STEP 4 — PIN */}
        {step === 4 && (
          <div className="space-y-3 py-4">
            {pinStatusQ.isLoading ? (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                <Loader2 className="animate-spin mr-2" size={16} />
                PIN holati tekshirilmoqda...
              </div>
            ) : pinStatusQ.data?.hasPin === false ? (
              /* ── 4a: PIN o'rnatilmagan — setup sub-form ── */
              <div className="space-y-4">
                <div className="flex items-center gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
                  <ShieldCheck size={16} className="shrink-0" />
                  Siz hali PIN o'rnatmagansiz. Hujjatni imzolash uchun avval PIN o'rnating.
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Yangi PIN (4-8 raqam)</label>
                  <Input
                    type="password" maxLength={8} autoFocus
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">PIN ni tasdiqlang</label>
                  <Input
                    type="password" maxLength={8}
                    value={newPinConfirm}
                    onChange={(e) => setNewPinConfirm(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="mt-1"
                  />
                </div>
                {newPin && newPinConfirm && newPin !== newPinConfirm && (
                  <p className="text-xs text-destructive">PIN lar mos emas</p>
                )}
              </div>
            ) : (
              /* ── 4b: PIN o'rnatilgan — imzolash maydoni ── */
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  {t("hujjatniRasmiyYuborishUchunPin")}
                </div>
                <Input
                  type="password" maxLength={8} autoFocus
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                />
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step > 1 && step < 4 && (
            <Button variant="outline" onClick={() => setStep((step - 1) as Step)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> {t("back")}
            </Button>
          )}
          {step === 1 && (
            <Button
              onClick={() => tmplId && startAi.mutate(tmplId)}
              disabled={!tmplId || startAi.isPending}
            >
              {t("proceed")}<ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
          {step === 2 && (
            <Button
              onClick={() => sendAnswer.mutate(answer)}
              disabled={!answer || sendAnswer.isPending}
            >
              {t("javobniYuborish")}<ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
          {step === 3 && (
            <Button onClick={() => setStep(4)}>
              {t("imzolashgaOtish")}<ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
          {step === 4 && pinStatusQ.data?.hasPin === false && (
            /* 4a: PIN o'rnatish tugmasi */
            <Button
              variant="default"
              onClick={() => setPinMut.mutate()}
              disabled={
                !/^\d{4,8}$/.test(newPin) ||
                newPin !== newPinConfirm ||
                setPinMut.isPending
              }
              className="bg-blue-600 hover:bg-blue-700"
            >
              {setPinMut.isPending ? (
                <><Loader2 className="animate-spin mr-2" size={14} /> Saqlanmoqda...</>
              ) : (
                <>PIN o'rnatish<ShieldCheck className="ml-2" size={14} /></>
              )}
            </Button>
          )}
          {step === 4 && pinStatusQ.data?.hasPin === true && (
            /* 4b: Imzolash va yuborish tugmasi */
            <Button
              variant="default"
              onClick={() => sendDoc.mutate()}
              disabled={!/^\d{4,8}$/.test(pin) || sendDoc.isPending}
              className="bg-emerald-600 hover:bg-[var(--ep-green)]/90"
            >
              {t("submitBtn")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
