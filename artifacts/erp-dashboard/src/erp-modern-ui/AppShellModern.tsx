import type { ReactNode } from "react";
import { Menu, MessageSquare } from "lucide-react";
import { Link } from "wouter";
import { ModuleTabs, ModuleSidebar, MobileSidebar } from "@/components/ModuleSidebar";
import { DesignNotifications } from "@/components/DesignNotifications";
import { EuroprintLogo } from "@/components/EuroprintLogo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggleModern } from "./ThemeToggleModern";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/store/chatStore";

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
  const totalUnread = useChatStore((s) => s.totalUnread);
  return (
    <Link href="/chat">
      <button
        type="button"
        className="relative flex items-center justify-center w-9 h-9 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        title="Ichki Chat"
      >
        <MessageSquare className="h-4 w-4" />
        {totalUnread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-[#ff5d2e] text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
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
  return (
    <div
      className="min-h-screen w-full bg-background text-foreground antialiased"
      data-erp-shell="modern"
      data-testid="authenticated-layout"
    >
      <header
        className={cn(
          "fixed top-0 inset-x-0 z-50 flex items-center justify-between gap-3 px-3 lg:px-5 border-b border-border/80",
          TOP_H,
          "bg-background/80 dark:bg-background/75 backdrop-blur-md supports-[backdrop-filter]:bg-background/65",
          "shadow-sm shadow-black/[0.03] dark:shadow-none",
        )}
      >
        <div className="flex items-center min-w-0 gap-2 lg:gap-4 h-full">
          <button
            type="button"
            className="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl hover:bg-muted transition-colors shrink-0"
            onClick={() => onMobileMenuOpenChange(true)}
            data-testid="button-mobile-menu"
            aria-label="Menyu"
          >
            <Menu className="h-5 w-5 text-muted-foreground" />
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
          <ChatHeaderButton />
          <DesignNotifications />
          <span className="hidden sm:block">
            <LanguageSwitcher />
          </span>
          <ThemeToggleModern />
          <button
            type="button"
            className={cn(
              "ml-1 h-9 px-3 rounded-xl text-xs font-semibold",
              "bg-primary text-primary-foreground hover:opacity-90 transition-opacity",
              "shadow-sm",
            )}
            data-testid="button-user-menu"
            onClick={onLogout}
            title="Chiqish"
          >
            Chiqish
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
          "min-h-screen bg-muted/35 dark:bg-background/95",
        )}
      >
        <div className="p-4 lg:p-6 max-w-[1920px] mx-auto">{children}</div>
      </main>
    </div>
  );
}
