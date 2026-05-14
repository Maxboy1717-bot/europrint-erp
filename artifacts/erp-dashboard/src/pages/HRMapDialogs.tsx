/**
 * @module HRMapDialogs
 * @description Left side panel (filters, AI transport, department stats) for HRMap.
 */

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Bus, Clock, Navigation, Sparkles, RefreshCw,
  ChevronDown, ChevronRight, Home,
} from "lucide-react";
import type { TransportResult, MapStats } from "./HRMapTypes";
import { EPStatusPill } from "@/components/ep";

interface LeftPanelProps {
  selectedDepartment: string;
  departments: Array<{ id: string; name: string }>;
  stats: MapStats | undefined;
  transportData: TransportResult | undefined;
  transportLoading: boolean;
  expandedGroup: string | null;
  onDepartmentChange: (v: string) => void;
  onGenerateRoutes: () => void;
  onToggleGroup: (id: string) => void;
}

export function LeftPanel({
  selectedDepartment,
  departments,
  stats,
  transportData,
  transportLoading,
  expandedGroup,
  onDepartmentChange,
  onGenerateRoutes,
  onToggleGroup,
}: LeftPanelProps) {
  return (
    <div className="space-y-4">
      {/* Department filter */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Filtrlar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Bo'lim</label>
            <Select value={selectedDepartment} onValueChange={onDepartmentChange}>
              <SelectTrigger data-testid="select-department" className="h-9 text-sm">
                <SelectValue placeholder="Barcha bo'limlar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha bo'limlar</SelectItem>
                {(Array.isArray(departments) ? departments : []).map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* AI Transport panel */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bus className="h-4 w-4 text-[var(--ep-blue)]" />
            Transport Marshrutlar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            AI xodimlarni yo'nalish bo'yicha guruhlaydi va uyga ketish vaqtini belgilaydi.
          </p>
          <Button
            className="w-full"
            size="sm"
            onClick={onGenerateRoutes}
            disabled={transportLoading}
            data-testid="button-generate-routes"
          >
            {transportLoading
              ? <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />Hisoblanmoqda...</>
              : <><Sparkles className="h-3.5 w-3.5 mr-1.5" />AI Marshrutlar</>
            }
          </Button>

          {transportData && (
            <>
              <Separator />
              <p className="text-xs text-muted-foreground">{transportData.summary}</p>
              <div className="space-y-2">
                {(Array.isArray(transportData.groups) ? transportData.groups : []).map((group) => (
                  <div key={group.id}>
                    <button
                      className="w-full flex items-center justify-between text-sm py-1 hover-elevate rounded-md px-2"
                      onClick={() => onToggleGroup(group.id)}
                      data-testid={`button-group-${group.id}`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: group.color }} />
                        <span className="font-medium">{group.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-xs">{group.employees.length}</Badge>
                        {expandedGroup === group.id
                          ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                          : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                        }
                      </div>
                    </button>
                    {expandedGroup === group.id && (
                      <div className="mt-1 pl-3 space-y-1.5 border-l-2" style={{ borderColor: group.color }}>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>Chiqish: {group.departureTime}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Navigation className="h-3 w-3" />
                          <span>{group.totalMinutes} daqiqa</span>
                        </div>
                        {group.driverNote && (
                          <p className="text-xs text-muted-foreground italic">{group.driverNote}</p>
                        )}
                        {(Array.isArray(group.employees) ? group.employees : []).map(emp => (
                          <div key={emp.id} className="text-xs flex items-center gap-1.5">
                            <Home className="h-3 w-3 text-muted-foreground shrink-0" />
                            <div>
                              <div className="font-medium">{emp.fullName}</div>
                              <div className="text-muted-foreground">{emp.distanceKm} km • {emp.travelMinutes} min</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Department breakdown */}
      {(stats?.byDepartment || []).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Bo'limlar bo'yicha</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(stats?.byDepartment || []).map((d, i) => (
              <div key={d.departmentName ?? `dept-${i}`} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{d.departmentName}</span>
                <EPStatusPill tone="neutral">{d.count}</EPStatusPill>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
