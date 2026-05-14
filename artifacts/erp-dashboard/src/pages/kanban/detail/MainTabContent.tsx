/**
 * @module MainTabContent
 * @description React page component. Route-level UI.
 */

import { Separator } from "@/components/ui/separator";
import { TimeTrackingWidget } from "../TimeTrackingWidget";
import { PRIORITY_CONFIG } from "../kanban-types";
import type { MainTabContentProps } from "./MainTabContentTypes";
import {
  AssigneeField,
  CoExecutorsField,
  DeadlineField,
  DescriptionField,
  ObserversField,
  PriorityField,
} from "./MainTabContentSections";
import {
  HiddenFieldsSection,
  TagsField,
  TaskRatingSection,
} from "./MainTabContentExtras";

export function MainTabContent({
  card, employees, observers, coExecutors, tags, allCards, projects, deals,
  onUpdate, onAddObserver, onRemoveObserver, onAddCoExecutor, onRemoveCoExecutor,
  onAddTag, onRemoveTag, onStartTime, onStopTime,
  newTagName, onNewTagNameChange, showHiddenFields, onToggleHiddenFields,
  taskRating, onTaskRatingChange, hoveredRating, onHoveredRatingChange, t,
}: MainTabContentProps) {
  // Kept for forward-compatibility; priority badge can be used by parent if needed.
  const _priorityConfig = PRIORITY_CONFIG[card.priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.normal;
  void _priorityConfig;

  return (
    <div className="space-y-4">
      <DescriptionField card={card} onUpdate={onUpdate} t={t} />

      <div className="space-y-3">
        <PriorityField card={card} onUpdate={onUpdate} t={t} />

        <DeadlineField card={card} onUpdate={onUpdate} t={t} />

        <AssigneeField card={card} employees={employees} onUpdate={onUpdate} t={t} />

        <ObserversField
          card={card}
          employees={employees}
          observers={observers}
          onAddObserver={onAddObserver}
          onRemoveObserver={onRemoveObserver}
          t={t}
        />

        <CoExecutorsField
          card={card}
          employees={employees}
          coExecutors={coExecutors}
          onAddCoExecutor={onAddCoExecutor}
          onRemoveCoExecutor={onRemoveCoExecutor}
          t={t}
        />

        <HiddenFieldsSection
          card={card}
          allCards={allCards}
          projects={projects}
          deals={deals}
          showHiddenFields={showHiddenFields}
          onToggleHiddenFields={onToggleHiddenFields}
          onUpdate={onUpdate}
        />

        <TagsField
          tags={tags}
          newTagName={newTagName}
          onNewTagNameChange={onNewTagNameChange}
          onAddTag={onAddTag}
          onRemoveTag={onRemoveTag}
          t={t}
        />
      </div>

      <Separator />

      <TimeTrackingWidget card={card} onStart={onStartTime} onStop={onStopTime} t={t} />

      <Separator />

      <TaskRatingSection
        taskRating={taskRating}
        hoveredRating={hoveredRating}
        onTaskRatingChange={onTaskRatingChange}
        onHoveredRatingChange={onHoveredRatingChange}
      />
    </div>
  );
}
