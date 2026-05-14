/**
 * @module KanbanColumn
 * @description React page component. Route-level UI.
 */

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { KanbanColumnHeader } from "@/components/crm/KanbanColumnHeader";
import { EntityCard } from "./EntityCard";
import type { KanbanColumnProps } from "./crm-types";
import { useTranslation } from '@/lib/i18n';

function hexToRgba(hex: string, alpha: number): string {
  try {
    if (!hex?.startsWith("#") || hex.length < 7) return `rgba(107,114,128,${alpha})`;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  } catch {
    return `rgba(107,114,128,${alpha})`;
  }
}

export function KanbanColumn({
  stage,
  entities,
  entityType,
  totalValue,
  onEntityClick,
  onAddTask,
  onQuickAdd,
  stageIndex = 0,
  totalStages = 7,
}: KanbanColumnProps) {
  const { t } = useTranslation("common");
  const { setNodeRef, isOver } = useDroppable({
    id: stage.stageId,
    data: { stageId: stage.stageId },
  });

  const color = stage.color ?? "#A0AEC0";

  // ── Neumorphic soyalar ──────────────────────────────────────────────────────
  const shadowIdle =
    "6px 6px 20px rgba(163,177,198,0.45), -4px -4px 12px rgba(255,255,255,0.80)";
  const shadowOver =
    "inset 4px 4px 12px rgba(163,177,198,0.35), inset -2px -2px 8px rgba(255,255,255,0.60), 0 0 0 2px " +
    hexToRgba(color, 0.35);

  return (
    <motion.div
      ref={setNodeRef}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay: stageIndex * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className={cn("w-full sm:w-[270px] flex-shrink-0 flex flex-col rounded-[20px] transition-all duration-200")}
      style={{
        background: isOver ? "#E8F0FB" : "#FFFFFF",
        boxShadow: isOver ? shadowOver : shadowIdle,
      }}
      data-testid={`column-${stage.stageId}`}
    >
      {/* ── Ustun sarlavhasi ─────────────────────────────────────── */}
      <div className="px-4 pt-0 pb-3">
        <KanbanColumnHeader
          stageName={stage.name}
          stageColor={stage.color || undefined}
          itemCount={entities.length}
          totalValue={totalValue || 0}
          currency={entityType === "deals" ? "UZS" : "EUR"}
          onQuickAdd={onQuickAdd}
        />
      </div>

      {/* ── Ajratuvchi ──────────────────────────────────────────── */}
      <div
        className="mx-4 mb-2"
        style={{ height: "1px", background: "rgba(0,0,0,0.05)", borderRadius: "1px" }}
      />

      {/* ── Kartochkalar ro'yxati ────────────────────────────────── */}
      <ScrollArea className="flex-1 max-h-[calc(100vh-310px)]">
        <SortableContext
          id={stage.stageId}
          items={(Array.isArray(entities) ? entities : []).map((e) => e.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="px-3 pb-3 space-y-2.5">
            <AnimatePresence initial={false}>
              {(Array.isArray(entities) ? entities : []).map((entity) => (
                <EntityCard
                  key={entity.id}
                  entity={entity}
                  entityType={entityType}
                  onClick={onEntityClick}
                  onAddTask={onAddTask}
                  stageColor={stage.color ?? "#A0AEC0"}
                  stageIndex={stageIndex}
                  totalStages={totalStages}
                />
              ))}
            </AnimatePresence>

            {/* ── Bo'sh holat ─────────────────────────────────── */}
            {entities.length === 0 && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                whileHover={{ scale: 1.02 }}
                onClick={onQuickAdd}
                className="w-full flex flex-col items-center justify-center h-[88px] gap-2 rounded-[14px] cursor-pointer border-0 transition-all duration-180"
                style={{
                  background: hexToRgba(color, 0.04),
                  border: `2px dashed ${hexToRgba(color, 0.30)}`,
                }}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-xl font-light leading-none"
                  style={{
                    background: hexToRgba(color, 0.12),
                    color,
                    boxShadow: `2px 2px 6px ${hexToRgba(color, 0.18)}, -1px -1px 4px rgba(255,255,255,0.7)`,
                  }}
                >
                  +
                </div>
                <p className="text-[11px] font-600" style={{ color: hexToRgba(color, 0.65) }}>
                  {t("boshQoshish")}
                </p>
              </motion.button>
            )}
          </div>
        </SortableContext>
      </ScrollArea>
    </motion.div>
  );
}
