/**
 * @module CandidateMarketSection
 * @description React UI component.
 */

import { Users } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { CandidateMarket } from "./HiringForecast";

interface CandidateMarketSectionProps {
  candidateMarket: CandidateMarket;
  setCandidateMarket: (update: (prev: CandidateMarket) => CandidateMarket) => void;
}

export function CandidateMarketSection({ candidateMarket, setCandidateMarket }: CandidateMarketSectionProps) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <Users className="w-4 h-4 text-cyan-400" />
        Ish izlovchilar bozori
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs mb-1 block">Mavjud kandidatlar soni (taxminiy)</Label>
          <Input
            type="number"
            min={0}
            placeholder="Masalan: 50"
            value={candidateMarket.candidate_count}
            onChange={e => setCandidateMarket(prev => ({
              ...prev,
              candidate_count: e.target.value === "" ? "" : Number(e.target.value),
            }))}
            data-testid="input-candidate-count"
          />
        </div>

        <div>
          <Label className="text-xs mb-1 block">Javob berish muddati (kun)</Label>
          <Input
            type="number"
            min={0}
            placeholder="Masalan: 3"
            value={candidateMarket.avg_response_days}
            onChange={e => setCandidateMarket(prev => ({
              ...prev,
              avg_response_days: e.target.value === "" ? "" : Number(e.target.value),
            }))}
            data-testid="input-response-days"
          />
        </div>

        <div>
          <Label className="text-xs mb-1 block">Maosh kutilmasi (min, so'm)</Label>
          <Input
            type="number"
            min={0}
            placeholder="0"
            value={candidateMarket.salary_expectation_min}
            onChange={e => setCandidateMarket(prev => ({
              ...prev,
              salary_expectation_min: e.target.value === "" ? "" : Number(e.target.value),
            }))}
            data-testid="input-salary-exp-min"
          />
        </div>

        <div>
          <Label className="text-xs mb-1 block">Maosh kutilmasi (max, so'm)</Label>
          <Input
            type="number"
            min={0}
            placeholder="0"
            value={candidateMarket.salary_expectation_max}
            onChange={e => setCandidateMarket(prev => ({
              ...prev,
              salary_expectation_max: e.target.value === "" ? "" : Number(e.target.value),
            }))}
            data-testid="input-salary-exp-max"
          />
        </div>

        <div className="col-span-2">
          <Label className="text-xs mb-1 block">Ko'nikmalar darajasi (o'rtacha)</Label>
          <div className="flex gap-2">
            {(["junior", "middle", "senior"] as const).map(level => (
              <button
                key={level}
                type="button"
                onClick={() => setCandidateMarket(prev => ({ ...prev, avg_skill_level: level }))}
                className={`flex-1 text-xs rounded-lg border px-2 py-1.5 transition-all capitalize ${
                  candidateMarket.avg_skill_level === level
                    ? "bg-primary/10 border-primary/50 text-primary font-semibold"
                    : "border-border/40 text-muted-foreground hover:border-border"
                }`}
                data-testid={`btn-skill-level-${level}`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
