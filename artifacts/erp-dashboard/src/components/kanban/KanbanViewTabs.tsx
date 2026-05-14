/**
 * @module KanbanViewTabs
 * @description React UI component.
 */

import { FolderKanban, LayoutList, CalendarDays, Target, Calendar, TrendingUp, Users } from "lucide-react";
import { ViewMode, KanbanTranslations } from "@/components/kanban/types";

interface KanbanViewTabsProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  t: KanbanTranslations;
}

const TABS: { value: ViewMode; icon: React.ElementType; labelKey: keyof KanbanTranslations["views"] }[] = [
  { value: "kanban",     icon: FolderKanban, labelKey: "kanban"     },
  { value: "list",       icon: LayoutList,   labelKey: "list"       },
  { value: "deadlines",  icon: CalendarDays, labelKey: "deadlines"  },
  { value: "myPlan",     icon: Target,       labelKey: "myPlan"     },
  { value: "calendar",   icon: Calendar,     labelKey: "calendar"   },
  { value: "gantt",      icon: FolderKanban, labelKey: "gantt"      },
  { value: "dashboard",  icon: TrendingUp,   labelKey: "dashboard"  },
  { value: "allocation", icon: Users,        labelKey: "allocation" },
];

export function KanbanViewTabs({ viewMode, setViewMode, t }: KanbanViewTabsProps) {
  return (
    <div
      style={{
        display:      "flex",
        alignItems:   "center",
        gap:          4,
        background:   "#FFFFFF",
        borderRadius: 14,
        padding:      "4px 6px",
        boxShadow:    "4px 4px 12px rgba(163,177,198,0.40), -3px -3px 8px rgba(255,255,255,0.80)",
      }}
    >
      {TABS.map(({ value, icon: Icon, labelKey }) => {
        const isActive = viewMode === value;
        return (
          <button
            key={value}
            onClick={() => setViewMode(value)}
            style={{
              display:      "flex",
              alignItems:   "center",
              gap:          5,
              padding:      "6px 12px",
              borderRadius: 10,
              border:       "none",
              cursor:       "pointer",
              fontSize:     12,
              fontWeight:   isActive ? 700 : 500,
              transition:   "background 0.18s, box-shadow 0.18s, color 0.18s",
              background:   isActive
                ? "#5B9BD5"
                : "transparent",
              color:        isActive ? "#FFFFFF" : "#718096",
              boxShadow:    isActive
                ? "3px 3px 8px rgba(91,155,213,0.40), -1px -1px 4px rgba(255,255,255,0.60)"
                : "none",
              whiteSpace:   "nowrap",
            }}
          >
            <Icon style={{ width: 14, height: 14, flexShrink: 0 }} />
            {t.views[labelKey]}
          </button>
        );
      })}
    </div>
  );
}
