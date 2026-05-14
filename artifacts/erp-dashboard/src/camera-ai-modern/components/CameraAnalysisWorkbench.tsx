/**
 * @module CameraAnalysisWorkbench
 * @description React UI component.
 */

import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, Database, Scan, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { analyzeByMissions } from "../api";
import type { CameraAiRow } from "../types";
import { normalizeCategories } from "../taskCatalog";
import { EPLoader } from "@/components/ep";
import "../camera-ai-visual.css";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = r.result as string;
      const i = s.indexOf("base64,");
      resolve(i >= 0 ? s.slice(i + 7) : s);
    };
    r.onerror = () => reject(new Error("read"));
    r.readAsDataURL(file);
  });
}

interface CameraAnalysisWorkbenchProps {
  cameras: CameraAiRow[];
  lang: "uz" | "ru";
}

export function CameraAnalysisWorkbench({ cameras, lang }: CameraAnalysisWorkbenchProps) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [cameraId, setCameraId] = useState<string>(() => (cameras[0] ? String(cameras[0].id) : ""));
  const [persist, setPersist] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [base64, setBase64] = useState<string | null>(null);
  const [resultJson, setResultJson] = useState<string | null>(null);

  useEffect(() => {
    if (cameras.length && !(Array.isArray(cameras) ? cameras : []).some((c) => String(c.id) === cameraId)) {
      setCameraId(String(cameras[0].id));
    }
  }, [cameras, cameraId]);

  const runMutation = useMutation({
    mutationFn: async () => {
      if (!cameraId || !base64) throw new Error("missing");
      return analyzeByMissions({ cameraId, imageBase64: base64, persist });
    },
    onSuccess: (data) => {
      setResultJson(JSON.stringify(data, null, 2));
      qc.invalidateQueries({ queryKey: ["/api/camera-dashboard/stats"] });
      qc.invalidateQueries({ queryKey: ["/api/camera-dashboard/pending-alerts"] });
      const executedLanes = Array.isArray(data.executedLanes) ? (data.executedLanes as string[]) : [];
      toast({
        title: lang === "uz" ? "Tahlil tugadi" : "Анализ завершён",
        description:
          lang === "uz"
            ? `Yo‘llar: ${executedLanes.join(", ") || "—"}`
            : `Каналы: ${executedLanes.join(", ") || "—"}`,
      });
    },
    onError: (e: Error) => {
      toast({
        variant: "destructive",
        title: lang === "uz" ? "Xato" : "Ошибка",
        description: e.message || (lang === "uz" ? "So‘rov bajarilmadi" : "Ошибка запроса"),
      });
    },
  });

  const selected = (Array.isArray(cameras) ? cameras : []).find((c) => String(c.id) === cameraId);
  const missions = selected ? normalizeCategories(selected.aiCategories) : [];

  return (
    <div className="cai-module cai-lab-shell">
      <div className="cai-lab-head flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl from-cyan-500/25 to-violet-500/20 border border-cyan-500/30">
            <Scan className="h-5 w-5 text-[var(--ep-cyan)] dark:text-cyan-400" />
          </div>
          <div>
            <h3 className="font-bold text-lg tracking-tight flex items-center gap-2">
              {lang === "uz" ? "Tahlil laboratoriyasi" : "Лаборатория"}
              <Zap className="h-4 w-4 text-[var(--ep-yellow)]" />
            </h3>
            <p className="text-xs text-muted-foreground">
              {lang === "uz"
                ? "Kadr yuklang — faqat tanlangan topshiriqlar bo‘yicha AI ishlaydi."
                : "Загрузите кадр — AI по выбранным задачам."}
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-6">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-1">
          <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              {lang === "uz" ? "Kamera" : "Камера"}
            </Label>
            <Select value={cameraId} onValueChange={setCameraId}>
              <SelectTrigger className="rounded-xl h-9 border-cyan-500/20">
                <SelectValue placeholder="..." />
              </SelectTrigger>
              <SelectContent>
                {(Array.isArray(cameras) ? cameras : []).map((c) => (
                  <SelectItem key={String(c.id)} value={String(c.id)}>
                    {c.name} ({c.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              <span className="font-semibold text-[var(--ep-cyan)] dark:text-cyan-400">
                {lang === "uz" ? "Faol topshiriqlar: " : "Задачи: "}
              </span>
              {missions.length ? missions.join(", ") : lang === "uz" ? "yo‘q (panelda tanlang)" : "нет"}
            </p>
          </div>

          <div className="space-y-1">
          <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              {lang === "uz" ? "Kadr fayli" : "Кадр"}
            </Label>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                try {
                  const b = await fileToBase64(f);
                  setBase64(b);
                  setPreview(URL.createObjectURL(f));
                } catch {
                  toast({ variant: "destructive", title: "Fayl" });
                }
              }}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="cai-lab-drop w-full cursor-pointer"
            >
              <Upload className="h-8 w-8 text-[var(--ep-cyan)]/70" />
              <span className="text-sm font-medium text-foreground">
                {lang === "uz" ? "Rasmni tanlash yoki bu yerga torting" : "Выберите изображение"}
              </span>
              <span className="text-xs text-muted-foreground">JPEG / PNG</span>
            </button>
          </div>
        </div>

        {preview && (
          <div className="rounded-xl border border-cyan-500/25 overflow-hidden bg-black/5 dark:bg-black/30 max-h-56">
            <img src={preview} alt="" className="w-full h-full object-contain max-h-56 mx-auto" />
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2 border-t border-border/60">
          <div className="flex items-center gap-3">
            <Switch id="cai-persist" checked={persist} onCheckedChange={setPersist} />
            <Label htmlFor="cai-persist" className="flex items-center gap-2 cursor-pointer text-sm">
              <Database className="h-4 w-4 text-[var(--ep-purple)]" />
              {lang === "uz" ? "Bazaga yozish (alert / buzilish)" : "Запись в БД"}
            </Label>
          </div>
          <Button
            type="button"
            disabled={!base64 || !cameraId || runMutation.isPending || missions.length === 0}
            className="cai-btn-primary rounded-xl gap-2 h-11 px-8"
            onClick={() => runMutation.mutate()}
          >
            {runMutation.isPending ? <EPLoader /> : <Scan className="h-4 w-4" />}
            {lang === "uz" ? "Tahlilni boshlash" : "Запустить"}
          </Button>
        </div>

        {missions.length === 0 && selected && (
          <p className="text-sm rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-amber-900 dark:text-amber-100">
            {lang === "uz"
              ? "Avval «Kameralar» tabida ushbu kamera uchun topshiriqlarni belgilang."
              : "Сначала назначьте задачи камере во вкладке «Камеры»."}
          </p>
        )}

        {resultJson && (
          <div>
            <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2 block">
              JSON
            </Label>
            <ScrollArea className="h-[260px] w-full rounded-xl border border-cyan-500/15">
              <pre className="cai-lab-json whitespace-pre-wrap break-all p-4 m-0">{resultJson}</pre>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}
