import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FolderKanban, LayoutList, CalendarDays, Target, Calendar, TrendingUp, Users } from "lucide-react";
import { ViewMode, KanbanTranslations } from "@/components/kanban/types";

interface KanbanViewTabsProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  t: KanbanTranslations;
}

export function KanbanViewTabs({ viewMode, setViewMode, t }: KanbanViewTabsProps) {
  return (
    <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
      <TabsList className="bg-blue-700/50 border-0 rounded-xl p-2 h-auto gap-2">
        <TabsTrigger value="kanban" className="gap-3 rounded-lg px-6 py-3.5 text-base font-semibold min-h-[52px] text-blue-100 data-[state=active]:bg-surface-container-lowest data-[state=active]:text-blue-600 data-[state=active]:shadow-md">
          <FolderKanban className="h-6 w-6" /> {t.views.kanban}
        </TabsTrigger>
        <TabsTrigger value="list" className="gap-3 rounded-lg px-6 py-3.5 text-base font-semibold min-h-[52px] text-blue-100 data-[state=active]:bg-surface-container-lowest data-[state=active]:text-blue-600 data-[state=active]:shadow-md">
          <LayoutList className="h-6 w-6" /> {t.views.list}
        </TabsTrigger>
        <TabsTrigger value="deadlines" className="gap-3 rounded-lg px-6 py-3.5 text-base font-semibold min-h-[52px] text-blue-100 data-[state=active]:bg-surface-container-lowest data-[state=active]:text-blue-600 data-[state=active]:shadow-md">
          <CalendarDays className="h-6 w-6" /> {t.views.deadlines}
        </TabsTrigger>
        <TabsTrigger value="myPlan" className="gap-3 rounded-lg px-6 py-3.5 text-base font-semibold min-h-[52px] text-blue-100 data-[state=active]:bg-surface-container-lowest data-[state=active]:text-blue-600 data-[state=active]:shadow-md">
          <Target className="h-6 w-6" /> {t.views.myPlan}
        </TabsTrigger>
        <TabsTrigger value="calendar" className="gap-3 rounded-lg px-6 py-3.5 text-base font-semibold min-h-[52px] text-blue-100 data-[state=active]:bg-surface-container-lowest data-[state=active]:text-blue-600 data-[state=active]:shadow-md">
          <Calendar className="h-6 w-6" /> {t.views.calendar}
        </TabsTrigger>
        <TabsTrigger value="gantt" className="gap-3 rounded-lg px-6 py-3.5 text-base font-semibold min-h-[52px] text-blue-100 data-[state=active]:bg-surface-container-lowest data-[state=active]:text-blue-600 data-[state=active]:shadow-md">
          <FolderKanban className="h-6 w-6" /> {t.views.gantt}
        </TabsTrigger>
        <TabsTrigger value="dashboard" className="gap-3 rounded-lg px-6 py-3.5 text-base font-semibold min-h-[52px] text-blue-100 data-[state=active]:bg-surface-container-lowest data-[state=active]:text-blue-600 data-[state=active]:shadow-md">
          <TrendingUp className="h-6 w-6" /> {t.views.dashboard}
        </TabsTrigger>
        <TabsTrigger value="allocation" className="gap-3 rounded-lg px-6 py-3.5 text-base font-semibold min-h-[52px] text-blue-100 data-[state=active]:bg-surface-container-lowest data-[state=active]:text-blue-600 data-[state=active]:shadow-md">
          <Users className="h-6 w-6" /> {t.views.allocation}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
