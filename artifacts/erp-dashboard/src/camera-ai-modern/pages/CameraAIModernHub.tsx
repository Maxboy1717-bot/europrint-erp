/**
 * @module CameraAIModernHub
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Camera,
  Shield,
  AlertTriangle,
  Activity,
  RefreshCw,
  Settings2,
  Video,
  ChevronRight,
  Sparkles,
  MapPin,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { EPErrorState } from "@/components/ep";
import { cn } from "@/lib/utils";
import {
  fetchCamerasFull,
  fetchCameraDashboardStats,
  fetchPendingAlerts,
  patchCameraAi,
} from "../api";
import { AI_TASK_CATALOG, normalizeCategories } from "../taskCatalog";
import type { CameraAiRow } from "../types";
import { CameraMissionEditor } from "../components/CameraMissionEditor";
import { CameraAnalysisWorkbench } from "../components/CameraAnalysisWorkbench";
import "../camera-ai-visual.css";
import { useTranslation } from '@/lib/i18n';

const severityClass: Record<string, string> = {
  low: "border-l-blue-500 bg-blue-500/5",
  medium: "border-l-amber-500 bg-amber-500/5",
  high: "border-l-orange-500 bg-orange-500/5",
  critical: "border-l-red-500 bg-red-500/5",
};

export default function CameraAIModernHub() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const qc = useQueryClient();
  const [lang, setLang] = useState<"uz" | "ru">("uz");
  const [search, setSearch] = useState("");
  const [editorCamera, setEditorCamera] = useState<CameraAiRow | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const statsQ = useQuery({
    queryKey: ["/api/camera-dashboard/stats"],
    queryFn: fetchCameraDashboardStats,
  });
  const camerasQ = useQuery({
    queryKey: ["/api/cameras"],
    queryFn: fetchCamerasFull,
  });
  const alertsQ = useQuery({
    queryKey: ["/api/camera-dashboard/pending-alerts", 12],
    queryFn: () => fetchPendingAlerts(12),
  });

  const saveMutation = useMutation({
    mutationFn: ({ id, body }: { id: string | number; body: Parameters<typeof patchCameraAi>[1] }) =>
      patchCameraAi(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/cameras"] });
      toast({
        title: lang === "uz" ? "Saqlandi" : "Сохранено",
        description: lang === "uz" ? "Kamera sozlamalari yangilandi" : "Настройки камеры обновлены",
      });
      setEditorOpen(false);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: lang === "uz" ? "Xato" : "Ошибка",
        description:
          lang === "uz"
            ? "Saqlashda muammo (rol yoki tarmoq tekshirilsin)"
            : "Ошибка сохранения",
      });
    },
  });

  const toggleAiMutation = useMutation({
    mutationFn: ({ id, aiEnabled }: { id: string | number; aiEnabled: boolean }) =>
      patchCameraAi(id, { aiEnabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/cameras"] }),
    onError: () => {
      toast({
        variant: "destructive",
        title: lang === "uz" ? "Xato" : "Ошибка",
      });
    },
  });

  const cameras = camerasQ.data ?? [];
  const filtered = (Array.isArray(cameras) ? cameras : []).filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      String(c.name).toLowerCase().includes(q) ||
      String(c.code ?? "").toLowerCase().includes(q) ||
      String(c.location ?? "").toLowerCase().includes(q)
    );
  });

  const openEditor = (c: CameraAiRow) => {
    setEditorCamera(c);
    setEditorOpen(true);
  };

  const refetchAll = () => {
    statsQ.refetch();
    camerasQ.refetch();
    alertsQ.refetch();
  };

  if (statsQ.isError || camerasQ.isError) {
    return (
      <div className="cai-module p-4">
        <EPErrorState onRetry={refetchAll} />
      </div>
    );
  }

  const stats = statsQ.data;
  const loading = statsQ.isLoading || camerasQ.isLoading;

  return (
    <div className="cai-module space-y-8 pb-12 -mx-1 sm:-mx-2">
      {/* Hero — boshqa ERP sahifalaridan aniq farq qiladi */}
      <section className="cai-hero">
        <div className="cai-hero-grid" aria-hidden />
        <div className="cai-hero-content flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="cai-pill">
                <span className="cai-live-dot" />
                {lang === "uz" ? "AI nazorat moduli" : "Модуль AI-надзора"}
              </span>
              <span className="cai-pill opacity-90">
                <Cpu className="h-3 w-3" />
                {t("geminiVision")}
              </span>
            </div>
            <h1 className="cai-hero-title">
              {lang === "uz" ? (
                <>
                  {t("vizual")}<span className="text-cyan-300">xavfsizlik</span> va{" "}
                  <span className="text-violet-300">{t("ishlabChiqarish")}</span> AI
                </>
              ) : (
                <>
                  Визуальная <span className="text-cyan-300">{t("untitled")}</span> и AI{" "}
                  <span className="text-violet-300">{t("untitled2")}</span>
                </>
              )}
            </h1>
            <p className="cai-hero-sub">
              {lang === "uz"
                ? "Har kamera uchun alohida topshiriqlar, gradient dashboard va laboratoriya rejimi. Bu sahifa boshqa ERP bo‘limlaridan vizual jihatdan ajratilgan."
                : "Индивидуальные задачи на камеру, отдельный визуальный стиль. Эта страница отличается от остального ERP."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="flex rounded-full border border-white/20 dark:border-white/10 overflow-hidden bg-black/20 backdrop-blur-sm">
              <button
                type="button"
                onClick={() => setLang("uz")}
                className={cn(
                  "px-4 py-2 text-xs font-bold transition-colors",
                  lang === "uz" ? "bg-[var(--ep-cyan)] text-white" : "text-slate-200 hover:bg-white/10",
                )}
              >
                O‘ZB
              </button>
              <button
                type="button"
                onClick={() => setLang("ru")}
                className={cn(
                  "px-4 py-2 text-xs font-bold transition-colors",
                  lang === "ru" ? "bg-[var(--ep-cyan)] text-white" : "text-slate-200 hover:bg-white/10",
                )}
              >
                RU
              </button>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={refetchAll}
              className="gap-2 bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              <RefreshCw className={cn("h-4 w-4", (statsQ.isFetching || camerasQ.isFetching) && "animate-spin")} />
              {lang === "uz" ? "Yangilash" : "Обновить"}
            </Button>
            <Link href="/camera-dashboard">
              <Button type="button" variant="outline" size="sm" className="border-white/30 text-white hover:bg-white/10">
                {lang === "uz" ? "Klassik panel" : "Классика"}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="cai-stat-bento">
          {([1, 2, 3, 4]).map((i) => (
            <Skeleton key={`k-${i}`} className="h-28 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="cai-stat-bento">
          <div className="cai-stat-card">
            <div className="flex items-start justify-between gap-2">
              <Camera className="h-4 w-4 text-[var(--ep-cyan)] dark:text-cyan-400" />
              <Sparkles className="h-4 w-4 text-[var(--ep-purple)] opacity-60" />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mt-3">
              {lang === "uz" ? "Jami kameralar" : "Всего камер"}
            </p>
            <p className="cai-stat-value mt-1">{stats?.totalCameras ?? cameras.length}</p>
            <p className="text-xs text-muted-foreground">{lang === "uz" ? "Ro‘yxat" : "В списке"}</p>
          </div>
          <div className="cai-stat-card">
            <Activity className="h-5 w-5 text-[var(--ep-green)] dark:text-emerald-400" />
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mt-3">
              {lang === "uz" ? "Faol" : "Активны"}
            </p>
            <p className="cai-stat-value mt-1">{stats?.activeCameras ?? (Array.isArray(cameras) ? cameras : []).filter((c) => c.isActive).length}</p>
            <p className="text-xs text-muted-foreground">{lang === "uz" ? "Real vaqt" : "Онлайн"}</p>
          </div>
          <div className="cai-stat-card cai-stat--alert">
            <AlertTriangle className="h-5 w-5 text-[var(--ep-yellow)]" />
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mt-3">
              {lang === "uz" ? "Ochiq alertlar" : "Открытые алерты"}
            </p>
            <p className="cai-stat-value mt-1">{stats?.unresolvedAlerts ?? "—"}</p>
            <p className="text-xs text-muted-foreground">{lang === "uz" ? "Hal qilinmagan" : "Не решены"}</p>
          </div>
          <div className="cai-stat-card">
            <Shield className="h-5 w-5 text-[var(--ep-purple)] dark:text-violet-400" />
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mt-3">
              {lang === "uz" ? "Xavfsizlik yozuvi" : "Нарушения ТБ"}
            </p>
            <p className="cai-stat-value mt-1">{stats?.safetyViolationsCount ?? "—"}</p>
            <p className="text-xs text-muted-foreground">{lang === "uz" ? "Jami" : "Всего"}</p>
          </div>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <div className="cai-tabs-pill">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="overview">
              {lang === "uz" ? "Kameralar" : "Камеры"}
            </TabsTrigger>
            <TabsTrigger value="lab">
              {lang === "uz" ? "Laboratoriya" : "Лаборатория"}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="lab" className="mt-0 focus-visible:outline-none">
          <CameraAnalysisWorkbench cameras={cameras} lang={lang} />
        </TabsContent>

        <TabsContent value="overview" className="mt-0 space-y-6 focus-visible:outline-none">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 cai-panel">
              <div className="cai-panel-head flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
                    <Video className="h-5 w-5 text-[var(--ep-cyan)]" />
                    {lang === "uz" ? "Kamera va topshiriqlar" : "Камеры и задачи"}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {lang === "uz" ? "Har qatorda chap — cyan chiziq; AI tugmasi o‘ngda." : "Слева акцентная полоса."}
                  </p>
                </div>
                <Input
                  placeholder={lang === "uz" ? "Qidiruv: nom, kod, joy…" : "Поиск…"}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="max-w-full sm:max-w-xs rounded-xl border-cyan-500/20 focus-visible:ring-cyan-500/40"
                />
              </div>
              <div className="p-4 space-y-3">
                {camerasQ.isLoading ? (
                  <Skeleton className="h-40 w-full rounded-lg" />
                ) : filtered.length === 0 ? (
                  <div className="text-center py-16 px-4 rounded-xl border border-dashed border-cyan-500/25 bg-cyan-500/5">
                    <Camera className="h-12 w-12 mx-auto text-[var(--ep-cyan)]/50 mb-3" />
                    <p className="font-medium text-foreground">
                      {lang === "uz" ? "Kamera topilmadi" : "Камеры не найдены"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1 mb-4">
                      {lang === "uz" ? "/cameras sahifasidan qo‘shing" : "Добавьте через /cameras"}
                    </p>
                    <Link href="/cameras">
                      <Button className="cai-btn-primary rounded-full">{lang === "uz" ? "Kameralar" : "К камерам"}</Button>
                    </Link>
                  </div>
                ) : (
                  (Array.isArray(filtered) ? filtered : []).map((cam) => {
                    const cats = normalizeCategories(cam.aiCategories);
                    const aiOn = cam.aiEnabled !== false;
                    return (
                      <div
                        key={String(cam.id)}
                        className={cn("cai-cam-card", !cam.isActive && "cai-cam-off")}
                      >
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
                              <Badge variant="secondary" className="text-[10px]">
                                OFF
                              </Badge>
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
                                {lang === "uz" ? "⚠ Topshiriq yo‘q — AI ishlamaydi" : "⚠ Нет задач"}
                              </span>
                            ) : (
                              cats.slice(0, 6).map((id) => {
                                const def = AI_TASK_CATALOG.find((t) => t.id === id);
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
                            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                              AI
                            </span>
                            <Switch
                              checked={aiOn}
                              disabled={toggleAiMutation.isPending}
                              onCheckedChange={(v) => toggleAiMutation.mutate({ id: cam.id, aiEnabled: v })}
                            />
                          </div>
                          <Button
                            type="button"
                            className="cai-btn-primary rounded-xl gap-2 px-4"
                            onClick={() => openEditor(cam)}
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

            <div className="space-y-4">
              <div className="cai-panel">
                <div className="cai-panel-head">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-[var(--ep-yellow)]" />
                    {lang === "uz" ? "So‘nggi ogohlantirishlar" : "Алерты"}
                  </h3>
                </div>
                <div className="p-3 space-y-2 max-h-[340px] overflow-y-auto">
                  {(Array.isArray(alertsQ.data) ? alertsQ.data : []).length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-8">
                      {lang === "uz" ? "Hozircha xavf yo‘q" : "Пусто"}
                    </p>
                  ) : (
                    (Array.isArray(alertsQ.data) ? alertsQ.data : []).map((a) => (
                      <div
                        key={a.id}
                        className={cn("cai-alert-row text-sm", severityClass[a.severity] ?? severityClass.medium)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-medium leading-snug line-clamp-2">{a.title}</span>
                          <Badge variant="outline" className="shrink-0 text-[9px] uppercase">
                            {a.severity}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="cai-panel">
                <div className="cai-panel-head">
                  <h3 className="text-sm font-bold">{lang === "uz" ? "Tezkor havolalar" : "Ссылки"}</h3>
                </div>
                <div className="p-2 flex flex-col gap-0.5">
                  <QuickLink to="/camera-live-monitoring" label={lang === "uz" ? "Jonli monitoring" : "Мониторинг"} />
                  <QuickLink to="/camera-alerts" label={lang === "uz" ? "Hodisalar" : "События"} />
                  <QuickLink to="/cameras" label={lang === "uz" ? "Kameralar CRUD" : "Список камер"} />
                  <QuickLink to="/camera/monitoring" label={lang === "uz" ? "Yuz tanish" : "Лица"} />
                  <QuickLink to="/camera-reports" label={lang === "uz" ? "Hisobotlar" : "Отчёты"} />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <CameraMissionEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        camera={editorCamera}
        lang={lang}
        isSaving={saveMutation.isPending}
        onSave={(payload) => {
          if (!editorCamera) return;
          saveMutation.mutate({ id: editorCamera.id, body: payload });
        }}
      />
    </div>
  );
}

function QuickLink({ to, label }: { to: string; label: string }) {
  return (
    <Link href={to}>
      <span className="cai-link-row">
        {label}
        <ChevronRight className="h-4 w-4 text-[var(--ep-cyan)] shrink-0" />
      </span>
    </Link>
  );
}
