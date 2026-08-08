/**
 * @module App
 * @description Source module. See exports for details.
 */

import { useState, useEffect, lazy, Suspense } from "react";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { IdleLogoutProvider } from "@/components/IdleLogoutProvider";
import { ChatSocketProvider } from "@/hooks/chat/ChatSocketProvider";
import { Router as WouterRouter, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { getDefaultRouteForRole } from "@/lib/roleRoutes";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { findModuleByPath } from "@/components/ModuleSidebar";
import { LanguageProvider } from "@/lib/i18n";
import { PageLoader } from "@/components/PageLoader";
import { PrivateRoute } from "@/components/PrivateRoute";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import ErrorBoundary from "@/components/error-boundary";
import { ErpThemeProvider } from "@/erp-modern-ui";
import { AppShellModern } from "@/erp-modern-ui";
import { AppRouter } from "@/routes/AppRouter";

import Login from "@/pages/Login";
const OTPVerify = lazy(() => import("@/pages/OTPVerify"));
const IoTTablet = lazy(() => import("@/pages/IoTTablet"));
const AIInterviewPublicPage = lazy(() => import("@/pages/AIInterviewPublicPage"));
const HRCapitalPublicTest = lazy(() => import("@/pages/HRCapitalPublicTest"));
const TelegramMiniApp = lazy(() => import("@/pages/mini-app/TelegramMiniApp"));
const PosMonitorApp   = lazy(() => import("./pos-monitor/PosMonitorApp"));
const ChatPageFull    = lazy(() => import("@/pages/chat/ChatPage"));
const DocumentPrintView = lazy(() => import("@/pages/documents/DocumentPrintView"));

function MainApp() {
  const [location, setLocation] = useLocation();
  const [activeModule, setActiveModule] = useState(() => findModuleByPath(location) ?? "tz01");
  const { refetch: refetchAuth, isAuthenticated, isLoading, logout, user } = useAuth();
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const module = findModuleByPath(location);
    if (module !== null && module !== activeModule) setActiveModule(module);
  }, [location]);

  useEffect(() => {
    if (pendingRedirect && isAuthenticated) {
      const target = pendingRedirect;
      setPendingRedirect(null);
      setLocation(target);
    }
  }, [isAuthenticated, pendingRedirect, setLocation]);

  const handleLoginSuccess = async (role?: string) => {
    await refetchAuth();
    setPendingRedirect(getDefaultRouteForRole(role ?? ''));
  };

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  useEffect(() => {
    if (location === "/login" && !isLoading && isAuthenticated) {
      setLocation(getDefaultRouteForRole(user?.role ?? ""));
    }
  }, [location, isLoading, isAuthenticated, setLocation, user]);

  if (location === "/login") {
    if (!isLoading && isAuthenticated) return null;
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  if (location === "/otp-verify") {
    return <Suspense fallback={<PageLoader />}><OTPVerify /></Suspense>;
  }

  if (location === "/iot/tablet") {
    return <Suspense fallback={<PageLoader />}><IoTTablet /></Suspense>;
  }

  if (location.startsWith("/ai-interview/")) {
    return <Suspense fallback={<PageLoader />}><AIInterviewPublicPage /></Suspense>;
  }

  if (location.startsWith("/public/hrc-test/")) {
    return <Suspense fallback={<PageLoader />}><HRCapitalPublicTest /></Suspense>;
  }

  if (location.startsWith("/mini-app")) {
    return <Suspense fallback={<PageLoader />}><TelegramMiniApp /></Suspense>;
  }

  if (location.startsWith("/pos-monitor")) {
    return <Suspense fallback={<PageLoader />}><PosMonitorApp /></Suspense>;
  }

  // P1-11 clean print/PDF view — rendered OUTSIDE the AppShell so window.print() produces a
  // proper document (no sidebar/toolbar chrome). Auth-gated; the page itself is leadership-gated.
  if (/^\/(documents|spreadsheets)\/[^/]+\/print$/.test(location)) {
    return <PrivateRoute><Suspense fallback={<PageLoader />}><DocumentPrintView /></Suspense></PrivateRoute>;
  }

  // Item #17 (CHAT-COMPLETE-FRESH-ANALYSIS-2026-07-10-v1.md:270): "/chat/*" used to swallow
  // "/chat/admin" too, so the dedicated admin/director-gated route in AppRouter.tsx (:204,
  // wrapped in the normal AppShellModern — a moderation dashboard, not the messenger) never
  // ran; ChatAdminPage was unreachable by URL. "/chat/admin" now falls through to AppRouter.
  if (location === "/chat" || (location.startsWith("/chat/") && !location.startsWith("/chat/admin"))) {
    return (
      <PrivateRoute>
        <ChatSocketProvider>
          <Suspense fallback={<PageLoader />}>
            <ChatPageFull />
          </Suspense>
        </ChatSocketProvider>
      </PrivateRoute>
    );
  }

  return (
    <PrivateRoute>
      <ChatSocketProvider>
        <AppShellModern
          activeModule={activeModule}
          onModuleChange={setActiveModule}
          mobileMenuOpen={mobileMenuOpen}
          onMobileMenuOpenChange={setMobileMenuOpen}
          onLogout={handleLogout}
        >
          <Suspense fallback={<PageLoader />}>
            <AppRouter />
          </Suspense>
        </AppShellModern>
        <ChatWidget />
      </ChatSocketProvider>
    </PrivateRoute>
  );
}

const routerBase = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function App() {
  return (
    <ErrorBoundary>
      <WouterRouter base={routerBase}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <LanguageProvider>
              <ErpThemeProvider>
                <TooltipProvider>
                  <IdleLogoutProvider>
                    <MainApp />
                  </IdleLogoutProvider>
                  <Toaster />
                </TooltipProvider>
              </ErpThemeProvider>
            </LanguageProvider>
          </AuthProvider>
        </QueryClientProvider>
      </WouterRouter>
    </ErrorBoundary>
  );
}
