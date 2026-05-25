/**
 * @module RemainingTabsLearningExtras
 * @description Skill-gap analysis card and mentor/mentee relationship card for
 * the LearningTab.  Extracted to keep RemainingTabsLearning.tsx under 300 lines.
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, Users, CheckCircle2, XCircle, MinusCircle } from "lucide-react";
import type { SkillGap, MentorshipRecord, SkillGapData, MentorshipData } from "./profile-types";
import { EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

// ---------------------------------------------------------------------------
// SkillGapCard
// ---------------------------------------------------------------------------

interface SkillGapCardProps {
  skillGapData?: SkillGapData | null;
  loadingSkillGap?: boolean;
}

export function SkillGapCard({ skillGapData, loadingSkillGap }: SkillGapCardProps) {
  const { t } = useTranslation("common");
  if (!loadingSkillGap && !(skillGapData && Array.isArray(skillGapData.gaps) && skillGapData.gaps.length > 0)) {
    return null;
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-[var(--ep-primary)]" />
          Ko'nikma tahlili (Skill Gap)
        </CardTitle>
        <CardDescription>{t("lavozimTalablariVaXodimKonikmalarini")}</CardDescription>
      </CardHeader>
      <CardContent>
        {loadingSkillGap ? (
          <Skeleton className="h-32 rounded-lg" />
        ) : skillGapData ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{skillGapData.summary.totalRequired}</p>
                <p className="text-xs text-muted-foreground">{t("jamiTalab")}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-[var(--ep-green)]">{skillGapData.summary.met}</p>
                <p className="text-xs text-muted-foreground">{t("bajarilgan")}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-[var(--ep-yellow)]">{skillGapData.summary.gaps}</p>
                <p className="text-xs text-muted-foreground">{t("etishmovchi")}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-[var(--ep-red)]">{skillGapData.summary.missing}</p>
                <p className="text-xs text-muted-foreground">{t("mavjudEmas")}</p>
              </div>
            </div>

            {skillGapData.summary.gapPercent > 0 && (
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>{t("konikmaBoshligi")}</span>
                  <span className="font-medium text-[var(--ep-primary)]">{skillGapData.summary.gapPercent}%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-orange-500"
                    style={{ width: `${skillGapData.summary.gapPercent}%` }}
                  />
                </div>
              </div>
            )}

            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("konikma")}</TableHead>
                  <TableHead>{t("category")}</TableHead>
                  <TableHead>{t("talab1")}</TableHead>
                  <TableHead>{t("hozirgi")}</TableHead>
                  <TableHead>{t("status28")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(skillGapData.gaps) ? skillGapData.gaps : []).map((gap: SkillGap) => (
                  <TableRow key={gap.skillName} data-testid={`row-skillgap-${gap.skillName}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell>
                      <div className="font-medium">{gap.skillName}</div>
                      {gap.isMandatory && (
                        <EPStatusPill tone="danger" className="text-xs mt-1">{t("majburiy")}</EPStatusPill>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{gap.skillCategory}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={`req-${i}`} className={`w-3 h-3 rounded-full ${i < gap.requiredLevel ? 'bg-primary' : 'bg-secondary'}`} />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={`cur-${i}`} className={`w-3 h-3 rounded-full ${i < gap.currentLevel ? 'bg-green-500' : 'bg-secondary'}`} />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {gap.status === "met" && (
                        <div className="flex items-center gap-1 text-[var(--ep-green)]">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="text-sm">{t("bajarilgan")}</span>
                        </div>
                      )}
                      {gap.status === "gap" && (
                        <div className="flex items-center gap-1 text-[var(--ep-yellow)]">
                          <MinusCircle className="h-4 w-4" />
                          <span className="text-sm">Etishmovchi ({gap.gap} ball)</span>
                        </div>
                      )}
                      {gap.status === "missing" && (
                        <div className="flex items-center gap-1 text-[var(--ep-red)]">
                          <XCircle className="h-4 w-4" />
                          <span className="text-sm">{t("mavjudEmas")}</span>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// MentorshipCard
// ---------------------------------------------------------------------------

interface MentorshipCardProps {
  mentorshipData?: MentorshipData | null;
  loadingMentorship?: boolean;
}

export function MentorshipCard({ mentorshipData, loadingMentorship }: MentorshipCardProps) {
  const { t } = useTranslation("common");
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-[var(--ep-blue)]" />
          Mentor / Mentee bog'liqligi
        </CardTitle>
        <CardDescription>{t("mentorlikMunosabatlari")}</CardDescription>
      </CardHeader>
      <CardContent>
        {loadingMentorship ? (
          <Skeleton className="h-24 rounded-lg" />
        ) : mentorshipData && (mentorshipData.asMentor.length > 0 || mentorshipData.asMentee.length > 0) ? (
          <div className="space-y-4">
            {mentorshipData.asMentor.length > 0 && (
              <div>
                <p className="text-sm font-medium text-[var(--ep-blue)] mb-2">{t("mentorSifatida")}</p>
                <div className="space-y-2">
                  {(Array.isArray(mentorshipData.asMentor) ? mentorshipData.asMentor : []).map((m: MentorshipRecord) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-3 rounded-md bg-indigo-50/50 dark:bg-indigo-950/20"
                      data-testid={`row-mentor-${m.id}`}
                    >
                      <div>
                        <p className="font-medium text-sm">{m.partnerName || "Noma'lum"}</p>
                        {m.goals && <p className="text-xs text-muted-foreground mt-1">{m.goals}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{m.startDate}</Badge>
                        <Badge className={m.status === "active" ? "bg-green-500" : "bg-muted-foreground"}>
                          {m.status === "active" ? "Faol" : m.status === "completed" ? "Tugagan" : "Bekor"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {mentorshipData.asMentee.length > 0 && (
              <div>
                <p className="text-sm font-medium text-[var(--ep-purple)] mb-2">{t("menteeSifatida")}</p>
                <div className="space-y-2">
                  {(Array.isArray(mentorshipData.asMentee) ? mentorshipData.asMentee : []).map((m: MentorshipRecord) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-3 rounded-md bg-purple-50/50 dark:bg-purple-950/20"
                      data-testid={`row-mentee-${m.id}`}
                    >
                      <div>
                        <p className="font-medium text-sm">Mentor: {m.partnerName || "Noma'lum"}</p>
                        {m.goals && <p className="text-xs text-muted-foreground mt-1">{m.goals}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{m.startDate}</Badge>
                        <Badge className={m.status === "active" ? "bg-green-500" : "bg-muted-foreground"}>
                          {m.status === "active" ? "Faol" : m.status === "completed" ? "Tugagan" : "Bekor"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            {t("mentorlikMunosabatlariTopilmadi")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
