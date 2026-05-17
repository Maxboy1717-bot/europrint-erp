import * as React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, Users, Building2, Calendar, Plane, 
  Banknote, Target, Scale, Clock, GraduationCap, 
  Briefcase, Activity, ShieldAlert, BookOpen, UserCheck, CheckSquare,
  LogOut, Menu, X, BarChart3, Star, Kanban, TrendingUp,
  Brain, Wallet, BookMarked, Award, TestTube, Bot, Library
} from "lucide-react";
import { Button } from "./ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { NotificationBell } from "@/components/dizayn-new/NotificationBell";
import { ChatNotificationBell } from "@/components/chat/ChatNotificationBell";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navGroups = [
    {
      title: "Asosiy",
      items: [
        { href: "/", label: "Dashboard", icon: LayoutDashboard }
      ]
    },
    {
      title: "HR Modul",
      items: [
        { href: "/hr/dashboard", label: "HR Dashboard", icon: BarChart3 },
        { href: "/hr/employees", label: "Xodimlar", icon: Users },
        { href: "/hr/departments", label: "Bo'limlar", icon: Building2 },
        { href: "/hr/attendance", label: "Davomat", icon: Calendar },
        { href: "/hr/vacation-sick", label: "Ta'til va Kasallik", icon: Plane },
        { href: "/hr/payroll", label: "Ish haqi", icon: Banknote },
        { href: "/hr/payroll-automation", label: "Ish haqi avtomatik", icon: Wallet },
        { href: "/hr/kpi", label: "KPI & Maqsadlar", icon: Target },
        { href: "/hr/daily-kpi", label: "Kunlik KPI", icon: TrendingUp },
        { href: "/hr/discipline", label: "Intizom", icon: Scale },
        { href: "/hr/shifts", label: "Smenalar", icon: Clock },
        { href: "/hr/shift-schedule", label: "Smena jadvali", icon: Calendar },
        { href: "/hr/skills", label: "Ko'nikmalar", icon: GraduationCap },
        { href: "/hr/skills-matrix", label: "Ko'nikmalar matritsasi", icon: Target },
        { href: "/hr/recruitment", label: "Yollash", icon: Briefcase },
        { href: "/hr/recruiting-kanban", label: "Yollash Kanban", icon: Kanban },
        { href: "/hr/adaptation", label: "Adaptatsiya", icon: UserCheck },
        { href: "/hr/assessment", label: "Baholash 360", icon: Activity },
        { href: "/hr/rating", label: "Xodim reytingi", icon: Star },
        { href: "/hr/succession", label: "Vorislik rejalash", icon: Users },
        { href: "/hr/ai-risk", label: "AI HR", icon: Brain },
      ]
    },
    {
      title: "LMS Modul",
      items: [
        { href: "/lms", label: "LMS Dashboard", icon: BookMarked },
        { href: "/lms/courses", label: "Kurslar", icon: BookOpen },
        { href: "/lms/enrollments", label: "Ro'yxatlar", icon: CheckSquare },
        { href: "/lms/tests", label: "Testlar", icon: TestTube },
        { href: "/lms/ai-exams", label: "AI Imtihonlar", icon: Bot },
        { href: "/lms/certificates", label: "Sertifikatlar", icon: Award },
        { href: "/lms/mentorship", label: "Mentorlik", icon: Users },
        { href: "/lms/knowledge-base", label: "Bilimlar bazasi", icon: Library },
      ]
    },
    {
      title: "Xavfsizlik",
      items: [
        { href: "/safety/incidents", label: "Hodisalar", icon: ShieldAlert },
      ]
    }
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex w-full overflow-hidden">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-72 bg-sidebar border-r border-sidebar-border text-sidebar-foreground transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border/50">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center mr-3 shadow-lg shadow-primary/20">
            <span className="font-display font-bold text-white">EP</span>
          </div>
          <span className="font-display font-bold text-xl tracking-tight">EuroPrint ERP</span>
          <button className="ml-auto lg:hidden" onClick={() => setMobileMenuOpen(false)}>
            <X className="h-5 w-5 opacity-70" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto h-[calc(100vh-4rem)] pb-24">
          {(Array.isArray(navGroups) ? navGroups : []).map((group, i) => (
            <div key={`k-${i}`} className="mb-6">
              <h4 className="px-3 mb-2 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
                {group.title}
              </h4>
              <nav className="space-y-1">
                {(Array.isArray(group.items) ? group.items : []).map((item) => {
                  const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
                  const Icon = item.icon;
                  return (
                    <Link key={item.href} href={item.href} className={cn(
                      "flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                      isActive 
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-primary/20" 
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}>
                      <Icon className={cn("h-4 w-4 mr-3", isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/50 group-hover:text-sidebar-accent-foreground")} />
                      {item.label}
                      {isActive && (
                        <motion.div 
                          layoutId="sidebar-active" 
                          className="absolute inset-0 border-2 border-primary/20 rounded-xl"
                          initial={false}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        <header className="h-16 flex-none bg-background/80 backdrop-blur-md border-b border-border z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <button className="lg:hidden mr-4 p-2 -ml-2 rounded-md hover:bg-muted text-muted-foreground" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="text-sm font-medium text-muted-foreground hidden sm:block">
              {new Date().toLocaleDateString('uz-UZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </h2>
          </div>
          <div className="flex items-center space-x-4">
            <ChatNotificationBell />
            <NotificationBell />
            <div className="h-8 w-px bg-border mx-2"></div>
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold leading-none">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-muted-foreground mt-1 text-right">@{user.username}</p>
              </div>
              <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </div>
              <Button variant="ghost" size="icon" onClick={logout} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={location}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
