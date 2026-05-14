/**
 * HRCapitalTestsTabs — Four tab-content sub-components for HRCapitalTests:
 * SessionsTab, ToolTestAdminTab, ResultsTab, MethodologyTab.
 */
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, FlaskConical, Target, ClipboardList, Plus, Pencil, Trash2, Copy, CheckCircle2, BarChart3, ChevronRight, Lightbulb, Clock } from "lucide-react";
import {
  INDICATORS, SYNDROME_DESCRIPTIONS, IQ_LEVELS,
  type HrcSession, type HrcQuestion,
} from "./HRCapitalTestsTypes";
import { getTestTypeIcon, getTestTypeLabel, getStatusBadge } from "./HRCapitalTestsHelpers";

import { useTranslation } from '@/lib/i18n';
import { EPLoader } from "@/components/ep";
// ─── SessionsTab ──────────────────────────────────────────────────────────────

interface SessionsTabProps {
  filteredSessions: HrcSession[];
  sessionsLoading: boolean;
  filterType: string;
  setFilterType: (type: string) => void;
  copyLink: (token: string) => void;
  copiedLink: string | null;
  setSelectedSession: (s: HrcSession) => void;
  setShowCreateSessionDialog: (open: boolean) => void;
}

export function SessionsTab({filteredSessions, sessionsLoading, filterType, setFilterType,
  copyLink, copiedLink, setSelectedSession, setShowCreateSessionDialog,
}: SessionsTabProps) {
  const { t } = useTranslation('common');
  return (
    <div className="space-y-4">
      {/* Filter buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground">{t('filter1')}</span>
        {(["all", "tool_test", "iq", "leadership", "replication"] as const).map(type => (
          <Button
            key={type} variant={filterType === type ? "default" : "outline"} size="sm"
            onClick={() => setFilterType(type)} className="text-xs h-7"
          >
            {type === "all" ? "Barchasi" : getTestTypeLabel(type)}
          </Button>
        ))}
      </div>

      {sessionsLoading ? (
        <div className="flex justify-center py-12"><EPLoader size={24} /></div>
      ) : filteredSessions.length === 0 ? (
        <Card className="border-0 shadow-none bg-muted/40">
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Brain className="h-12 w-12 mb-3 opacity-30" />
            <p>{t("hozirchaTestSessiyalariYoq")}</p>
            <Button className="mt-4" size="sm" onClick={() => setShowCreateSessionDialog(true)}>
              <Plus className="w-4 h-4 mr-2" /> {t("yangiSessiyaYaratish")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filteredSessions.map(session => (
            <Card key={session.id} className="bg-muted/40 border-0 shadow-none hover:bg-muted/60 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      {getTestTypeIcon(session.test_type)}
                    </div>
                    <div>
                      <div className="font-medium text-sm">
                        {session.candidate_name || session.employee_name || "Noma'lum"}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="text-[10px] bg-primary/10 text-primary border-0">
                          {getTestTypeLabel(session.test_type)}
                        </Badge>
                        {getStatusBadge(session.status)}
                        {session.vacancy_title && (
                          <span className="text-xs text-muted-foreground">{session.vacancy_title}</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        {new Date(session.created_at).toLocaleDateString("uz-UZ")} ·{" "}
                        Muddati: {new Date(session.expires_at).toLocaleDateString("uz-UZ")}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {session.score !== null && session.score !== undefined && (
                      <div className={`text-lg font-bold ${session.test_type === "tool_test" && session.score < 0 ? "text-[var(--ep-red)]" : "text-primary"}`}>
                        {session.test_type === "tool_test"
                          ? `${session.score > 0 ? "+" : ""}${session.score}`
                          : `${session.score}%`}
                      </div>
                    )}
                    {session.status === "completed" ? (
                      <Button size="sm" variant="outline" onClick={() => setSelectedSession(session)} className="text-xs">
                        {t("natija")}
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => copyLink(session.session_token)} className="text-xs"
                        data-testid={`button-copy-link-${session.id}`}>
                        {copiedLink === session.session_token
                          ? <><CheckCircle2 className="w-3.5 h-3.5 mr-1 text-[var(--ep-green)]" /> {t("nusxalandi")}</>
                          : <><Copy className="w-3.5 h-3.5 mr-1" /> {t("link")}</>}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ToolTestAdminTab ─────────────────────────────────────────────────────────

interface ToolTestAdminTabProps {
  questions: HrcQuestion[];
  questionsLoading: boolean;
  indicatorGroups: Record<string, HrcQuestion[]>;
  onAddQuestion: () => void;
  onEditQuestion: (q: HrcQuestion) => void;
  onDeleteQuestion: (id: number) => void;
}

export function ToolTestAdminTab({
  questions, questionsLoading, indicatorGroups,
  onAddQuestion, onEditQuestion, onDeleteQuestion,
}: ToolTestAdminTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          10 ta ko'rsatkich (A-J) uchun savollar boshqaruvi. Har bir savol -100 dan +100 gacha shkala.
        </p>
        <Button size="sm" onClick={onAddQuestion} data-testid="button-add-question">
          <Plus className="w-4 h-4 mr-2" /> {t("savolQoshish")}
        </Button>
      </div>

      {questionsLoading ? (
        <div className="flex justify-center py-12"><EPLoader size={24} /></div>
      ) : (
        <div className="space-y-4">
          {INDICATORS.map(ind => (
            <Card key={ind.key} className="border-0 bg-muted/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: ind.color }}>
                    {ind.key}
                  </span>
                  {ind.label}
                  <span className="text-xs text-muted-foreground font-normal">— {ind.desc}</span>
                  <Badge className="ml-auto text-xs border-0" style={{ backgroundColor: `${ind.color}20`, color: ind.color }}>
                    {(indicatorGroups[ind.key] ?? []).length} savol
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(indicatorGroups[ind.key] ?? []).map(q => (
                  <div key={q.id} className="flex items-start gap-3 p-3 bg-muted/60 rounded-lg">
                    <div className="flex-1">
                      <div className="text-sm">{q.text_uz}</div>
                      {q.text_ru && <div className="text-xs text-muted-foreground mt-0.5">{q.text_ru}</div>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge className={`text-xs border-0 ${q.weight > 0 ? "bg-green-100 text-[var(--ep-green)]" : "bg-red-100 text-[var(--ep-red)]"}`}>
                        {q.weight > 0 ? "+" : ""}{q.weight}
                      </Badge>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEditQuestion(q)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => onDeleteQuestion(q.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
                {!(indicatorGroups[ind.key]?.length) && (
                  <div className="text-xs text-muted-foreground text-center py-2">
                    {t("buKorsatkichUchunSavollarYoq")}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ResultsTab ───────────────────────────────────────────────────────────────

interface ResultsTabProps {
  sessions: HrcSession[];
  setSelectedSession: (s: HrcSession) => void;
}

export function ResultsTab({ sessions, setSelectedSession }: ResultsTabProps) {
  const completed = sessions.filter(s => s.status === "completed");

  if (completed.length === 0) {
    return (
      <Card className="border-0 shadow-none bg-muted/40">
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <BarChart3 className="h-12 w-12 mb-3 opacity-30" />
          <p>{t("haliTugallanganTestlarYoq")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {completed.map(session => (
        <Card key={session.id}
          className="bg-muted/40 border-0 shadow-none cursor-pointer hover:bg-muted/60 transition-colors"
          onClick={() => setSelectedSession(session)}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">{getTestTypeIcon(session.test_type)}</div>
            <div className="flex-1">
              <div className="font-medium">{session.candidate_name || session.employee_name || "—"}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {getTestTypeLabel(session.test_type)} · {session.completed_at ? new Date(session.completed_at).toLocaleDateString("uz-UZ") : "—"}
              </div>
              {session.syndrome && (
                <Badge className={`mt-1 text-xs border ${SYNDROME_DESCRIPTIONS[session.syndrome]?.color ?? "bg-gray-100 text-gray-700"}`}>
                  {session.syndrome}
                </Badge>
              )}
              {session.iq_level && (
                <Badge className="mt-1 text-xs bg-blue-100 text-[var(--ep-blue)] border-0">{session.iq_level}</Badge>
              )}
            </div>
            {session.score != null && (
              <div className={`text-2xl font-bold ${session.test_type === "tool_test" && session.score < 0 ? "text-[var(--ep-red)]" : "text-primary"}`}>
                {session.test_type === "tool_test"
                  ? `${session.score > 0 ? "+" : ""}${session.score}`
                  : `${session.score}%`}
              </div>
            )}
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── MethodologyTab ───────────────────────────────────────────────────────────

export function MethodologyTab() {
  const { t } = useTranslation("common");
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card className="border-0 bg-muted/40">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="w-5 h-5 text-[var(--ep-purple)]" /> TOOL TEST
          </CardTitle>
          <CardDescription>10 ko'rsatkich (A-J), -100 dan +100 gacha</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {INDICATORS.map(ind => (
            <div key={ind.key} className="flex items-center gap-2 text-sm">
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                style={{ backgroundColor: ind.color }}>
                {ind.key}
              </span>
              <span className="font-medium">{ind.label}</span>
              <span className="text-muted-foreground text-xs">— {ind.desc}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-0 bg-muted/40">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-[var(--ep-yellow)]" /> Sindromlar (Material №29)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {Object.entries(SYNDROME_DESCRIPTIONS).map(([key, info]) => (
            <div key={key} className="flex items-start gap-2">
              <Badge className={`text-[10px] shrink-0 border ${info.color}`}>{info.label}</Badge>
              <span className="text-xs text-muted-foreground">{info.description}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-0 bg-muted/40">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-[var(--ep-blue)]" /> {t("iqTestDarajalari")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {IQ_LEVELS.map(l => (
            <div key={l.label} className="flex items-center gap-2 text-sm">
              <span className={`font-medium ${l.color}`}>{l.label}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-0 bg-muted/40">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-5 h-5 text-[var(--ep-primary)]" /> {t("testTurlariMaqsadi")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div><span className="font-medium">TOOL TEST</span> {t("shaxsiyatProfiliAJKorsatkichlari")}</div>
          <div><span className="font-medium">{t("iqTest")}</span> {t("intellektualDarajaMantiqiyFikrlashQobiliyati")}</div>
          <div><span className="font-medium">{t("liderlikTesti")}</span> {t("muammoKelibChiqishManbainiTopish")}</div>
          <div><span className="font-medium">{t("takrorlashTesti")}</span> — Ko'rsatmani aniq bajarish qobiliyati (90-100% maqsad)</div>
        </CardContent>
      </Card>
    </div>
  );
}
