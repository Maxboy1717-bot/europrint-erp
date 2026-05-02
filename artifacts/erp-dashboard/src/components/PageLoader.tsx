import { Loader2 } from "lucide-react";

export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center h-[50vh] gap-3" data-testid="page-loader">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Yuklanmoqda...</p>
    </div>
  );
}
