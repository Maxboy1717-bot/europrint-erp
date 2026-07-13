/**
 * @module ChatEmployeeInfoPanel
 * @description Chat 3-panel inbox — o'ng ustun: xodim-profil paneli
 *   (Crisp/Intercom-uslub, owner design-spec 2026-07-11). Suhbatdagi
 *   XODIM (DM'da ikkinchi ishtirokchi) haqidagi ma'lumot. Bu — messenger
 *   bubble UI (--tg-*) EMAS, balki ma'lumot-paneli → STANDART --ep-* token.
 *   Umumiy ma'lumot kartasi: ish-holati, profil (ism/telefon/email/lavozim/
 *   bo'lim), bo'lim/filial ko'rsatkichi. Tab-bar + qolgan tablar keyingi commit.
 */

import { useState, type ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Phone, Mail, Briefcase, Building2, MapPin, Plus, Tag, Paperclip, Download } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { ChatAvatar } from "./ChatAvatar";
import { useTranslation } from "@/lib/i18n";

const SUGGESTED_TAGS = ["Muhim", "Kutilmoqda", "Tezkor"];

export interface ChatPanelEmployee {
  userId: number;
  fullName: string;
  role: string;
  avatarUrl?: string;
  employeeId?: string;
  isOnline?: boolean;
}

// Ish-holati → rang + yorliq. Qiymatlar chat_user_presence.work_status'dan.
const WORK_STATUS: Record<string, { label: string; dot: string }> = {
  ishda:      { label: "Ishda",      dot: "bg-[var(--ep-green)]" },
  band:       { label: "Band",       dot: "bg-[var(--ep-red)]" },
  tushlikda:  { label: "Tushlikda",  dot: "bg-[var(--ep-yellow)]" },
  tatilda:    { label: "Ta'tilda",   dot: "bg-[var(--ep-muted)]" },
  tashqarida: { label: "Tashqarida", dot: "bg-[var(--ep-muted)]" },
};

interface EmployeeProfile {
  phone?: string | null;
  email?: string | null;
  position?: string | null;
  positionName?: string | null;
  department?: string | null;
  departmentName?: string | null;
  branch?: string | null;
  workStatus?: string | null;
}

function Field({ icon, label, value }: { icon: ReactNode; label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <span className="text-[var(--ep-muted)] mt-0.5">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-[var(--ep-muted)]">{label}</p>
        <p className="text-[14px] text-[var(--ep-text)] break-words">{value?.trim() ? value : "—"}</p>
      </div>
    </div>
  );
}

