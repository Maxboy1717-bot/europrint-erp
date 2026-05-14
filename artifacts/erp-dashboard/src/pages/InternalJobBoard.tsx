/**
 * @module InternalJobBoard
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Briefcase, AlertTriangle, Search, CheckCircle,
} from "lucide-react";
import { InternalVacancy } from "./InternalJobBoardTypes";
import { VacancyCard } from "./InternalJobBoardSections";
import { ApplyDialog } from "./InternalJobBoardDialogs";
import { EPStatusPill } from "@/components/ep";

export default function InternalJobBoard() {
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "urgent">("all");
  const [applyTarget, setApplyTarget] = useState<InternalVacancy | null>(null);

  const { data: resp, isLoading } = useQuery<{ data: InternalVacancy[] }>({
    queryKey: ["/api/hr/recruitment/internal-board"],
    staleTime: 60_000,
  });

  const vacancies = resp?.data ?? [];

  const filtered = (Array.isArray(vacancies) ? vacancies : []).filter(v => {
    const matchSearch =
      !search ||
      v.title.toLowerCase().includes(search.toLowerCase()) ||
      (v.department_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (v.description || "").toLowerCase().includes(search.toLowerCase());
    const matchDept = departmentFilter === "all" || (v.department_name || "") === departmentFilter;
    const matchType = typeFilter === "all" || (typeFilter === "urgent" && v.is_urgent);
    return matchSearch && matchDept && matchType;
  });

  const departments = Array.from(
    new Set((Array.isArray(vacancies) ? vacancies : []).map(v => v.department_name || "").filter(Boolean))
  );
  const urgentCount = (Array.isArray(vacancies) ? vacancies : []).filter(v => v.is_urgent).length;

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      {/* Header */}
      <div className="border-b border-border/50 px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Briefcase className="h-5 w-5 text-primary" />
          <h1 className="font-semibold text-base">Ichki Vakansiyalar</h1>
          <EPStatusPill tone="neutral">{vacancies.length} ta</EPStatusPill>
          {urgentCount > 0 && (
            <Badge className="bg-[var(--ep-red)] text-white gap-1">
              <AlertTriangle className="w-3 h-3" />
              {urgentCount} shoshilinch
            </Badge>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-5">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground flex-1">
            Bu sahifada faqat kompaniya ichki xodimlari uchun mo'ljallangan vakansiyalar ko'rsatiladi.
            Ariza berish uchun vakansiyani tanlang.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Vakansiya yoki bo'lim nomi..."
              className="pl-8 h-9 text-sm"
              value={search}
              onChange={e => setSearch(e.target.value)}
              data-testid="input-search-internal"
            />
          </div>
          {departments.length > 0 && (
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full sm:w-[180px] h-9 text-sm" data-testid="select-dept-filter">
                <SelectValue placeholder="Bo'lim" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha bo'limlar</SelectItem>
                {(Array.isArray(departments) ? departments : []).map(d => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={typeFilter} onValueChange={v => setTypeFilter(v as "all" | "urgent")}>
            <SelectTrigger className="w-full sm:w-[150px] h-9 text-sm" data-testid="select-type-filter">
              <SelectValue placeholder="Tur" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha turlar</SelectItem>
              <SelectItem value="urgent">Faqat shoshilinch</SelectItem>
            </SelectContent>
          </Select>
          {(search || departmentFilter !== "all" || typeFilter !== "all") && (
            <span className="text-xs text-muted-foreground self-center">{filtered.length} ta topildi</span>
          )}
        </div>

        {/* List / Empty states */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <div className="text-center">
              <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-30 animate-pulse" />
              <p className="text-sm">Yuklanmoqda...</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <div className="text-center">
              <Briefcase className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="font-medium mb-1">
                {vacancies.length === 0
                  ? "Hozircha ichki vakansiyalar yo'q"
                  : "Mos vakansiya topilmadi"}
              </p>
              <p className="text-xs text-muted-foreground">
                {vacancies.length === 0
                  ? "HR bo'limi yangi ichki vakansiya e'lon qilganda bu yerda ko'rinadi"
                  : "Boshqa kalit so'z yoki bo'lim tanlang"}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(Array.isArray(filtered) ? filtered : []).map(v => (
              <VacancyCard key={v.id} vacancy={v} onApply={setApplyTarget} />
            ))}
          </div>
        )}

        {vacancies.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border/30">
            <CheckCircle className="w-3.5 h-3.5 text-[var(--ep-green)]" />
            Jami {vacancies.length} ta ichki vakansiya mavjud — ariza berishni unutmang!
          </div>
        )}
      </div>

      <ApplyDialog
        vacancy={applyTarget}
        open={!!applyTarget}
        onClose={() => setApplyTarget(null)}
      />
    </div>
  );
}
