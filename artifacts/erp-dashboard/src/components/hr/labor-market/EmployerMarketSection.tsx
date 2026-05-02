import { Trash2, Plus, Building2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MarketHeatBadge, HEAT_OPTIONS } from "./MarketHeatBadge";
import type { EmployerMarket } from "./HiringForecast";

interface Competitor {
  company: string;
  salary_min: number | "";
  salary_max: number | "";
  benefits: string;
  channels: string;
}

interface EmployerMarketSectionProps {
  employerMarket: EmployerMarket;
  setEmployerMarket: (update: (prev: EmployerMarket) => EmployerMarket) => void;
}

export function EmployerMarketSection({ employerMarket, setEmployerMarket }: EmployerMarketSectionProps) {
  function addCompetitor() {
    setEmployerMarket(prev => ({
      ...prev,
      competitors: [
        ...prev.competitors,
        { company: "", salary_min: "", salary_max: "", benefits: "", channels: "" },
      ],
    }));
  }

  function removeCompetitor(i: number) {
    setEmployerMarket(prev => ({
      ...prev,
      competitors: (prev.competitors ?? []).filter((_, idx) => idx !== i),
    }));
  }

  function updateCompetitor(i: number, field: keyof Competitor, value: string | number) {
    setEmployerMarket(prev => ({
      ...prev,
      competitors: (prev.competitors ?? []).map((c, idx) =>
        idx === i ? { ...c, [field]: value } : c
      ),
    }));
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Building2 className="w-4 h-4 text-indigo-400" />
          Ish beruvchilar bozori
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Bozor holati:</span>
          <div className="flex gap-1">
            {(Array.isArray(HEAT_OPTIONS) ? HEAT_OPTIONS : []).map(h => (
              <button
                key={h.value}
                type="button"
                onClick={() => setEmployerMarket(prev => ({ ...prev, market_heat: h.value }))}
                className={`text-[10px] rounded-full border px-2 py-0.5 transition-all ${
                  employerMarket.market_heat === h.value
                    ? h.color + " font-semibold"
                    : "border-border/40 text-muted-foreground hover:border-border"
                }`}
                data-testid={`btn-heat-${h.value}`}
              >
                {h.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <MarketHeatBadge heat={employerMarket.market_heat} />
        <span className="text-xs text-muted-foreground">
          {employerMarket.competitors.length} ta raqobatchi kiritilgan
        </span>
      </div>

      <div className="space-y-2">
        {(Array.isArray(employerMarket.competitors) ? employerMarket.competitors : []).map((comp, i) => (
          <div
            key={`k-${i}`}
            className="bg-surface-container rounded-lg p-3 space-y-2 border border-border/40"
            data-testid={`competitor-row-${i}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground">#{i + 1} raqobatchi</span>
              <button
                type="button"
                onClick={() => removeCompetitor(i)}
                className="text-muted-foreground hover:text-red-400 transition-colors"
                data-testid={`btn-remove-competitor-${i}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] mb-0.5 block">Kompaniya nomi</Label>
                <Input
                  className="h-7 text-xs"
                  placeholder="Kompaniya..."
                  value={comp.company}
                  onChange={e => updateCompetitor(i, "company", e.target.value)}
                  data-testid={`input-competitor-company-${i}`}
                />
              </div>
              <div>
                <Label className="text-[10px] mb-0.5 block">Kanallar</Label>
                <Input
                  className="h-7 text-xs"
                  placeholder="hh.uz, Telegram..."
                  value={comp.channels}
                  onChange={e => updateCompetitor(i, "channels", e.target.value)}
                />
              </div>
              <div>
                <Label className="text-[10px] mb-0.5 block">Maosh (min)</Label>
                <Input
                  className="h-7 text-xs"
                  type="number"
                  placeholder="0"
                  value={comp.salary_min}
                  onChange={e => updateCompetitor(i, "salary_min", e.target.value === "" ? "" : Number(e.target.value))}
                />
              </div>
              <div>
                <Label className="text-[10px] mb-0.5 block">Maosh (max)</Label>
                <Input
                  className="h-7 text-xs"
                  type="number"
                  placeholder="0"
                  value={comp.salary_max}
                  onChange={e => updateCompetitor(i, "salary_max", e.target.value === "" ? "" : Number(e.target.value))}
                />
              </div>
            </div>
            <div>
              <Label className="text-[10px] mb-0.5 block">Imtiyozlar</Label>
              <Input
                className="h-7 text-xs"
                placeholder="DMS, bonuslar, masofaviy ish..."
                value={comp.benefits}
                onChange={e => updateCompetitor(i, "benefits", e.target.value)}
              />
            </div>
          </div>
        ))}

        <Button
          size="sm"
          variant="outline"
          className="w-full h-8 text-xs gap-1 border-dashed"
          onClick={addCompetitor}
          data-testid="btn-add-competitor"
        >
          <Plus className="w-3.5 h-3.5" />
          Raqobatchi qo'shish
        </Button>
      </div>
    </section>
  );
}
