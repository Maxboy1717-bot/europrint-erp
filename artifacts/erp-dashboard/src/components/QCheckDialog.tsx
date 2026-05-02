import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, Brain, Clock } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export interface QCheckResult {
  orderId:           string;
  completenessScore: number;
  missingFields:     string[];
  techCardJson:      Record<string, unknown>;
  preflight:         {
    pass: boolean;
    warnings: string[];
    errors:   string[];
    dpi:         number | null;
    colorspace:  string | null;
    bleedMm:     number | null;
    tacPct:      number | null;
  } | null;
  confidence:   number;
  autoExecuted: boolean;
}

interface QCheckDialogProps {
  open:      boolean;
  result:    QCheckResult | null;
  timeout?:  number;
  onCommit:  (result: QCheckResult) => void;
  onCancel:  () => void;
}

export function QCheckDialog({ open, result, timeout = 5, onCommit, onCancel }: QCheckDialogProps) {
  const { t } = useTranslation('ai');
  const [remaining, setRemaining] = useState(timeout);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!open || !result?.autoExecuted) return;
    setRemaining(timeout);

    timerRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          onCommit(result);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [open, result, timeout, onCommit]);

  if (!result) return null;

  const { autoExecuted, confidence, completenessScore, missingFields, preflight } = result;
  const pct = Math.round(completenessScore * 100);
  const confPct = Math.round(confidence * 100);
  const countdownPct = autoExecuted ? Math.round((remaining / timeout) * 100) : 0;

  function handleCancel() {
    if (timerRef.current) clearInterval(timerRef.current);
    onCancel();
  }

  function handleCommitNow() {
    if (timerRef.current) clearInterval(timerRef.current);
    onCommit(result!);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleCancel(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-violet-500" />
            {t('qcheck.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t('qcheck.completeness')}</span>
            <div className="flex items-center gap-2">
              <Progress value={pct} className="w-24 h-2" />
              <span className="text-sm font-medium">{pct}%</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t('qcheck.confidenceLabel')}</span>
            <Badge variant={confPct >= 80 ? "default" : "secondary"}>{confPct}%</Badge>
          </div>

          {missingFields.length > 0 && (
            <div className="rounded-md bg-amber-50 dark:bg-amber-950 p-3 text-sm">
              <p className="font-medium text-amber-700 dark:text-amber-400 mb-1">{t('qcheck.missingFieldsTitle')}</p>
              <ul className="list-disc list-inside text-amber-600 dark:text-amber-300 space-y-0.5">
                {missingFields.map((f) => <li key={f}>{f}</li>)}
              </ul>
            </div>
          )}

          {preflight && (
            <div className={`rounded-md p-3 text-sm ${preflight.pass ? "bg-green-50 dark:bg-green-950" : "bg-red-50 dark:bg-red-950"}`}>
              <p className={`font-medium mb-1 ${preflight.pass ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
                {preflight.pass ? t('qcheck.preflightOk') : t('qcheck.preflightFail')}
              </p>
              {preflight.errors.map((e, i) => (
                <p key={i} className="text-red-600 dark:text-red-300">{e}</p>
              ))}
              {preflight.warnings.map((w, i) => (
                <p key={i} className="text-amber-600 dark:text-amber-300">{w}</p>
              ))}
            </div>
          )}

          {autoExecuted ? (
            <div className="rounded-md bg-violet-50 dark:bg-violet-950 p-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 font-medium text-violet-700 dark:text-violet-300">
                  <Clock className="h-4 w-4" />
                  {t('qcheck.autoCommitTitle')}
                </span>
                <span className="text-violet-600 dark:text-violet-400 font-mono">{remaining}s</span>
              </div>
              <Progress value={countdownPct} className="h-2 bg-violet-200 dark:bg-violet-800 [&>div]:bg-violet-500" />
              <p className="text-xs text-violet-600 dark:text-violet-400">
                {t('qcheck.autoCommitHint', { seconds: remaining })}
              </p>
            </div>
          ) : (
            <div className="rounded-md bg-blue-50 dark:bg-blue-950 p-3 text-sm text-blue-700 dark:text-blue-300">
              {t('qcheck.manualReview')}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel} className="flex items-center gap-1.5">
            <XCircle className="h-4 w-4" />
            {t('qcheck.cancelBtn')}
          </Button>
          {autoExecuted && (
            <Button onClick={handleCommitNow} className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4" />
              {t('qcheck.commitNowBtn')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
