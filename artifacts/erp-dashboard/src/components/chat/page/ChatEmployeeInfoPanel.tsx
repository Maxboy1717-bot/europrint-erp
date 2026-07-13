/**
 * @module ChatEmployeeInfoPanel
 * @description Chat 3-panel inbox — o'ng ustun: xodim-profil paneli
 *   (Crisp/Intercom-uslub, owner design-spec 2026-07-11). Suhbatdagi
 *   XODIM (DM'da ikkinchi ishtirokchi) haqidagi ma'lumot. Bu — messenger
 *   bubble UI (--tg-*) EMAS, balki ma'lumot-paneli → STANDART --ep-* token.
 *   Umumiy ma'lumot kartasi: ish-holati, profil (ism/telefon/email/lavozim/
 *   bo'lim), bo'lim/filial ko'rsatkichi. Tab-bar + qolgan tablar keyingi commit.
 */

import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Phone, Mail, Briefcase, Building2, MapPin } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { ChatAvatar } from "./ChatAvatar";
import { useTranslation } from "@/lib/i18n";

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

export function ChatEmployeeInfoPanel({ employee, onClose }: { employee: ChatPanelEmployee; onClose: () => void }) {
  const { t } = useTranslation("common");

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
        <span className="text-[14px] font-semibold">{t("umumiyMalumot")}</span>
        <button onClick={onClose} className="p-1.5 rounded-md hover:bg-[var(--ep-subtle)] text-[var(--ep-muted)]" title={t("yopish")}>
          <X className="w-4 h-4" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
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
      </div>
    </div>
  );
}
