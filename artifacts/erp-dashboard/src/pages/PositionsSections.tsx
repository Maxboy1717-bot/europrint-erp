/**
 * @module PositionsSections
 * @description Major section components for the Positions page: filters bar and positions table.
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Search, Pencil, Trash2, Target } from "lucide-react";
import { type Position, type Department, KPI_TEMPLATES } from "./PositionsTypes";
import { useTranslation } from '@/lib/i18n';

// ---------------------------------------------------------------------------
// Filters bar
// ---------------------------------------------------------------------------

interface PositionsFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  deptFilter: string;
  onDeptFilterChange: (value: string) => void;
  departments: Department[];
  filteredCount: number;
}

export function PositionsFilters({
  search, onSearchChange, deptFilter, onDeptFilterChange, departments, filteredCount,
}: PositionsFiltersProps) {
  const { t } = useTranslation("common");
  return (
    <div className="px-6 py-3 flex items-center gap-3 flex-wrap">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("Qidirish...")}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 h-9"
        />
      </div>
      <Select value={deptFilter} onValueChange={onDeptFilterChange}>
        <SelectTrigger className="w-48 h-9">
          <SelectValue placeholder={t("barchaBolimlar")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("barchaBolimlar")}</SelectItem>
          {(Array.isArray(departments) ? departments : []).map((d) => (
            <SelectItem key={d.id} value={d.id}>{d.name_uz || d.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-sm text-muted-foreground">{filteredCount} ta lavozim</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Positions table
// ---------------------------------------------------------------------------

interface PositionsTableProps {
  positions: Position[];
  isLoading: boolean;
  getDeptName: (id: string | null) => string;
  onEdit: (pos: Position) => void;
  onDelete: (id: string) => void;
  onKpiClick: (pos: Position, currentKey: string) => void;
}

export function PositionsTable({
  positions, isLoading, getDeptName, onEdit, onDelete, onKpiClick,
}: PositionsTableProps) {
  const { t } = useTranslation("common");
  return (
    <div className="flex-1 overflow-auto px-6 pb-6">
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="ep-table-scroll"><Table>
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow>
              <TableHead className="w-[80px]">{t("code")}</TableHead>
              <TableHead>{t("lavozimNomi1")}</TableHead>
              <TableHead>{t("bolim1")}</TableHead>
              <TableHead className="w-[90px]">{t("daraja")}</TableHead>
              <TableHead className="w-[90px]">Shtат</TableHead>
              <TableHead className="w-[90px]">{t("status28")}</TableHead>
              <TableHead className="w-[100px]">KPI</TableHead>
              <TableHead className="w-[100px] text-right">{t("Amallar")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={`k-${i}`} className="hover:bg-muted/40 transition-colors">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : positions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-[13px] text-muted-foreground">
                  {t("lavozimlarTopilmadi")}
                </TableCell>
              </TableRow>
            ) : (
              (Array.isArray(positions) ? positions : []).map((pos) => (
                <PositionRow
                  key={pos.id}
                  pos={pos}
                  getDeptName={getDeptName}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onKpiClick={onKpiClick}
                />
              ))
            )}
          </TableBody>
        </Table></div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single table row (internal)
// ---------------------------------------------------------------------------

interface PositionRowProps {
  pos: Position;
  getDeptName: (id: string | null) => string;
  onEdit: (pos: Position) => void;
  onDelete: (id: string) => void;
  onKpiClick: (pos: Position, currentKey: string) => void;
}

function PositionRow({ pos, getDeptName, onEdit, onDelete, onKpiClick }: PositionRowProps) {
  const { t } = useTranslation("common");
  const kpiMatch = pos.description?.match(/^\[KPI:([^\]]+)\]/);
  const kpiKey = kpiMatch ? kpiMatch[1] : "";
  const kpiTpl = kpiKey ? KPI_TEMPLATES.find((t) => t.key === kpiKey) : null;

  return (
    <TableRow className="group hover:bg-muted/40 transition-colors">
      <TableCell className="font-mono text-xs text-muted-foreground">{pos.code || "—"}</TableCell>
      <TableCell>
        <div className="font-medium">{pos.name_uz || pos.name}</div>
        {pos.name_ru && <div className="text-xs text-muted-foreground">{pos.name_ru}</div>}
        {pos.is_management && (
          <Badge variant="outline" className="text-xs mt-0.5">{t("boshqaruv")}</Badge>
        )}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">{getDeptName(pos.department_id)}</TableCell>
      <TableCell>
        {pos.level != null ? (
          <Badge variant="outline" className="text-xs">{pos.level}-daraja</Badge>
        ) : "—"}
      </TableCell>
      <TableCell className="text-sm">{pos.headcount ?? "—"}</TableCell>
      <TableCell>
        <Badge variant={pos.is_active ? "default" : "secondary"} className="text-xs">
          {pos.is_active ? "Faol" : "Nofaol"}
        </Badge>
      </TableCell>
      <TableCell>
        {kpiKey ? (
          <Badge
            variant="outline"
            className="text-xs cursor-pointer gap-1"
            onClick={() => onKpiClick(pos, kpiKey)}
          >
            <Target className="h-2.5 w-2.5" />
            {kpiTpl?.label ?? kpiKey}
          </Badge>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1 text-muted-foreground"
            onClick={() => onKpiClick(pos, "")}
          >
            <Target className="h-3 w-3" /> {t("biriktir")}
          </Button>
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(pos)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => onDelete(pos.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
