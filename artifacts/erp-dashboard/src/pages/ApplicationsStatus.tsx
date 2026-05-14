/** @module ApplicationsStatus @description Lightweight status/feedback screen components for the Applications page (auth error, loading, data error). */

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { EPLoader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
export function AuthErrorScreen() {
  const { t } = useTranslation("common");
  return (
    <div className="h-screen flex items-center justify-center">
      <Card className="w-96">
        <CardHeader>
          <CardTitle>{t("autentifikatsiyaXatosi")}</CardTitle>
          <CardDescription>{t("tizimgaKirishdaMuammoYuzBerdi")}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {t("sessiyaYaroqsizYokiMuddatiTugagan")}
          </p>
          <Button
            onClick={() => (window.location.href = "/")}
            className="w-full"
            data-testid="button-reload"
          >
            {t("sahifaniYangilash")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-64" data-testid="loading-spinner">
      <EPLoader size={32} tone="muted" />
    </div>
  );
}

export function ErrorScreen() {
  const { t } = useTranslation("common");
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-2" data-testid="error-state">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-muted-foreground">{t("malumotlarniYuklashdaXatolikYuzBerdi")}</p>
    </div>
  );
}
