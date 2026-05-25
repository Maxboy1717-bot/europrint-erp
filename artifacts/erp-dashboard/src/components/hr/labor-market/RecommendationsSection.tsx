/**
 * @module RecommendationsSection
 * @description React UI component.
 */

import { Lightbulb, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from '@/lib/i18n';

interface RecommendationsSectionProps {
  recommendations: string;
  setRecommendations: (val: string) => void;
  onGenerate: () => void;
}

export function RecommendationsSection({ recommendations, setRecommendations, onGenerate }: RecommendationsSectionProps) {
  const { t } = useTranslation("common");
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-yellow-400" />
          {t("tavsiyalar1")}
        </h3>
        <Button
          size="sm"
          variant="outline"
          type="button"
          className="h-7 text-xs gap-1 border-yellow-500/40 text-yellow-400 hover:bg-[var(--ep-yellow)]/90/10"
          onClick={onGenerate}
          data-testid="btn-generate-recommendations"
        >
          <AlertCircle className="w-3 h-3" />
          {t("tizimTavsiyaBersin")}
        </Button>
      </div>
      <Textarea
        className="text-xs min-h-[120px]"
        placeholder={t("tavsiyalarBuYerdaPaydoBoladi")}
        value={recommendations}
        onChange={e => setRecommendations(e.target.value)}
        data-testid="textarea-recommendations"
      />
    </section>
  );
}
