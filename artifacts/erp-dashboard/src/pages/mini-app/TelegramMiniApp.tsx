/**
 * Telegram Mini App — POS
 *
 * Sahifalar:
 *  - Auth (initData tekshirish)
 *  - Barcode skan (kamera orqali + qo'lda kiritish)
 *  - So'rov yaratish (INTERNAL_ISSUE)
 *  - Tarix
 *  - Menejer tasdiqlash
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, QueryClient, QueryClientProvider } from "@tanstack/react-query";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name?: string;
            last_name?: string;
            username?: string;
          };
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        showAlert: (msg: string) => void;
        showConfirm: (msg: string, cb: (ok: boolean) => void) => void;
        BackButton: {
          show: () => void;
          hide: () => void;
          onClick: (cb: () => void) => void;
          offClick: (cb: () => void) => void;
        };
        MainButton: {
          setText: (t: string) => void;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          onClick: (cb: () => void) => void;
          offClick: (cb: () => void) => void;
          showProgress: (leaveActive?: boolean) => void;
          hideProgress: () => void;
          setParams: (p: { text?: string; color?: string; text_color?: string; is_active?: boolean; is_visible?: boolean }) => void;
        };
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
        };
        colorScheme: "light" | "dark";
        HapticFeedback: {
          impactOccurred: (style: "light"|"medium"|"heavy"|"rigid"|"soft") => void;
          notificationOccurred: (type: "error"|"success"|"warning") => void;
          selectionChanged: () => void;
        };
      };
    };
  }
}

function getTg() {
  return typeof window !== "undefined" ? window?.Telegram?.WebApp : null;
}

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
const API_BASE = `${BASE}/api/pos/mini-app`;

type Screen = "loading" | "auth-error" | "scan" | "request" | "history" | "approvals" | "request-detail";

interface User {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  role: string;
  departmentCode: string;
  departmentName: string;
}

interface MaterialResult {
  id: number;
  name: string;
  nameRu: string;
  barcode: string;
  unit: string;
  stock: number;
  isConsumable: boolean;
  minIntervalDays: number;
  maxQtyPerIssue: number;
}

interface RequestItem {
  materialId: number;
  name: string;
  nameRu?: string;
  qty: number;
  unit: string;
}

interface HistoryItem {
  id: number;
  requestNumber: string;
  status: string;
  priority: string;
  createdAt: string;
  departmentCode: string;
  lines: Array<{ name: string; requestedQty: number; issuedQty?: number; unit: string }>;
}

interface PendingApproval {
  id: number;
  requestNumber: string;
  status: string;
  priority: string;
  createdAt: string;
  requestedByName: string;
  departmentCode: string;
  lines: Array<{ name: string; nameRu?: string; requestedQty: number; unit: string }>;
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});

const STATUS_LABELS: Record<string, string> = {
  draft: "Qoralama",
  pending: "Kutilmoqda",
  approved: "Tasdiqlandi",
  rejected: "Rad etildi",
  issued: "Berildi",
  cancelled: "Bekor",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "#6b7280",
  pending: "#d97706",
  approved: "#059669",
  rejected: "#dc2626",
  issued: "#2563eb",
  cancelled: "#9ca3af",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "#6b7280",
  normal: "#2563eb",
  high: "#d97706",
  urgent: "#dc2626",
};

function apiCall(path: string, options?: RequestInit) {
  const token = sessionStorage.getItem("tg_session_token");
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "x-tg-session": token } : {}),
      ...options?.headers,
    },
  }).then(async (r) => {
    if (!r.ok) {
      const err = await r.json().catch(() => ({ message: r.statusText }));
      throw new Error(err.message || r.statusText);
    }
    return r.json();
  });
}

function TelegramMiniAppInner() {
  const tg = getTg();
  const [screen, setScreen] = useState<Screen>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string>("");

  const [barcodeInput, setBarcodeInput] = useState("");
  const [scanResult, setScanResult] = useState<MaterialResult | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCameraMode, setIsCameraMode] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cartItems, setCartItems] = useState<RequestItem[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("");
  const [requestNotes, setRequestNotes] = useState("");

  const [selectedApproval, setSelectedApproval] = useState<PendingApproval | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  const isManager = user?.role && ["admin","department_manager","warehouse_manager","pos_manager"].includes(user.role);

  useEffect(() => {
    tg?.ready();
    tg?.expand();
    authenticate();
  }, []);

  async function authenticate() {
    const initData = tg?.initData || "";

    if (!initData && import.meta.env.DEV) {
      const devToken = sessionStorage.getItem("tg_session_token");
      if (devToken) {
        const storedUser = sessionStorage.getItem("tg_user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
          setScreen("scan");
          return;
        }
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
          const err = await r.json().catch(() => ({ message: r.statusText }));
          throw new Error(err.message || "Autentifikatsiya xatosi");
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

  const historyItems: HistoryItem[] = historyData?.items ?? [];

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
    mutationFn: (barcode: string) => apiCall("/barcode/scan", {
      method: "POST",
      body: JSON.stringify({ barcode, warehouseId: selectedWarehouseId || undefined }),
    }),
    onSuccess: (data) => {
      if (data?.found && data?.materialCard) {
        const m = data.materialCard;
        setScanResult({
          id: m.id, name: m.xomAshyo || m.name, nameRu: m.xomAshyoRu || m.nameRu,
          barcode: m.barcode, unit: m.unitOfMeasure || m.unit,
          stock: m.currentStock ?? m.availableStock ?? 0,
          isConsumable: m.isConsumable, minIntervalDays: m.minIntervalDays,
          maxQtyPerIssue: m.maxQtyPerIssue,
        });
        tg?.HapticFeedback?.notificationOccurred("success");
      } else {
        showToast("Mahsulot topilmadi", "error");
        tg?.HapticFeedback?.notificationOccurred("error");
      }
    },
    onError: (err: Error) => {
      showToast(err.message, "error");
      tg?.HapticFeedback?.notificationOccurred("error");
    },
  });

  const requestMutation = useMutation({
    mutationFn: () => apiCall("/requests", {
      method: "POST",
      body: JSON.stringify({
        departmentCode: user?.departmentCode || "GENERAL",
        notes: requestNotes || undefined,
        lines: (Array.isArray(cartItems) ? cartItems : []).map(i => ({ materialCardId: i.materialId, requestedQty: i.qty })),
      }),
    }),
    onSuccess: () => {
      setCartItems([]);
      setRequestNotes("");
      tg?.HapticFeedback?.notificationOccurred("success");
      showToast("So'rov muvaffaqiyatli yuborildi!", "success");
      setScreen("history");
      refetchHistory();
    },
    onError: (err: Error) => {
      showToast(err.message, "error");
      tg?.HapticFeedback?.notificationOccurred("error");
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => apiCall(`/requests/${id}/approve`, { method: "PATCH", body: JSON.stringify({}) }),
    onSuccess: () => {
      tg?.HapticFeedback?.notificationOccurred("success");
      showToast("Tasdiqlandi!", "success");
      setSelectedApproval(null);
      setScreen("approvals");
      refetchApprovals();
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      apiCall(`/requests/${id}/reject`, { method: "PATCH", body: JSON.stringify({ reason }) }),
    onSuccess: () => {
      tg?.HapticFeedback?.notificationOccurred("success");
      showToast("Rad etildi", "success");
      setSelectedApproval(null);
      setShowRejectInput(false);
      setRejectReason("");
      setScreen("approvals");
      refetchApprovals();
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const [toast, setToast] = useState<{ msg: string; type: "success"|"error"|"info" } | null>(null);
  function showToast(msg: string, type: "success"|"error"|"info" = "info") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function addToCart(material: MaterialResult) {
    const existing = (Array.isArray(cartItems) ? cartItems : []).find(i => i.materialId === material.id);
    if (existing) {
      setCartItems(prev => (prev ?? []).map(i =>
        i.materialId === material.id ? { ...i, qty: Math.min(i.qty + 1, material.maxQtyPerIssue || 999) } : i
      ));
    } else {
      setCartItems(prev => [...prev, {
        materialId: material.id, name: material.name, nameRu: material.nameRu,
        qty: 1, unit: material.unit,
      }]);
    }
    tg?.HapticFeedback?.impactOccurred("light");
    showToast(`${material.name} qo'shildi`, "success");
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraMode(true);

      const { BrowserMultiFormatReader } = await import("@zxing/library").catch(() => ({ BrowserMultiFormatReader: null }));
      if (BrowserMultiFormatReader && videoRef.current) {
        const reader = new BrowserMultiFormatReader();
        type ZxingCallback = (result: { getText(): string } | null, err?: unknown) => void;
        const readerWithCallback = reader as unknown as { decodeFromVideoElement(el: HTMLVideoElement, cb: ZxingCallback): void };
        readerWithCallback.decodeFromVideoElement(videoRef.current, (result) => {
          if (result) {
            const code = result.getText();
            setBarcodeInput(code);
            scanMutation.mutate(code);
            stopCamera();
          }
        });
      }
    } catch (err) {
      showToast("Kameraga ruxsat berilmadi", "error");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setIsCameraMode(false);
  }

  const colors = {
    bg: tg?.themeParams?.bg_color || "#ffffff",
    text: tg?.themeParams?.text_color || "#000000",
    hint: tg?.themeParams?.hint_color || "#6b7280",
    button: tg?.themeParams?.button_color || "#3b82f6",
    buttonText: tg?.themeParams?.button_text_color || "#ffffff",
  };

  const isDark = tg?.colorScheme === "dark";

  const cardStyle: React.CSSProperties = {
    background: isDark ? "#1f2937" : "#f9fafb",
    border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
    borderRadius: 12,
    padding: "12px 14px",
    marginBottom: 10,
  };

  const btnStyle = (variant: "primary" | "danger" | "secondary" = "primary"): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "12px 16px",
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
    width: "100%",
    background: variant === "primary" ? colors.button : variant === "danger" ? "#ef4444" : isDark ? "#374151" : "#e5e7eb",
    color: variant === "primary" ? colors.buttonText : variant === "danger" ? "#fff" : colors.text,
  });

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: `1.5px solid ${isDark ? "#374151" : "#d1d5db"}`,
    background: isDark ? "#111827" : "#fff",
    color: colors.text,
    fontSize: 14,
    boxSizing: "border-box",
  };

  // ─── LOADING ──────────────────────────────────────────────────────────────
  if (screen === "loading") {
    return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh", background: colors.bg, color: colors.text, gap: 16 }}>
        <div style={{ fontSize: 40 }}>📦</div>
        <div style={{ fontSize: 16, fontWeight: 600 }}>POS Mini App yuklanmoqda...</div>
        <LoadingSpinner color={colors.button} />
      </div>
    );
  }

  // ─── AUTH ERROR ────────────────────────────────────────────────────────────
  if (screen === "auth-error") {
    return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh", background: colors.bg, color: colors.text, padding: 24, gap: 16 }}>
        <div style={{ fontSize: 48 }}>🚫</div>
        <h2 style={{ margin: 0, textAlign: "center" }}>Kirish muvaffaqiyatsiz</h2>
        <p style={{ textAlign: "center", color: colors.hint, margin: 0 }}>{authError}</p>
        <button style={btnStyle("primary")} onClick={authenticate}>Qayta urinish</button>
      </div>
    );
  }

  // ─── APPROVAL DETAIL ──────────────────────────────────────────────────────
  if (screen === "request-detail" && selectedApproval) {
    return (
      <AppLayout
        screen={screen}
        onBack={() => { setScreen("approvals"); setSelectedApproval(null); setShowRejectInput(false); setRejectReason(""); }}
        title="So'rov tafsiloti"
        colors={colors} isDark={isDark} user={user}
      >
        <div style={{ padding: "0 16px 100px" }}>
          <div style={cardStyle}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 16 }}>{selectedApproval.requestNumber}</span>
              <StatusBadge status={selectedApproval.status} />
            </div>
            <div style={{ color: colors.hint, fontSize: 12, marginBottom: 4 }}>
              {selectedApproval.requestedByName} · {selectedApproval.departmentCode}
            </div>
            <div style={{ color: colors.hint, fontSize: 12 }}>
              {new Date(selectedApproval.createdAt).toLocaleString("uz-UZ")}
            </div>
            {selectedApproval.priority !== "normal" && (
              <div style={{ marginTop: 8, fontWeight: 600, color: PRIORITY_COLORS[selectedApproval.priority] ?? "#888", fontSize: 12 }}>
                ⚡ {selectedApproval.priority.toUpperCase()} ustuvorlik
              </div>
            )}
          </div>

          <h3 style={{ margin: "16px 0 8px", fontSize: 15, fontWeight: 600 }}>Materiallar</h3>
          {(Array.isArray(selectedApproval.lines) ? selectedApproval.lines : []).map((line, i) => (
            <div key={`k-${i}`} style={cardStyle}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{line.name}</div>
              {line.nameRu && <div style={{ fontSize: 12, color: colors.hint, marginBottom: 4 }}>{line.nameRu}</div>}
              <div style={{ fontSize: 13, color: colors.hint }}>
                {line.requestedQty} {line.unit}
              </div>
            </div>
          ))}

          {showRejectInput ? (
            <div style={{ marginTop: 16 }}>
              <textarea
                style={{ ...inputStyle, minHeight: 80, resize: "none" } as React.CSSProperties}
                placeholder="Rad etish sababi..."
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
              />
              <div style={{ display:"flex", gap: 8, marginTop: 8 }}>
                <button style={{ ...btnStyle("secondary"), flex: 1 }} onClick={() => setShowRejectInput(false)}>Bekor</button>
                <button
                  style={{ ...btnStyle("danger"), flex: 1 }}
                  disabled={!rejectReason.trim() || rejectMutation.isPending}
                  onClick={() => rejectMutation.mutate({ id: selectedApproval.id, reason: rejectReason })}
                >
                  {rejectMutation.isPending ? "..." : "Rad et"}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ position:"fixed", bottom: 0, left: 0, right: 0, padding: "12px 16px", background: colors.bg, borderTop: `1px solid ${isDark ? "#374151" : "#e5e7eb"}` }}>
              <div style={{ display:"flex", gap: 8 }}>
                <button style={{ ...btnStyle("danger"), flex: 1 }} onClick={() => setShowRejectInput(true)}>❌ Rad etish</button>
                <button
                  style={{ ...btnStyle("primary"), flex: 1 }}
                  disabled={approveMutation.isPending}
                  onClick={() => approveMutation.mutate(selectedApproval.id)}
                >
                  {approveMutation.isPending ? "..." : "✅ Tasdiqlash"}
                </button>
              </div>
            </div>
          )}
        </div>
      </AppLayout>
    );
  }

  // ─── APPROVALS LIST ───────────────────────────────────────────────────────
  if (screen === "approvals") {
    return (
      <AppLayout screen={screen} onBack={() => setScreen("scan")} title="Kutilayotgan so'rovlar" colors={colors} isDark={isDark} user={user}>
        <div style={{ padding: "0 16px 16px" }}>
          {pendingApprovals.length === 0 ? (
            <EmptyState icon="✅" text="Kutilayotgan so'rov yo'q" />
          ) : (
            (Array.isArray(pendingApprovals) ? pendingApprovals : []).map(a => (
              <button
                key={a.id}
                style={{ ...cardStyle, width:"100%", textAlign:"left", cursor:"pointer", display:"block" }}
                onClick={() => { setSelectedApproval(a); setScreen("request-detail"); }}
              >
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{a.requestNumber}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: PRIORITY_COLORS[a.priority] ?? "#888" }}>
                    {a.priority !== "normal" ? "⚡ " : ""}{a.priority?.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: colors.hint, marginBottom: 4 }}>
                  👤 {a.requestedByName} · {a.departmentCode}
                </div>
                <div style={{ fontSize: 12, color: colors.hint }}>
                  📦 {(Array.isArray(a.lines) ? a.lines : []).length} ta material · {new Date(a.createdAt).toLocaleDateString("uz-UZ")}
                </div>
              </button>
            ))
          )}
        </div>
      </AppLayout>
    );
  }

  // ─── HISTORY ─────────────────────────────────────────────────────────────
  if (screen === "history") {
    return (
      <AppLayout screen={screen} onBack={() => setScreen("scan")} title="Harakatlar tarixi" colors={colors} isDark={isDark} user={user}>
        <div style={{ padding: "0 16px 16px" }}>
          {historyItems.length === 0 ? (
            <EmptyState icon="📋" text="Harakatlar yo'q" />
          ) : (
            (Array.isArray(historyItems) ? historyItems : []).map(item => (
              <div key={item.id} style={cardStyle}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 6 }}>
                  <span style={{ fontWeight: 700 }}>{item.requestNumber}</span>
                  <StatusBadge status={item.status} />
                </div>
                <div style={{ fontSize: 12, color: colors.hint, marginBottom: 4 }}>
                  {new Date(item.createdAt).toLocaleString("uz-UZ")}
                </div>
                {(Array.isArray(item.lines) ? item.lines : []).slice(0, 2).map((l, i) => (
                  <div key={`k-${i}`} style={{ fontSize: 13, marginTop: 2 }}>
                    {l.name} — {l.requestedQty} {l.unit}
                    {l.issuedQty ? ` (berildi: ${l.issuedQty})` : ""}
                  </div>
                ))}
                {(Array.isArray(item.lines) ? item.lines : []).length > 2 && (
                  <div style={{ fontSize: 12, color: colors.hint }}>+{item.lines.length - 2} ta boshqa...</div>
                )}
              </div>
            ))
          )}
        </div>
      </AppLayout>
    );
  }

  // ─── REQUEST ─────────────────────────────────────────────────────────────
  if (screen === "request") {
    return (
      <AppLayout screen={screen} onBack={() => setScreen("scan")} title="Material so'rov" colors={colors} isDark={isDark} user={user}>
        <div style={{ padding: "0 16px 120px" }}>
          {cartItems.length === 0 ? (
            <EmptyState icon="📦" text="So'rov uchun barcode skanerlang" />
          ) : (
            <>
              {(Array.isArray(cartItems) ? cartItems : []).map((item, i) => (
                <div key={item.materialId} style={cardStyle}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>{item.name}</div>
                      {item.nameRu && <div style={{ fontSize: 12, color: colors.hint }}>{item.nameRu}</div>}
                    </div>
                    <button
                      style={{ background:"none", border:"none", cursor:"pointer", color:"#ef4444", fontSize: 18, padding: 0 }}
                      onClick={() => setCartItems(prev => (prev ?? []).filter(c => c.materialId !== item.materialId))}
                    >✕</button>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap: 10, marginTop: 8 }}>
                    <button
                      style={{ width: 32, height: 32, borderRadius: "50%", border:`1.5px solid ${isDark?"#374151":"#d1d5db"}`, background:"none", cursor:"pointer", color: colors.text, fontSize: 18, display:"flex", alignItems:"center", justifyContent:"center" }}
                      onClick={() => setCartItems(prev => (prev ?? []).map(c => c.materialId === item.materialId ? { ...c, qty: Math.max(1, c.qty - 1) } : c))}
                    >−</button>
                    <span style={{ fontWeight: 700, minWidth: 30, textAlign:"center" }}>{item.qty}</span>
                    <button
                      style={{ width: 32, height: 32, borderRadius: "50%", border:`1.5px solid ${isDark?"#374151":"#d1d5db"}`, background:"none", cursor:"pointer", color: colors.text, fontSize: 18, display:"flex", alignItems:"center", justifyContent:"center" }}
                      onClick={() => setCartItems(prev => (prev ?? []).map(c => c.materialId === item.materialId ? { ...c, qty: c.qty + 1 } : c))}
                    >+</button>
                    <span style={{ color: colors.hint, fontSize: 13 }}>{item.unit}</span>
                  </div>
                </div>
              ))}

              <textarea
                style={{ ...inputStyle, minHeight: 70, resize: "none", marginTop: 8 } as React.CSSProperties}
                placeholder="Izoh (ixtiyoriy)..."
                value={requestNotes}
                onChange={e => setRequestNotes(e.target.value)}
              />
            </>
          )}
        </div>

        {cartItems.length > 0 && (
          <div style={{ position:"fixed", bottom: 0, left: 0, right: 0, padding: "12px 16px", background: colors.bg, borderTop:`1px solid ${isDark?"#374151":"#e5e7eb"}` }}>
            <button
              style={btnStyle("primary")}
              disabled={requestMutation.isPending}
              onClick={() => requestMutation.mutate()}
            >
              {requestMutation.isPending ? <LoadingSpinner color={colors.buttonText} size={16} /> : "📤"}
              {requestMutation.isPending ? " Yuborilmoqda..." : ` So'rov yuborish (${cartItems.length} ta material)`}
            </button>
          </div>
        )}
      </AppLayout>
    );
  }

  // ─── SCAN (main) ─────────────────────────────────────────────────────────
  return (
    <AppLayout screen={screen} title="POS Skanerlash" colors={colors} isDark={isDark} user={user}>
      <div style={{ padding: "0 16px 100px" }}>
        {/* Ombor tanlash */}
        {warehouses.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <select
              style={{ ...inputStyle }}
              value={selectedWarehouseId}
              onChange={e => setSelectedWarehouseId(e.target.value)}
            >
              <option value="">Barcha omborlar</option>
              {(Array.isArray(warehouses) ? warehouses : []).map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Kamera mode */}
        {isCameraMode ? (
          <div style={{ marginBottom: 12 }}>
            <video ref={videoRef} style={{ width:"100%", borderRadius: 12, aspectRatio:"4/3", objectFit:"cover", background:"#000" }} />
            <button style={{ ...btnStyle("secondary"), marginTop: 8 }} onClick={stopCamera}>❌ Kamerani yopish</button>
          </div>
        ) : (
          <>
            <div style={{ display:"flex", gap: 8, marginBottom: 8 }}>
              <input
                style={{ ...inputStyle, flex: 1 }}
                placeholder="Barcode kiriting..."
                value={barcodeInput}
                onChange={e => setBarcodeInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && barcodeInput.trim()) { scanMutation.mutate(barcodeInput.trim()); setBarcodeInput(""); } }}
              />
              <button
                style={{ padding:"10px 14px", borderRadius: 10, border:"none", background: colors.button, color: colors.buttonText, cursor:"pointer", fontWeight: 600 }}
                onClick={() => { if (barcodeInput.trim()) { scanMutation.mutate(barcodeInput.trim()); setBarcodeInput(""); } }}
                disabled={!barcodeInput.trim() || scanMutation.isPending}
              >🔍</button>
            </div>
            <button style={{ ...btnStyle("secondary"), marginBottom: 12 }} onClick={startCamera}>📷 Kamera bilan skanerlash</button>
          </>
        )}

        {/* Material qidirish */}
        <input
          style={{ ...inputStyle, marginBottom: 8 }}
          placeholder="Material nomi bo'yicha qidirish..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />

        {/* Scan natijasi */}
        {scanMutation.isPending && (
          <div style={{ textAlign:"center", padding: 20 }}><LoadingSpinner color={colors.button} /></div>
        )}

        {scanResult && !scanMutation.isPending && (
          <div style={{ ...cardStyle, border:`2px solid ${colors.button}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>{scanResult.name}</div>
                {scanResult.nameRu && <div style={{ fontSize: 13, color: colors.hint }}>{scanResult.nameRu}</div>}
              </div>
              <button style={{ background:"none", border:"none", cursor:"pointer", color: colors.hint, fontSize: 16 }} onClick={() => setScanResult(null)}>✕</button>
            </div>
            <div style={{ display:"flex", gap: 12, marginBottom: 10, fontSize: 13 }}>
              <span style={{ color: scanResult.stock > 0 ? "#059669" : "#dc2626" }}>
                📦 {scanResult.stock} {scanResult.unit}
              </span>
              <span style={{ color: colors.hint, fontFamily:"monospace" }}>#{scanResult.barcode}</span>
            </div>
            <button style={btnStyle("primary")} onClick={() => { addToCart(scanResult); setScanResult(null); setScreen("request"); }}>
              ➕ So'rovga qo'shish
            </button>
          </div>
        )}

        {/* Qidiruv natijalari */}
        {searchQuery.length >= 2 && searchResults.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 13, color: colors.hint, marginBottom: 6 }}>{searchResults.length} ta material topildi</div>
            {(Array.isArray(searchResults) ? searchResults : []).map(m => (
              <div key={m.id} style={cardStyle}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>{m.name}</div>
                    {m.nameRu && <div style={{ fontSize: 12, color: colors.hint }}>{m.nameRu}</div>}
                    <div style={{ fontSize: 12, color: colors.hint, marginTop: 2 }}>
                      📦 {m.stock} {m.unit} · #{m.barcode}
                    </div>
                  </div>
                  <button
                    style={{ padding:"6px 12px", borderRadius: 8, border:"none", background: colors.button, color: colors.buttonText, cursor:"pointer", fontSize: 13, fontWeight: 600, flexShrink: 0 }}
                    onClick={() => { addToCart(m); setSearchQuery(""); }}
                  >+ Qo'shish</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {searchQuery.length >= 2 && searchResults.length === 0 && (
          <div style={{ textAlign:"center", padding: 20, color: colors.hint, fontSize: 14 }}>🔍 Material topilmadi</div>
        )}
      </div>

      {/* Bottom Nav */}
      <div style={{ position:"fixed", bottom: 0, left: 0, right: 0, background: colors.bg, borderTop:`1px solid ${isDark?"#374151":"#e5e7eb"}`, display:"flex", justifyContent:"space-around", padding:"8px 0 max(8px, env(safe-area-inset-bottom))" }}>
        <NavBtn icon="📷" label="Skan" active={(screen as Screen)==="scan"} onClick={() => setScreen("scan")} color={colors.button} hint={colors.hint} text={colors.text} />
        <NavBtn icon={`📤${cartItems.length > 0 ? ` (${cartItems.length})` : ""}`} label="So'rov" active={(screen as Screen)==="request"} onClick={() => setScreen("request")} color={colors.button} hint={colors.hint} text={colors.text} />
        <NavBtn icon="📋" label="Tarix" active={(screen as Screen)==="history"} onClick={() => { setScreen("history"); refetchHistory(); }} color={colors.button} hint={colors.hint} text={colors.text} />
        {isManager && (
          <NavBtn
            icon={`✅${pendingApprovals.length > 0 ? ` (${pendingApprovals.length})` : ""}`}
            label="Tasdiqlash"
            active={(screen as Screen)==="approvals"}
            onClick={() => { setScreen("approvals"); refetchApprovals(); }}
            color={colors.button} hint={colors.hint} text={colors.text}
          />
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position:"fixed", top: 16, left: 16, right: 16, zIndex: 9999,
          padding:"12px 16px", borderRadius: 10,
          background: toast.type === "success" ? "#059669" : toast.type === "error" ? "#dc2626" : "#2563eb",
          color: "#fff", fontWeight: 600, fontSize: 14, textAlign:"center",
          boxShadow:"0 4px 12px rgba(0,0,0,0.2)",
        }}>
          {toast.msg}
        </div>
      )}
    </AppLayout>
  );
}

function AppLayout({ children, screen, onBack, title, colors, isDark, user }: {
  children: React.ReactNode;
  screen: Screen;
  onBack?: () => void;
  title: string;
  colors: Record<string, string>;
  isDark: boolean;
  user: User | null;
}) {
  return (
    <div style={{ minHeight:"100vh", background: colors.bg, color: colors.text, fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" }}>
      <div style={{ display:"flex", alignItems:"center", gap: 8, padding:"12px 16px", borderBottom:`1px solid ${isDark?"#374151":"#e5e7eb"}`, position:"sticky", top: 0, background: colors.bg, zIndex: 100 }}>
        {onBack && (
          <button style={{ background:"none", border:"none", cursor:"pointer", padding:"4px 8px", color: colors.text, fontSize: 18 }} onClick={onBack}>←</button>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 17 }}>{title}</div>
          {user && <div style={{ fontSize: 11, color: "#6b7280", marginTop: 1 }}>{user.firstName} {user.lastName} · {user.departmentName || user.departmentCode}</div>}
        </div>
        <div style={{ fontSize: 22 }}>📦</div>
      </div>
      <div style={{ paddingTop: 4 }}>
        {children}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding:"2px 8px", borderRadius: 20,
      background: `${STATUS_COLORS[status] || "#6b7280"}22`,
      color: STATUS_COLORS[status] || "#6b7280",
    }}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{ textAlign:"center", padding:"40px 0" }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>{icon}</div>
      <div style={{ color:"#6b7280", fontSize: 15 }}>{text}</div>
    </div>
  );
}

function LoadingSpinner({ color = "#3b82f6", size = 24 }: { color?: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size,
      border:`${Math.max(2, size / 8)}px solid ${color}33`,
      borderTop:`${Math.max(2, size / 8)}px solid ${color}`,
      borderRadius:"50%",
      animation:"spin 0.8s linear infinite",
    }} />
  );
}

function NavBtn({ icon, label, active, onClick, color, hint, text }: { icon: string; label: string; active: boolean; onClick: () => void; color: string; hint: string; text: string }) {
  return (
    <button
      style={{ display:"flex", flexDirection:"column", alignItems:"center", gap: 2, background:"none", border:"none", cursor:"pointer", padding:"4px 12px", color: active ? color : hint, transition:"color 0.15s" }}
      onClick={onClick}
    >
      <span style={{ fontSize: 20 }}>{icon}</span>
      <span style={{ fontSize: 10, fontWeight: active ? 700 : 400 }}>{label}</span>
    </button>
  );
}

export default function TelegramMiniApp() {
  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } * { box-sizing: border-box; } body { margin: 0; }`}</style>
      <QueryClientProvider client={queryClient}>
        <TelegramMiniAppInner />
      </QueryClientProvider>
    </>
  );
}
