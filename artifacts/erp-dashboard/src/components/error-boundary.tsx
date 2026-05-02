import React, { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { logClientError } from '@/lib/errorLogger';

interface ErrorFallbackProps {
  error: Error;
  onReset: () => void;
}

export function ErrorFallback({ error, onReset }: ErrorFallbackProps) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background" data-testid="error-boundary">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center py-12 px-6">
          <AlertTriangle className="w-16 h-16 text-destructive mb-4" data-testid="icon-error" />
          <h2 className="text-2xl font-semibold mb-2" data-testid="text-error-title">
            Xatolik yuz berdi
          </h2>
          <p className="text-center text-muted-foreground mb-6" data-testid="text-error-description">
            Sahifani yangilashga harakat qiling
          </p>
          <Button onClick={onReset} className="w-full" data-testid="button-refresh">
            Yangilash
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
        <div
          className="min-h-screen flex items-center justify-center bg-background p-4"
          data-testid="error-boundary-container"
        >
          <Card className="w-full max-w-md">
            <CardContent className="flex flex-col gap-4 py-12 px-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-destructive" data-testid="icon-error" />
                <h2 className="text-2xl font-semibold" data-testid="text-error-title">
                  Xatolik yuz berdi
                </h2>
              </div>
              <p className="text-muted-foreground" data-testid="text-error-description">
                Sahifani yangilashga harakat qiling
              </p>
              {this.state.error && (
                <details className="text-xs text-muted-foreground">
                  <summary className="cursor-pointer hover:text-foreground">
                    Xatolik ma'lumotlari
                  </summary>
                  <pre className="mt-2 overflow-auto bg-muted p-2 rounded text-xs">
                    {this.state.error.toString()}
                  </pre>
                </details>
              )}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={this.handleReset}
                  className="flex-1"
                  data-testid="button-retry"
                >
                  Qayta urinish
                </Button>
                <Button
                  onClick={this.handleRefresh}
                  variant="outline"
                  className="flex-1"
                  data-testid="button-refresh"
                >
                  Yangilash
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
