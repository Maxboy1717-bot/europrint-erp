/**
 * DIZAYN-NEW: AppSidebar — Enterprise sidebar redesign
 * Vazifa 2: User avatar, section dividers, active highlight, badge, dark mode toggle, collapsed mode
 * Linear/Vercel uslubida
 */
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useRoleMenus } from "@/hooks/use-role-menus";
import { useDefaultPanel } from "@/hooks/use-default-panel";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  BarChart3, BookOpen, Users, ClipboardList, Award,
  Target, Calendar, UserCheck, FileText, Settings,
  HelpCircle, LogOut, Sun, Moon, Network, BrainCircuit,
  FileCheck, FileQuestion, LayoutDashboard, Lightbulb, ScrollText,
} from "lucide-react";
import { EuroprintLogo } from "@/components/EuroprintLogo";
import { safeStorage } from '@/lib/safeStorage';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
  badge?: number;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

interface AppSidebarRedesignProps {
  activePage?: string;
  onNavigate?: (page: string) => void;
  user?: {
    name: string;
    role: string;
    avatar?: string;
  };
}

// ─── Nav Config ───────────────────────────────────────────────────────────────

const MAIN_NAV: NavSection = {
  label: "Asosiy",
  items: [
    { title: "Dashboard",    url: "analytics",            icon: LayoutDashboard },
    { title: "Kurslar",      url: "courses",              icon: BookOpen        },
    { title: "Xodimlar",     url: "employees",            icon: Users           },
    { title: "Tashkiliy",    url: "org-structure/hierarchy", icon: Network      },
    { title: "Testlar",      url: "tests",                icon: ClipboardList   },
    { title: "AI Imtihonlar",url: "ai-exams",             icon: BrainCircuit    },
    { title: "Barcha imtihon", url: "all-exams",          icon: FileCheck       },
    { title: "Anketa",       url: "questionnaire",        icon: FileQuestion    },
    { title: "Sertifikatlar",url: "certificates",         icon: Award, badge: 3 },
    { title: "Ko'nikmalar",  url: "skills-matrix",        icon: Target          },
    { title: "Tadbirlar",    url: "events-calendar",      icon: Calendar        },
    { title: "Mentorlik",    url: "mentorship",           icon: UserCheck       },
    { title: "Arizalar",     url: "applications",         icon: FileText        },
    { title: "Statistika",   url: "stats",                icon: BarChart3       },
    { title: "Kaizen",       url: "kaizen",               icon: Lightbulb       },
    { title: "Buyruqlar",    url: "orders-registry",      icon: ScrollText      },
  ],
};

const SYSTEM_NAV: NavSection = {
  label: "Tizim",
  items: [
    { title: "Sozlamalar", url: "settings", icon: Settings  },
    { title: "Yordam",     url: "help",     icon: HelpCircle },
  ],
};

// ─── Role badge color ─────────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, string> = {
  super_admin:    "bg-destructive/10 text-destructive border-destructive/20",
  director:       "bg-[hsl(var(--module-hr))]/10 text-[hsl(var(--module-hr))] border-[hsl(var(--module-hr))]/20",
  hr_specialist:  "bg-[hsl(var(--module-hr-light))] text-[hsl(var(--module-hr))] border-[hsl(var(--module-hr))]/20",
  sales_manager:  "bg-[hsl(var(--module-sd-light))] text-[hsl(var(--module-sd))] border-[hsl(var(--module-sd))]/20",
  finance:        "bg-[hsl(var(--module-fi-light))] text-[hsl(var(--module-fi))] border-[hsl(var(--module-fi))]/20",
};

function getRoleBadgeClass(role: string) {
  return ROLE_COLORS[role] ?? "bg-muted text-muted-foreground border-border";
}

function getRoleLabel(role: string) {
  const labels: Record<string, string> = {
    super_admin: "Super Admin",
    director: "Direktor",
    hr_specialist: "HR Mutaxassis",
    sales_manager: "Savdo Menejer",
    finance: "Moliyachi",
    technologist: "Texnolog",
    operator: "Operator",
    warehouse_keeper: "Omborchi",
    qc_specialist: "QC Mutaxassis",
  };
  return labels[role] ?? role;
}

// ─── Nav Item Component ───────────────────────────────────────────────────────

interface NavItemButtonProps {
  item: NavItem;
  isActive: boolean;
  isCollapsed: boolean;
  onClick: () => void;
}

