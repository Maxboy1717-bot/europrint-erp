/**
 * @module CouncilQuorum
 * @description Kengash kvorumi (Batch 5 Item 8). Kengash tanlanadi, 2/3 kvorum talabi ko'rsatiladi,
 *   qaror baholanadi (hozir bo'lganlar / rozi / qarshi → natija). Egasi qoidasi (decisions/04-coordination):
 *   2/3 kvorum; yetmasa "maslahat" (kuchsiz); yetsa oddiy ko'pchilik; teng bo'lsa Rais hal qiladi.
 *   BE: GET /api/coordination/councils, GET /api/councils/:id/quorum, POST /api/councils/:id/quorum/evaluate.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ModulePage } from "@/components/ui/module-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { EPErrorState } from "@/components/ep";
import { tLabel } from "@/lib/i18n/tLabel";
import { Vote, Users, Gavel, CheckCircle2, XCircle, MinusCircle } from "lucide-react";

interface Council { id: number; name: string; }
interface QuorumInfo { councilId: number; votingMembers: number; quorumFraction: string; quorumRequired: number; }
interface DecisionResult extends QuorumInfo { presentCount: number; votesFor: number; votesAgainst: number; quorumMet: boolean; outcome: string; }
interface CouncilMember { id: number; council_id: number; user_id: number; username: string | null; role: string; is_permanent: boolean; }
type CouncilVoteChoice = "for" | "against" | "abstain";
interface CouncilVote { id: number; council_id: number; decision_ref: string; voter_user_id: number; vote: CouncilVoteChoice; voted_at: string; }

const OUTCOME: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  approved: { label: tLabel("common.qarorQabul", "Qabul qilindi"), variant: "default" },
  rejected: { label: tLabel("common.qarorRad", "Rad etildi"), variant: "destructive" },
  chair_tiebreak: { label: tLabel("common.qarorRais", "Teng — Rais hal qiladi"), variant: "outline" },
  advisory: { label: tLabel("common.qarorMaslahat", "Maslahat (kvorum yo'q)"), variant: "secondary" },
};

const VOTE_CHOICE: Record<CouncilVoteChoice, { label: string; icon: typeof CheckCircle2 }> = {
  for:      { label: tLabel("common.rozi", "Rozi"), icon: CheckCircle2 },
  against:  { label: tLabel("common.qarshi", "Qarshi"), icon: XCircle },
  abstain:  { label: tLabel("common.betaraf", "Betaraf"), icon: MinusCircle },
};

export default function CouncilQuorum() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [councilId, setCouncilId] = useState<string>("");
  const [present, setPresent] = useState("0");
  const [votesFor, setVotesFor] = useState("0");
  const [votesAgainst, setVotesAgainst] = useState("0");
  const [decisionRef, setDecisionRef] = useState("");
  const [result, setResult] = useState<DecisionResult | null>(null);

  const councilsQ = useQuery<Council[] | { data?: Council[] }>({
    queryKey: ["/api/coordination/councils"],
    queryFn: async () => apiRequest("GET", "/api/coordination/councils"),
  });
  const councils: Council[] = Array.isArray(councilsQ.data) ? councilsQ.data : (councilsQ.data?.data ?? []);

  const quorumQ = useQuery<QuorumInfo>({
    queryKey: ["/api/councils/quorum", councilId],
    queryFn: async () => apiRequest("GET", `/api/councils/${councilId}/quorum`),
    enabled: !!councilId,
  });

  const membersQ = useQuery<CouncilMember[] | { data?: CouncilMember[] }>({
    queryKey: ["/api/councils/members", councilId],
    queryFn: async () => apiRequest("GET", `/api/councils/${councilId}/members`),
    enabled: !!councilId,
  });
  const members: CouncilMember[] = Array.isArray(membersQ.data) ? membersQ.data : (membersQ.data?.data ?? []);

  const votesQ = useQuery<CouncilVote[] | { data?: CouncilVote[] }>({
    queryKey: ["/api/councils/votes", councilId, decisionRef],
    queryFn: async () => apiRequest("GET", `/api/councils/${councilId}/votes/${encodeURIComponent(decisionRef)}`),
    enabled: !!councilId && !!decisionRef,
  });
  const votes: CouncilVote[] = Array.isArray(votesQ.data) ? votesQ.data : (votesQ.data?.data ?? []);
  const voteByUser = new Map(votes.map(v => [v.voter_user_id, v.vote]));

  const castVoteM = useMutation<CouncilVote, Error, { voterUserId: number; vote: CouncilVoteChoice }>({
    mutationFn: async ({ voterUserId, vote }) => (await apiRequest("POST", `/api/councils/${councilId}/votes`, {
      decisionRef, voterUserId, vote,
    })) as CouncilVote,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/councils/votes", councilId, decisionRef] }),
    onError: () => toast({ title: "Xatolik", description: tLabel("common.ovozSaqlanmadi", "Ovoz saqlanmadi"), variant: "destructive" }),
  });

  const evaluateM = useMutation<DecisionResult>({
    mutationFn: async () => (await apiRequest("POST", `/api/councils/${councilId}/quorum/evaluate`,
      decisionRef
        ? { decisionRef }
        : { presentCount: Number(present) || 0, votesFor: Number(votesFor) || 0, votesAgainst: Number(votesAgainst) || 0 },
    )) as DecisionResult,
    onSuccess: (d: DecisionResult) => setResult(d),
    onError: () => toast({ title: "Xatolik", description: tLabel("common.baholabBolmadi", "Baholab bo'lmadi"), variant: "destructive" }),
  });

  const num = (v: string, set: (s: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => set(e.target.value.replace(/\D/g, "").slice(0, 4));

  if (councilsQ.isError) return <EPErrorState onRetry={councilsQ.refetch} error={councilsQ.error} />;
  const q = quorumQ.data;

  return (
    <ModulePage module="admin" title="Kengash Kvorumi" subtitle="2/3 kvorum + oddiy ko'pchilik qoidasi" icon={<Vote className="h-5 w-5" />}>
      <div className="space-y-4 max-w-2xl">
        <div>
          <Label>{tLabel("common.kengash", "Kengash")}</Label>
          <Select value={councilId} onValueChange={(v) => { setCouncilId(v); setResult(null); }}>
            <SelectTrigger data-testid="select-council"><SelectValue placeholder={tLabel("common.kengashniTanlang", "Kengashni tanlang")} /></SelectTrigger>
            <SelectContent>{councils.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        {councilId && q && (
          <Card>
            <CardContent className="p-4 flex flex-wrap gap-6 items-center">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{tLabel("common.ovozBeruvchiAzolar", "Ovoz beruvchi a'zolar")}</p>
                  <p className="text-lg font-semibold" data-testid="voting-members">{q.votingMembers}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{tLabel("common.kvorumTalabi", "Kvorum talabi")} ({q.quorumFraction})</p>
                <p className="text-lg font-semibold" data-testid="quorum-required">{q.quorumRequired}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {councilId && (
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium"><Gavel className="h-4 w-4" /> {tLabel("common.qarorniBaholash", "Qarorni baholash")}</div>

              <div>
                <Label>{tLabel("common.qarorHavolasi", "Qaror havolasi (ixtiyoriy — a'zolar bo'yicha real ovoz uchun)")}</Label>
                <Input
                  data-testid="input-decision-ref"
                  placeholder={tLabel("common.masalanRasporyazhenieId", "masalan: rasporyazhenie-2026-07-13-4")}
                  value={decisionRef}
                  onChange={(e) => setDecisionRef(e.target.value)}
                />
              </div>

              {decisionRef ? (
                <div className="space-y-2" data-testid="member-vote-list">
                  <p className="text-xs text-muted-foreground">{tLabel("common.azolarOvozi", "A'zolar ovozi")}</p>
                  {members.length === 0 && (
                    <p className="text-sm text-muted-foreground">{tLabel("common.azoTopilmadi", "Kengashda a'zo topilmadi")}</p>
                  )}
                  {members.map((m) => {
                    const current = voteByUser.get(m.user_id);
                    return (
                      <div key={m.id} className="flex items-center justify-between gap-3 rounded-md border p-2" data-testid={`member-row-${m.user_id}`}>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm font-medium truncate">{m.username ?? `#${m.user_id}`}</span>
                          <Badge variant="outline" className="shrink-0">{m.role}</Badge>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {(Object.keys(VOTE_CHOICE) as CouncilVoteChoice[]).map((choice) => {
                            const Icon = VOTE_CHOICE[choice].icon;
                            const selected = current === choice;
                            return (
                              <Button
                                key={choice}
                                type="button"
                                size="sm"
                                variant={selected ? "default" : "outline"}
                                disabled={castVoteM.isPending}
                                data-testid={`vote-${choice}-${m.user_id}`}
                                onClick={() => castVoteM.mutate({ voterUserId: m.user_id, vote: choice })}
                              >
                                <Icon className="h-3.5 w-3.5 mr-1" /> {VOTE_CHOICE[choice].label}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>{tLabel("common.hozirBolgan", "Hozir bo'lgan")}</Label><Input data-testid="input-present" value={present} onChange={num(present, setPresent)} /></div>
                  <div><Label>{tLabel("common.rozi", "Rozi")}</Label><Input data-testid="input-for" value={votesFor} onChange={num(votesFor, setVotesFor)} /></div>
                  <div><Label>{tLabel("common.qarshi", "Qarshi")}</Label><Input data-testid="input-against" value={votesAgainst} onChange={num(votesAgainst, setVotesAgainst)} /></div>
                </div>
              )}

              <Button data-testid="button-evaluate" disabled={evaluateM.isPending} onClick={() => evaluateM.mutate()}>{tLabel("common.baholash", "Baholash")}</Button>

              {result && (
                <div className="rounded-lg border p-4 space-y-2" data-testid="result-panel">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">{tLabel("common.natija", "Natija")}:</span>
                    <Badge variant={OUTCOME[result.outcome]?.variant ?? "outline"} data-testid="result-outcome">{OUTCOME[result.outcome]?.label ?? result.outcome}</Badge>
                    <Badge variant={result.quorumMet ? "default" : "secondary"}>
                      {result.quorumMet ? tLabel("common.kvorumBor", "Kvorum bor") : tLabel("common.kvorumYoq", "Kvorum yo'q")}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {tLabel("common.hozir", "Hozir")}: {result.presentCount}/{result.votingMembers} · {tLabel("common.rozi", "Rozi")}: {result.votesFor} · {tLabel("common.qarshi", "Qarshi")}: {result.votesAgainst} · {tLabel("common.talab", "Talab")}: {result.quorumRequired}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </ModulePage>
  );
}
