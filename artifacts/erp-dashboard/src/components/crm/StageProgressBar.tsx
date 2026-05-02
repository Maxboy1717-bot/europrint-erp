import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Stage {
  id: string;
  name: string;
  color?: string;
  sort: number;
}

interface StageProgressBarProps {
  stages: Stage[];
  currentStageId: string;
  onChange?: (stageId: string) => void;
  entityType: "lead" | "deal" | "invoice" | "proposal";
}

const DEFAULT_COLORS: Record<string, string> = {
  new: "#22c55e",
  in_progress: "#3b82f6",
  processing: "#3b82f6",
  waiting: "#eab308",
  pending: "#eab308",
  failed: "#ef4444",
  rejected: "#ef4444",
  success: "#a855f7",
  won: "#a855f7",
  completed: "#a855f7",
};

function getStageColor(stage: Stage): string {
  if (stage.color) return stage.color;
  const lowerName = stage.name.toLowerCase();
  for (const [key, color] of Object.entries(DEFAULT_COLORS)) {
    if (lowerName.includes(key)) return color;
  }
  return "#3b82f6";
}

export function StageProgressBar({
  stages,
  currentStageId,
  onChange,
  entityType,
}: StageProgressBarProps) {
  const sortedStages = [...stages].sort((a, b) => a.sort - b.sort);
  const currentIndex = (sortedStages ?? []).findIndex((s) => s.id === currentStageId);

  return (
    <div
      className="flex items-center gap-1 w-full"
      data-testid={`stage-progress-bar-${entityType}`}
    >
      {(Array.isArray(sortedStages) ? sortedStages : []).map((stage, index) => {
        const isActive = index <= currentIndex;
        const isCurrent = stage.id === currentStageId;
        const color = getStageColor(stage);

        return (
          <Tooltip key={stage.id}>
            <TooltipTrigger asChild>
              <button
                onClick={() => onChange?.(stage.id)}
                className={cn(
                  "flex-1 h-2 rounded-sm transition-all duration-200 cursor-pointer",
                  "hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
                  !isActive && "opacity-30"
                )}
                style={{
                  backgroundColor: color,
                  boxShadow: isCurrent ? `0 0 8px ${color}` : undefined,
                }}
                data-testid={`stage-bar-${stage.id}`}
                aria-label={stage.name}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-sm font-medium">{stage.name}</p>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
