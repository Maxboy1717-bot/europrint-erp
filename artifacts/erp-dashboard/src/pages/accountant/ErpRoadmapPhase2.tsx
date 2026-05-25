/**
 * @module ErpRoadmapPhase2
 * @description Phase 2 tab content for ErpRoadmapCard.
 */

import { Badge } from "@/components/ui/badge";
import { EPStatusPill } from "@/components/ep";

interface Props {
  t: (key: string) => string;
}

export function ErpRoadmapPhase2({ t }: Props) {
  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <Badge className="bg-orange-500">{t("phase2")}</Badge>
        <h3 className="text-lg font-bold">{t("muammolarRoyxatiVaFixPlan")}</h3>
      </div>

      <div className="p-4 bg-muted rounded-lg">
        <p className="font-medium mb-3">{t("faqatConfirmedIssueUchunHar")}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="p-3 border rounded-lg bg-background">
              <p className="font-bold text-primary mb-2">{t("issueId")}</p>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>{t("biznesJarayon")}</p>
                <p>{t("muammoTavsifi")}</p>
                <p>{t("tasiri")}</p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="p-3 border rounded-lg bg-background">
              <p className="font-bold text-primary mb-2">{t("taskAndSolution")}</p>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>{t("whatToDoExact")}</p>
                <p>{t("whichLayer")}</p>
                <p>{t("qandayYondashuvBilan")}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <p className="font-medium mb-2">{t("priorityLabel")}</p>
          <div className="flex flex-wrap gap-2">
            <EPStatusPill tone="danger">{t("kritik")}</EPStatusPill>
            <Badge className="bg-orange-500">{t("high")}</Badge>
            <EPStatusPill tone="warning">{t("medium")}</EPStatusPill>
            <EPStatusPill tone="neutral">{t("low")}</EPStatusPill>
          </div>
        </div>
      </div>
    </>
  );
}
