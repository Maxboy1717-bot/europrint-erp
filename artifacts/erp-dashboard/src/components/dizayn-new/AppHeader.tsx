/**
 * @module AppHeader
 * @description Application header bar with title, notification bell and user avatar.
 * Split from NotificationBell.tsx (Rule 16).
 */

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTranslation } from '@/lib/i18n';
import { tLabel } from '@/lib/i18n/tLabel';
import { NotificationBell } from "./NotificationBell";
import type { Notification } from "./NotificationBell.types";

export interface AppHeaderProps {
  title?: string;
  notifications?: Notification[];
  userName?: string;
  userAvatar?: string;
  onMenuToggle?: () => void;
  onViewAllNotifications?: () => void;
}

export function AppHeader({
  title, notifications, userName, userAvatar,
  onMenuToggle, onViewAllNotifications,
}: AppHeaderProps) {
  const { t } = useTranslation("common");
  const resolvedTitle = title ?? t("europrintErp");
  const initials = userName
    ?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    ?? "EP";

  return (
    <header className="flex items-center justify-between h-14 px-4 border-b border-border bg-card" role="banner">
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            type="button" onClick={onMenuToggle}
            aria-label={tLabel('common.NotificationBell.menyuniOchishYopish', "Menyuni ochish/yopish")}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors md:hidden"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <span className="text-sm font-semibold text-foreground">{resolvedTitle}</span>
      </div>

      <div className="flex items-center gap-2">
        <NotificationBell notifications={notifications} onViewAll={onViewAllNotifications} />
        <button
          type="button"
          aria-label={`Profil — ${userName ?? "Foydalanuvchi"}`}
          className="flex items-center gap-2 px-2 h-9 rounded-lg hover:bg-muted transition-colors"
        >
          <Avatar className="w-7 h-7">
            {userAvatar && <AvatarImage src={userAvatar} alt={userName ?? "Foydalanuvchi"} />}
            <AvatarFallback className="text-[10px] font-semibold bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          {userName && (
            <span className="text-sm font-medium text-foreground hidden sm:block">{userName}</span>
          )}
        </button>
      </div>
    </header>
  );
}