export function ChatEmployeeInfoPanel({ employee, roomId, onClose }: { employee: ChatPanelEmployee; roomId: string; onClose: () => void }) {
  const { t } = useTranslation("common");
  const qc = useQueryClient();

  // Suhbat teglari (Muhim/Kutilmoqda/Tezkor …)
  const tagsKey = [`/api/chat/rooms/${roomId}/tags`];
  const { data: tagsData } = useQuery<{ id: number; tag: string }[]>({
    queryKey: tagsKey,
    queryFn: () => apiRequest("GET", `/api/chat/rooms/${roomId}/tags`),
    enabled: !!roomId,
  });
  const tags = Array.isArray(tagsData) ? tagsData : [];
  const addTag = useMutation({
    mutationFn: (tag: string) => apiRequest("POST", `/api/chat/rooms/${roomId}/tags`, { tag }),
    onSuccess: (fresh) => qc.setQueryData(tagsKey, fresh),
  });
  const removeTag = useMutation({
    mutationFn: (tag: string) => apiRequest("DELETE", `/api/chat/rooms/${roomId}/tags/${encodeURIComponent(tag)}`),
    onSuccess: (fresh) => qc.setQueryData(tagsKey, fresh),
  });

  const [tab, setTab] = useState<"umumiy" | "fayllar">("umumiy");
  // Fayllar tab — suhbatda ulashilgan fayllar (mavjud endpoint).
  const { data: filesData } = useQuery<Array<{ fileUrl?: string; fileName?: string; fileType?: string }>>({
    queryKey: [`/api/chat/rooms/${roomId}/files`],
    queryFn: () => apiRequest("GET", `/api/chat/rooms/${roomId}/files`),
    enabled: !!roomId && tab === "fayllar",
  });
  const files = Array.isArray(filesData) ? filesData : [];

  // Kengaytirilgan profil — kanonik HR endpointidan (mavjud bo'lmasa dash).
  const { data } = useQuery<EmployeeProfile>({
    queryKey: [`/api/hr/employees/${employee.employeeId}`],
    queryFn: () => apiRequest("GET", `/api/hr/employees/${employee.employeeId}`),
    enabled: !!employee.employeeId,
  });
  // Ish-holati — kanonik manba: chat_user_presence (HR profil emas).
  const { data: presence } = useQuery<{ status?: string | null; workStatus?: string | null } | null>({
    queryKey: [`/api/chat/presence/${employee.userId}`],
    queryFn: () => apiRequest("GET", `/api/chat/presence/${employee.userId}`),
  });

  const p = (data ?? {}) as EmployeeProfile;
  const position = p.positionName ?? p.position ?? "";
  const department = p.departmentName ?? p.department ?? "";
  const branch = p.branch ?? "";
  const ws = presence?.workStatus ? WORK_STATUS[presence.workStatus] : undefined;
  const location = [branch, department].filter(Boolean).join(" · ");

  return (
    <div className="flex flex-col h-full bg-[var(--ep-surface)] text-[var(--ep-text)]">
      <header className="flex items-center justify-between px-4 h-14 border-b border-[var(--ep-border)] flex-shrink-0">
        <span className="text-[14px] font-semibold truncate">{employee.fullName}</span>
        <button onClick={onClose} className="p-1.5 rounded-md hover:bg-[var(--ep-subtle)] text-[var(--ep-muted)]" title={t("yopish")}>
          <X className="w-4 h-4" />
        </button>
      </header>

      {/* Tab bar */}
      <div className="flex border-b border-[var(--ep-border)] flex-shrink-0 px-2 text-[13px]">
        {([["umumiy", t("umumiyMalumot")], ["fayllar", t("fayllar")]] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "px-3 py-2.5 -mb-px border-b-2 transition-colors",
              tab === key ? "border-[var(--ep-primary)] text-[var(--ep-text)] font-medium" : "border-transparent text-[var(--ep-muted)] hover:text-[var(--ep-text)]"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === "umumiy" && (<>
        {/* Avatar + ism + ish-holati */}
        <div className="flex flex-col items-center text-center pb-4 border-b border-[var(--ep-border)]">
          <ChatAvatar name={employee.fullName || "?"} url={employee.avatarUrl} size={72} />
          <p className="mt-3 text-[16px] font-semibold">{employee.fullName}</p>
          {position && <p className="text-[13px] text-[var(--ep-muted)]">{position}</p>}
          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--ep-subtle)]">
            <span className={cn("w-2 h-2 rounded-full", ws ? ws.dot : (employee.isOnline ? "bg-[var(--ep-green)]" : "bg-[var(--ep-muted)]"))} />
            <span className="text-[12px]">{ws ? ws.label : (employee.isOnline ? t("onlayn") : t("oflayn"))}</span>
          </div>
        </div>

        {/* Profil maydonlari */}
        <div className="pt-2 divide-y divide-[var(--ep-border)]">
          <Field icon={<Phone className="w-4 h-4" />} label={t("telefon")} value={p.phone} />
          <Field icon={<Mail className="w-4 h-4" />} label={t("email")} value={p.email} />
          <Field icon={<Briefcase className="w-4 h-4" />} label={t("lavozim")} value={position} />
          <Field icon={<Building2 className="w-4 h-4" />} label={t("bolim")} value={department} />
          <Field icon={<MapPin className="w-4 h-4" />} label={t("bolimFilial")} value={location} />
        </div>

        {/* Teglar (Muhim / Kutilmoqda / Tezkor …) */}
        <div className="pt-4 mt-2 border-t border-[var(--ep-border)]">
          <div className="flex items-center gap-1.5 mb-2 text-[11px] uppercase tracking-wide text-[var(--ep-muted)]">
            <Tag className="w-3.5 h-3.5" /> {t("teglar")}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tg) => (
              <span key={tg.id} className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full bg-[var(--ep-subtle)] text-[12px]">
                {tg.tag}
                <button onClick={() => removeTag.mutate(tg.tag)} className="p-0.5 rounded-full hover:bg-[var(--ep-border)]" title={t("olibTashlash")}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {SUGGESTED_TAGS.filter((s) => !tags.some((tg) => tg.tag === s)).map((s) => (
              <button
                key={s}
                onClick={() => addTag.mutate(s)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-dashed border-[var(--ep-border)] text-[12px] text-[var(--ep-muted)] hover:text-[var(--ep-text)] hover:border-[var(--ep-text)]"
              >
                <Plus className="w-3 h-3" /> {s}
              </button>
            ))}
          </div>
        </div>
        </>)}

        {tab === "fayllar" && (
          <div className="space-y-1.5">
            {files.length === 0 && (
              <p className="text-[13px] text-[var(--ep-muted)] text-center py-6">{t("fayllarYoq")}</p>
            )}
            {files.map((f, i) => (
              <a
                key={i}
                href={f.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--ep-subtle)]"
              >
                <Paperclip className="w-4 h-4 text-[var(--ep-muted)] flex-shrink-0" />
                <span className="text-[13px] truncate flex-1">{f.fileName || f.fileUrl}</span>
                <Download className="w-4 h-4 text-[var(--ep-muted)] flex-shrink-0" />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
