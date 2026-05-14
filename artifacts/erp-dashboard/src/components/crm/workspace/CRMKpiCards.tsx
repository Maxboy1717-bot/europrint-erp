/**
 * @module CRMKpiCards
 * @description React UI component.
 */

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Users,
  DollarSign,
  CheckCircle2,
  Target,
  Activity,
  Zap,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { EntityType } from "@/pages/crm/crm-types";

interface KpiItem  { id: number; [key: string]: unknown }
interface Stage    { stageId: string; name: string; color: string | null; sort: number }

interface CRMKpiCardsProps {
  items: KpiItem[];
  stages: Stage[];
  activeEntity: EntityType;
  stageValues: Record<string, number>;
}

interface KpiCardData {
  label: string;
  value: string;
  rawPct: number;
  sub: string;
  icon: React.ElementType;
  accent: string;
}

// ── Stage tasnifi ────────────────────────────────────────────────────────────

const POSITIVE_IDS = new Set([
  "WON","CONVERTED","PAID","APPROVED","DELIVERED",
  "COMPLETED","CLOSED_WON","SUCCESS","CLOSED",
]);
const NEGATIVE_IDS = new Set([
  "LOST","DECLINED","CANCELLED","CLOSED_LOST","FAILED","REJECTED","INACTIVE",
]);
const norm = (s: unknown): string => String(s ?? "").trim().toUpperCase();

// ── Neumorphic soyalar ───────────────────────────────────────────────────────
const SHADOW_CARD  = "6px 6px 16px rgba(163,177,198,0.55), -6px -6px 16px rgba(255,255,255,0.80)";
const SHADOW_HOVER = "8px 8px 20px rgba(163,177,198,0.65), -4px -4px 12px rgba(255,255,255,0.90)";

// ── Component ────────────────────────────────────────────────────────────────