function NavItemButton({ item, isActive, isCollapsed, onClick }: NavItemButtonProps) {
  const Icon = item.icon;

  const button = (
    <SidebarMenuButton
      asChild
      isActive={isActive}
      className={cn(
        "h-9 rounded-lg transition-all duration-150",
        "text-sm font-medium",
        isActive
          ? "bg-primary/10 text-primary border-l-2 border-primary pl-[calc(0.75rem-2px)]"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      <a
        href={`/${item.url}`}
        onClick={(e) => { e.preventDefault(); onClick(); }}
        aria-current={isActive ? "page" : undefined}
        data-testid={`nav-menu-item-${item.url}`}
        className="flex items-center gap-2.5 px-3"
      >
        <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
        {!isCollapsed && (
          <span className="flex-1 truncate">{item.title}</span>
        )}
        {!isCollapsed && item.badge && item.badge > 0 && (
          <Badge
            variant="secondary"
            className="ml-auto h-5 min-w-5 px-1.5 text-[10px] font-semibold bg-primary/15 text-primary border-0"
          >
            {item.badge}
          </Badge>
        )}
      </a>
    </SidebarMenuButton>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-2">
          {item.title}
          {item.badge && item.badge > 0 && (
            <Badge className="h-4 px-1 text-[10px]">{item.badge}</Badge>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  return button;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AppSidebarRedesign({
  activePage,
  onNavigate,
  user = { name: "Foydalanuvchi", role: "hr_specialist" },
}: AppSidebarRedesignProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [darkMode, setDarkMode] = useState(() =>
    document.documentElement.classList.contains("dark")
  );

  const { isMenuAllowed, isAdmin } = useRoleMenus();
  const { defaultPage } = useDefaultPanel();

  const currentPage = activePage ?? defaultPage;

  const handleNavigate = (url: string) => {
    onNavigate?.(url);
  };

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    safeStorage.setItem("theme", next ? "dark" : "light");
  };

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const renderSection = (section: NavSection) => {
    const visibleItems = isAdmin
      ? section.items
      : (section.items ?? []).filter((item) => isMenuAllowed(item.url));

    if (visibleItems.length === 0) return null;

    return (
      <SidebarGroup key={section.label}>
        {!isCollapsed && (
          <SidebarGroupLabel className="uppercase text-[10px] tracking-widest font-medium text-muted-foreground px-3 mb-1">
            {section.label}
          </SidebarGroupLabel>
        )}
        <SidebarGroupContent>
          <SidebarMenu className="space-y-0.5">
            {(Array.isArray(visibleItems) ? visibleItems : []).map((item) => (
              <SidebarMenuItem key={item.url}>
                <NavItemButton
                  item={item}
                  isActive={currentPage === item.url || currentPage.startsWith(item.url)}
                  isCollapsed={isCollapsed}
                  onClick={() => handleNavigate(item.url)}
                />
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  };

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar">
      {/* ── Header: Logo ── */}
      <SidebarHeader className="px-4 py-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-primary-foreground font-bold text-xs">EP</span>
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <EuroprintLogo height={18} />
              <span className="text-[10px] text-muted-foreground">ERP System v2.0</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* ── User Card ── */}
      {!isCollapsed && (
        <div className="px-3 py-3 border-b border-sidebar-border">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-sidebar-accent transition-colors">
            <Avatar className="w-8 h-8 flex-shrink-0">
              {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
              <AvatarFallback className="text-xs font-semibold bg-primary/15 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{user.name}</p>
              <span
                className={cn(
                  "inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full border",
                  getRoleBadgeClass(user.role)
                )}
              >
                {getRoleLabel(user.role)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Navigation ── */}
      <SidebarContent className="px-2 py-3 overflow-y-auto">
        {renderSection(MAIN_NAV)}

        <div className="mx-3 my-2 border-t border-sidebar-border" />

        {renderSection(SYSTEM_NAV)}
      </SidebarContent>

      {/* ── Footer: Dark mode + Logout ── */}
      <SidebarFooter className="px-3 py-3 border-t border-sidebar-border space-y-1">
        {/* Dark mode toggle */}
        <button
          type="button"
          onClick={toggleDark}
          aria-label={darkMode ? "Kunduzgi rejim" : "Tungi rejim"}
          className={cn(
            "w-full flex items-center gap-2.5 px-3 h-9 rounded-lg text-sm font-medium",
            "text-sidebar-foreground hover:bg-sidebar-accent",
            "transition-all duration-150"
          )}
        >
          {darkMode
            ? <Sun className="w-4 h-4 flex-shrink-0 text-warning" aria-hidden="true" />
            : <Moon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          }
          {!isCollapsed && (
            <span>{darkMode ? "Kunduzgi rejim" : "Tungi rejim"}</span>
          )}
        </button>

        {/* Logout */}
        <button
          type="button"
          onClick={() => {
            safeStorage.clear();
            window.location.href = "/";
          }}
          aria-label="Tizimdan chiqish"
          className={cn(
            "w-full flex items-center gap-2.5 px-3 h-9 rounded-lg text-sm font-medium",
            "text-muted-foreground hover:bg-destructive/10 hover:text-destructive",
            "transition-all duration-150"
          )}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          {!isCollapsed && <span>Chiqish</span>}
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}

export default AppSidebarRedesign;
