/**
 * @module MainTabContentExtras
 * @description Extra section components for MainTabContent: hidden fields, tags, rating.
 */

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Clock,
  Folder,
  FolderKanban,
  Hash,
  Loader2,
  Plus,
  Star,
  Tag,
  Timer,
  TrendingUp,
  X,
} from "lucide-react";
import type { KanbanCard, TaskTag } from "@shared/schema";
import { useTranslation } from '@/lib/i18n';
import {
  TAG_COLORS,
  PRIORITY_CONFIG,
  type CardWithOwner,
  type KanbanTranslations,
} from "../kanban-types";

// ── Hidden fields ─────────────────────────────────────────────────────────────

interface HiddenFieldsProps {
  card: CardWithOwner;
  allCards: CardWithOwner[];
  projects: { id: string; name: string }[];
  deals: { id: string; name: string; amount: number }[];
  showHiddenFields: boolean;
  onToggleHiddenFields: () => void;
  onUpdate: (data: Partial<KanbanCard>) => void;
}

export function HiddenFieldsSection({ card, allCards, projects, deals, showHiddenFields, onToggleHiddenFields, onUpdate }: HiddenFieldsProps) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [newProjectName, setNewProjectName] = useState("");
  const [showNewProjectInput, setShowNewProjectInput] = useState(false);

  const createProjectMutation = useMutation({
    mutationFn: (name: string) =>
      apiRequest("POST", "/api/kanban/projects", { name, color: "#3b82f6", status: "active" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kanban/projects"] });
      setNewProjectName("");
      setShowNewProjectInput(false);
      toast({ title: "Loyiha yaratildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const handleCreateProject = () => {
    const trimmed = newProjectName.trim();
    if (!trimmed) return;
    createProjectMutation.mutate(trimmed);
  };

  return (
    <>
      <div className="pt-2 border-t">
        <Button variant="ghost" size="sm" onClick={onToggleHiddenFields} className="w-full justify-start text-muted-foreground" data-testid="button-toggle-hidden-fields">
          {showHiddenFields ? (
            <><ChevronDown className="h-4 w-4 mr-2" />{t("kamroqKorsatish")}</>
          ) : (
            <><ChevronRight className="h-4 w-4 mr-2" />{t("yanaKoproq")}</>
          )}
        </Button>
      </div>
      {showHiddenFields && (
        <div className="space-y-3 pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <Folder className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Label className="min-w-[100px]">{t("otaVazifa")}</Label>
            <Select defaultValue={card.parentCardId || "none"} onValueChange={(v) => onUpdate({ parentCardId: v === "none" ? null : v })}>
              <SelectTrigger data-testid="select-parent-task" className="flex-1 h-9"><SelectValue placeholder={t("otaVazifaTanlang")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-</SelectItem>
                {(Array.isArray(allCards) ? allCards : []).filter(c => c.id !== card.id).map((c) => (
                  <SelectItem key={c.id ?? ""} value={c.id ?? ""}>{c.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-start gap-2">
            <FolderKanban className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-2" />
            <Label className="min-w-[100px] mt-2">{t("loyiha")}</Label>
            <div className="flex-1 space-y-1">
              <Select defaultValue={card.projectId || "none"} onValueChange={(v) => onUpdate({ projectId: v === "none" ? null : v })}>
                <SelectTrigger data-testid="select-project" className="h-9"><SelectValue placeholder={t("loyihaTanlang")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-</SelectItem>
                  {(Array.isArray(projects) ? projects : []).map((p) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}
                </SelectContent>
              </Select>
              {showNewProjectInput ? (
                <div className="flex gap-1">
                  <Input
                    autoFocus
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Loyiha nomi..."
                    className="h-8 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateProject();
                      if (e.key === "Escape") { setShowNewProjectInput(false); setNewProjectName(""); }
                    }}
                    data-testid="input-new-project-name"
                  />
                  <Button
                    size="sm"
                    className="h-8 px-2"
                    disabled={!newProjectName.trim() || createProjectMutation.isPending}
                    onClick={handleCreateProject}
                    data-testid="button-save-new-project"
                  >
                    {createProjectMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => { setShowNewProjectInput(false); setNewProjectName(""); }}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground px-1"
                  onClick={() => setShowNewProjectInput(true)}
                  data-testid="button-show-new-project"
                >
                  <Plus className="h-3 w-3 mr-1" />Yangi loyiha
                </Button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Label className="min-w-[100px]">{t("crmBitim")}</Label>
            <Select defaultValue={card.relatedType === 'deal' ? card.relatedId || "none" : "none"} onValueChange={(v) => {
              if (v && v !== "none") { onUpdate({ relatedType: 'deal', relatedId: v }); }
              else { onUpdate({ relatedType: null, relatedId: null }); }
            }}>
              <SelectTrigger data-testid="select-crm-deal" className="flex-1 h-9"><SelectValue placeholder={t("bitimTanlang1")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-</SelectItem>
                {(Array.isArray(deals) ? deals : []).map((deal) => (<SelectItem key={deal.id} value={deal.id}>{deal.name} - {deal.amount?.toLocaleString()} so'm</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Label className="min-w-[100px]">{t("rejalashtirilganVaqtSoat")}</Label>
            <Input type="number" className="flex-1" placeholder="0" defaultValue={card.estimatedTime || ""} onChange={(e) => {
              const val = e.target.value.trim();
              onUpdate({ estimatedTime: val ? parseInt(val) : null });
            }} data-testid="input-estimated-time" />
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Label className="min-w-[100px]">{t("startDate")}</Label>
            <Input type="date" className="flex-1" defaultValue={card.startDate || ""} onChange={(e) => onUpdate({ startDate: e.target.value || null })} data-testid="input-start-date" />
          </div>
          <Separator className="my-2" />
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Label className="min-w-[100px]">{t("takrorlanish")}</Label>
            <Select defaultValue={card.recurrencePattern || "none"} onValueChange={(v) => onUpdate({ recurrencePattern: v === "none" ? null : v })}>
              <SelectTrigger data-testid="select-recurrence-pattern" className="flex-1 h-9"><SelectValue placeholder={t("no")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("no")}</SelectItem>
                <SelectItem value="daily">{t("harKuni")}</SelectItem>
                <SelectItem value="weekly">{t("harHafta")}</SelectItem>
                <SelectItem value="monthly">{t("harOy")}</SelectItem>
                <SelectItem value="yearly">{t("harYil")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {card.recurrencePattern && (
            <>
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Label className="min-w-[100px]">{t("harNecha")}</Label>
                <Input type="number" min={1} className="flex-1" placeholder="1" defaultValue={card.recurrenceInterval || 1} onChange={(e) => onUpdate({ recurrenceInterval: parseInt(e.target.value) || 1 })} data-testid="input-recurrence-interval" />
                <span className="text-sm text-muted-foreground">
                  {card.recurrencePattern === 'daily' ? 'kun' : card.recurrencePattern === 'weekly' ? 'hafta' : card.recurrencePattern === 'monthly' ? 'oy' : 'yil'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Label className="min-w-[100px]">{t("endDate")}</Label>
                <Input type="date" className="flex-1" defaultValue={card.recurrenceEndDate || ""} onChange={(e) => onUpdate({ recurrenceEndDate: e.target.value || null })} data-testid="input-recurrence-end-date" />
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

// ── Tags ─────────────────────────────────────────────────────────────────────

interface TagsFieldProps {
  tags: TaskTag[];
  newTagName: string;
  onNewTagNameChange: (val: string) => void;
  onAddTag: (name: string) => void;
  onRemoveTag: (tagId: string) => void;
  t: KanbanTranslations & ((key: string) => string);
}

export function TagsField({ tags, newTagName, onNewTagNameChange, onAddTag, onRemoveTag, t }: TagsFieldProps) {
  return (
    <div className="flex items-start gap-2">
      <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-2" />
      <Label className="min-w-[100px] mt-2">{t.fields.tags}</Label>
      <div className="flex-1">
        <div className="flex flex-wrap gap-1">
          {(Array.isArray(tags) ? tags : []).map((tag, idx) => (
            <Badge key={tag.id} className={`${TAG_COLORS[idx % TAG_COLORS.length]} cursor-pointer`} onClick={() => onRemoveTag(tag.id)}>
              #{tag.name}<X className="h-3 w-3 ml-1" />
            </Badge>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <Input value={newTagName} onChange={(e) => onNewTagNameChange(e.target.value)} placeholder={t("yangiTeg")} onKeyDown={(e) => e.key === "Enter" && newTagName.trim() && onAddTag(newTagName)} data-testid="input-new-tag" />
          <Button size="icon" onClick={() => newTagName.trim() && onAddTag(newTagName)} disabled={!newTagName.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Rating ────────────────────────────────────────────────────────────────────

interface RatingProps {
  taskRating: number;
  hoveredRating: number;
  onTaskRatingChange: (val: number) => void;
  onHoveredRatingChange: (val: number) => void;
}

export function TaskRatingSection({ taskRating, hoveredRating, onTaskRatingChange, onHoveredRatingChange }: RatingProps) {
  const { t } = useTranslation("common");
  return (
    <div className="bg-muted/50 rounded-md p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Star className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{t("vazifaniBaholash")}</span>
      </div>
      <div className="flex items-center gap-1" data-testid="task-rating">
        {([1, 2, 3, 4, 5]).map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onTaskRatingChange(star)}
            onMouseEnter={() => onHoveredRatingChange(star)}
            onMouseLeave={() => onHoveredRatingChange(0)}
            className="p-1 hover-elevate rounded"
            data-testid={`button-rating-${star}`}
          >
            <Star className={`h-6 w-6 transition-colors ${star <= (hoveredRating || taskRating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
          </button>
        ))}
        {taskRating > 0 && <span className="text-sm text-muted-foreground ml-2">{taskRating}/5</span>}
      </div>
    </div>
  );
}

// Re-export so consumers can import from a single place
export { PRIORITY_CONFIG };
export type { CardWithOwner, KanbanTranslations };
