import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { CheckCircle2, XCircle, Hash, CreditCard } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ValidationResult {
  valid: boolean;
  reason?: string;
  details?: Record<string, unknown>;
}

export default function ValidatePage() {
  const { t } = useTranslation('admin');
  const [stir, setStir] = useState("");
  const [card, setCard] = useState("");
  const [stirResult, setStirResult] = useState<ValidationResult | null>(null);
  const [cardResult, setCardResult] = useState<ValidationResult | null>(null);

  const stirMutation = useMutation({
    mutationFn: (value: string) =>
      apiRequest<ValidationResult>("POST", "/api/validate/stir", { stir: value }),
    onSuccess: (r) => setStirResult(r),
    onError: (err: Error) => {
      setStirResult({ valid: false, reason: err.message });
      toast({ title: t('validate.stirFailed', 'STIR tekshiruv xato'), description: err.message, variant: "destructive" });
    },
  });

  const luhnMutation = useMutation({
    mutationFn: (value: string) =>
      apiRequest<ValidationResult>("POST", "/api/validate/luhn", { card: value }),
    onSuccess: (r) => setCardResult(r),
    onError: (err: Error) => {
      setCardResult({ valid: false, reason: err.message });
      toast({ title: t('validate.cardFailed', 'Karta tekshiruv xato'), description: err.message, variant: "destructive" });
    },
  });

  const renderResult = (result: ValidationResult | null) => {
    if (!result) return null;
    const Icon = result.valid ? CheckCircle2 : XCircle;
    const bg = result.valid ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700";
    return (
      <div className={`mt-3 p-3 rounded-md flex items-start gap-2 ${bg}`}>
        <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <Badge variant={result.valid ? "default" : "destructive"}>
            {result.valid ? t('validate.valid', "To'g'ri") : t('validate.invalid', "Noto'g'ri")}
          </Badge>
          {result.reason ? <p className="text-xs mt-1">{result.reason}</p> : null}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title={t('validate.title', "Hujjat Validatsiyasi")}
        description={t('validate.description', 'STIR (INN) va karta raqami (Luhn algoritmi) tekshiruvi')}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5 text-blue-600" />
              {t('validate.stir', 'STIR (INN) tekshiruvi')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="stir">{t('validate.stirLabel', 'STIR raqami')}</Label>
              <Input
                id="stir"
                placeholder="123456789"
                value={stir}
                onChange={(e) => setStir(e.target.value)}
                maxLength={9}
              />
            </div>
            <Button
              className="w-full"
              disabled={!stir || stirMutation.isPending}
              onClick={() => stirMutation.mutate(stir)}
            >
              {t('validate.check', 'Tekshirish')}
            </Button>
            {renderResult(stirResult)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-purple-600" />
              {t('validate.card', 'Karta raqami (Luhn)')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="card">{t('validate.cardLabel', 'Karta raqami')}</Label>
              <Input
                id="card"
                placeholder="8600 0000 0000 0000"
                value={card}
                onChange={(e) => setCard(e.target.value)}
                maxLength={19}
              />
            </div>
            <Button
              className="w-full"
              disabled={!card || luhnMutation.isPending}
              onClick={() => luhnMutation.mutate(card.replace(/\s/g, ""))}
            >
              {t('validate.check', 'Tekshirish')}
            </Button>
            {renderResult(cardResult)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
