/**
 * @module NotifItem
 * @description Single notification row rendered inside NotificationBell.
 * Split from NotificationBell.tsx (Rule 16).
 */

import { cn } from "@/lib/utils";
import { CheckCheck, X, ArrowRight } from "lucide-react";
import { useTranslation } from '@/lib/i18n';
import type { Notification } from "./NotificationBell.types";
import { TYPE_CONFIG } from "./NotificationBell.types";

interface NotifItemProps {
  notif: Notification;
  onMarkRead?: (id: string | number) => void;
  onDismiss?: (id: string | number) => void;
}

export function NotifItem({ notif, onMarkRead, onDismiss }: NotifItemProps) {
  const { t } = useTranslation("common");
  const cfg = TYPE_CONFIG[notif.type];
  const Icon = cfg.icon;

  return (
    <div
      className={cn(
        "group relative flex gap-3 px-4 py-3",
        "hover:bg-muted/50 transition-colors cursor-default",
        !notif.read && "bg-primary/[0.03]"
      )}
      role="listitem"
      aria-label={notif.title}
    >
      {!notif.read && (
        <span
          className="absolute left-2 top-[18px] w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"
          aria-label={t("oqilmagan")}
        />
      )}

      <div
        className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5", cfg.bgClass)}
        aria-hidden="true"
      >
        <Icon className={cn("w-4 h-4", cfg.iconClass)} />
      </div>

      <div className="flex-1 min-w-0 space-y-0.5">
        <p className={cn("text-sm font-medium text-foreground truncate", !notif.read && "font-semibold")}>
          {notif.title}
        </p>
        {notif.body && (
          <p className="text-xs text-muted-foreground line-clamp-2">{notif.body}</p>
        )}
        <div className="flex items-center justify-between pt-0.5">
          <span className="text-[10px] text-muted-foreground">{notif.time}</span>
          {notif.actionLabel && notif.actionHref && (
            <a
              href={notif.actionHref}
              className="text-[10px] font-medium text-primary hover:underline flex items-center gap-0.5"
              aria-label={`${notif.actionLabel} — ${notif.title}`}
            >
              {notif.actionLabel}
              <ArrowRight className="w-2.5 h-2.5" />
            </a>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        {!notif.read && (
          <button
            type="button" onClick={() => onMarkRead?.(notif.id)}
            aria-label={t("oqildiDebBelgilash")}
            className="w-5 h-5 flex items-center justify-center rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <CheckCheck className="w-3 h-3" />
          </button>
        )}
        <button
          type="button" onClick={() => onDismiss?.(notif.id)}
          aria-label={t("delete")}
          className="w-5 h-5 flex items-center justify-center rounded text-muted-foreground hover:text-[hsl(var(--error))] hover:bg-[hsl(var(--error))]/10 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
