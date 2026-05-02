import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChevronRight, Zap, Play, Star, Wrench, Building2 } from "lucide-react";
import { SectionTitle } from "@/components/director/helpers";

interface QuickActionsCardProps {
  onAction: (label: string) => void;
}

export function QuickActionsCard({ onAction }: QuickActionsCardProps) {
  const actions = [
    { label: "Buyurtmaga istisno", sub: "Avans kutmasdan ishlab chiqarishga", icon: Play, testId: "btn-action-exception" },
    { label: "Kechikkan buyurtmani VIP", sub: "Yuqori ustuvorlik berish", icon: Star, testId: "btn-action-vip" },
    { label: "MROga signal", sub: "Mashina ta'miriga chaqiriq", icon: Wrench, testId: "btn-action-mro" },
    { label: "Eslatma yozish", sub: "Menejer yoki bo'lim boshlig'iga", icon: Building2, testId: "btn-action-note" },
  ];

  return (
    <Card data-testid="card-quick-actions">
      <CardHeader className="pb-3">
        <SectionTitle icon={Zap} title="Tezkor Harakatlar" sub="Direktor buyruqlari" accent="text-primary" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {(Array.isArray(actions) ? actions : []).map((action, i) => (
            <button key={`k-${i}`} data-testid={action.testId} className="w-full flex items-center gap-3 p-3 rounded-lg border bg-background hover-elevate active-elevate-2 text-left transition-colors" onClick={() => onAction(action.label)}>
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <action.icon className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{action.label}</p>
                <p className="text-xs text-muted-foreground">{action.sub}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
