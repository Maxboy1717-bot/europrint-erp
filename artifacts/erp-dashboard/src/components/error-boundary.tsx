/**
 * @module error-boundary
 * @description React UI component.
 */

import React, { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { logClientError } from '@/lib/errorLogger';
import { useTranslation } from '@/lib/i18n';

interface ErrorFallbackProps {
  error: Error;
  onReset: () => void;
}

export function ErrorFallback({ error, onReset }: ErrorFallbackProps) {
  const { t } = useTranslation("common");
  return (
    <div className="flex items-center justify-center min-h-screen bg-background" data-testid="error-boundary">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center py-12 px-6">
          <AlertTriangle className="w-16 h-16 text-destructive mb-4" data-testid="icon-error" />
          <h2 className="text-2xl font-semibold mb-2" data-testid="text-error-title">
            {t("errorOccurred")}
          </h2>
          <p className="text-center text-muted-foreground mb-6" data-testid="text-error-description">
            {t("sahifaniYangilashgaHarakatQiling")}
          </p>
          <Button onClick={onReset} className="w-full" data-testid="button-refresh">
            {t("refresh")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, onReset: () => void) => ReactNode);
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logClientError(error, `ErrorBoundary: ${errorInfo.componentStack?.slice(0, 200)}`);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback(this.state.error, this.handleReset);
        }
        return this.props.fallback;
      }

      return (
        <ErrorBoundaryFallback
          error={this.state.error}
          onReset={this.handleReset}
          onRefresh={this.handleRefresh}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Default fallback UI for ErrorBoundary — uses hooks so translations work
 * inside the class component.
 */
function ErrorBoundaryFallback({ error, onReset, onRefresh }: { error: Error; onReset: () => void; onRefresh: () => void }) {
  const { t } = useTranslation("common");
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-background p-4"
      data-testid="error-boundary-container"
    >
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col gap-4 py-12 px-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-destructive" data-testid="icon-error" />
            <h2 className="text-2xl font-semibold" data-testid="text-error-title">
              {t("errorOccurred")}
            </h2>
          </div>
          <p className="text-muted-foreground" data-testid="text-error-description">
            {t("sahifaniYangilashgaHarakatQiling")}
          </p>
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer hover:text-foreground">
              {t("xatolikMalumotlari")}
            </summary>
            <pre className="mt-2 overflow-auto bg-muted p-2 rounded text-xs">
              {error.toString()}
            </pre>
          </details>
          <div className="flex gap-2 pt-2">
            <Button
              onClick={onReset}
              className="flex-1"
              data-testid="button-retry"
            >
              {t("qaytaUrinish")}
            </Button>
            <Button
              onClick={onRefresh}
              variant="outline"
              className="flex-1"
              data-testid="button-refresh"
            >
              {t("refresh")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ErrorBoundary;
