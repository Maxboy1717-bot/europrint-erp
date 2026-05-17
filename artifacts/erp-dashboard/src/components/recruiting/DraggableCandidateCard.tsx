import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { CandidateCard, type CandidateCardProps } from "./CandidateCard";
import type { FunnelStage } from "./types";

export interface DraggableCandidateCardProps extends CandidateCardProps {
  stageKey: FunnelStage;
  draggingDisabled?: boolean;
}

/**
 * Wraps `CandidateCard` with dnd-kit `useSortable`.
 *
 * The drag handle is the small grip in the top-right corner — clicking
 * any other button (advance/reject/AI/etc.) inside the card must not
 * trigger drag-start, hence the handle pattern.
 */
export function DraggableCandidateCard({
  stageKey,
  draggingDisabled,
  ...cardProps
}: DraggableCandidateCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: cardProps.entry.id,
    data: { type: "card", stage: stageKey },
    disabled: draggingDisabled,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative"
      data-testid={`draggable-${cardProps.entry.id}`}
      data-dragging={isDragging ? "true" : "false"}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Sudramoq: ${cardProps.entry.candidate_name}`}
        data-testid={`drag-handle-${cardProps.entry.id}`}
        className="absolute top-2 right-2 z-10 p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 cursor-grab active:cursor-grabbing touch-none"
        onClick={(e) => e.preventDefault()}
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>
      <CandidateCard {...cardProps} />
    </div>
  );
}
