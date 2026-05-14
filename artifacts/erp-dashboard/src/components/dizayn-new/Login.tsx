/**
 * DIZAYN-NEW: Login sahifasi — Enterprise ERP Professional Redesign
 * Vazifa 1: Split-layout (60/40), floating labels, gradient panel, animations
 * Stack: React 19 + shadcn/ui + Tailwind CSS v4 + Lucide React
 */
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, ArrowRight, Users, Building2, Zap, ShieldCheck } from "lucide-react";
import { EuroprintLogo } from "@/components/EuroprintLogo";
import { apiRequest, HttpError } from "@/lib/queryClient";

import { EPLoader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
// ─── Types ───────────────────────────────────────────────────────────────────

interface LoginRedesignProps {
  onLoginSuccess?: (role?: string) => void;
}

interface LoginFormState {
  username: string;
  password: string;
  showPassword: boolean;
  isLoading: boolean;
  error: string | null;
}

// ─── Validation ───────────────────────────────────────────────────────────────

const loginSchema = z.object({
  username: z.string().min(1, "Foydalanuvchi nomi kiritilishi shart"),
  password: z.string().min(1, "Parol kiritilishi shart"),
});

// ─── Left Panel Statistics ────────────────────────────────────────────────────

const HERO_STATS = [
  { icon: Users,     label: "400+ xodim",          sublabel: "tizimda faol" },
  { icon: Building2, label: "Bosmachilik №1",       sublabel: "O'zbekistonda" },
  { icon: Zap,       label: "Real-time ERP",        sublabel: "barcha jarayonlar" },
  { icon: ShieldCheck, label: "100% xavfsiz",       sublabel: "RBAC + audit" },
];

// ─── Floating Label Input ─────────────────────────────────────────────────────

interface FloatingInputProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  "data-testid"?: string;
  rightElement?: React.ReactNode;
}

