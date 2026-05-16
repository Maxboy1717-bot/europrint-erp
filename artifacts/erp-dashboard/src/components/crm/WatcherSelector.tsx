/**
 * @module WatcherSelector
 * @description React UI component.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Eye, Plus, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

import { tLabel } from '@/lib/i18n/tLabel';
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  department?: string;
}

interface WatcherSelectorProps {
  entityType: "lead" | "deal" | "contact" | "company";
  entityId: number;
  watchers: User[];
  onWatcherAdd: (userId: string) => void;
  onWatcherRemove: (userId: string) => void;
}

export function WatcherSelector({
  entityType,
  entityId,
  watchers,
  onWatcherAdd,
  onWatcherRemove,
}: WatcherSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const watcherIds = new Set((Array.isArray(watchers) ? watchers : []).map((w) => w.id));

  const filteredUsers = (Array.isArray(allUsers) ? allUsers : []).filter((user) => {
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    const email = (user.email || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || email.includes(query);
  });

  const getInitials = (user: User): string => {
    return `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase();
  };

  return (
    <div
      className="flex flex-col gap-2"
      data-testid={`watcher-selector-${entityType}-${entityId}`}
    >
      <div className="flex items-center gap-2">
        <Eye className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{tLabel('common.WatcherSelector.untitled', "Наблюдатели")}</span>
        <span className="text-xs text-muted-foreground">({watchers.length})</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(Array.isArray(watchers) ? watchers : []).map((watcher) => (
          <div
            key={watcher.id}
            className="flex items-center gap-1.5 bg-secondary rounded-full px-2 py-1"
            data-testid={`watcher-badge-${watcher.id}`}
          >
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-[10px] bg-[var(--ep-blue)] text-white">
                {getInitials(watcher)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs">
              {watcher.firstName} {watcher.lastName}
            </span>
            <button
              onClick={() => onWatcherRemove(watcher.id)}
              className="ml-1 hover:text-destructive transition-colors"
              data-testid={`button-remove-watcher-${watcher.id}`}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2"
              data-testid="button-add-watcher"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Добавить
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-2" align="start">
            <div className="flex items-center gap-2 px-2 pb-2 border-b">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={tLabel('common.WatcherSelector.untitled', "Поиск сотрудников...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 border-0 p-0 focus-visible:ring-0"
                data-testid="input-search-users"
              />
            </div>

            <ScrollArea className="h-56 mt-2">
              <div className="space-y-1">
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    Сотрудники не найдены
                  </div>
                ) : (
                  (Array.isArray(filteredUsers) ? filteredUsers : []).map((user) => {
                    const isSelected = watcherIds.has(user.id);
                    return (
                      <button
                        key={user.id}
                        onClick={() => {
                          if (isSelected) {
                            onWatcherRemove(user.id);
                          } else {
                            onWatcherAdd(user.id);
                          }
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 p-2 rounded-md text-left transition-colors",
                          "hover-elevate",
                          isSelected && "bg-blue-500/10"
                        )}
                        data-testid={`user-option-${user.id}`}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback
                            className={cn(
                              "text-xs",
                              isSelected ? "bg-[var(--ep-blue)] text-white" : "bg-muted"
                            )}
                          >
                            {getInitials(user)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {user.firstName} {user.lastName}
                          </p>
                          {user.department && (
                            <p className="text-xs text-muted-foreground truncate">
                              {user.department}
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <Check className="h-4 w-4 text-[var(--ep-blue)] shrink-0" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
