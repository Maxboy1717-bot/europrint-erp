/**
 * DIZAYN-NEW: NotificationBell — Real-time bildirishnoma komponenti
 * Vazifa 7: Badge, panel, rang-kodlash, vaqt formati
 * Header ga o'rnatiladi
 */
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, X, CheckCheck, ArrowRight, AlertCircle, Package, GraduationCap, Info } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type NotifType = "error" | "warning" | "success" | "info";

export interface Notification {
  id: string | number;
  type: NotifType;
  title: string;
  body?: string;
  time: string;       // ISO string yoki relative ("5 daqiqa oldin")
  read: boolean;
  actionLabel?: string;
  actionHref?: string;
}

interface NotificationBellProps {
  notifications?: Notification[];
  onMarkAllRead?: () => void;
  onMarkRead?: (id: string | number) => void;
  onViewAll?: () => void;
  onDismiss?: (id: string | number) => void;
  maxVisible?: number;
}

// ─── Type → styles ────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<NotifType, {
  icon: React.ElementType;
  iconClass: string;
  dotClass: string;
  bgClass: string;
}> = {
  error:   { icon: AlertCircle,   iconClass: "text-[hsl(var(--error))]",   dotClass: "bg-[hsl(var(--error))]",   bgClass: "bg-[hsl(var(--error))]/10"   },
  warning: { icon: Package,       iconClass: "text-[hsl(var(--warning))]", dotClass: "bg-[hsl(var(--warning))]", bgClass: "bg-[hsl(var(--warning))]/10" },
  success: { icon: GraduationCap, iconClass: "text-[hsl(var(--success))]", dotClass: "bg-[hsl(var(--success))]", bgClass: "bg-[hsl(var(--success))]/10" },
  info:    { icon: Info,          iconClass: "text-[hsl(var(--info))]",    dotClass: "bg-[hsl(var(--info))]",    bgClass: "bg-[hsl(var(--info))]/10"    },
};

// ─── Default demo notifications ───────────────────────────────────────────────

const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    type: "error",
    title: "QC rad etildi",
    body: "Buyurtma #2451 sifat nazoratidan o'tmadi",
    time: "5 daqiqa oldin",
    read: false,
    actionLabel: "Ko'rish",
    actionHref: "/qc",
  },
  {
    id: 2,
    type: "warning",
    title: "Material kam",
    body: "Qog'oz A4 — 12% qoldi (minimum: 15%)",
    time: "20 daqiqa oldin",
    read: false,
    actionLabel: "Xarid",
    actionHref: "/mm/purchase",
  },
  {
    id: 3,
    type: "success",
    title: "LMS kurs tugallandi",
    body: "Alisher N. — 'Xavfsizlik texnikasi' kursini tugatdi",
    time: "1 soat oldin",
    read: false,
  },
  {
    id: 4,
    type: "info",
    title: "Yangi buyurtma",
    body: "Buyurtma #2459 yaratildi — Iqtisodiyot nashriyoti",
    time: "2 soat oldin",
    read: true,
  },
  {
    id: 5,
    type: "warning",
    title: "Sertifikat muddati tugayapti",
    body: "Bobur K. sertifikati 5 kunda tugaydi",
    time: "3 soat oldin",
    read: true,
  },
];

// ─── Single notification item ─────────────────────────────────────────────────

interface NotifItemProps {
  notif: Notification;
  onMarkRead?: (id: string | number) => void;
  onDismiss?: (id: string | number) => void;
}

function NotifItem({ notif, onMarkRead, onDismiss }: NotifItemProps) {
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
      {/* Unread dot */}
      {!notif.read && (
        <span
          className="absolute left-2 top-[18px] w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"
          aria-label="O'qilmagan"
        />
      )}

      {/* Icon */}
      <div
        className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
          cfg.bgClass
        )}
        aria-hidden="true"
      >
        <Icon className={cn("w-4 h-4", cfg.iconClass)} />
      </div>

      {/* Content */}
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

      {/* Dismiss & mark-read on hover */}
      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        {!notif.read && (
          <button
            type="button"
            onClick={() => onMarkRead?.(notif.id)}
            aria-label="O'qildi deb belgilash"
            className="w-5 h-5 flex items-center justify-center rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <CheckCheck className="w-3 h-3" />
          </button>
        )}
        <button
          type="button"
          onClick={() => onDismiss?.(notif.id)}
          aria-label="O'chirish"
          className="w-5 h-5 flex items-center justify-center rounded text-muted-foreground hover:text-[hsl(var(--error))] hover:bg-[hsl(var(--error))]/10 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// ─── Notification Bell ────────────────────────────────────────────────────────

