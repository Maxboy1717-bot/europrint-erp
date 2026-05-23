/**
 * @module CameraAICameraPanel
 * @description Camera list panel with AI-toggle and search for CameraAIModernHub.
 * Split from CameraAIModernHub.tsx (Rule 16).
 */

import { Link } from "wouter";
import { Camera, Video, Settings2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AI_TASK_CATALOG, normalizeCategories } from "../taskCatalog";
import type { CameraAiRow } from "../types";

interface CameraAICameraPanelProps {
  isLoading: boolean;
  filtered: CameraAiRow[];
  search: string;
  onSearchChange: (s: string) => void;
  lang: "uz" | "ru";
  isTogglingAi: boolean;
  onToggleAi: (id: string | number, aiEnabled: boolean) => void;
  onEdit: (cam: CameraAiRow) => void;
}

export function CameraAICameraPanel({
  isLoading, filtered, search, onSearchChange, lang,
  isTogglingAi, onToggleAi, onEdit,
}: CameraAICameraPanelProps) {
  return (
    <div className="lg:col-span-2 cai-panel">
      <div className="cai-panel-head flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <Video className="h-5 w-5 text-[var(--ep-cyan)]" />
            {lang === "uz" ? "Kamera va topshiriqlar" : "Камеры и задачи"}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {lang === "uz" ? "Har qatorda chap — cyan chiziq; AI tugmasi o'ngda." : "Слева акцентная полоса."}
          </p>
        </div>
        <Input
          placeholder={lang === "uz" ? "Qidiruv: nom, kod, joy…" : "Поиск…"}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-full sm:max-w-xs rounded-xl border-cyan-500/20 focus-visible:ring-cyan-500/40"
        />
      </div>

      <div className="p-4 space-y-3">
        {isLoading ? (
          <Skeleton className="h-40 w-full rounded-lg" />
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-xl border border-dashed border-cyan-500/25 bg-cyan-500/5">
            <Camera className="h-12 w-12 mx-auto text-[var(--ep-cyan)]/50 mb-3" />
            <p className="font-medium text-foreground">
              {lang === "uz" ? "Kamera topilmadi" : "Камеры не найдены"}
            </p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              {lang === "uz" ? "/cameras sahifasidan qo'shing" : "Добавьте через /cameras"}
            </p>
            <Link href="/cameras">
              <Button className="cai-btn-primary rounded-full">
                {lang === "uz" ? "Kameralar" : "К камерам"}
              </Button>
            </Link>
          </div>
        ) : (
          (Array.isArray(filtered) ? filtered : []).map((cam) => {
            const cats = normalizeCategories(cam.aiCategories);
            const aiOn = cam.aiEnabled !== false;
            return (
              <div key={String(cam.id)} className={cn("cai-cam-card", !cam.isActive && "cai-cam-off")}>
                <div className="cai-cam-icon">
                  <Video className="h-7 w-7" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-base">{cam.name}</span>
                    <Badge variant="outline" className="font-mono text-[10px] border-cyan-500/30">
                      {cam.code}
                    </Badge>
                    {!cam.isActive && (
                      <Badge variant="secondary" className="text-[10px]">OFF</Badge>
                    )}
                  </div>
                  {cam.location && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {cam.location}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {cats.length === 0 ? (
                      <span className="text-xs text-[var(--ep-yellow)] dark:text-amber-400 font-medium">
                        {lang === "uz" ? "⚠ Topshiriq yo'q — AI ishlamaydi" : "⚠ Нет задач"}
                      </span>
                    ) : (
                      cats.slice(0, 6).map((id) => {
                        const def = AI_TASK_CATALOG.find((task) => task.id === id);
                        return (
                          <span
                            key={id}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-800 dark:text-cyan-200 border border-cyan-500/20"
                          >
                            {def ? (lang === "uz" ? def.labelUz : def.labelRu) : id}
                          </span>
                        );
                      })
                    )}
                    {cats.length > 6 && (
                      <span className="text-[10px] text-muted-foreground">+{cats.length - 6}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l border-border/60 sm:pl-4">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">AI</span>
                    <Switch
                      checked={aiOn}
                      disabled={isTogglingAi}
                      onCheckedChange={(v) => onToggleAi(cam.id, v)}
                    />
                  </div>
                  <Button
                    type="button"
                    className="cai-btn-primary rounded-xl gap-2 px-4"
                    onClick={() => onEdit(cam)}
                  >
                    <Settings2 className="h-4 w-4" />
                    {lang === "uz" ? "Topshiriqlar" : "Задачи"}
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
