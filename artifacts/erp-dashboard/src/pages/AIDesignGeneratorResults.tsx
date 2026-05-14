/** @module AIDesignGeneratorResults @description Results tab content: renders the grid of generated design cards with preview, 3D mockup, AI check panel, and approve/reject actions. */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, CheckCircle2, XCircle, Box } from "lucide-react";
import { AiCheckPanel } from "./AIDesignGeneratorPanels";
import { useTranslation } from '@/lib/i18n';
import {
  GeneratedDesign, AiCheckResult,
  STATUS_COLORS, STATUS_LABELS,
} from "./AIDesignGeneratorTypes";

interface ResultsTabProps {
  generatedDesigns: GeneratedDesign[];
  checksMap: Record<string, AiCheckResult[]>;
  mockupMap: Record<string, string>;
  verifyingDesignId: string | null;
  onVerify: (designId: string) => void;
  onMockup: (design: GeneratedDesign) => void;
  onApprove: (designId: string, orderId: string) => void;
  onReject: (designId: string) => void;
}

export function ResultsTab({
  generatedDesigns,
  checksMap,
  mockupMap,
  verifyingDesignId,
  onVerify,
  onMockup,
  onApprove,
  onReject,
}: ResultsTabProps) {
  const { t } = useTranslation("common");
  if (generatedDesigns.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">
            {t("haliDizaynYaratilmaganGeneratsiyaTabiga")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {(Array.isArray(generatedDesigns) ? generatedDesigns : []).map((design) => (
        <Card key={design.id} data-testid={`card-design-${design.id}`}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <CardTitle className="text-base">{design.title}</CardTitle>
                {design.slogan && (
                  <p className="text-xs text-muted-foreground mt-0.5 italic">{design.slogan}</p>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs">v{design.version}</Badge>
                <Badge className={`text-xs ${STATUS_COLORS[design.status] || ""}`}>
                  {STATUS_LABELS[design.status] || design.status}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Dizayn rasmi */}
            <div className="aspect-square max-h-64 bg-muted rounded-md overflow-hidden flex items-center justify-center">
              {design.imageUrl ? (
                <img
                  src={design.imageUrl}
                  alt={design.title}
                  className="w-full h-full object-cover"
                  data-testid={`img-design-${design.id}`}
                />
              ) : (
                <Sparkles className="h-12 w-12 text-muted-foreground" />
              )}
            </div>

            {/* 3D Mockup */}
            {mockupMap[design.id] && (
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Box className="h-3 w-3" /> {t("k3dMockup")}
                </div>
                <div className="aspect-square max-h-48 bg-muted rounded-md overflow-hidden">
                  <img src={mockupMap[design.id]} alt={t("k3dMockup")} className="w-full h-full object-contain" />
                </div>
              </div>
            )}

            {/* AI Tekshiruv */}
            <AiCheckPanel
              designId={design.id}
              checks={checksMap[design.id] || []}
              isVerifying={verifyingDesignId === design.id}
              onVerify={onVerify}
            />

            {/* Amallar */}
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onMockup(design)}
                data-testid={`button-mockup-${design.id}`}
              >
                <Box className="h-3 w-3 mr-1" />
                {t("k3dMockup")}
              </Button>
              <Button
                size="sm"
                className="bg-[var(--ep-green)] hover:bg-[var(--ep-green)]/90 text-white"
                onClick={() => onApprove(design.id, design.orderId)}
                data-testid={`button-approve-${design.id}`}
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {t("verify")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-[var(--ep-red)] border-red-200 hover:bg-red-50"
                onClick={() => onReject(design.id)}
                data-testid={`button-reject-${design.id}`}
              >
                <XCircle className="h-3 w-3 mr-1" />
                {t("reject")}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
