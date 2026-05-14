/**
 * @module camera-heatmap-controls
 * @description Header controls bar for the Camera Heatmap page.
 *              Contains the period picker, context-sensitive metric / employee /
 *              department pickers, and the language toggle.
 */

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Zap, User, Building2 } from "lucide-react";
import { safeArray } from "@/lib/queryClient";
import {
  type Employee,
  type Department,
  type Language,
  type Period,
  type Metric,
  type ViewMode,
  type Translations,
} from "./camera-heatmap-types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface HeatmapControlsProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  selectedPeriod: Period;
  onPeriodChange: (period: Period) => void;
  viewMode: ViewMode;
  selectedMetric: Metric;
  onMetricChange: (metric: Metric) => void;
  selectedEmployeeId: string;
  onEmployeeChange: (id: string) => void;
  employeesList: Employee[] | undefined;
  selectedDepartmentId: string;
  onDepartmentChange: (id: string) => void;
  departmentsList: Department[] | undefined;
  t: Translations;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function HeatmapControls({
  language,
  onLanguageChange,
  selectedPeriod,
  onPeriodChange,
  viewMode,
  selectedMetric,
  onMetricChange,
  selectedEmployeeId,
  onEmployeeChange,
  employeesList,
  selectedDepartmentId,
  onDepartmentChange,
  departmentsList,
  t,
}: HeatmapControlsProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Period picker — always shown */}
      <Select value={selectedPeriod} onValueChange={(v: Period) => onPeriodChange(v)}>
        <SelectTrigger
          className="w-full sm:w-[130px] bg-background border-border rounded-lg h-9"
          data-testid="select-period"
        >
          <Calendar className="h-4 w-4 mr-2" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-card border-border">
          <SelectItem value="today">{t.today}</SelectItem>
          <SelectItem value="week">{t.week}</SelectItem>
          <SelectItem value="month">{t.month}</SelectItem>
        </SelectContent>
      </Select>

      {/* Metric picker — general view only */}
      {viewMode === "general" && (
        <Select value={selectedMetric} onValueChange={(v: Metric) => onMetricChange(v)}>
          <SelectTrigger
            className="w-full sm:w-[160px] bg-background border-border rounded-lg h-9"
            data-testid="select-metric"
          >
            <Zap className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="movement">{t.movement}</SelectItem>
            <SelectItem value="violations">{t.violations}</SelectItem>
            <SelectItem value="productivity">{t.productivity}</SelectItem>
          </SelectContent>
        </Select>
      )}

      {/* Employee picker — employee view only */}
      {viewMode === "employee" && (
        <Select value={selectedEmployeeId} onValueChange={onEmployeeChange}>
          <SelectTrigger
            className="w-full sm:w-[200px] bg-background border-border rounded-lg h-9"
            data-testid="select-employee"
          >
            <User className="h-4 w-4 mr-2" />
            <SelectValue placeholder={t.selectEmployee} />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {safeArray<Employee>(employeesList).map(emp => (
              <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Department picker — zone view only */}
      {viewMode === "zone" && (
        <Select value={selectedDepartmentId} onValueChange={onDepartmentChange}>
          <SelectTrigger
            className="w-full sm:w-[200px] bg-background border-border rounded-lg h-9"
            data-testid="select-department"
          >
            <Building2 className="h-4 w-4 mr-2" />
            <SelectValue placeholder={t.selectDepartment} />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {safeArray<Department>(departmentsList).map(dept => (
              <SelectItem key={dept.id} value={dept.id}>
                {language === "uz" ? dept.name : dept.nameRu}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Language toggle */}
      <div className="flex rounded-lg border border-border overflow-hidden">
        <Button
          variant={language === "uz" ? "default" : "ghost"}
          size="sm"
          className="rounded-none px-4"
          onClick={() => onLanguageChange("uz")}
          data-testid="button-lang-uz"
        >
          UZ
        </Button>
        <Button
          variant={language === "ru" ? "default" : "ghost"}
          size="sm"
          className="rounded-none px-4"
          onClick={() => onLanguageChange("ru")}
          data-testid="button-lang-ru"
        >
          RU
        </Button>
      </div>
    </div>
  );
}
