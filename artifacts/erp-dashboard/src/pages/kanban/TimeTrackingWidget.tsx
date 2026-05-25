/**
 * @module TimeTrackingWidget
 * @description React page component. Route-level UI.
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, Play, Square } from "lucide-react";
import { type CardWithOwner, type T, formatTime, formatTimeShort } from "./kanban-types";

export function TimeTrackingWidget({
  card,
  onStart,
  onStop,
  t,
}: {
  card: CardWithOwner;
  onStart: () => void;
  onStop: () => void;
  t: typeof T.uz & ((key: string) => string);
}) {
  const [elapsed, setElapsed] = useState(0);
  const activeTrack = card.activeTimeTrack ?? card.active_time_track ?? null;
  const isTracking = !!activeTrack;

  useEffect(() => {
    if (!isTracking || !activeTrack) {
      setElapsed(0);
      return;
    }

    const startTime = new Date(activeTrack.startedAt ?? activeTrack.started_at).getTime();
    const updateElapsed = () => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [isTracking, activeTrack]);

  const totalMinutes = (card.totalTrackedTime ?? card.total_tracked_time ?? 0) + Math.floor(elapsed / 60);
  const targetMinutes = card.targetTime ?? card.target_time ?? card.estimatedTime ?? card.estimated_time ?? 300;

  return (
    <div className="bg-muted/50 rounded-md p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium flex items-center gap-2">
          <Clock className="h-4 w-4" />
          {t.time.tracking}
        </span>
        <Button
          size="sm"
          variant={isTracking ? "destructive" : "default"}
          onClick={isTracking ? onStop : onStart}
          data-testid={isTracking ? "button-stop-tracking" : "button-start-tracking"}
        >
          {isTracking ? <Square className="h-3 w-3 mr-1" /> : <Play className="h-3 w-3 mr-1" />}
          {isTracking ? t.actions.stop : t.actions.start}
        </Button>
      </div>

      <div className="text-center">
        <span className={`text-2xl font-mono ${isTracking ? "text-[var(--ep-green)] font-semibold" : ""}`}>
          {formatTime(elapsed)}
        </span>
        <span className="text-muted-foreground text-sm"> / {formatTimeShort(targetMinutes)}</span>
      </div>

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{t.time.total}: {formatTimeShort(totalMinutes)}</span>
        <span>{t.time.target}: {formatTimeShort(targetMinutes)}</span>
      </div>

      <Progress value={(totalMinutes / targetMinutes) * 100} className="h-1.5" />
    </div>
  );
}
