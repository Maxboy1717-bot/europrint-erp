/**
 * @module error-state
 * @description React UI component.
 */

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from '@/lib/i18n';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title,
  message,
  onRetry
}: ErrorStateProps) {
  const { t } = useTranslation("common");
  const resolvedTitle = title ?? t("errorOccurred");
  const resolvedMessage = message ?? t("malumotlarniYuklashdaXatolikQaytaUriningKoring");
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
        <p className="text-lg font-medium mb-2">{resolvedTitle}</p>
        <p className="text-muted-foreground mb-4">{resolvedMessage}</p>
        {onRetry && (
          <Button variant="outline" onClick={onRetry} data-testid="btn-retry">
            <RefreshCw className="h-4 w-4 mr-2" />
            {t("qaytaYuklash")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
