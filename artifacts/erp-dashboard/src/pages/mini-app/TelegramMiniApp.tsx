/** @module TelegramMiniApp @description Root Telegram Mini App POS component — authentication, state management, mutations, and top-level screen routing. Delegates all screen rendering to dedicated screen components. */

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  getTg,
  apiCall,
  parseScanResult,
  type Screen,
  type User,
  type MaterialResult,
  type RequestItem,
  type PendingApproval,
  type AppColors,
  type ToastState,
  API_BASE,
} from "./TelegramMiniAppTypes";
import { LoadingSpinner } from "./TelegramMiniAppHelpers";
import { HistoryScreen, ApprovalsScreen, ApprovalDetailScreen, RequestScreen } from "./TelegramMiniAppScreens";
import { ScanScreen } from "./TelegramMiniAppScanScreen";
import { useTranslation } from '@/lib/i18n';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});

// ─── Inner component ──────────────────────────────────────────────────────────

function TelegramMiniAppInner() {
  const { t } = useTranslation("common");
  const tg = getTg();

  // Auth state
  const [screen, setScreen] = useState<Screen>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string>("");

  // Scan state
  const [barcodeInput, setBarcodeInput] = useState("");
  const [scanResult, setScanResult] = useState<MaterialResult | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCameraMode, setIsCameraMode] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("");

  // Cart state
  const [cartItems, setCartItems] = useState<RequestItem[]>([]);
  const [requestNotes, setRequestNotes] = useState("");

  // Approval state
  const [selectedApproval, setSelectedApproval] = useState<PendingApproval | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  // Toast
  const [toast, setToast] = useState<ToastState>(null);

  const isManager = !!(
    user?.role &&
    ["admin", "department_manager", "warehouse_manager", "pos_manager"].includes(user.role)
  );

  useEffect(() => {
    tg?.ready();
    tg?.expand();
    authenticate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function showToast(msg: string, type: "success" | "error" | "info" = "info") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function authenticate() {
    const initData = tg?.initData || "";

    if (!initData && import.meta.env.DEV) {
      const devToken = sessionStorage.getItem("tg_session_token");
      if (devToken) {
        const stored = sessionStorage.getItem("tg_user");
        if (stored) { setUser(JSON.parse(stored)); setScreen("scan"); return; }
      }
      const mockUser: User = {
        id: 1, firstName: "Demo", lastName: "User", username: "demo",
        role: "department_manager", departmentCode: "PROD", departmentName: "Ishlab chiqarish",
      };
      setUser(mockUser);
      sessionStorage.setItem("tg_user", JSON.stringify(mockUser));
      sessionStorage.setItem("tg_session_token", "dev-mock-token");
      setScreen("scan");
      return;
    }

    if (!initData) {
      setAuthError("Telegram Mini App ma'lumotlari topilmadi. Iltimos, Telegram orqali oching.");
      setScreen("auth-error");
      return;
    }

    try {
      const data = await fetch(`${API_BASE}/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData }),
      }).then(async (r) => {
        if (!r.ok) {
          const e = await r.json().catch(() => ({ message: r.statusText }));
          throw new Error(e.message || "Autentifikatsiya xatosi");
        }
        return r.json();
      });
      sessionStorage.setItem("tg_session_token", data.token);
      sessionStorage.setItem("tg_user", JSON.stringify(data.user));
      setUser(data.user);
      setScreen("scan");
    } catch (err: unknown) {
      setAuthError((err instanceof Error ? err.message : null) || "Kirish muvaffaqiyatsiz");
      setScreen("auth-error");
    }
  }

  const { data: warehousesData } = useQuery({
    queryKey: ["mini-app-warehouses"],
    queryFn: () => apiCall("/warehouses"),
    enabled: !!sessionStorage.getItem("tg_session_token"),
  });
  const warehouses: Array<{ id: string; name: string }> = Array.isArray(warehousesData) ? warehousesData : [];

  const { data: historyData, refetch: refetchHistory } = useQuery({
    queryKey: ["mini-app-history"],
    queryFn: () => apiCall("/history"),
    enabled: screen === "history",
  });
  const historyItems = historyData?.items ?? [];

  const { data: approvalsData, refetch: refetchApprovals } = useQuery({
    queryKey: ["mini-app-approvals"],
    queryFn: () => apiCall("/pending-approvals"),
    enabled: screen === "approvals",
    refetchInterval: 30000,
  });
  const pendingApprovals: PendingApproval[] = Array.isArray(approvalsData) ? approvalsData : [];

  const { data: searchData } = useQuery({
    queryKey: ["mini-app-materials", searchQuery],
    queryFn: () => apiCall(`/materials?q=${encodeURIComponent(searchQuery)}&warehouseId=${selectedWarehouseId}`),
    enabled: searchQuery.length >= 2,
  });
  const searchResults: MaterialResult[] = Array.isArray(searchData) ? searchData : [];

  const scanMutation = useMutation({
    mutationFn: (barcode: string) =>
      apiCall("/barcode/scan", { method: "POST", body: JSON.stringify({ barcode, warehouseId: selectedWarehouseId || undefined }) }),
    onSuccess: (data) => {
      if (data?.found && data?.materialCard) {
        setScanResult(parseScanResult(data.materialCard));
        tg?.HapticFeedback?.notificationOccurred("success");
      } else {
        showToast("Mahsulot topilmadi", "error");
        tg?.HapticFeedback?.notificationOccurred("error");
      }
    },
    onError: (err: Error) => { showToast(err.message, "error"); tg?.HapticFeedback?.notificationOccurred("error"); },
  });

  const requestMutation = useMutation({
    mutationFn: () => apiCall("/requests", { method: "POST", body: JSON.stringify({ departmentCode: user?.departmentCode || "GENERAL", notes: requestNotes || undefined, lines: (Array.isArray(cartItems) ? cartItems : []).map((i) => ({ materialCardId: i.materialId, requestedQty: i.qty })) }) }),
    onSuccess: () => {
      setCartItems([]); setRequestNotes("");
      tg?.HapticFeedback?.notificationOccurred("success");
      showToast("So'rov muvaffaqiyatli yuborildi!", "success");
      setScreen("history"); refetchHistory();
    },
    onError: (err: Error) => { showToast(err.message, "error"); tg?.HapticFeedback?.notificationOccurred("error"); },
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => apiCall(`/requests/${id}/approve`, { method: "PATCH", body: JSON.stringify({}) }),
    onSuccess: () => { tg?.HapticFeedback?.notificationOccurred("success"); showToast("Tasdiqlandi!", "success"); setSelectedApproval(null); setScreen("approvals"); refetchApprovals(); },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => apiCall(`/requests/${id}/reject`, { method: "PATCH", body: JSON.stringify({ reason }) }),
    onSuccess: () => { tg?.HapticFeedback?.notificationOccurred("success"); showToast("Rad etildi", "success"); setSelectedApproval(null); setShowRejectInput(false); setRejectReason(""); setScreen("approvals"); refetchApprovals(); },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  function addToCart(material: MaterialResult) {
    const existing = (Array.isArray(cartItems) ? cartItems : []).find((i) => i.materialId === material.id);
    if (existing) {
      setCartItems((prev) => (Array.isArray(prev) ? prev : []).map((i) => i.materialId === material.id ? { ...i, qty: Math.min(i.qty + 1, material.maxQtyPerIssue || 999) } : i));
    } else {
      setCartItems((prev) => [...prev, { materialId: material.id, name: material.name, nameRu: material.nameRu, qty: 1, unit: material.unit }]);
    }
    tg?.HapticFeedback?.impactOccurred("light");
    showToast(`${material.name} qo'shildi`, "success");
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
      setIsCameraMode(true);
      const { BrowserMultiFormatReader } = await import("@zxing/library").catch(() => ({ BrowserMultiFormatReader: null }));
      if (BrowserMultiFormatReader && videoRef.current) {
        const reader = new BrowserMultiFormatReader();
        type Cb = (result: { getText(): string } | null, err?: unknown) => void;
        (reader as unknown as { decodeFromVideoElement(el: HTMLVideoElement, cb: Cb): void }).decodeFromVideoElement(videoRef.current, (result) => {
          if (result) { const code = result.getText(); setBarcodeInput(code); scanMutation.mutate(code); stopCamera(); }
        });
      }
    } catch { showToast("Kameraga ruxsat berilmadi", "error"); }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setIsCameraMode(false);
  }

  const isDark = tg?.colorScheme === "dark";
  const colors: AppColors = {
    bg: tg?.themeParams?.bg_color || "#ffffff",
    text: tg?.themeParams?.text_color || "#000000",
    hint: tg?.themeParams?.hint_color || "#6b7280",
    button: tg?.themeParams?.button_color || "#3b82f6",
    buttonText: tg?.themeParams?.button_text_color || "#ffffff",
  };

  if (screen === "loading") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: colors.bg, color: colors.text, gap: 16 }}>
        <div style={{ fontSize: 40 }}>📦</div>
        <div style={{ fontSize: 16, fontWeight: 600 }}>{t("posMiniAppYuklanmoqda")}</div>
        <LoadingSpinner color={colors.button} />
      </div>
    );
  }

  if (screen === "auth-error") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: colors.bg, color: colors.text, padding: 24, gap: 16 }}>
        <div style={{ fontSize: 48 }}>🚫</div>
        <h2 style={{ margin: 0, textAlign: "center" }}>{t("kirishMuvaffaqiyatsiz")}</h2>
        <p style={{ textAlign: "center", color: colors.hint, margin: 0 }}>{authError}</p>
        <button style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "12px 16px", borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14, width: "100%", background: colors.button, color: colors.buttonText }} onClick={authenticate}>
          {t("qaytaUrinish")}
        </button>
      </div>
    );
  }

  if (screen === "request-detail" && selectedApproval) {
    return <ApprovalDetailScreen screen={screen} colors={colors} isDark={isDark} user={user} approval={selectedApproval} rejectReason={rejectReason} showRejectInput={showRejectInput} onRejectReasonChange={setRejectReason} onShowRejectInput={setShowRejectInput} onBack={() => { setScreen("approvals"); setSelectedApproval(null); setShowRejectInput(false); setRejectReason(""); }} approveMutation={approveMutation} rejectMutation={rejectMutation} />;
  }

  if (screen === "approvals") {
    return <ApprovalsScreen screen={screen} colors={colors} isDark={isDark} user={user} pendingApprovals={pendingApprovals} onBack={() => setScreen("scan")} onSelect={(a) => { setSelectedApproval(a); setScreen("request-detail"); }} />;
  }

  if (screen === "history") {
    return <HistoryScreen screen={screen} colors={colors} isDark={isDark} user={user} historyItems={historyItems} onBack={() => setScreen("scan")} />;
  }

  if (screen === "request") {
    return <RequestScreen screen={screen} colors={colors} isDark={isDark} user={user} cartItems={cartItems} requestNotes={requestNotes} onNotesChange={setRequestNotes} onRemoveItem={(id) => setCartItems((prev) => (Array.isArray(prev) ? prev : []).filter((c) => c.materialId !== id))} onQtyChange={(id, delta) => setCartItems((prev) => (Array.isArray(prev) ? prev : []).map((c) => c.materialId === id ? { ...c, qty: Math.max(1, c.qty + delta) } : c))} onSubmit={() => requestMutation.mutate()} isPending={requestMutation.isPending} onBack={() => setScreen("scan")} />;
  }

  return (
    <ScanScreen
      screen={screen} colors={colors} isDark={isDark} user={user}
      warehouses={warehouses} selectedWarehouseId={selectedWarehouseId} onWarehouseChange={setSelectedWarehouseId}
      isCameraMode={isCameraMode} videoRef={videoRef} onStartCamera={startCamera} onStopCamera={stopCamera}
      barcodeInput={barcodeInput} onBarcodeChange={setBarcodeInput}
      onBarcodeScan={() => { if (barcodeInput.trim()) { scanMutation.mutate(barcodeInput.trim()); setBarcodeInput(""); } }}
      searchQuery={searchQuery} onSearchChange={setSearchQuery} searchResults={searchResults}
      scanMutation={scanMutation} scanResult={scanResult} onClearScanResult={() => setScanResult(null)} onAddToCart={addToCart}
      cartCount={cartItems.length} pendingApprovals={pendingApprovals} isManager={isManager}
      onNav={setScreen}
      onNavHistory={() => { setScreen("history"); refetchHistory(); }}
      onNavApprovals={() => { setScreen("approvals"); refetchApprovals(); }}
      toast={toast}
    />
  );
}

// ─── Public export ────────────────────────────────────────────────────────────

export default function TelegramMiniApp() {
  const { t } = useTranslation("common");
  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } * { box-sizing: border-box; } body { margin: 0; }`}</style>
      <QueryClientProvider client={queryClient}>
        <TelegramMiniAppInner />
      </QueryClientProvider>
    </>
  );
}
