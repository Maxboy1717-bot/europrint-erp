/**
 * @module ExtraTabs
 * @description React UI component.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, UserX, Layers, TrendingUp, CheckCircle, BarChart2 } from "lucide-react";
import { StatCard } from "./StatCard";
import { NodeDetail, NODE_TYPE_LABELS } from "./types";
import { useTranslation } from '@/lib/i18n';

import { tLabel } from '@/lib/i18n/tLabel';
interface StatsTabProps {
  node: NodeDetail;
}

export function StatsTab({ node }: StatsTabProps) {
  const { t } = useTranslation("common");
  const isVacant = !node.headUserName;
  
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard
          icon={<Users className="h-4 w-4" />}
          label={t("togridanXodimlar")}
          value={node.employeeCount}
          color="var(--ep-org-l5)"
        />
        <StatCard
          icon={<Building2 className="h-4 w-4" />}
          label={tLabel('common.ExtraTabs.jamiBolimlarFarzand', "Jami bo'limlar (farzand)")}
          value={node.childCount}
          color="var(--ep-org-l1)"
        />
        <StatCard
          icon={<UserX className="h-4 w-4" />}
          label={t("vakantFarzandlar")}
          value={node.vacantChildCount ?? 0}
          color={(node.vacantChildCount ?? 0) > 0 ? "var(--ep-red)" : "hsl(var(--muted-foreground))"}
        />
        <StatCard
          icon={<Layers className="h-4 w-4" />}
          label={t("ierarxiyaDarajasi")}
          value={`${node.hierarchyLevel} — ${NODE_TYPE_LABELS[node.nodeType] || node.nodeType}`}
          color="var(--ep-org-l0)"
        />
        <StatCard
          icon={isVacant ? <UserX className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
          label={t("rahbarHolati")}
          value={isVacant ? "Vakant" : "Tayinlangan"}
          color={isVacant ? "var(--ep-red)" : "var(--ep-green)"}
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label={t("faollik")}
          value={node.isActive ? "Faol ✓" : "Nofaol ✗"}
          color={node.isActive ? "var(--ep-green)" : "hsl(var(--muted-foreground))"}
        />
      </div>
      <div className="mt-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart2 className="h-4 w-4" />
              {t("qoshimchaMalumot1")}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {([
              { label: "Bo'lim turi", value: NODE_TYPE_LABELS[node.nodeType] || node.nodeType },
              { label: "Ota bo'lim", value: node.parentName || (node.parentId ? `#${node.parentId}` : "Ildiz (asosiy)") },
              { label: "QYaM uzunligi", value: node.tskp ? `${node.tskp.length} belgi` : "Kiritilmagan" },
              { label: "Rang kodi", value: node.color },
            ]).map((row) => (
              <div key={row.label} className="flex flex-col gap-0.5">
                <span className="text-muted-foreground text-xs">{row.label}</span>
                <span className="font-medium text-sm">{row.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export function VacantTab({ node }: StatsTabProps) {
  const { t } = useTranslation("common");
  const isVacant = !node.headUserName;
  return (
    <Card>
      <CardContent className="py-6">
        <div className="flex items-center gap-3">
          {!isVacant ? (
            <>
              <CheckCircle className="h-6 w-6 text-[var(--ep-green)]" />
              <div>
                <p className="font-medium">{t("rahbarTayinlangan")}</p>
                <p className="text-sm text-muted-foreground">{node.headUserName}</p>
              </div>
            </>
          ) : (
            <>
              <UserX className="h-6 w-6 text-[var(--ep-red)]" />
              <div>
                <p className="font-medium text-[var(--ep-red)]">{t("rahbarVakant")}</p>
                <p className="text-sm text-muted-foreground">{t("buBolimgaRahbarTayinlanmagan")}</p>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
