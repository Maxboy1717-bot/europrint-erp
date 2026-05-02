import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GripVertical, Flame, Check, Play, Paperclip, MessageSquare } from "lucide-react";
import {
  type CardWithOwner, type T,
  PRIORITY_CONFIG, TAG_COLORS,
  getDeadlineCategory, formatDeadlineUzbek, formatTimeHMS, formatTimeShort,
} from "./kanban-types";

export function SortableTaskCard({ card, onClick, t }: { card: CardWithOwner; onClick: () => void; t: Record<string, Record<string, string>> }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id! });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const priorityConfig = PRIORITY_CONFIG[card.priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.normal;
  const hasSubtasks = (card.subtasksCount || 0) > 0;
  const hasComments = (card.commentsCount || 0) > 0;
  const hasFiles = (card.filesCount || 0) > 0;
  const hasChecklist = typeof card.checklistProgress === "number";
  const isTracking = !!card.activeTimeTrack;
  const isHighPriority = card.priority === "high" || card.priority === "urgent";

  const getDeadlineBadgeStyle = () => {
    if (!card.dueDate) return "";
    const category = getDeadlineCategory(card.dueDate);
    switch (category) {
      case "overdue": return "bg-red-500 text-white";
      case "today": return "bg-lime-500 text-white";
      case "thisWeek": return "bg-emerald-500 text-white";
      case "nextWeek": return "bg-sky-500 text-white";
      default: return "bg-gray-400 text-white";
    }
  };

  const getDeadlineLabel = () => {
    if (!card.dueDate) return "";
    const category = getDeadlineCategory(card.dueDate);
    const date = new Date(card.dueDate);
    const timeStr = `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
    switch (category) {
      case "overdue": return `Kechikkan, ${timeStr}`;
      case "today": return `Bugun, ${timeStr}`;
      default: return formatDeadlineUzbek(card.dueDate);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-testid={`card-${card.id}`}
      className="bg-surface-container-lowest dark:bg-slate-800 shadow-sm rounded-lg border border-outline-variant/20 dark:border-slate-700 p-3 cursor-pointer hover-elevate group relative"
      onClick={onClick}
    >
      <div {...attributes} {...listeners} className="absolute top-2 left-1 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {isHighPriority && (
              <Flame className={`h-4 w-4 flex-shrink-0 ${card.priority === "urgent" ? "text-red-500" : "text-orange-500"}`} />
            )}
            <p className="font-medium text-sm leading-tight">{card.title}</p>
          </div>
          {!isHighPriority && (
            <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${priorityConfig.dotColor}`} />
          )}
        </div>

        {card.tags && card.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {card.tags.slice(0, 3).map((tag, idx) => (
              <span key={tag.id} className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${TAG_COLORS[idx % TAG_COLORS.length]}`}>
                {tag.name}
              </span>
            ))}
            {card.tags.length > 3 && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-container dark:bg-gray-700 text-on-surface-variant dark:text-gray-300">+{card.tags.length - 3}</span>
            )}
          </div>
        )}

        <div className="flex items-center gap-1.5 flex-wrap">
          {hasChecklist && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
              <Check className="h-3 w-3" />
              {card.subtasksCompleted}/{card.subtasksCount}
            </span>
          )}

          {isTracking && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
              <Play className="h-2.5 w-2.5 fill-current" />
              {formatTimeHMS((card.totalTrackedTime || 0) * 60)} / {formatTimeShort(card.targetTime || 0)}
            </span>
          )}

          {hasFiles && (
            <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-surface-container-low dark:bg-gray-800 text-on-surface-variant dark:text-on-surface-variant flex items-center gap-0.5">
              <Paperclip className="h-3 w-3" />
              {card.filesCount}
            </span>
          )}

          {hasComments && (
            <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-surface-container-low dark:bg-gray-800 text-on-surface-variant dark:text-on-surface-variant flex items-center gap-0.5">
              <MessageSquare className="h-3 w-3" />
              {card.commentsCount}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mt-1">
          {card.dueDate ? (
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${getDeadlineBadgeStyle()}`}>
              {getDeadlineLabel()}
            </span>
          ) : (
            <div />
          )}

          {card.owner && (
            <div className="flex items-center -space-x-2">
              <Avatar className="h-6 w-6 border-2 border-white dark:border-slate-800 ring-0">
                <AvatarImage src={card.owner.profileImageUrl || undefined} />
                <AvatarFallback className="text-[9px] bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                  {card.owner.fullName.split(" ").map(n => n[0]).join("").substring(0, 2)}
                </AvatarFallback>
              </Avatar>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function CardOverlay({ card }: { card: CardWithOwner }) {
  const priorityConfig = PRIORITY_CONFIG[card.priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.normal;
  return (
    <div className="bg-card border rounded-md p-3 w-72">
      <div className="flex items-start gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground mt-1" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{card.title}</p>
          <div className={`h-2 w-2 rounded-full mt-2 ${priorityConfig.dotColor}`} />
        </div>
      </div>
    </div>
  );
}
