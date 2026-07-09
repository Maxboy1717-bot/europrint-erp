/**
 * @module CouncilQuorum
 * @description Kengash kvorumi (Batch 5 Item 8). Kengash tanlanadi, 2/3 kvorum talabi ko'rsatiladi,
 *   qaror baholanadi (hozir bo'lganlar / rozi / qarshi → natija). Egasi qoidasi (decisions/04-coordination):
 *   2/3 kvorum; yetmasa "maslahat" (kuchsiz); yetsa oddiy ko'pchilik; teng bo'lsa Rais hal qiladi.
 *   BE: GET /api/coordination/councils, GET /api/councils/:id/quorum, POST /api/councils/:id/quorum/evaluate.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { Vote, Users, Gavel } from "lucide-react";

interface Council { id: number; name: string; }
interface QuorumInfo { councilId: number; votingMembers: number; quorumFraction: string; quorumRequired: number; }
interface DecisionResult extends QuorumInfo { presentCount: number; votesFor: number; votesAgainst: number; quorumMet: boolean; outcome: string; }

const OUTCOME: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  approved: { label: tLabel("common.qarorQabul", "Qabul qilindi"), variant: "default" },
  rejected: { label: tLabel("common.qarorRad", "Rad etildi"), variant: "destructive" },
  chair_tiebreak: { label: tLabel("common.qarorRais", "Teng — Rais hal qiladi"), variant: "outline" },
  advisory: { label: tLabel("common.qarorMaslahat", "Maslahat (kvorum yo'q)"), variant: "secondary" },
};

export default function CouncilQuorum() {
  const { toast } = useToast();
  const [councilId, setCouncilId] = useState<string>("");
  const [present, setPresent] = useState("0");
  const [votesFor, setVotesFor] = useState("0");
  const [votesAgainst, setVotesAgainst] = useState("0");
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

  const evaluateM = useMutation<DecisionResult>({
    mutationFn: async () => (await apiRequest("POST", `/api/councils/${councilId}/quorum/evaluate`, {
      presentCount: Number(present) || 0, votesFor: Number(votesFor) || 0, votesAgainst: Number(votesAgainst) || 0,
    })) as DecisionResult,
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
              <div className="grid grid-cols-3 gap-3">
                <div><Label>{tLabel("common.hozirBolgan", "Hozir bo'lgan")}</Label><Input data-testid="input-present" value={present} onChange={num(present, setPresent)} /></div>
                <div><Label>{tLabel("common.rozi", "Rozi")}</Label><Input data-testid="input-for" value={votesFor} onChange={num(votesFor, setVotesFor)} /></div>
                <div><Label>{tLabel("common.qarshi", "Qarshi")}</Label><Input data-testid="input-against" value={votesAgainst} onChange={num(votesAgainst, setVotesAgainst)} /></div>
              </div>
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
