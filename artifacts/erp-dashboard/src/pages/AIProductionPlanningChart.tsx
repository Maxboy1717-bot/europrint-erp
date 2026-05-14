/** @module AIProductionPlanningChart @description Gantt chart component that renders a daily production timeline from PlanDataItem arrays. */

import { PlanDataItem, GANTT_COLORS, GANTT_TOTAL_WIDTH, GANTT_ROW_H, GANTT_LABEL_W, GANTT_CHART_W } from "./AIProductionPlanningTypes";
import { useTranslation } from '@/lib/i18n';

// ─── Time helper ──────────────────────────────────────────────────────────────
function parseTime(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// ─── Hour marker labels shown above the chart ─────────────────────────────────
const HOUR_MARKERS = [0, 4, 8, 12, 16, 20, 24] as const;

// ─── GanttChart ───────────────────────────────────────────────────────────────
interface GanttChartProps {
  items: PlanDataItem[];
}

export function GanttChart({ items }: GanttChartProps) {
  const { t } = useTranslation("common");
  if (!items.length) {
    return <p className="text-sm text-muted-foreground text-center py-8">{t("jadvalBosh")}</p>;
  }

  const machines = [...new Set((Array.isArray(items) ? items : []).map((i) => i.machineName))];

  return (
    <div className="overflow-x-auto rounded-lg border bg-muted/20 p-3" data-testid="gantt-chart">
      <div className="text-xs font-semibold text-muted-foreground mb-2">{t("ganttChartKunlikReja")}</div>

      {/* Hour markers */}
      <div className="flex ml-[140px] mb-1">
        {HOUR_MARKERS.map((h) => (
          <div
            key={h}
            style={{ width: `${(h === 24 ? 0 : (4 * 60) / GANTT_TOTAL_WIDTH) * GANTT_CHART_W}px` }}
            className="relative"
          >
            <span className="text-[10px] text-muted-foreground">{String(h).padStart(2, "0")}:00</span>
          </div>
        ))}
      </div>

      {/* Machine rows */}
      <div className="space-y-1">
        {(Array.isArray(machines) ? machines : []).map((machine, mi) => {
          const machineItems = (Array.isArray(items) ? items : []).filter(
            (i) => i.machineName === machine
          );
          return (
            <div key={machine} className="flex items-center gap-2">
              <div
                className="text-xs font-medium text-muted-foreground truncate"
                style={{ width: GANTT_LABEL_W, minWidth: GANTT_LABEL_W }}
              >
                {machine}
              </div>
              <div
                className="relative rounded bg-muted/50"
                style={{ width: GANTT_CHART_W, height: GANTT_ROW_H }}
              >
                {(Array.isArray(machineItems) ? machineItems : []).map((item, idx) => {
                  const start = parseTime(item.startTime);
                  const end = parseTime(item.endTime);
                  const width = Math.max(((end - start) / GANTT_TOTAL_WIDTH) * GANTT_CHART_W, 30);
                  const left = (start / GANTT_TOTAL_WIDTH) * GANTT_CHART_W;
                  const color = GANTT_COLORS[mi % GANTT_COLORS.length];
                  return (
                    <div
                      key={idx}
                      title={`${item.papkaNo} | ${item.startTime}-${item.endTime} | ${item.duration} min`}
                      style={{
                        left,
                        width,
                        backgroundColor: color + "cc",
                        borderLeft: `3px solid ${color}`,
                      }}
                      className="absolute top-1 bottom-1 rounded text-white text-[10px] font-bold flex items-center px-1 overflow-hidden"
                      data-testid={`gantt-bar-${item.papkaNo}`}
                    >
                      {item.papkaNo}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
