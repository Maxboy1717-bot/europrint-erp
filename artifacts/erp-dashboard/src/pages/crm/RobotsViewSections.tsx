/**
 * @module RobotsViewSections
 * @description Robot card section and label helpers for RobotsView.
 * Dialog lives in RobotsViewDialog.tsx.
 */

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Bot, Edit, Trash2, Zap, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Robot } from "./RobotsViewTypes";
import { TRIGGER_TYPES, ACTION_TYPES, ENTITY_COLORS } from "./RobotsViewTypes";

// ── Label / icon helpers ──────────────────────────────────────────────────────

export function getTriggerIcon(triggerType: string) {
  return TRIGGER_TYPES.find(t => t.value === triggerType)?.icon || Zap;
}

export function getTriggerLabel(triggerType: string) {
  return TRIGGER_TYPES.find(t => t.value === triggerType)?.label || triggerType;
}

export function getActionIcon(actionType: string) {
  return ACTION_TYPES.find(a => a.value === actionType)?.icon || Settings;
}

export function getActionLabel(actionType: string) {
  return ACTION_TYPES.find(a => a.value === actionType)?.label || actionType;
}

export function getEntityLabel(entityType: string) {
  const labels: Record<string, string> = {
    leads: "Lidlar",
    deals: "Bitimlar",
    contacts: "Kontaktlar",
    companies: "Kompaniyalar",
  };
  return labels[entityType] || entityType;
}

// ── RobotCard ────────────────────────────────────────────────────────────────

interface RobotCardProps {
  robot: Robot;
  onToggle: (id: number) => void;
  onEdit: (robot: Robot) => void;
  onDelete: (id: string) => void;
}

export function RobotCard({ robot, onToggle, onEdit, onDelete }: RobotCardProps) {
  const TriggerIcon = getTriggerIcon(robot.triggerType);
  const ActionIcon = getActionIcon(robot.actionType);

  return (
    <Card
      className={cn("p-4", ENTITY_COLORS[robot.entityType] || "")}
      data-testid={`card-robot-${robot.id}`}
    >
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className={cn(
            "p-2 rounded-lg shrink-0",
            robot.isActive
              ? "bg-green-100 text-[var(--ep-green)] dark:bg-green-900/30 dark:text-green-400"
              : "bg-muted/40 text-muted-foreground dark:bg-gray-800 dark:text-muted-foreground"
          )}>
            <Bot className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-medium truncate">{robot.name}</h3>
            <p className="text-xs text-muted-foreground">{getEntityLabel(robot.entityType)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Switch
            checked={robot.isActive}
            onCheckedChange={() => onToggle(robot.id)}
            data-testid={`switch-robot-${robot.id}`}
          />
        </div>
      </div>

      {robot.description && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{robot.description}</p>
      )}

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-xs bg-muted/50 p-2 rounded">
          <TriggerIcon className="h-3.5 w-3.5 text-[var(--ep-blue)] shrink-0" />
          <span className="truncate">{getTriggerLabel(robot.triggerType)}</span>
        </div>
        <div className="flex items-center gap-2 text-xs bg-muted/50 p-2 rounded">
          <ActionIcon className="h-3.5 w-3.5 text-[var(--ep-purple)] shrink-0" />
          <span className="truncate">{getActionLabel(robot.actionType)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t">
        <Badge variant={robot.isActive ? "default" : "secondary"} className="text-xs">
          {robot.isActive ? "Faol" : "O'chirilgan"}
        </Badge>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onEdit(robot)}
            data-testid={`button-edit-robot-${robot.id}`}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onDelete(String(robot.id))}
            data-testid={`button-delete-robot-${robot.id}`}
          >
            <Trash2 className="h-4 w-4 text-[var(--ep-red)]" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
