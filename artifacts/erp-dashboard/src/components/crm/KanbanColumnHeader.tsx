/**
 * @module KanbanColumnHeader
 * @description React UI component.
 */

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { useTranslation } from '@/lib/i18n';

interface KanbanColumnHeaderProps {
  stageName: string;
  stageColor?: string;
  itemCount: number;
  totalValue: number;
  currency?: string;
  onQuickAdd?: () => void;
}

export function KanbanColumnHeader({
  stageName,
  stageColor,
  itemCount,
  totalValue,
  currency = "UZS",
  onQuickAdd,
}: KanbanColumnHeaderProps) {
  const { t } = useTranslation("common");
  const color = stageColor ?? "#A0AEC0";

  return (
    <div
      className="flex flex-col"
      data-testid={`kanban-header-${stageName.toLowerCase().replace(/\s+/g, "-")}`}
    >
      {/* ── Rangli yuqori chiziq ─────────────────────────────── */}
      <div
        className="h-[4px] w-full rounded-b-sm mb-3"
        style={{ background: `linear-gradient(90deg, ${color} 0%, ${color}55 100%)` }}
        data-testid="stage-color-indicator"
      />

      {/* ── Nom qatori ─────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 px-0.5">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Pulsing dot */}
          <motion.div
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: color }}
            animate={{ scale: [1, 1.35, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Nom — UPPERCASE */}
          <h3
            className="font-bold text-[12px] uppercase tracking-[0.05em] truncate"
            style={{ color: "#2D3748" }}
          >
            {stageName}
          </h3>

          {/* Soni badge */}
          <motion.span
            key={itemCount}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 28 }}
            className="text-[11px] font-bold px-2 min-w-[22px] text-center py-0.5 rounded-[6px] shrink-0 leading-none"
            style={{
              backgroundColor: `${color}22`,
              color,
              boxShadow: `inset 1px 1px 3px ${color}18`,
            }}
            data-testid="item-count-badge"
          >
            {itemCount}
          </motion.span>
        </div>

        {/* Tez qo'shish tugmasi */}
        {onQuickAdd && (
          <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 shrink-0 rounded-[10px] border-0 transition-all duration-180"
              style={{
                background: `${color}14`,
                color,
                boxShadow: `2px 2px 6px rgba(163,177,198,0.35), -1px -1px 4px rgba(255,255,255,0.80)`,
              }}
              onClick={onQuickAdd}
              data-testid="button-quick-add"
              title={t("yangiQoshish")}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </motion.div>
        )}
      </div>

      {/* ── Jami qiymat ─────────────────────────────────────── */}
      {totalValue > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[11px] font-semibold tabular-nums mt-1.5 px-0.5"
          style={{ color }}
          data-testid="total-value-display"
        >
          {formatCurrency(totalValue, currency)}
        </motion.p>
      )}
    </div>
  );
}
