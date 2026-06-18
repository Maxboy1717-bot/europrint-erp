/**
 * @module OrgKartalarV2Page
 * @description Org kartalar V2 sahifasi. /api/org/functions dan real data.
 *   Razryad darajalari + kartalar bo'lim bo'yicha guruhlangan.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ModulePage } from "@/components/ui/module-page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EPStatusPill } from "@/components/ep";
import { Users, Search, Layers, TrendingUp } from "lucide-react";

interface RazryadRow {
  id: number;
  level: number;
  name_uz: string;
  name_ru: string;
  coefficient: number;
  min_months: number;
}

interface FunctionRow {
  id: number;
  position_name: string;
  position_name_ru: string | null;
  code: string | null;
  status: string | null;
  min_salary: number | null;
  max_salary: number | null;
  tskp: string | null;
  department_id: number;
  department_name: string | null;
  razryad_level: number | null;
  razryad_name: string | null;
  razryad_coefficient: number | null;
  employee_count: string | number;
}

const STATUS_LABELS: Record<string, string> = {
  active: "Faol",
  vacant: "Bo'sh",
  frozen: "Muzlatilgan",
  archived: "Arxiv",
  io: "IO",
};

const STATUS_TONE: Record<string, "success" | "warning" | "neutral" | "info" | "danger"> = {
  active:   "success",
  vacant:   "warning",
  frozen:   "neutral",
  archived: "neutral",
  io:       "info",
};

const RAZRYAD_COLORS = [
  "bg-slate-100 text-slate-700",
  "bg-blue-100 text-blue-700",
  "bg-green-100 text-green-700",
  "bg-yellow-100 text-yellow-700",
  "bg-orange-100 text-orange-700",
  "bg-red-100 text-red-700",
];

export default function OrgKartalarV2Page() {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState<number | null>(null);

  const { data: razryadData, isLoading: razryadLoading } = useQuery<RazryadRow[]>({
    queryKey: ["/api/org/razryad"],
    queryFn: () => apiRequest("GET", "/api/org/razryad"),
    select: (d) => (Array.isArray(d) ? d : (d as { data?: RazryadRow[] })?.data ?? []),
  });

  const { data: functionsData, isLoading: fnLoading } = useQuery<FunctionRow[]>({
    queryKey: ["/api/org/functions"],
    queryFn: () => apiRequest("GET", "/api/org/functions"),
    select: (d) => (Array.isArray(d) ? d : (d as { data?: FunctionRow[] })?.data ?? []),
  });

  const razryad = Array.isArray(razryadData) ? razryadData : [];
  const functions = Array.isArray(functionsData) ? functionsData : [];

  const filtered = functions.filter((f) => {
    const matchSearch =
      !search ||
      f.position_name.toLowerCase().includes(search.toLowerCase()) ||
      (f.department_name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === null || f.department_id === deptFilter;
    return matchSearch && matchDept;
  });

  // Departmentlar ro'yxati
  const depts = Array.from(
    new Map(functions.map((f) => [f.department_id, f.department_name])).entries()
  );

  // Guruhlash: department bo'yicha
  const grouped: Record<string, FunctionRow[]> = {};
  for (const fn of filtered) {
    const key = fn.department_name ?? "Boshqa";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(fn);
  }

  const isLoading = razryadLoading || fnLoading;
  const totalEmployees = functions.reduce((s, f) => s + Number(f.employee_count ?? 0), 0);
  const vacantCount = functions.filter((f) => f.status === "vacant").length;

  return (
    <ModulePage
      module="hr"
      title="Org Kartalar V2"
      subtitle={`${functions.length} ta karta · ${totalEmployees} xodim · ${vacantCount} bo'sh`}
      actions={
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Karta yoki bo'lim qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 w-64"
            />
          </div>
        </div>
      }
    >
      {/* Razryad darajalari */}
      <section className="mb-6">
        <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Razryad darajalari
        </h2>
        {razryadLoading ? (
          <div className="flex gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-20 w-32 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {razryad.map((r) => (
              <div
                key={r.id}
                className="flex flex-col items-center p-3 rounded-lg border bg-card min-w-[100px]"
              >
                <span className="text-2xl font-bold text-[var(--ep-brand)]">
                  {r.coefficient.toFixed(2)}x
                </span>
                <span className="text-xs font-medium mt-1">{r.name_uz}</span>
                <span className="text-[10px] text-muted-foreground">{r.min_months}+ oy</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Bo'lim filtri */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setDeptFilter(null)}
          className={`px-3 py-1 rounded-full text-xs border transition-colors ${
            deptFilter === null
              ? "bg-[var(--ep-brand)] text-white border-[var(--ep-brand)]"
              : "bg-background hover:bg-muted border-border"
          }`}
        >
          Barchasi ({functions.length})
        </button>
        {depts.map(([id, name]) => (
          <button
            key={id}
            onClick={() => setDeptFilter(deptFilter === id ? null : id)}
            className={`px-3 py-1 rounded-full text-xs border transition-colors ${
              deptFilter === id
                ? "bg-[var(--ep-brand)] text-white border-[var(--ep-brand)]"
                : "bg-background hover:bg-muted border-border"
            }`}
          >
            {name ?? "Bo'lim"} ({functions.filter((f) => f.department_id === id).length})
          </button>
        ))}
      </div>

      {/* Kartalar guruhlangan */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-36 rounded-lg" />
          ))}
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Layers className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>Karta topilmadi</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([deptName, cards]) => (
            <section key={deptName}>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-foreground">
                <span className="h-1 w-4 rounded bg-[var(--ep-brand)] inline-block" />
                {deptName}
                <span className="text-muted-foreground font-normal">({cards.length})</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {cards.map((fn) => {
                  const rIdx = (fn.razryad_level ?? 1) - 1;
                  const rColor = RAZRYAD_COLORS[Math.min(rIdx, 5)];
                  const empCount = Number(fn.employee_count ?? 0);
                  return (
                    <Card key={fn.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2 pt-4 px-4">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-sm leading-tight">
                            {fn.position_name}
                          </CardTitle>
                          <EPStatusPill tone={STATUS_TONE[fn.status ?? "active"] ?? "neutral"}>
                            {STATUS_LABELS[fn.status ?? "active"] ?? fn.status}
                          </EPStatusPill>
                        </div>
                        {fn.code && (
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {fn.code}
                          </span>
                        )}
                      </CardHeader>
                      <CardContent className="px-4 pb-4 space-y-2">
                        <div className="flex items-center justify-between">
                          {fn.razryad_level ? (
                            <span
                              className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${rColor}`}
                            >
                              R{fn.razryad_level} · {fn.razryad_name}
                              <span className="opacity-70">
                                ({fn.razryad_coefficient?.toFixed(2)}x)
                              </span>
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Razryad belgilanmagan</span>
                          )}
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" />
                            {empCount}
                          </span>
                        </div>
                        {fn.min_salary != null && (
                          <p className="text-xs text-muted-foreground">
                            Maosh: {fn.min_salary.toLocaleString()}
                            {fn.max_salary ? `–${fn.max_salary.toLocaleString()}` : ""} UZS
                          </p>
                        )}
                        {fn.tskp && (
                          <p className="text-xs text-muted-foreground line-clamp-1" title={fn.tskp}>
                            ЦКП: {fn.tskp}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </ModulePage>
  );
}
