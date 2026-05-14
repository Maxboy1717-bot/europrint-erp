/**
 * @module ChecklistTabContent
 * @description React page component. Route-level UI.
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { Plus, ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import type { ChecklistWithItems } from "../kanban-types";
import { useTranslation } from '@/lib/i18n';

interface ChecklistTabContentProps {
  checklists: ChecklistWithItems[];
  newChecklistTitle: string;
  onNewChecklistTitleChange: (val: string) => void;
  onAddChecklist: (title: string) => void;
  expandedChecklists: Record<string, boolean>;
  onToggleExpanded: (id: string, val: boolean) => void;
  newChecklistItemTitle: Record<string, string>;
  onNewItemTitleChange: (checklistId: string, val: string) => void;
  onAddItem: (checklistId: string, title: string) => void;
  onToggleItem: (itemId: string) => void;
  onDeleteChecklist: (checklistId: string) => void;
  isDeleting: boolean;
}

function getChecklistProgress(checklist: ChecklistWithItems) {
  if (!checklist.items?.length) return 0;
  const completed = checklist.items?.filter(i => i.completed).length;
  return Math.round((completed / checklist.items.length) * 100);
}

export function ChecklistTabContent({
  checklists,
  newChecklistTitle,
  onNewChecklistTitleChange,
  onAddChecklist,
  expandedChecklists,
  onToggleExpanded,
  newChecklistItemTitle,
  onNewItemTitleChange,
  onAddItem,
  onToggleItem,
  onDeleteChecklist,
  isDeleting,
}: ChecklistTabContentProps) {
  const { t } = useTranslation("common");
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder={t("yangiChekList")}
          value={newChecklistTitle}
          onChange={(e) => onNewChecklistTitleChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && newChecklistTitle.trim() && onAddChecklist(newChecklistTitle)}
          data-testid="input-new-checklist"
        />
        <Button onClick={() => onAddChecklist(newChecklistTitle)} disabled={!newChecklistTitle.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {(Array.isArray(checklists) ? checklists : []).map((checklist) => {
        const isExpanded = expandedChecklists[checklist.id] !== false;
        const progress = getChecklistProgress(checklist);

        return (
          <Collapsible
            key={checklist.id}
            open={isExpanded}
            onOpenChange={(o) => onToggleExpanded(checklist.id, o)}
          >
            <div className="border rounded-md p-3">
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <span className="font-medium">{checklist.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {checklist.items?.filter(i => i.completed).length || 0}/{checklist.items?.length || 0}
                    </span>
                    <Progress value={progress} className="w-16 h-1.5" />
                    <DeleteConfirmDialog
                      title={t("checklistniOchirish")}
                      description={t("buAmalniQaytaribBolmaydi")}
                      onConfirm={() => onDeleteChecklist(checklist.id)}
                      isPending={isDeleting}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => e.stopPropagation()}
                        data-testid={`button-delete-checklist-${checklist.id}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </DeleteConfirmDialog>
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3 space-y-2">
                {checklist.items?.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 pl-6">
                    <Checkbox checked={item.completed} onCheckedChange={() => onToggleItem(item.id)} />
                    <span className={`text-sm flex-1 ${item.completed ? "line-through text-muted-foreground" : ""}`}>
                      {item.title}
                    </span>
                  </div>
                ))}
                <div className="flex gap-2 pl-6">
                  <Input
                    placeholder={t("yangiElement")}
                    value={newChecklistItemTitle[checklist.id] || ""}
                    onChange={(e) => onNewItemTitleChange(checklist.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const val = newChecklistItemTitle[checklist.id] || "";
                        if (val.trim()) onAddItem(checklist.id, val);
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    onClick={() => onAddItem(checklist.id, newChecklistItemTitle[checklist.id] || "")}
                    disabled={!(newChecklistItemTitle[checklist.id] || "").trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        );
      })}

      {checklists.length === 0 && (
        <p className="text-center text-muted-foreground py-8">{t("chekListlarYoq")}</p>
      )}
    </div>
  );
}
