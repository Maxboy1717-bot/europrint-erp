/**
 * @module PosTraining
 * @description POS Monitor tablet — "Tez o'quv" (quick-training) widget.
 *
 * VISION 12-lms#85 (POS Monitor tablet LMS quick-training widget): ombor operatori
 * planshetdan qisqa "mikro-modul" o'quvlarini ko'radi va o'z video-darslarining
 * davomini "Tugatdim" bilan belgilaydi. ERP SSO cookie (credentials:include) bilan
 * EMPLOYEE roli ostida ochiladi — alohida login YO'Q (PosHome bilan bir xil pattern).
 *
 * Consumed endpoints (barchasi @Roles incl EMPLOYEE, global prefix 'api'):
 *   • GET  /api/micro-modules   → LmsMicroModulesController.listMicroModules (faol mikro-modullar)
 *   • GET  /api/video-progress  → LmsVideoProgressController.listVideoProgress (joriy foydalanuvchi)
 *   • POST /api/video-progress  → LmsVideoProgressController.saveVideoProgress (Q-19 real mutation)
 *
 * Q-31: shared pos-monitor.api.ts ga TEGMAYDI — PosHome kabi bu yerda to'g'ridan-to'g'ri
 * ERP SSO cookie bilan chaqiradi (parallel-sessiya izolyatsiyasi).
 * Q-40/DB-drift: video-progress mutation ISHLATILADI (video_progress.user_id = auth user id).
 * micro-modules/:id/view ISHLATILMAYDI — micro_module_views.employee_id FK employees(id),
 * lekin controller users.id yuboradi (overlap 1/31) → ~97% userda FK-fail.
 * Q-21: faqat var(--pos-*) token — xom rang YO'Q.
 */

import { useCallback, useEffect, useState } from "react";
import { usePosI18n } from "../i18n/usePosI18n";

const _base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

// ─── Result-wrapperlarni ochish ({ isSuccess, value } | { ok, data } | xom array) ──────
// PosHome.fetchMyWarehouses bilan bir xil (isbotlangan). Global response-transform YO'Q
// (faqat SentryInterceptor) — GET xom array qaytaradi, wrapper bo'lsa ham ochiladi.
function unwrap(v: unknown): unknown {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    const o = v as Record<string, unknown>;
    if ("isSuccess" in o && "value" in o) return o.value;
    if ("ok" in o && "data" in o) return o.data;
  }
  return v;
}

async function readBody(res: Response): Promise<string> {
  let msg = res.statusText;
  try { const j = (await res.json()) as { message?: string }; msg = j.message ?? msg; } catch { /* noop */ }
  return msg;
}

async function posGet<T>(path: string): Promise<T> {
  const res = await fetch(`${_base}${path}`, {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(await readBody(res));
  return unwrap(await res.json()) as T;
}

async function posPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${_base}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readBody(res));
  return unwrap(await res.json()) as T;
}

interface MicroModule {
  id: number;
  title: string | null;
  title_ru: string | null;
  description: string | null;
  course_title: string | null;
}

interface VideoProgress {
  id: number;
  lesson_id: number;
  current_time: number | null;
  duration: number | null;
  completed: boolean | null;
  last_watched_at: string | null;
}

function pct(row: VideoProgress): number {
  const d = Number(row.duration ?? 0);
  const c = Number(row.current_time ?? 0);
  if (!(d > 0)) return row.completed ? 100 : 0;
  return Math.max(0, Math.min(100, Math.round((c / d) * 100)));
}

