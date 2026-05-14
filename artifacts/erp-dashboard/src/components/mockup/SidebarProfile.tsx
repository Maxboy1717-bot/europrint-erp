/**
 * SidebarProfile — sidebar yuqorisidagi user profile block (mockup uslubi).
 *
 * Mockup'da:
 *   - 64px diametrli rangdor avatar
 *   - Yashil online dot
 *   - Foydalanuvchi ismi (14px bold)
 *   - Lavozim (11px muted)
 *   - Personal/Hammasi tablari (orange pill)
 */
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useTranslation } from '@/lib/i18n';

export function SidebarProfile() {
  const { t } = useTranslation("common");
  const { user } = useAuth();
  const [tab, setTab] = useState<'personal' | 'all'>('personal');

  const displayName = user?.full_name ?? user?.username ?? "Foydalanuvchi";
  const role = user?.role ?? "Xodim";
  const initials = displayName
    .split(/\s+/)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("") || "?";

  return (
    <div className="border-b border-[hsl(var(--border))]">
      <div className="text-center px-4 pt-5 pb-4">
        <div
          className="relative inline-flex items-center justify-center w-16 h-16 rounded-full text-white font-semibold text-[22px]"
          style={{ background: 'var(--ep-dark)' }}
        >
          {initials}
          <span
            className="absolute bottom-0.5 right-1 w-3 h-3 rounded-full border-2"
            style={{
              background: 'var(--ep-green)',
              borderColor: 'hsl(var(--card))',
            }}
          />
        </div>
        <div className="font-semibold mt-2 text-sm">{displayName}</div>
        <div className="text-[11px] text-[var(--ep-muted)] mt-0.5 capitalize">
          {role.replace(/_/g, ' ')}
        </div>
      </div>

      {/* Toggle tabs (Personal / Hammasi) */}
      <div className="flex gap-0 px-4 pb-3">
        <button
          className={`flex-1 py-2 px-1 text-xs font-medium rounded-full transition ${
            tab === 'personal'
              ? 'bg-[var(--ep-primary)] text-white'
              : 'text-[var(--ep-muted)] bg-transparent'
          }`}
          onClick={() => setTab('personal')}
        >
          {t("shaxsiy")}
        </button>
        <button
          className={`flex-1 py-2 px-1 text-xs font-medium rounded-full transition ${
            tab === 'all'
              ? 'bg-[var(--ep-primary)] text-white'
              : 'text-[var(--ep-muted)] bg-transparent'
          }`}
          onClick={() => setTab('all')}
        >
          {t("hammasi")}
        </button>
      </div>
    </div>
  );
}
