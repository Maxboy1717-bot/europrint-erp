/**
 * Telegram Mini App (WebApp) integration utility.
 *
 * When POS Monitor is opened inside a Telegram Bot's WebApp context,
 * this module initialises the Telegram WebApp SDK, expands to full screen,
 * applies the Telegram theme, and exposes helpers for haptic feedback and
 * the native back/close buttons.
 */

interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  close: () => void;
  isExpanded: boolean;
  colorScheme: "light" | "dark";
  themeParams: Record<string, string>;
  initDataUnsafe: {
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
    start_param?: string;
  };
  HapticFeedback: {
    impactOccurred: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
    notificationOccurred: (type: "error" | "success" | "warning") => void;
    selectionChanged: () => void;
  };
  MainButton: {
    text: string;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    onClick: (fn: () => void) => void;
    offClick: (fn: () => void) => void;
  };
  BackButton: {
    show: () => void;
    hide: () => void;
    onClick: (fn: () => void) => void;
    offClick: (fn: () => void) => void;
  };
  onEvent: (eventType: string, fn: () => void) => void;
  offEvent: (eventType: string, fn: () => void) => void;
  sendData: (data: string) => void;
  openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
}

/** Returns true when running inside Telegram WebApp context. */
export function isTelegramWebApp(): boolean {
  return typeof window !== "undefined" && !!window.Telegram?.WebApp;
}

/** Returns the raw Telegram WebApp object (or null outside TG context). */
export function getTelegramWebApp(): TelegramWebApp | null {
  return (window.Telegram?.WebApp as TelegramWebApp | undefined) ?? null;
}

/**
 * Initialise Telegram Mini App.
 * Call this once on app startup (e.g. in main.tsx or App component).
 * Safe to call outside Telegram context — does nothing.
 */
export function initTelegramWebApp(): void {
  const tg = getTelegramWebApp();
  if (!tg) return;

  tg.ready();
  if (!tg.isExpanded) tg.expand();
}

/** Get the Telegram user info embedded in the WebApp init data. */
export function getTelegramUser() {
  return getTelegramWebApp()?.initDataUnsafe?.user ?? null;
}

/** Haptic feedback helpers. */
export const haptic = {
  success: () => getTelegramWebApp()?.HapticFeedback.notificationOccurred("success"),
  error:   () => getTelegramWebApp()?.HapticFeedback.notificationOccurred("error"),
  warning: () => getTelegramWebApp()?.HapticFeedback.notificationOccurred("warning"),
  tap:     () => getTelegramWebApp()?.HapticFeedback.impactOccurred("light"),
  medium:  () => getTelegramWebApp()?.HapticFeedback.impactOccurred("medium"),
};

/**
 * Show the Telegram native back button and attach a handler.
 * Returns a cleanup function that hides the button and removes the handler.
 */
export function useTelegramBackButton(onBack: () => void): () => void {
  const tg = getTelegramWebApp();
  if (!tg) return () => undefined;

  tg.BackButton.show();
  tg.BackButton.onClick(onBack);
  return () => {
    tg.BackButton.hide();
    tg.BackButton.offClick(onBack);
  };
}