export function CRMKpiCards({
  items,
  stages,
  activeEntity,
  stageValues,
}: CRMKpiCardsProps) {
  const kpis: KpiCardData[] = useMemo(() => {
    const total       = items.length;
    const sortedStages = [...stages].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
    const firstStage  = sortedStages[0];

    // Yangi (birinchi bosqich)
    const newCount = firstStage
      ? items.filter((item) => norm(item.statusId ?? item.stageId ?? item.status) === norm(firstStage.stageId)).length
      : 0;

    // Yutilgan (POSITIVE bosqichlar)
    const wonStages = stages.filter((s) => POSITIVE_IDS.has(norm(s.stageId)));
    const wonCount  = items.filter((item) => {
      const sid = norm(item.statusId ?? item.stageId ?? item.status);
      return wonStages.some((s) => norm(s.stageId) === sid);
    }).length;

    // Faol (terminal bosqichlarda emas)
    const terminalStages = stages.filter((s) => {
      const n = norm(s.stageId);
      return POSITIVE_IDS.has(n) || NEGATIVE_IDS.has(n);
    });
    const activeCount = items.filter((item) => {
      const sid = norm(item.statusId ?? item.stageId ?? item.status);
      return !terminalStages.some((s) => norm(s.stageId) === sid);
    }).length;

    const conversionRate = total > 0 ? Math.round((wonCount / total) * 100) : 0;
    const activePct      = total > 0 ? Math.round((activeCount / total) * 100) : 0;
    const totalValue     = Object.values(stageValues).reduce((s, v) => s + v, 0);
    const hasValue       = ["deals", "proposals", "invoices"].includes(activeEntity);
    const wonLabel       = wonStages.length > 0 ? wonStages.map((s) => s.name).join(" · ") : "Yakunlangan";

    if (hasValue) {
      return [
        {
          label: "Jami",
          value: String(total),
          rawPct: 100,
          sub: newCount > 0 ? `${newCount} yangi qo'shildi` : `${stages.length} bosqich`,
          icon: Users,
          accent: "#5B9BD5",
        },
        {
          label: "Umumiy qiymat",
          value: formatCurrency(totalValue, "UZS"),
          rawPct: 100,
          sub: `${stages.length} bosqich bo'yicha`,
          icon: DollarSign,
          accent: "#6DC5A0",
        },
        {
          label: "Yutilgan",
          value: String(wonCount),
          rawPct: total > 0 ? Math.round((wonCount / total) * 100) : 0,
          sub: wonLabel,
          icon: CheckCircle2,
          accent: "#6DC5A0",
        },
        {
          label: "Konversiya",
          value: `${conversionRate}%`,
          rawPct: conversionRate,
          sub: `${total} dan ${wonCount} ta`,
          icon: Target,
          accent: conversionRate >= 20 ? "#F5C96A" : "#F08080",
        },
      ];
    }

    return [
      {
        label: "Jami vazifalar",
        value: String(total),
        rawPct: 100,
        sub: newCount > 0 ? `${newCount} yangi qo'shildi` : "Barcha yozuvlar",
        icon: Users,
        accent: "#5B9BD5",
      },
      {
        label: "Jarayondagilar",
        value: String(activeCount),
        rawPct: activePct,
        sub: "Faol jarayonda",
        icon: Activity,
        accent: "#F5C96A",
      },
      {
        label: "Yakunlangan",
        value: String(wonCount),
        rawPct: total > 0 ? Math.round((wonCount / total) * 100) : 0,
        sub: wonLabel,
        icon: CheckCircle2,
        accent: "#6DC5A0",
      },
      {
        label: "Konversiya",
        value: `${conversionRate}%`,
        rawPct: conversionRate,
        sub: `${total} dan ${wonCount} ta`,
        icon: conversionRate >= 20 ? TrendingUp : Zap,
        accent: conversionRate >= 20 ? "#F5C96A" : "#F08080",
      },
    ];
  }, [items, stages, activeEntity, stageValues]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 px-5 pt-4 pb-2">
      {kpis.map((kpi, i) => (
        <motion.div
          key={kpi.label}
          initial={{ opacity: 0, y: -16, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.35, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{
            y: -3,
            boxShadow: SHADOW_HOVER,
            transition: { duration: 0.18 },
          }}
          className="relative overflow-hidden rounded-[20px] cursor-default select-none"
          style={{
            background: "#FFFFFF",
            boxShadow: SHADOW_CARD,
            padding: "20px",
          }}
          data-testid={`kpi-card-${kpi.label.toLowerCase().replace(/\s+/g, "-")}`}
        >
          {/* ── Yuqori qator: yorliq + ikonka ────────────────── */}
          <div className="flex items-start justify-between mb-3">
            <p
              className="text-[11px] font-600 uppercase tracking-[0.05em]"
              style={{ color: "#A0AEC0", fontWeight: 600 }}
            >
              {kpi.label}
            </p>

            {/* Ikonka bloki: 44×44, aksent 12% fon */}
            <div
              className="flex items-center justify-center shrink-0 rounded-[14px]"
              style={{
                width: 44, height: 44,
                background: `${kpi.accent}1E`,
                boxShadow: `2px 2px 8px ${kpi.accent}25, -1px -1px 6px rgba(255,255,255,0.70)`,
              }}
            >
              <kpi.icon
                style={{ width: 22, height: 22, color: kpi.accent, strokeWidth: 1.8 }}
              />
            </div>
          </div>

          {/* ── Raqam: 28px / weight 800 ─────────────────────── */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.08 + 0.15 }}
            className="leading-none tracking-tight mb-1"
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: "#2D3748",
            }}
          >
            {kpi.value}
          </motion.p>

          {/* ── Kichik tavsif ────────────────────────────────── */}
          <p
            className="leading-tight mb-4"
            style={{ fontSize: 11, color: "#718096" }}
          >
            {kpi.sub}
          </p>

          {/* ── Progress bar ─────────────────────────────────── */}
          <div>
            <div
              className="w-full rounded-full overflow-hidden"
              style={{
                height: 5,
                background: "rgba(163,177,198,0.22)",
                boxShadow: "inset 1px 1px 3px rgba(163,177,198,0.30), inset -1px -1px 3px rgba(255,255,255,0.60)",
              }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: kpi.accent }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(kpi.rawPct, 2)}%` }}
                transition={{ duration: 0.8, delay: i * 0.1 + 0.25, ease: "easeOut" }}
              />
            </div>
            <p
              className="mt-1 text-right"
              style={{ fontSize: 10, fontWeight: 700, color: kpi.accent }}
            >
              {kpi.rawPct}%
            </p>
          </div>

          {/* ── Dekorativ glow ───────────────────────────────── */}
          <div
            className="absolute -bottom-5 -right-5 w-20 h-20 rounded-full pointer-events-none"
            style={{ background: kpi.accent, opacity: 0.07 }}
          />
        </motion.div>
      ))}
    </div>
  );
}