function FloatingInput({
  id,
  label,
  type = "text",
  value,
  onChange,
  autoComplete,
  "data-testid": testId,
  rightElement,
}: FloatingInputProps) {
  const [focused, setFocused] = useState(false);
  const isFloated = focused || value.length > 0;

  return (
    <div className="relative">
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoComplete={autoComplete}
        data-testid={testId}
        aria-label={label}
        className={cn(
          "h-14 px-4 pt-5 pb-2 text-sm",
          "border border-border rounded-lg bg-card",
          "transition-all duration-150 ease-in-out",
          "focus:ring-2 focus:ring-primary/30 focus:border-primary",
          rightElement && "pr-12"
        )}
      />
      <label
        htmlFor={id}
        className={cn(
          "absolute left-4 pointer-events-none select-none",
          "transition-all duration-150 ease-in-out text-muted-foreground",
          isFloated
            ? "top-2 text-[10px] font-medium text-primary"
            : "top-1/2 -translate-y-1/2 text-sm"
        )}
      >
        {label}
      </label>
      {rightElement && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {rightElement}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function LoginRedesign({ onLoginSuccess }: LoginRedesignProps) {
  const { t } = useTranslation("common");
  const [form, setForm] = useState<LoginFormState>({
    username: "",
    password: "",
    showPassword: false,
    isLoading: false,
    error: null,
  });

  const setField = <K extends keyof LoginFormState>(
    key: K,
    value: LoginFormState[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setField("error", null);

    const parsed = loginSchema.safeParse({
      username: form.username,
      password: form.password,
    });

    if (!parsed.success) {
      setField("error", parsed.error.errors[0].message);
      return;
    }

    setField("isLoading", true);
    try {
      // After a successful login the server sets the httpOnly access_token /
      // refresh_token cookies on the response — the browser persists them
      // automatically. We no longer write tokens to localStorage; reading
      // them client-side would defeat the purpose of httpOnly cookies.
      const data = await apiRequest<{
        accessToken?: string;
        user?: { id: string | number; username: string; role: string };
      }>('POST', "/api/auth/login", { username: form.username, password: form.password });

      if (data.accessToken) {
        onLoginSuccess?.(data.user?.role);
      }
    } catch (err) {
      let status = 0;
      if (err instanceof HttpError) {
        status = err.status;
      } else if (err instanceof Error) {
        const m = err.message.match(/^(\d{3}):/);
        if (m) status = Number(m[1]);
      }
      if (status === 429) {
        setField("error", "Juda ko'p urinish. 15 daqiqadan keyin qayta urinib ko'ring.");
      } else if (status > 0 && status < 500) {
        setField("error", "Login yoki parol noto'g'ri");
      } else {
        setField("error", "Server bilan ulanishda xatolik yuz berdi");
      }
    } finally {
      setField("isLoading", false);
    }
  };

  return (
    <div
      className="min-h-screen flex overflow-hidden"
      role="main"
      aria-label={t("tizimgaKirishSahifasi")}
    >
      {/* ── LEFT PANEL: Hero (60%) ── */}
      <div
        className="hidden lg:flex lg:w-[60%] relative flex-col justify-between p-12"
        style={{
          background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-dim, 216 100% 32%)) 100%)",
        }}
        aria-hidden="true"
      >
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 -translate-y-1/3 translate-x-1/3"
          style={{ background: "radial-gradient(circle, white 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-10 translate-y-1/3 -translate-x-1/3"
          style={{ background: "radial-gradient(circle, white 0%, transparent 70%)" }} />

        {/* Logo */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-3 bg-white/15 rounded-xl px-4 py-2 backdrop-blur-sm">
            <EuroprintLogo height={28} />
            <span className="text-white font-semibold text-sm tracking-wide">{t("erpSystem")}</span>
          </div>
        </div>

        {/* Center content */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-white leading-tight">
              {t("zamonaviyIshlabChiqarish")}
              <br />
              <span className="opacity-80">boshqaruv tizimi</span>
            </h1>
            <p className="text-white/70 text-base max-w-sm">
              SAP darajadagi ERP — 15 modul, real-time monitoring, AI tahlil
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(Array.isArray(HERO_STATS) ? HERO_STATS : []).map(({ icon: Icon, label, sublabel }) => (
              <div
                key={label}
                className="flex items-center gap-3 bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10"
              >
                <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{label}</p>
                  <p className="text-white/60 text-xs">{sublabel}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-white/40 text-xs">{t("v202026EuroprintLlc")}</p>
        </div>
      </div>

      {/* ── RIGHT PANEL: Form (40%) ── */}
      <div
        className={cn(
          "w-full lg:w-[40%] flex flex-col items-center justify-center",
          "bg-background px-6 py-12 sm:px-12",
          /* Entrance animation */
          "animate-in slide-in-from-bottom-4 fade-in duration-500"
        )}
      >
        {/* Mobile logo */}
        <div className="lg:hidden mb-8">
          <EuroprintLogo height={36} />
        </div>

        <div className="w-full max-w-sm space-y-8">
          {/* Heading */}
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              {t("tizimgaKirish")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("europrintErpGaXushKelibsiz")}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Username */}
            <FloatingInput
              id="username"
              label={t("username")}
              value={form.username}
              onChange={(v) => setField("username", v)}
              autoComplete="username"
              data-testid="input-username"
            />

            {/* Password */}
            <FloatingInput
              id="password"
              label={t("Parol")}
              type={form.showPassword ? "text" : "password"}
              value={form.password}
              onChange={(v) => setField("password", v)}
              autoComplete="current-password"
              data-testid="input-password"
              rightElement={
                <button
                  type="button"
                  onClick={() => setField("showPassword", !form.showPassword)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={form.showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
                  tabIndex={0}
                >
                  {form.showPassword
                    ? <EyeOff className="w-4 h-4" />
                    : <Eye className="w-4 h-4" />
                  }
                </button>
              }
            />

            {/* Error message */}
            {form.error && (
              <div
                role="alert"
                className="flex items-start gap-2 bg-[var(--ep-red)]/10 border border-error/20 rounded-lg px-3 py-2.5"
              >
                <span className="text-[var(--ep-red)] text-xs mt-0.5">⚠</span>
                <p className="text-[var(--ep-red)] text-xs">{form.error}</p>
              </div>
            )}

            {/* Submit button */}
            <Button
              type="submit"
              className={cn(
                "w-full h-12 font-medium text-sm",
                "bg-primary hover:bg-[hsl(var(--primary-dim,216_100%_32%))]",
                "text-primary-foreground",
                "transition-all duration-150",
                "rounded-lg gap-2",
                form.isLoading && "opacity-70 cursor-not-allowed"
              )}
              disabled={form.isLoading}
              data-testid="button-login"
            >
              {form.isLoading ? (
                <>
                  <EPLoader className="w-4 h-4" />
                  {t("kirilmoqda")}
                </>
              ) : (
                <>
                  {t("tizimgaKirish")}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              v2.0 &nbsp;·&nbsp; © 2026 Europrint LLC
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginRedesign;
