/**
 * @module LoginSections
 * @description Reusable UI sections for the Login page:
 *   FloatingInput, HeroPanel, FormPanel layout pieces.
 */

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Users, Building2, Zap, ShieldCheck,
} from "lucide-react";
import { EuroprintLogo } from "@/components/EuroprintLogo";
import { useTranslation } from '@/lib/i18n';

// ─── Hero stats ───────────────────────────────────────────────────────────────

export const HERO_STATS = [
  { icon: Users,       label: "400+ xodim",    sublabel: "tizimda faol"      },
  { icon: Building2,   label: "Bosmachilik №1", sublabel: "O'zbekistonda"     },
  { icon: Zap,         label: "Real-time ERP",  sublabel: "barcha jarayonlar" },
  { icon: ShieldCheck, label: "100% xavfsiz",   sublabel: "RBAC + audit"      },
];

// ─── Floating Label Input ─────────────────────────────────────────────────────

export interface FloatingInputProps {
  id: string;
  /** Overrides the default `name={id}` — useful when tests select by a different name. */
  name?: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  "data-testid"?: string;
  rightElement?: React.ReactNode;
}

export function FloatingInput({
  id, name, label, type = "text", value, onChange,
  autoComplete, "data-testid": testId, rightElement,
}: FloatingInputProps) {
  const { t } = useTranslation("common");
  const [focused, setFocused] = useState(false);
  const isFloated = focused || value.length > 0;

  return (
    <div className="relative">
      <Input
        id={id}
        name={name ?? id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={(e) => { setFocused(false); onChange(e.target.value); }}
        autoComplete={autoComplete}
        data-testid={testId}
        aria-label={label}
        className={cn(
          "h-14 px-4 pt-5 pb-2 text-sm",
          "border border-border rounded-xl bg-card",
          "transition-all duration-150 ease-in-out",
          "focus:ring-2 focus:ring-primary focus:border-primary",
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

// ─── Hero Panel (left 60%) ────────────────────────────────────────────────────

export function LoginHeroPanel() {
  const { t } = useTranslation("common");
  return (
    <div
      className="erp-auth-hero-panel hidden lg:flex lg:w-[60%] relative flex-col justify-between p-12"
      aria-hidden="true"
    >
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 -translate-y-1/3 translate-x-1/3"
        style={{ background: "radial-gradient(circle, white 0%, transparent 70%)" }} />
      <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-10 translate-y-1/3 -translate-x-1/3"
        style={{ background: "radial-gradient(circle, white 0%, transparent 70%)" }} />

      <div className="relative z-10">
        <div className="inline-flex items-center gap-3 bg-white/15 rounded-xl px-4 py-2 backdrop-blur-sm">
          <EuroprintLogo height={28} />
          <span className="text-white font-semibold text-sm tracking-wide">{t("erpSystem")}</span>
        </div>
      </div>

      <div className="relative z-10 space-y-8">
        <div className="space-y-3">
          <h1 className="ep-h1 text-white">
            {t("zamonaviyIshlabChiqarish")}
            <br />
            <span className="opacity-80">{t("boshqaruvTizimi")}</span>
          </h1>
          <p className="text-white/70 text-base max-w-sm">
            SAP darajadagi ERP — 15 modul, real-time monitoring, AI tahlil
          </p>
        </div>

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

      <div className="relative z-10">
        <p className="text-white/40 text-xs">{t("v202026EuroprintLlc")}</p>
      </div>
    </div>
  );
}
