import { WifiOff, Wifi, RefreshCw, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SyncStatus } from "@/lib/pos-sync";

interface OfflineStatusBannerProps {
  isOnline: boolean;
  syncStatus: SyncStatus;
  pendingCount: number;
  lastSyncAt: Date | null;
  onSync: () => void;
}

export function OfflineStatusBanner({
  isOnline,
  syncStatus,
  pendingCount,
  lastSyncAt,
  onSync,
}: OfflineStatusBannerProps) {
  if (isOnline && pendingCount === 0 && syncStatus !== "syncing") return null;

  if (!isOnline) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border-b border-amber-200 text-amber-800 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-200">
        <WifiOff className="h-4 w-4 flex-shrink-0" />
        <span className="text-sm font-medium">Oflayn rejimda</span>
        <span className="text-xs text-amber-600 dark:text-amber-300">— Ma'lumotlar qurilmada saqlanadi</span>
        {pendingCount > 0 && (
          <Badge variant="outline" className="border-amber-400 text-amber-700 dark:text-amber-300 ml-1 text-xs">
            <Clock className="h-3 w-3 mr-1" />
            {pendingCount} ta sotuv kutmoqda
          </Badge>
        )}
      </div>
    );
  }

  if (syncStatus === "syncing") {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border-b border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200">
        <RefreshCw className="h-4 w-4 animate-spin flex-shrink-0" />
        <span className="text-sm font-medium">Sinxronlanmoqda...</span>
        {pendingCount > 0 && (
          <span className="text-xs text-blue-600 dark:text-blue-300">{pendingCount} ta sotuv qoldi</span>
        )}
      </div>
    );
  }

  if (isOnline && pendingCount > 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 border-b border-orange-200 text-orange-800 dark:bg-orange-950 dark:border-orange-800 dark:text-orange-200">
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
        <span className="text-sm font-medium">{pendingCount} ta sotuv serverga yuborilmagan</span>
        <Button
          variant="outline"
          size="sm"
          className="ml-2 h-6 text-xs border-orange-300 text-orange-700 hover:bg-orange-100"
          onClick={onSync}
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Hozir sync
        </Button>
      </div>
    );
  }

  return null;
}

interface OfflineHeaderBadgeProps {
  isOnline: boolean;
  pendingCount: number;
  syncStatus: SyncStatus;
}

export function OfflineHeaderBadge({ isOnline, pendingCount, syncStatus }: OfflineHeaderBadgeProps) {
  if (!isOnline) {
    return (
      <Badge variant="outline" className="flex items-center gap-1 border-amber-400 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950">
        <WifiOff className="h-3 w-3" />
        Oflayn
        {pendingCount > 0 && (
          <span className="ml-1 bg-amber-500 text-white text-xs rounded-full px-1.5">{pendingCount}</span>
        )}
      </Badge>
    );
  }

  if (syncStatus === "syncing") {
    return (
      <Badge variant="outline" className="flex items-center gap-1 border-blue-400 text-blue-600 dark:text-blue-400">
        <RefreshCw className="h-3 w-3 animate-spin" />
        Sync...
      </Badge>
    );
  }

  if (pendingCount > 0) {
    return (
      <Badge variant="outline" className="flex items-center gap-1 border-orange-400 text-orange-600">
        <Clock className="h-3 w-3" />
        {pendingCount}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="flex items-center gap-1 border-green-400 text-green-600 dark:text-green-400">
      <Wifi className="h-3 w-3" />
      Onlayn
    </Badge>
  );
}
