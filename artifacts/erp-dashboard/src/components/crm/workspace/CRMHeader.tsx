import { Button } from "@/components/ui/button";
import { Plus, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { EntityType, ENTITY_CONFIG } from "@/pages/crm/crm-types";
import { CRMHeaderProps } from "./types";

export function CRMHeader({ activeEntity, onEntityChange, onQuickCreate }: CRMHeaderProps) {
  return (
    <div className="bg-gradient-to-br from-primary to-primary-dim text-white px-4 py-3">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-1">
          {(Object.keys(ENTITY_CONFIG) as EntityType[]).map((entity) => {
            const config = ENTITY_CONFIG[entity];
            const Icon = config.icon;
            return (
              <Button
                key={entity}
                variant="ghost"
                size="sm"
                onClick={() => onEntityChange(entity)}
                className={cn(
                  "text-white/80 hover:text-white hover:bg-surface-container-lowest/10",
                  activeEntity === entity && "bg-surface-container-lowest/20 text-white"
                )}
                data-testid={`tab-entity-${entity}`}
              >
                <Icon className="h-4 w-4 mr-1.5" />
                {config.label}
              </Button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                className="bg-surface-container-lowest/20 hover:bg-surface-container-lowest/30 text-white border-none"
                data-testid="button-create-dropdown"
              >
                <Plus className="h-4 w-4 mr-1" />
                Yaratish
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(Object.keys(ENTITY_CONFIG) as EntityType[]).map((entity) => {
                const Icon = ENTITY_CONFIG[entity].icon;
                return (
                  <DropdownMenuItem
                    key={entity}
                    onClick={() => onQuickCreate(entity)}
                    data-testid={`menu-create-${entity}`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {ENTITY_CONFIG[entity].label.slice(0, -3)}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
