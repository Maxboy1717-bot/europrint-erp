/**
 * @module MainTabContentTypes
 * @description Type definitions and helpers for MainTabContent.
 */

import type { KanbanCard, TaskTag } from "@shared/schema";
import type {
  CardWithOwner,
  ObserverWithUser,
  CoExecutorWithUser,
  Employee,
  KanbanTranslations,
} from "../kanban-types";

export interface MainTabContentProps {
  card: CardWithOwner;
  employees: Employee[];
  observers: ObserverWithUser[];
  coExecutors: CoExecutorWithUser[];
  tags: TaskTag[];
  allCards: CardWithOwner[];
  projects: { id: string; name: string }[];
  deals: { id: string; name: string; amount: number }[];
  onUpdate: (data: Partial<KanbanCard>) => void;
  onAddObserver: (userId: string) => void;
  onRemoveObserver: (observerId: string) => void;
  onAddCoExecutor: (userId: string) => void;
  onRemoveCoExecutor: (coExecutorId: string) => void;
  onAddTag: (name: string) => void;
  onRemoveTag: (tagId: string) => void;
  onStartTime: () => void;
  onStopTime: () => void;
  newTagName: string;
  onNewTagNameChange: (val: string) => void;
  showHiddenFields: boolean;
  onToggleHiddenFields: () => void;
  taskRating: number;
  onTaskRatingChange: (val: number) => void;
  hoveredRating: number;
  onHoveredRatingChange: (val: number) => void;
  t: KanbanTranslations & ((key: string) => string);
}

// Backend may return snake_case (full_name, profile_image_url). This helper
// normalises access so components never crash on undefined.
export function getName(obj: unknown): string {
  if (!obj || typeof obj !== "object") return "?";
  const r = obj as Record<string, unknown>;
  return String(r.fullName ?? r.full_name ?? "?");
}

export function getAvatar(obj: unknown): string | undefined {
  if (!obj || typeof obj !== "object") return undefined;
  const r = obj as Record<string, unknown>;
  return (r.profileImageUrl ?? r.profile_image_url ?? undefined) as string | undefined;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0] ?? "")
    .join("")
    .substring(0, 2)
    .toUpperCase() || "?";
}
