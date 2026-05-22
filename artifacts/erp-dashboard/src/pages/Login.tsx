/**
 * Login sahifasi — dizayn-new LoginRedesign integratsiyasi
 * Split-layout (60/40), floating labels, gradient hero panel
 */
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { EuroprintLogo } from "@/components/EuroprintLogo";
import { apiRequest, HttpError, setAuthToken } from "@/lib/queryClient";
import { safeStorage } from '@/lib/safeStorage';
import { FloatingInput, LoginHeroPanel } from "./LoginSections";

import { EPLoader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
// ─── Types ────────────────────────────────────────────────────────────────────

interface LoginProps {
  onLoginSuccess: (role?: string) => void;
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

// ─── Main Component ────────────────────────────────────────────────────────────

export default function Login({ onLoginSuccess }: LoginProps) {
  const { t } = useTranslation("common");
  const [form, setForm] = useState<LoginFormState>({
    username: "",
    password: "",
    showPassword: false,
    isLoading: false,
    error: null,
  });

  const setField = <K extends keyof LoginFormState>(
    key: K, value: LoginFormState[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setField("error", null);

    // Browser autofill does not always fire onChange on controlled inputs.
    // Read directly from DOM as the authoritative source so autofilled
    // values are never silently lost.
    const formEl = e.currentTarget;
    const domUsername = (formEl.querySelector('#username') as HTMLInputElement | null)?.value ?? '';
    const domPassword = (formEl.querySelector('#password') as HTMLInputElement | null)?.value ?? '';
    const username = domUsername || form.username;
    const password = domPassword || form.password;

    const parsed = loginSchema.safeParse({ username, password });

    if (!parsed.success) {
      setField("error", parsed.error.errors[0].message);
      return;
    }

    setField("isLoading", true);
    try {
      const data = await apiRequest<{
        accessToken?: string;
        user?: { id: string | number; username: string; role: string };
      }>('POST', "/api/auth/login", {
        username: username.trim().toLowerCase(),
        password,
      });

      if (data.accessToken) {
        // setAuthToken is a no-op post-cookie migration — httpOnly cookies
        // are set by the server's Set-Cookie header. Call retained for clarity
        // and forward compatibility.
        setAuthToken(data.accessToken, undefined);
        // Optional UX cache of non-sensitive user fields (role, name) so
        // routing decisions don't have to await /api/auth/me on first paint.
        // No token is persisted here.
        if (data.user) safeStorage.setItem("admin", JSON.stringify(data.user));
        onLoginSuccess(data.user?.role);
      }
    } catch (err) {
      // apiRequest throws Error("<status>: <body>") for non-2xx HTTP responses,
      // or HttpError(500, ...) for envelope-level failures.
      let status = 0;
      if (err instanceof HttpError) {
        status = err.status;
      } else if (err instanceof Error) {
        const m = err.message.match(/^(\d{3}):/);
        if (m) status = Number(m[1]);
      }
      if (status === 429) {
        setField("error", "Juda ko'p urinish. 15 daqiqadan keyin qayta urinib ko'ring.");
      } else if (status >= 500) {
        setField("error", "Server vaqtinchalik ishlamayapti. Iltimos, biroz kutib qayta urinib ko'ring.");
      } else if (status > 0) {
        setField("error", "Login yoki parol noto'g'ri");
      } else {
        setField("error", "Server bilan ulanishda xatolik yuz berdi. Sahifani yangilab qayta urinib ko'ring.");
      }
    } finally {
      setField("isLoading", false);
    }
  };

  return (
    <div
      className="erp-auth-root min-h-screen flex overflow-hidden"
      role="main"
      aria-label={t("tizimgaKirishSahifasi")}
    >
      {/* ── LEFT PANEL: Hero (60%) ── */}
      <LoginHeroPanel />

      {/* ── RIGHT PANEL: Form (40%) ── */}
      <div
        className={cn(
          "w-full lg:w-[40%] flex flex-col items-center justify-center",
          "bg-background px-6 py-12 sm:px-12",
          "animate-in slide-in-from-bottom-4 fade-in duration-500"
        )}
      >
        <div className="lg:hidden mb-8">
          <EuroprintLogo height={36} />
        </div>

        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              {t("tizimgaKirish")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("europrintErpGaXushKelibsiz")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <FloatingInput
              id="username"
              name="email"
              label={t("username")}
              value={form.username}
              onChange={(v) => setField("username", v)}
              autoComplete="username email"
              data-testid="input-username"
            />

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
                >
                  {form.showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            {form.error && (
              <div
                role="alert"
                className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2.5"
              >
                <span className="text-destructive text-xs mt-0.5">⚠</span>
                <p className="text-destructive text-xs">{form.error}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="solid"
              className="w-full h-12 font-medium text-sm gap-2 rounded-xl"
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
