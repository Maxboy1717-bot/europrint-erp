/**
 * MockupShell — SmartHR mockup uslubidagi to'liq AppShell.
 *
 * Mockup HTML strukturasini aynan ko'chiradi:
 *   - Chap sidebar (248px, oq fon, profile block, toggle tabs, nav sections)
 *   - TopBar (60px, logo + search + top icons)
 *   - Main content (margin-left: 248px)
 *
 * Mavjud AppShellModern'ning to'liq o'rinbosari.
 */
import { useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useChatStore } from "@/store/chatStore";
import { useTranslation } from '@/lib/i18n';
import {
  Search, Moon, Maximize2, Grid3x3, MessageSquare,
  Mail, Bell, Menu, Printer, LayoutGrid, ShoppingCart,
  Users, Megaphone, Settings, Wallet, BarChart3, GitBranch,
  Box, ClipboardList, UserCircle, Calendar, CheckSquare,
  StickyNote, Receipt, Sun, FileText, Wrench, ShieldCheck,
  Briefcase, MapPin, BookOpen, Network, Crown, Activity,
} from "lucide-react";

interface NavItem {
  label: string;
  url?: string;
  icon: ReactNode;
  badge?: { text: string; variant: 'hot' | 'new' };
  exact?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV: NavSection[] = [
  {
    title: "Asosiy menyu",
    items: [
      { label: "Boshqaruv paneli", url: "/", icon: <LayoutGrid className="h-4 w-4" />, badge: { text: "Hot", variant: "hot" } },
    ],
  },
  {
    title: "Savdo va mijozlar",
    items: [
      { label: "Savdo buyurtmalari", url: "/sd/sales-orders", icon: <ShoppingCart className="h-4 w-4" /> },
      { label: "CRM Mijozlar", url: "/crm-workspace", icon: <Users className="h-4 w-4" />, badge: { text: "New", variant: "new" } },
      { label: "Marketing", url: "/marketing", icon: <Megaphone className="h-4 w-4" /> },
    ],
  },
  {
    title: "Ishlab chiqarish",
    items: [
      { label: "MES Production", url: "/mes/dashboard", icon: <GitBranch className="h-4 w-4" /> },
      { label: "Sifat nazorati", url: "/qc", icon: <ShieldCheck className="h-4 w-4" /> },
      { label: "Uskunalar (MRO)", url: "/mro", icon: <Wrench className="h-4 w-4" /> },
    ],
  },
  {
    title: "Ombor va materiallar",
    items: [
      { label: "WMS Ombor", url: "/warehouse/hub", icon: <Box className="h-4 w-4" /> },
      { label: "POS Monitor", url: "/pos-monitor", icon: <Activity className="h-4 w-4" /> },
      { label: "Inventarizatsiya", url: "/inventory", icon: <ClipboardList className="h-4 w-4" /> },
    ],
  },
  {
    title: "Boshqaruv",
    items: [
      { label: "Xodimlar (HR)", url: "/employees", icon: <UserCircle className="h-4 w-4" /> },
      { label: "Tashkiliy Tuzilma", url: "/org-structure/hierarchy", icon: <Network className="h-4 w-4" /> },
      { label: "7 Funksiya", url: "/seven-functions", icon: <Crown className="h-4 w-4" /> },
      { label: "Moliya", url: "/finance-dashboard", icon: <Wallet className="h-4 w-4" /> },
      { label: "Hisobotlar", url: "/reports", icon: <BarChart3 className="h-4 w-4" /> },
      { label: "Sozlamalar", url: "/settings", icon: <Settings className="h-4 w-4" /> },
    ],
  },
  {
    title: "Ilovalar",
    items: [
      { label: "Chat", url: "/chat", icon: <MessageSquare className="h-4 w-4" />, badge: { text: "3", variant: "hot" } },
      { label: "Kalendar", url: "/events-calendar", icon: <Calendar className="h-4 w-4" /> },
      { label: "Email", url: "/email", icon: <Mail className="h-4 w-4" /> },
      { label: "Vazifalar", url: "/goals", icon: <CheckSquare className="h-4 w-4" /> },
      { label: "Eslatmalar", url: "/notes", icon: <StickyNote className="h-4 w-4" /> },
    ],
  },
  {
    title: "Loyihalar va hisob",
    items: [
      { label: "Kanban", url: "/kanban", icon: <Briefcase className="h-4 w-4" /> },
      { label: "Schet-fakturalar", url: "/invoices", icon: <Receipt className="h-4 w-4" /> },
      { label: "Mijozlar Grid", url: "/clients-grid", icon: <Grid3x3 className="h-4 w-4" /> },
      { label: "Tashkiliy Xarita", url: "/hr-map", icon: <MapPin className="h-4 w-4" /> },
      { label: "LMS Ta'lim", url: "/lms-dashboard", icon: <BookOpen className="h-4 w-4" /> },
    ],
  },
  {
    title: "Style Guide",
    items: [
      { label: "Mockup Showcase", url: "/mockup-showcase", icon: <FileText className="h-4 w-4" /> },
    ],
  },
];

export interface MockupShellProps {
  children: ReactNode;
  onLogout?: () => void;
}

export function MockupShell({children, onLogout: _onLogout }: MockupShellProps) {
  const { t } = useTranslation('common');
  const { user } = useAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tab, setTab] = useState<'menu' | 'chat' | 'inbox'>('menu');
  const totalUnread = useChatStore((s) => s.totalUnread);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) return 'dark';
    return 'light';
  });

  const displayName = user?.fullName ?? user?.username ?? "Foydalanuvchi";
  const role = user?.role ?? "Xodim";
  const initials = displayName
    .split(/\s+/)
    .map((s: string) => s[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("") || "?";

  const isActive = (url?: string): boolean => {
    if (!url) return false;
    if (url === "/") return location === "/" || location === "/dashboard";
    return location === url || location.startsWith(url + "/");
  };

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    document.documentElement.classList.toggle('dark', next === 'dark');
    localStorage.setItem('theme', next);
    setTheme(next);
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--ep-bg)', color: 'var(--ep-text)', fontSize: 13, fontFamily: 'Inter, "Segoe UI", system-ui, sans-serif' }}>
      {/* ============ SIDEBAR (chap, 248px, oq fon) ============ */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-full sm:w-[248px] overflow-y-auto bg-[hsl(var(--card))] border-r border-[hsl(var(--border))] transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Profile block */}
        <div className="text-center px-4 pt-5 pb-4 border-b border-[hsl(var(--border))]">
          <div
            className="relative inline-flex items-center justify-center w-16 h-16 rounded-full text-white font-semibold text-[22px]"
            style={{ background: 'var(--ep-dark)' }}
          >
            {initials}
            <span
              className="absolute bottom-0.5 right-1 w-3 h-3 rounded-full border-2"
              style={{ background: 'var(--ep-green)', borderColor: 'hsl(var(--card))' }}
            />
          </div>
          <div className="font-semibold mt-2 text-sm">{displayName}</div>
          <div className="text-[11px] text-[var(--ep-muted)] mt-0.5 capitalize">
            {role.replace(/_/g, ' ')}
          </div>
        </div>

        {/* Toggle tabs */}
        <div className="flex gap-0 px-4 pt-2">
          {(['menu', 'chat', 'inbox'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 px-1 text-xs font-medium rounded-full transition ${tab === t ? 'text-white' : 'text-[var(--ep-muted)] bg-transparent'}`}
              style={tab === t ? { background: 'var(--ep-primary)' } : undefined}
            >
              {t === 'menu' ? 'Menyu' : t === 'chat' ? `Chat${totalUnread > 0 ? ` (${totalUnread})` : ''}` : 'Inbox'}
            </button>
          ))}
        </div>

        {/* Nav sections */}
        {tab === 'menu' && (
          <nav className="pb-6">
            {NAV.map((section) => (
              <div key={section.title}>
                <div className="px-[18px] pt-4 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--ep-muted)]">
                  {section.title}
                </div>
                {section.items.map((item) => {
                  const active = isActive(item.url);
                  return (
                    <Link
                      key={item.label}
                      href={item.url ?? "#"}
                      className={`flex items-center gap-2.5 px-[18px] py-2.5 text-[13px] no-underline transition ${active ? 'font-semibold' : ''}`}
                      style={{
                        color: active ? 'var(--ep-primary)' : 'var(--ep-text)',
                        borderLeft: '3px solid transparent',
                        borderLeftColor: active ? 'var(--ep-primary)' : 'transparent',
                        background: active ? 'rgba(255,144,47,0.06)' : 'transparent',
                      }}
                      onMouseEnter={(e) => {
                        if (!active) e.currentTarget.style.background = 'rgba(255,144,47,0.04)';
                      }}
                      onMouseLeave={(e) => {
                        if (!active) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <span style={{ width: 18, flexShrink: 0 }}>{item.icon}</span>
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded-[10px] font-semibold uppercase"
                          style={{
                            background: item.badge.variant === 'hot' ? '#ffe5e5' : '#fff0e0',
                            color: item.badge.variant === 'hot' ? '#dc3545' : 'var(--ep-primary)',
                          }}
                        >
                          {item.badge.text}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        )}

        {tab === 'chat' && (
          <div className="p-4 text-sm text-[var(--ep-muted)]">
            {t("chatRoyxatiKeyinroqQoshiladi")}
          </div>
        )}

        {tab === 'inbox' && (
          <div className="p-4 text-sm text-[var(--ep-muted)]">
            {t("inboxXabarlarKeyinroqQoshiladi")}
          </div>
        )}
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ============ MAIN (margin-left: 248px) ============ */}
      <div className="lg:ml-[248px] min-h-screen flex flex-col">
        {/* TopBar */}
        <header
          className="sticky top-0 z-30 h-[60px] px-6 flex items-center justify-between"
          style={{ background: 'hsl(var(--card))', borderBottom: '1px solid hsl(var(--border))' }}
        >
          <div className="flex items-center flex-1 min-w-0">
            <button
              type="button"
              className="lg:hidden mr-2 w-9 h-9 rounded-full inline-flex items-center justify-center hover:bg-muted"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Logo */}
            <div className="flex items-center gap-2 font-bold text-lg">
              <span
                className="w-8 h-8 rounded-full inline-flex items-center justify-center text-white"
                style={{ background: 'var(--ep-primary)' }}
              >
                <Printer className="h-4 w-4" />
              </span>
              {t("europrint1")}
            </div>

            {/* Search */}
            <div className="relative flex-1 max-w-md ml-6 hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--ep-muted)]" />
              <input
                type="search"
                placeholder={t("erpTizimidaQidirish")}
                className="w-full pl-9 pr-16 py-2 rounded-lg text-sm"
                style={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                }}
              />
              <span
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded text-[11px] text-[var(--ep-muted)]"
                style={{ background: 'hsl(var(--muted))' }}
              >
                Ctrl + /
              </span>
            </div>
          </div>

          {/* Top icons */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-full inline-flex items-center justify-center"
              style={{ background: 'hsl(var(--muted))' }}
              title={t("theme")}
            >
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
            <button
              onClick={() => document.documentElement.requestFullscreen?.()}
              className="w-9 h-9 rounded-full inline-flex items-center justify-center hidden md:inline-flex"
              style={{ background: 'hsl(var(--muted))' }}
              title={t('fullscreen')}
            >
              <Maximize2 className="h-4 w-4" />
            </button>
            <Link
              href="/chat"
              className="relative w-9 h-9 rounded-full inline-flex items-center justify-center"
              style={{ background: 'hsl(var(--muted))' }}
            >
              <MessageSquare className="h-4 w-4" />
              {totalUnread > 0 && (
                <span
                  className="absolute top-1.5 right-2 w-2 h-2 rounded-full"
                  style={{ background: 'var(--ep-primary)' }}
                />
              )}
            </Link>
            <button
              className="relative w-9 h-9 rounded-full inline-flex items-center justify-center"
              style={{ background: 'hsl(var(--muted))' }}
              title={t("notifications")}
            >
              <Bell className="h-4 w-4" />
              <span
                className="absolute top-1.5 right-2 w-2 h-2 rounded-full"
                style={{ background: 'var(--ep-primary)' }}
              />
            </button>

            <Link
              href="/profile"
              className="ml-1.5 w-7 h-7 rounded-full inline-flex items-center justify-center text-white text-[11px] font-semibold"
              style={{ background: 'var(--ep-primary)' }}
              title={displayName}
            >
              {initials}
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-6 py-5">
          {children}
        </main>
      </div>
    </div>
  );
}
