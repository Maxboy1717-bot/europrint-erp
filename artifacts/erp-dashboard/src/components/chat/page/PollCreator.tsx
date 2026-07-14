/**
 * @module PollCreator
 * @description React UI component.
 */

import { useState, useCallback } from "react";
import { X, Plus, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getChatApiBase } from "@/lib/apiBase";
import { apiRequest, HttpError } from "@/lib/queryClient";
import { useTranslation } from '@/lib/i18n';

interface Props {
  roomId: string;
  onClose: () => void;
  onCreated?: () => void;
}

export function PollCreator({ roomId, onClose, onCreated }: Props) {
  const { t } = useTranslation("common");
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [isMultiple, setIsMultiple] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const addOption = () => {
    if (options.length < 10) setOptions([...options, ""]);
  };

  const removeOption = (idx: number) => {
    if (options.length <= 2) return;
    setOptions((Array.isArray(options) ? options : []).filter((_, i) => i !== idx));
  };

  const updateOption = (idx: number, val: string) => {
    const next = [...options];
    next[idx] = val;
    setOptions(next);
  };

  const handleSubmit = useCallback(async () => {
    if (!question.trim()) return setError("Savol kiriting");
    const validOptions = (Array.isArray(options) ? options : []).filter((o) => o.trim());
    if (validOptions.length < 2) return setError("Kamida 2 ta variant kerak");

    setLoading(true);
    setError("");
    try {
      // Canonical room-scoped create (chat-reactions.controller @Controller('chat')) — same poll
      // system MessagePoll votes against (/api/chat/polls/:id/vote). roomId is in the URL here.
      await apiRequest('POST', `${getChatApiBase()}/rooms/${roomId}/polls`, {
        question: question.trim(),
        options: validOptions,
        isMultiple,
        isAnonymous,
      });
      onCreated?.();
      onClose();
    } catch (e) {
      setError(e instanceof HttpError ? e.message : "Xato");
    } finally {
      setLoading(false);
    }
  }, [roomId, question, options, isMultiple, isAnonymous, onClose, onCreated]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">{t("sorovnomaYaratish")}</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* Question */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">{t("savol")}</label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={t("savolKiriting")}
              rows={2}
              className="w-full resize-none rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>

          {/* Options */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">{t("variantlar")}</label>
            <div className="space-y-1.5">
              {(Array.isArray(options) ? options : []).map((opt, idx) => (
                <div key={idx} className="flex gap-1.5">
                  <input
                    value={opt}
                    onChange={(e) => updateOption(idx, e.target.value)}
                    placeholder={`Variant ${idx + 1}`}
                    className="flex-1 rounded-lg border border-border/60 bg-muted/30 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
                  />
                  {options.length > 2 && (
                    <button
                      onClick={() => removeOption(idx)}
                      className="p-1.5 text-muted-foreground hover:text-destructive rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 10 && (
              <button
                onClick={addOption}
                className="mt-1.5 flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                {t("variantQoshish")}
              </button>
            )}
          </div>

          {/* Settings */}
          <div className="flex gap-4">
            <label className="flex items-center gap-1.5 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={isMultiple}
                onChange={(e) => setIsMultiple(e.target.checked)}
                className="rounded"
              />
              {t("kopTanlov")}
            </label>
            <label className="flex items-center gap-1.5 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="rounded"
              />
              {t("anonim")}
            </label>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
            >
              {t("Bekor")}
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !question.trim()}
              className={cn(
                "flex-1 py-2 rounded-lg text-sm font-medium transition-colors",
                "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              )}
            >
              {loading ? "Yaratilmoqda..." : "Yaratish"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