export function NotificationBell({
  notifications: propNotifications,
  onMarkAllRead,
  onMarkRead,
  onViewAll,
  onDismiss,
  maxVisible = 5,
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [localNotifs, setLocalNotifs] = useState<Notification[]>(
    propNotifications ?? DEMO_NOTIFICATIONS
  );

  const notifications = propNotifications ?? localNotifs;
  const unreadCount = (Array.isArray(notifications) ? notifications : []).filter((n) => !n.read).length;
  const visible = notifications.slice(0, maxVisible);

  const handleMarkRead = useCallback((id: string | number) => {
    onMarkRead?.(id);
    if (!propNotifications) {
      setLocalNotifs((prev) =>
        (prev ?? []).map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    }
  }, [onMarkRead, propNotifications]);

  const handleMarkAllRead = useCallback(() => {
    onMarkAllRead?.();
    if (!propNotifications) {
      setLocalNotifs((prev) => (prev ?? []).map((n) => ({ ...n, read: true })));
    }
  }, [onMarkAllRead, propNotifications]);

  const handleDismiss = useCallback((id: string | number) => {
    onDismiss?.(id);
    if (!propNotifications) {
      setLocalNotifs((prev) => (prev ?? []).filter((n) => n.id !== id));
    }
  }, [onDismiss, propNotifications]);

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        aria-label={`Bildirishnomalar${unreadCount > 0 ? ` — ${unreadCount} yangi` : ""}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={cn(
          "relative w-9 h-9 flex items-center justify-center rounded-lg",
          "text-muted-foreground hover:text-foreground",
          "hover:bg-muted transition-all duration-150",
          open && "bg-muted text-foreground"
        )}
      >
        <Bell className="w-4.5 h-4.5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span
            className={cn(
              "absolute top-1 right-1",
              "min-w-[16px] h-4 px-0.5 rounded-full",
              "bg-[hsl(var(--error))] text-white",
              "flex items-center justify-center",
              "text-[9px] font-bold leading-none",
              "ring-2 ring-background"
            )}
            aria-hidden="true"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Panel */}
          <div
            role="dialog"
            aria-label="Bildirishnomalar paneli"
            aria-modal="true"
            className={cn(
              "absolute right-0 top-11 z-40 w-80 sm:w-96",
              "bg-card border border-border rounded-xl shadow-[var(--shadow-xl)]",
              "overflow-hidden",
              "animate-in slide-in-from-top-2 fade-in duration-200"
            )}
          >
            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-foreground">
                  Bildirishnomalar
                </h2>
                {unreadCount > 0 && (
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {unreadCount} yangi
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded-md hover:bg-primary/5"
                    aria-label="Barchasini o'qildi deb belgilash"
                  >
                    <CheckCheck className="w-3 h-3" aria-hidden="true" />
                    Barchasi o'qildi
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Yopish"
                  className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Notification list */}
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3">
                  <Bell className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">Yangi bildirishnoma yo'q</p>
                <p className="text-xs text-muted-foreground">Barcha bildirishnomalar o'qildi</p>
              </div>
            ) : (
              <div
                role="list"
                className="max-h-80 overflow-y-auto divide-y divide-border/50"
              >
                {(Array.isArray(visible) ? visible : []).map((notif) => (
                  <NotifItem
                    key={notif.id}
                    notif={notif}
                    onMarkRead={handleMarkRead}
                    onDismiss={handleDismiss}
                  />
                ))}
              </div>
            )}

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-3 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-8 text-xs text-primary hover:text-primary hover:bg-primary/5 gap-1"
                  onClick={() => {
                    setOpen(false);
                    onViewAll?.();
                  }}
                >
                  Barchasini ko'rish
                  <ArrowRight className="w-3 h-3" aria-hidden="true" />
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── AppHeader with NotificationBell ─────────────────────────────────────────

interface AppHeaderProps {
  title?: string;
  notifications?: Notification[];
  userName?: string;
  userAvatar?: string;
  onMenuToggle?: () => void;
  onViewAllNotifications?: () => void;
}

export function AppHeader({
  title = "EuroPrint ERP",
  notifications,
  userName,
  userAvatar,
  onMenuToggle,
  onViewAllNotifications,
}: AppHeaderProps) {
  const initials = userName
    ?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    ?? "EP";

  return (
    <header
      className="flex items-center justify-between h-14 px-4 border-b border-border bg-card"
      role="banner"
    >
      {/* Left: menu + title */}
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            type="button"
            onClick={onMenuToggle}
            aria-label="Menyuni ochish/yopish"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors md:hidden"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <span className="text-sm font-semibold text-foreground">{title}</span>
      </div>

      {/* Right: bell + avatar */}
      <div className="flex items-center gap-2">
        <NotificationBell
          notifications={notifications}
          onViewAll={onViewAllNotifications}
        />

        {/* User avatar */}
        <button
          type="button"
          aria-label={`Profil — ${userName ?? "Foydalanuvchi"}`}
          className="flex items-center gap-2 px-2 h-9 rounded-lg hover:bg-muted transition-colors"
        >
          <Avatar className="w-7 h-7">
            {userAvatar && (
              <img src={userAvatar} alt={userName ?? "Foydalanuvchi"} className="rounded-full" />
            )}
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

export default NotificationBell;
