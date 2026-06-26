/**
 * @module CRMHeader
 * @description React UI component.
 */

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Plus, ChevronDown, Zap } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { EntityType, ENTITY_CONFIG } from "@/pages/crm/crm-types";
import { CRMHeaderProps } from "./types";
import { useTranslation } from '@/lib/i18n';

// Per-entity accent colours used for icon halos and active tab glow
const ENTITY_GRADIENTS: Record<EntityType, { from: string; to: string; glow: string; bg: string }> = {
  leads:     { from: "#22c55e", to: "#16a34a", glow: "rgba(34,197,94,0.25)",   bg: "rgba(34,197,94,0.10)"  },
  deals:     { from: "#3b82f6", to: "#1d4ed8", glow: "rgba(59,130,246,0.25)",  bg: "rgba(59,130,246,0.10)" },
  contacts:  { from: "#a855f7", to: "#7c3aed", glow: "rgba(168,85,247,0.25)",  bg: "rgba(168,85,247,0.10)" },
  companies: { from: "#f97316", to: "#ea580c", glow: "rgba(249,115,22,0.25)",  bg: "rgba(249,115,22,0.10)" },
  proposals: { from: "#8b5cf6", to: "#6d28d9", glow: "rgba(139,92,246,0.25)",  bg: "rgba(139,92,246,0.10)" },
  invoices:  { from: "#f59e0b", to: "#d97706", glow: "rgba(245,158,11,0.25)",  bg: "rgba(245,158,11,0.10)" },
  robots:    { from: "#06b6d4", to: "#0891b2", glow: "rgba(6,182,212,0.25)",   bg: "rgba(6,182,212,0.10)"  },
};

export function CRMHeader({ activeEntity, onEntityChange, onQuickCreate }: CRMHeaderProps) {
  const { t } = useTranslation("common");
  const active = ENTITY_GRADIENTS[activeEntity];

  return (
    <div
      className="relative border-b px-6 pt-4 pb-0 overflow-hidden"
      style={{
        background: "var(--ep-primary)",
        borderColor: "rgba(0,0,0,0.07)",
      }}
    >
      {/* Subtle background glow that shifts with active entity */}
      <motion.div
        key={activeEntity}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 60% 120% at 5% 0%, ${active.bg} 0%, transparent 70%)`,
        }}
      />

      {/* ── Top row: branding + create button ─────────────────── */}
      <div className="relative flex items-center justify-between gap-4 mb-4">
        {/* Brand block */}
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.08, rotate: -4 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className="relative flex items-center justify-center w-10 h-10 rounded-lg shrink-0"
            style={{
              background: `linear-gradient(135deg, ${active.from}, ${active.to})`,
              boxShadow: `0 4px 16px ${active.glow}, 0 1px 3px rgba(0,0,0,0.12)`,
            }}
          >
            <Zap className="h-5 w-5 text-white fill-white" />
          </motion.div>
          <div>
            <h1
              className="font-black text-base tracking-tight leading-tight"
              style={{ color: "var(--ep-text)" }}
            >
              CRM
            </h1>
            <p className="text-[11px] font-medium leading-tight" style={{ color: "var(--ep-muted)" }}>
              {t("mijozlarBilanIshlash")}
            </p>
          </div>
        </div>

        {/* "+ Yaratish" premium button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                size="default"
                className="h-9 font-semibold px-4 gap-2 text-sm text-white border-0"
                style={{
                  background: `linear-gradient(135deg, ${active.from} 0%, ${active.to} 100%)`,
                  boxShadow: `0 4px 14px ${active.glow}, 0 1px 3px rgba(0,0,0,0.1)`,
                }}
                data-testid="button-create-dropdown"
              >
                <Plus className="h-4 w-4" />
                {t("Yaratish")}
                <ChevronDown className="h-3.5 w-3.5 opacity-80" />
              </Button>
            </motion.div>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-52 rounded-lg border-0 p-2"
            style={{
              boxShadow: "0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.08)",
              background: "#ffffff",
            }}
          >
            <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-2 pb-1">
              {t("yangiYaratish")}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="mb-1 bg-slate-100" />
            {(Object.keys(ENTITY_CONFIG) as EntityType[]).map((entity) => {
              const cfg   = ENTITY_CONFIG[entity];
              const Icon  = cfg.icon;
              const grad  = ENTITY_GRADIENTS[entity];
              return (
                <DropdownMenuItem
                  key={entity}
                  onClick={() => onQuickCreate(entity)}
                  className="gap-3 cursor-pointer py-2.5 px-2 rounded-xl focus:bg-slate-50 group"
                  data-testid={`menu-create-${entity}`}
                >
                  <span
                    className="flex items-center justify-center w-8 h-8 rounded-xl shrink-0"
                    style={{ background: grad.bg }}
                  >
                    <Icon
                      className="h-4 w-4"
                      style={{ color: grad.from }}
                    />
                  </span>
                  <span className="text-sm font-medium text-slate-700">{cfg.label}</span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ── Entity tabs ────────────────────────────────────────── */}
      <div className="relative flex items-end gap-0 overflow-x-auto hidden-scrollbar">
        {(Object.keys(ENTITY_CONFIG) as EntityType[]).map((entity) => {
          const cfg     = ENTITY_CONFIG[entity];
          const Icon    = cfg.icon;
          const grad    = ENTITY_GRADIENTS[entity];
          const isActive = activeEntity === entity;

          return (
            <button
              key={entity}
              onClick={() => onEntityChange(entity)}
              data-testid={`tab-entity-${entity}`}
              className={cn(
                "relative flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap",
                "transition-all duration-200 rounded-t-xl select-none",
                isActive ? "text-slate-900" : "text-slate-500 hover:text-slate-700",
              )}
              style={
                isActive
                  ? {
                      background: "rgba(255,255,255,0.9)",
                      boxShadow: `0 -2px 12px ${grad.glow}`,
                    }
                  : {}
              }
            >
              {/* Icon with coloured halo when active */}
              <span
                className="flex items-center justify-center w-6 h-6 rounded-lg transition-all duration-200"
                style={
                  isActive
                    ? { background: grad.bg }
                    : { background: "transparent" }
                }
              >
                <Icon
                  className="h-3.5 w-3.5 shrink-0 transition-colors duration-200"
                  style={{ color: isActive ? grad.from : undefined }}
                />
              </span>

              <span className="text-[13px]">{cfg.label}</span>

              {/* Glowing bottom bar — animated in */}
              <AnimatePresence>
                {isActive && (
                  <motion.span
                    layoutId="crm-tab-indicator"
                    className="absolute bottom-0 left-3 right-3 h-[3px] rounded-t-full"
                    style={{
                      background: `linear-gradient(90deg, ${grad.from}, ${grad.to})`,
                      boxShadow: `0 0 8px ${grad.glow}`,
                    }}
                    initial={{ scaleX: 0.5, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    exit={{ scaleX: 0.5, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </div>
    </div>
  );
}
