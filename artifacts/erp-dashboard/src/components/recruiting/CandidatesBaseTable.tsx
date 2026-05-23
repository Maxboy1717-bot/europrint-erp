/**
 * @module CandidatesBaseTable
 * @description Arxiv / "Nomzodlar Bazasi" — Kanban'dan chiqqan terminal nomzodlar
 *   (SINOV_COMPLETE va REJECTED) jadval ko'rinishida saqlanadi va qidiriladi.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, Briefcase, Search, CheckCircle2, XCircle, FileText, RotateCcw } from "lucide-react";
import { STAGES, type FunnelStage } from "@/components/recruiting/helpers-constants";
import type { PipelineEntry, Vacancy } from "@/components/recruiting/types";
import { tLabel } from '@/lib/i18n/tLabel';

interface Props {
  entries: PipelineEntry[];
  vacancyMap: Record<number, Vacancy>;
  onRestore?: (entryId: number) => void;
  onReport?: (entry: PipelineEntry) => void;
  isRestoring?: boolean;
}

const STAGE_LABEL_MAP: Record<FunnelStage, string> =
  Object.fromEntries(STAGES.map(s => [s.key, s.label])) as Record<FunnelStage, string>;

export function CandidatesBaseTable({ entries, vacancyMap, onRestore, onReport, isRestoring }: Props) {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<"all" | "SINOV_COMPLETE" | "REJECTED">("all");

  const safe = Array.isArray(entries) ? entries : [];
  const filtered = safe.filter(e => {
    const matchSearch = !search
      || e.candidate_name.toLowerCase().includes(search.toLowerCase())
      || (e.candidate_phone ?? "").includes(search)
      || (e.candidate_email ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStage = stageFilter === "all" || e.funnel_stage === stageFilter;
    return matchSearch && matchStage;
  });

  const sinovCount = safe.filter(e => e.funnel_stage === "SINOV_COMPLETE").length;
  const rejectedCount = safe.filter(e => e.funnel_stage === "REJECTED").length;

  return (
    <div className="flex flex-col gap-3 flex-1 min-h-0">
      {/* Filtrlar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={tLabel("common.CandidatesBaseTable.tsx.ismTelefonYokiEmailBoyichaQidirish", "Ism, telefon yoki email bo'yicha qidirish...")}
            className="pl-8 h-9 text-sm"
            data-testid="input-base-search"
          />
        </div>
        <Button
          size="sm"
          variant={stageFilter === "all" ? "default" : "outline"}
          onClick={() => setStageFilter("all")}
          className="h-9 text-xs"
          data-testid="btn-base-filter-all"
        >
          Barchasi ({safe.length})
        </Button>
        <Button
          size="sm"
          variant={stageFilter === "SINOV_COMPLETE" ? "default" : "outline"}
          onClick={() => setStageFilter("SINOV_COMPLETE")}
          className={`h-9 text-xs gap-1 ${stageFilter === "SINOV_COMPLETE" ? "bg-lime-600 hover:bg-lime-700" : "border-lime-500/40 text-lime-500"}`}
          data-testid="btn-base-filter-complete"
        >
          <CheckCircle2 className="w-3 h-3" />
          Sinov Yakunlandi ({sinovCount})
        </Button>
        <Button
          size="sm"
          variant={stageFilter === "REJECTED" ? "default" : "outline"}
          onClick={() => setStageFilter("REJECTED")}
          className={`h-9 text-xs gap-1 ${stageFilter === "REJECTED" ? "bg-red-600 hover:bg-red-700" : "border-red-500/40 text-red-500"}`}
          data-testid="btn-base-filter-rejected"
        >
          <XCircle className="w-3 h-3" />
          Rad etildi ({rejectedCount})
        </Button>
      </div>

      {/* Jadval */}
      <div className="flex-1 overflow-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 sticky top-0 z-10">
            <tr className="text-xs text-muted-foreground">
              <th className="text-left px-3 py-2 font-semibold">Nomzod</th>
              <th className="text-left px-3 py-2 font-semibold">Aloqa</th>
              <th className="text-left px-3 py-2 font-semibold">Vakansiya</th>
              <th className="text-left px-3 py-2 font-semibold">{tLabel("common.CandidatesBaseTable.tsx.holat", "Holat")}</th>
              <th className="text-left px-3 py-2 font-semibold">Manba</th>
              <th className="text-right px-3 py-2 font-semibold">{tLabel("common.CandidatesBaseTable.tsx.amallar", "Amallar")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center text-muted-foreground text-xs">
                  {tLabel("common.CandidatesBaseTable.tsx.bazadaHechQandayNomzodTopilmadi", "Bazada hech qanday nomzod topilmadi.")}
                </td>
              </tr>
            ) : (
              filtered.map(entry => {
                const vac = entry.vacancy_id ? vacancyMap[entry.vacancy_id] : null;
                const isRejected = entry.funnel_stage === "REJECTED";
                return (
                  <tr
                    key={entry.id}
                    className="hover:bg-muted/30 transition-colors"
                    data-testid={`row-base-${entry.id}`}
                  >
                    <td className="px-3 py-2 align-top">
                      <div className="font-medium text-foreground">{entry.candidate_name}</div>
                      {entry.recruiter_name && (
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          Rekruter: {entry.recruiter_name}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 align-top">
                      {entry.candidate_phone && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="w-2.5 h-2.5" /> {entry.candidate_phone}
                        </div>
                      )}
                      {entry.candidate_email && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <Mail className="w-2.5 h-2.5" />
                          <span className="truncate max-w-[180px]">{entry.candidate_email}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 align-top">
                      {entry.vacancy_title ? (
                        <div className="flex items-center gap-1 text-xs">
                          <Briefcase className="w-3 h-3 text-primary shrink-0" />
                          <span className="truncate max-w-[200px]">{entry.vacancy_title}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 align-top">
                      <Badge
                        className={`text-[11px] font-medium ${
                          isRejected
                            ? "bg-red-500/15 text-red-500 border-red-500/30"
                            : "bg-lime-500/15 text-lime-600 border-lime-500/30"
                        }`}
                      >
                        {isRejected ? <XCircle className="w-2.5 h-2.5 mr-1" /> : <CheckCircle2 className="w-2.5 h-2.5 mr-1" />}
                        {STAGE_LABEL_MAP[entry.funnel_stage as FunnelStage] ?? entry.funnel_stage}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 align-top">
                      {entry.candidate_source && (
                        <Badge variant="outline" className="text-[10px]">
                          {entry.candidate_source}
                        </Badge>
                      )}
                    </td>
                    <td className="px-3 py-2 align-top text-right">
                      <div className="flex gap-1 justify-end">
                        {onReport && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-[11px] gap-1 text-blue-500"
                            onClick={() => onReport(entry)}
                            data-testid={`btn-base-report-${entry.id}`}
                          >
                            <FileText className="w-3 h-3" />
                            {tLabel("common.CandidatesBaseTable.tsx.hisobot", "Hisobot")}
                          </Button>
                        )}
                        {onRestore && isRejected && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[11px] gap-1 border-amber-500/40 text-amber-500"
                            onClick={() => onRestore(entry.id)}
                            disabled={isRestoring}
                            data-testid={`btn-base-restore-${entry.id}`}
                          >
                            <RotateCcw className="w-3 h-3" />
                            {tLabel("common.CandidatesBaseTable.tsx.tiklash", "Tiklash")}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
