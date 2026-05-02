import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ 
  title = "Xatolik yuz berdi", 
  message = "Ma'lumotlarni yuklashda xatolik. Qayta urinib ko'ring.", 
  onRetry 
}: ErrorStateProps) {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
        <p className="text-lg font-medium mb-2">{title}</p>
        <p className="text-muted-foreground mb-4">{message}</p>
        {onRetry && (
          <Button variant="outline" onClick={onRetry} data-testid="btn-retry">
            <RefreshCw className="h-4 w-4 mr-2" />
            Qayta yuklash
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