export default function PosTraining() {
  const { t } = usePosI18n();
  const tt = (key: string, fallback: string) => {
    const v = t(key);
    return v === key ? fallback : v;
  };

  const [modules, setModules] = useState<MicroModule[]>([]);
  const [progress, setProgress] = useState<VideoProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [saveError, setSaveError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [mm, vp] = await Promise.all([
        posGet<unknown>("/api/micro-modules"),
        posGet<unknown>("/api/video-progress"),
      ]);
      setModules(Array.isArray(mm) ? (mm as MicroModule[]) : []);
      setProgress(Array.isArray(vp) ? (vp as VideoProgress[]) : []);
    } catch (e: unknown) {
      setError((e as Error)?.message ?? "O'quv ma'lumotlarini yuklashda xato");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // Q-19 real mutation: POST /api/video-progress — darsni "Tugatdim" deb belgilash.
  const markComplete = useCallback(async (row: VideoProgress) => {
    setSavingId(row.lesson_id);
    setSaveError("");
    try {
      const dur = Math.max(0, Math.trunc(Number(row.duration ?? row.current_time ?? 0)));
      await posPost("/api/video-progress", {
        lessonId: row.lesson_id,
        progressSeconds: dur,
        totalSeconds: dur,
        completed: true,
      });
      await load();
    } catch (e: unknown) {
      setSaveError((e as Error)?.message ?? "Saqlashda xato");
    } finally {
      setSavingId(null);
    }
  }, [load]);

  const wrap: React.CSSProperties = { padding: "16px 16px 32px", maxWidth: 760, margin: "0 auto" };
  const sectionTitle: React.CSSProperties = {
    fontSize: 13, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase",
    color: "var(--pos-text-muted)", margin: "22px 4px 10px",
  };

  if (loading) {
    return (
      <div style={wrap}>
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--pos-text-muted)" }}>
          <div style={{ fontSize: 34, marginBottom: 10 }}>🎓</div>
          <div style={{ fontWeight: 600 }}>{tt("posTraining.loading", "O'quv yuklanmoqda…")}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={wrap}>
      {/* ── Sarlavha ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
        <span style={{ fontSize: 34, lineHeight: 1 }}>🎓</span>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--pos-text)" }}>
            {tt("posTraining.title", "Tez o'quv")}
          </div>
          <div style={{ fontSize: 12, color: "var(--pos-text-muted)" }}>
            {tt("posTraining.subtitle", "Qisqa mikro-modullar va video darslar davomi")}
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <button className="pos-btn pos-btn-ghost" onClick={() => void load()} style={{ fontSize: 13, padding: "8px 12px" }}>
          🔄 {tt("posTraining.refresh", "Yangilash")}
        </button>
      </div>

      {error && (
        <div style={{ textAlign: "center", padding: 18, marginTop: 12, color: "var(--pos-danger)", background: "var(--pos-card)", border: "1px solid var(--pos-border)", borderRadius: 14 }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>⚠️</div>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>{error}</div>
          <button className="pos-btn pos-btn-ghost" onClick={() => void load()}>🔄 {tt("posTraining.retry", "Qayta urinish")}</button>
        </div>
      )}

      {/* ── Mikro-modullar (GET /api/micro-modules) ── */}
      <div style={sectionTitle}>{tt("posTraining.microModules", "Mikro-modullar")}</div>
      {modules.length === 0 ? (
        <div style={{ padding: 18, color: "var(--pos-text-muted)", fontSize: 13, textAlign: "center", background: "var(--pos-card)", border: "1px dashed var(--pos-border)", borderRadius: 14 }}>
          {tt("posTraining.noModules", "Faol mikro-modul yo'q")}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {modules.map(m => (
            <div key={m.id} className="pos-card" style={{ padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 22 }}>📘</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "var(--pos-text)" }}>
                    {m.title || `#${m.id}`}
                  </div>
                  {m.course_title && (
                    <div style={{ fontSize: 11, color: "var(--pos-text-muted)" }}>{m.course_title}</div>
                  )}
                </div>
              </div>
              {m.description && (
                <div style={{ marginTop: 8, fontSize: 13, color: "var(--pos-text-muted)", lineHeight: 1.45 }}>
                  {m.description}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Video darslarim (GET + POST /api/video-progress) ── */}
      <div style={sectionTitle}>{tt("posTraining.myVideos", "Video darslarim")}</div>
      {saveError && (
        <div style={{ marginBottom: 10, padding: "8px 12px", color: "var(--pos-danger)", background: "var(--pos-card)", border: "1px solid var(--pos-border)", borderRadius: 10, fontSize: 12 }}>
          {saveError}
        </div>
      )}
      {progress.length === 0 ? (
        <div style={{ padding: 18, color: "var(--pos-text-muted)", fontSize: 13, textAlign: "center", background: "var(--pos-card)", border: "1px dashed var(--pos-border)", borderRadius: 14 }}>
          {tt("posTraining.noVideos", "Boshlangan video dars yo'q")}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {progress.map(row => {
            const done = row.completed === true;
            const p = pct(row);
            return (
              <div key={row.id} className="pos-card" style={{ padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 22 }}>{done ? "✅" : "▶️"}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "var(--pos-text)" }}>
                      {tt("posTraining.lesson", "Dars")} #{row.lesson_id}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--pos-text-muted)" }}>
                      {p}% {done ? tt("posTraining.completed", "tugatildi") : tt("posTraining.watched", "ko'rildi")}
                    </div>
                  </div>
                  {done ? (
                    <span className="pos-badge pos-badge-green">{tt("posTraining.done", "Tugatilgan")}</span>
                  ) : (
                    <button
                      className="pos-btn pos-btn-success"
                      style={{ fontSize: 13, padding: "8px 14px" }}
                      disabled={savingId === row.lesson_id}
                      onClick={() => void markComplete(row)}
                    >
                      {savingId === row.lesson_id ? tt("posTraining.saving", "Saqlanmoqda…") : tt("posTraining.markDone", "Tugatdim")}
                    </button>
                  )}
                </div>
                <div style={{ marginTop: 10, height: 6, background: "var(--pos-border)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${p}%`, height: "100%", background: done ? "var(--pos-success)" : "var(--pos-accent)" }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
