/**
 * @module AppShellModern
 * @description Source module. See exports for details.
 */

import type { ReactNode } from "react";
import { Menu, MessageSquare } from "lucide-react";
import { Link } from "wouter";
import { ModuleTabs, ModuleSidebar, MobileSidebar } from "@/components/ModuleSidebar";
import { DesignNotifications } from "@/components/DesignNotifications";
import { GlobalInboxBadge } from "@/components/cc/GlobalInboxBadge";
import { EuroprintLogo } from "@/components/EuroprintLogo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggleModern } from "./ThemeToggleModern";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/store/chatStore";
import { useTranslation } from '@/lib/i18n';

const TOP_H = "h-14";
const TOP_OFFSET = "pt-14";
const SIDEBAR_W = "lg:ml-64";

export interface AppShellModernProps {
  activeModule: string;
  onModuleChange: (module: string) => void;
  mobileMenuOpen: boolean;
  onMobileMenuOpenChange: (open: boolean) => void;
  onLogout: () => void;
  children: ReactNode;
}

function ChatHeaderButton() {
  const { t } = useTranslation("common");
  const totalUnread = useChatStore((s) => s.totalUnread);
  return (
    <Link href="/chat">
      <button
        type="button"
        className="relative flex items-center justify-center w-9 h-9 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        title={t("ichkiChat")}
      >
        <MessageSquare className="h-4 w-4" />
        {totalUnread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
            {totalUnread > 99 ? "99+" : totalUnread}
          </span>
        )}
      </button>
    </Link>
  );
}

/**
 * Zamonaviy ERP shell: shaffof header, semantic bg-background, sidebar mos offset.
 * Navigatsiya va modul mantiq o'zgarishsiz — faqat UI qatlami.
 */
export function AppShellModern({
  activeModule,
  onModuleChange,
  mobileMenuOpen,
  onMobileMenuOpenChange,
  onLogout,
  children,
}: AppShellModernProps) {
  const { t } = useTranslation("common");
  return (
    <div
      className="min-h-screen w-full bg-background text-foreground antialiased"
      data-erp-shell="modern"
      data-testid="authenticated-layout"
    >
      <header
        className={cn(
          "fixed top-0 inset-x-0 z-50 flex items-center justify-between gap-3 px-3 lg:px-5 border-b border-border",
          TOP_H,
          "bg-card text-foreground",
        )}
      >
        <div className="flex items-center min-w-0 gap-2 lg:gap-4 h-full">
          <button
            type="button"
            className="lg:hidden flex items-center justify-center w-9 h-9 rounded-md hover:bg-muted transition-colors shrink-0"
            onClick={() => onMobileMenuOpenChange(true)}
            data-testid="button-mobile-menu"
            aria-label={t("menyu")}
          >
            <Menu className="h-4 w-4 text-muted-foreground" />
          </button>

          <div
            className="flex items-center shrink-0 pr-2 lg:pr-4 border-r border-border/70"
            data-testid="text-logo"
          >
            <EuroprintLogo height={28} />
          </div>

          <div className="hidden lg:flex items-stretch min-w-0 overflow-x-auto hidden-scrollbar">
            <ModuleTabs activeModule={activeModule} onModuleChange={onModuleChange} />
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <GlobalInboxBadge />
          <ChatHeaderButton />
          <DesignNotifications />
          <span className="hidden sm:block">
            <LanguageSwitcher />
          </span>
          <ThemeToggleModern />
          <button
            type="button"
            className={cn(
              "ml-1 h-8 px-3 rounded-md text-[12px] font-medium",
              "bg-primary text-primary-foreground hover:bg-primary/90 transition-colors",
            )}
            data-testid="button-user-menu"
            onClick={onLogout}
            title={t("logout")}
          >
            {t("logout")}
          </button>
        </div>
      </header>

      <ModuleSidebar activeModule={activeModule} onModuleChange={onModuleChange} />

      <MobileSidebar
        open={mobileMenuOpen}
        onClose={() => onMobileMenuOpenChange(false)}
        activeModule={activeModule}
        onModuleChange={(mod) => {
          onModuleChange(mod);
          onMobileMenuOpenChange(false);
        }}
      />

      <main
        className={cn(
          "erp-main-canvas ml-0",
          SIDEBAR_W,
          TOP_OFFSET,
          "bg-background",
        )}
        style={{ height: "calc(100dvh - 3.5rem)", display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        {/* flex-1 + min-h-0 gives children a real height to fill with h-full */}
        <div className="p-4 lg:p-6" style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden" }}>
          {children}
        </div>
      </main>
    </div>
  );
}
