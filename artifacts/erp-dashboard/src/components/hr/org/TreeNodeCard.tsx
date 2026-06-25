/**
 * @module TreeNodeCard
 * @description React UI component.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, UserX, Settings2, Users, ChevronUp, Brain } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { OrgNode, CARD_W, CARD_H, LEVEL_LABELS, HRC_INDICATORS } from "./types";
import { getLevelColor, getInitials } from "./helpers";
import { useTranslation } from '@/lib/i18n';

export function TreeNodeCard({
  node,
  onClick,
  onAdd,
  isDragging,
  isDragTarget,
}: {
  node: OrgNode;
  onClick: (id: number) => void;
  onAdd: (parentId: string) => void;
  isDragging?: boolean;
  isDragTarget?: boolean;
}) {
  const { t } = useTranslation("common");
  const [hrcExpanded, setHrcExpanded] = useState(false);
  const isVacant = !node.headUserName;
  const level = node.hierarchyLevel ?? 0;
  const baseColor = getLevelColor(level);
  const empCount = node.employeeCount ?? 0;
  const tskpShort = node.tskp ? node.tskp.substring(0, 32) + (node.tskp.length > 32 ? "…" : "") : null;
  const hasHrc = !!node.hrcLatest && Object.keys(node.hrcLatest).length > 0;

  // VISION (egasi EP-ORG: "kartada razryad badge ko'rinadi") — razryad raqamini katalogdan yechamiz
  const { data: razryadData } = useQuery<{ items: { id: number; level: number }[] }>({
    queryKey: ["/api/org-structure/razryad-levels"],
    staleTime: 300_000,
  });
  const razryadLevel = node.razryadLevelId != null && Array.isArray(razryadData?.items)
    ? razryadData.items.find((r) => r.id === node.razryadLevelId)?.level
    : undefined;

  return (
    <div className="relative" style={{ width: CARD_W }}>
      <div
        className="rounded-xl text-white cursor-pointer hover:scale-[1.02] hover:shadow-2xl transition-all duration-150 select-none relative overflow-hidden"
        style={{
          width: CARD_W,
          minHeight: CARD_H,
          background: `linear-gradient(135deg, ${baseColor}f0, ${baseColor}bb)`,
          border: isDragTarget ? "2px solid #22c55e" : isVacant ? "2px dashed #ef4444" : `2px solid ${baseColor}44`,
          boxShadow: isDragTarget ? "0 0 0 4px #22c55e55" : `0 4px 16px ${baseColor}44`,
          opacity: isDragging ? 0.5 : 1,
          outline: isDragTarget ? "2px solid #22c55e" : undefined,
        }}
        onClick={() => onClick(node.id)}
        data-testid={`node-${node.id}`}
      >
        <div
          className="absolute -right-5 -top-5 rounded-full opacity-15"
          style={{ width: 80, height: 80, background: "white" }}
        />

        <button
          className="absolute top-1.5 right-1.5 z-20 rounded-full bg-white/20 hover:bg-white/40 transition-colors flex items-center justify-center"
          style={{ width: 20, height: 20 }}
          onClick={(e) => { e.stopPropagation(); onAdd(String(node.id)); }}
          title={t("pastkiBolimQoshish")}
          data-testid={`button-add-child-${node.id}`}
        >
          <Plus className="h-3 w-3 text-white" />
        </button>

        {isVacant && (
          <div className="absolute top-1.5 left-1.5">
            <Badge variant="destructive" className="text-[9px] px-1 py-0 flex items-center gap-0.5">
              <UserX className="h-2 w-2" />
              {t("vakant")}
            </Badge>
          </div>
        )}

        {node.isMachineOperator && !isVacant && (
          <div className="absolute top-1.5 left-1.5">
            <span title={t("dastgohOperatori")} className="text-[10px] bg-white/25 rounded px-1 py-0.5 flex items-center gap-0.5">
              <Settings2 className="h-2.5 w-2.5" />
            </span>
          </div>
        )}

        <div className="p-3 space-y-1.5 relative z-10">
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[9px] font-bold bg-white/25 rounded px-1.5 py-0.5 uppercase tracking-wide">
              {LEVEL_LABELS[level] || `D${level}`}
            </span>
            {razryadLevel != null && (
              <span className="text-[9px] font-bold bg-amber-300/40 rounded px-1.5 py-0.5" title="Razryad">
                {razryadLevel}-razr
              </span>
            )}
            <span className="text-[9px] text-white/50">#{node.id}</span>
          </div>

          <p className="font-bold text-sm leading-snug line-clamp-2">{node.name}</p>

          {tskpShort && (
            <p className="text-[9px] text-white/65 italic line-clamp-1">{tskpShort}</p>
          )}

          <div className="flex items-center justify-between pt-1 border-t border-white/15">
            <div className="flex items-center gap-1.5 min-w-0">
              {isVacant ? (
                <div
                  className="rounded-full flex items-center justify-center shrink-0"
                  style={{ width: 20, height: 20, background: "#ef444460", border: "1px solid rgba(255,255,255,0.35)" }}
                >
                  <UserX className="h-2.5 w-2.5" />
                </div>
              ) : node.headUserPhoto ? (
                <img
                  src={node.headUserPhoto}
                  alt={node.headUserName || ""}
                  style={{ width: 20, height: 20, borderRadius: "50%", objectFit: "cover", border: "1px solid rgba(255,255,255,0.5)", flexShrink: 0 }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <div
                  className="rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                  style={{ width: 20, height: 20, background: "rgba(255,255,255,0.25)", border: "1px solid rgba(255,255,255,0.35)" }}
                >
                  {getInitials(node.headUserName)}
                </div>
              )}
              <span className="text-[9px] text-white/80 truncate max-w-[90px]">
                {node.headUserName || "Rahbar tayinlanmagan"}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Users className="h-2.5 w-2.5 text-white/60" />
              <span className="text-[9px] text-white/70 mr-1">{empCount}</span>
              {!isVacant && (
                <button
                  onClick={(e) => { e.stopPropagation(); setHrcExpanded(v => !v); }}
                  title={t("hrCapitalPortret1")}
                  className="rounded flex items-center justify-center bg-white/15 hover:bg-white/35 transition-colors"
                  style={{ width: 16, height: 16 }}
                  data-testid={`button-hrc-toggle-${node.id}`}
                >
                  {hrcExpanded
                    ? <ChevronUp className="h-2.5 w-2.5 text-white" />
                    : <Brain className="h-2.5 w-2.5 text-white/80" />
                  }
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {hrcExpanded && !isVacant && (
        <div
          className="absolute left-0 right-0 z-50 rounded-b-xl shadow-lg border border-border bg-popover text-popover-foreground p-2.5 flex flex-col gap-2"
          style={{ top: CARD_H + 2 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-wider text-primary flex items-center gap-1">
              <Brain className="h-2.5 w-2.5" />{t("hrCapitalPortret")}
            </span>
            {node.portretFilled
              ? <span className="text-[9px] bg-green-500/20 text-green-400 px-1.5 rounded">{t("toldirilgan")}</span>
              : <span className="text-[9px] bg-yellow-500/20 text-yellow-400 px-1.5 rounded">{t("portretYoq")}</span>
            }
          </div>

          {hasHrc ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-1">
                {(Array.isArray(HRC_INDICATORS) ? HRC_INDICATORS : []).map(key => {
                  const score = node.hrcLatest?.[key] ?? 0;
                  const pct = Math.max(4, (score + 100) / 2);
                  const colorBar = score >= 30 ? "#22c55e" : score >= -30 ? "#f59e0b" : "#ef4444";
                  const label = score > 0 ? `+${score}` : String(score);
                  return (
                    <div key={key} className="flex flex-col items-center gap-0.5">
                      <span className="text-[8px] font-mono" style={{ color: colorBar }}>{label}</span>
                      <div className="w-full h-4 bg-white/10 rounded-sm overflow-hidden flex items-end">
                        <div className="w-full rounded-sm" style={{ height: `${pct}%`, backgroundColor: colorBar }} />
                      </div>
                      <span className="text-[7px] text-white/50 font-mono">{key}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[7px] text-white/30">
                <span>-100</span><span>0</span><span>+100</span>
              </div>
              {(node.iqLevel || node.leadershipScore != null || node.syndrome) && (
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5 border-t border-white/10">
                  {node.iqLevel && (
                    <span className="text-[8px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">
                      IQ: {node.iqLevel}
                    </span>
                  )}
                  {node.leadershipScore != null && (
                    <span className="text-[8px] bg-orange-500/20 text-orange-300 px-1.5 py-0.5 rounded">
                      Lider: {node.leadershipScore > 0 ? "+" : ""}{node.leadershipScore}
                    </span>
                  )}
                  {node.syndrome && (
                    <span className="text-[8px] bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded">
                      {node.syndrome}
                    </span>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="text-[9px] text-white/40 text-center py-1">{t("testNatijasiMavjudEmas")}</p>
          )}

          {node.headUserEmployeeId && (
            <a
              href={`/employees/${node.headUserEmployeeId}?tab=hr-capital`}
              className="text-[9px] text-primary/70 hover:text-primary underline text-center block"
              onClick={(e) => e.stopPropagation()}
            >
              {t("toliqPortretniKorish")}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
