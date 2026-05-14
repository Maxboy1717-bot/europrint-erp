/**
 * @module MainTabContentSections
 * @description Section sub-components for MainTabContent.
 */

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { addDays, format, getDay } from "date-fns";
import {
  Calendar,
  Eye,
  Flag,
  Plus,
  User,
  Users,
  X,
} from "lucide-react";
import type { KanbanCard } from "@shared/schema";
import {
  type CardWithOwner,
  type CoExecutorWithUser,
  type Employee,
  type KanbanTranslations,
  type ObserverWithUser,
} from "../kanban-types";
import { getAvatar, getName, initials } from "./MainTabContentTypes";
import { useTranslation } from '@/lib/i18n';

// ── Description ──────────────────────────────────────────────────────────────

interface DescriptionFieldProps {
  card: CardWithOwner;
  onUpdate: (data: Partial<KanbanCard>) => void;
  t: KanbanTranslations;
}

export function DescriptionField({ card, onUpdate, t }: DescriptionFieldProps) {
  const { t } = useTranslation("common");
  return (
    <div>
      <Label>{t.fields.description}</Label>
      <Textarea
        defaultValue={card.description || ""}
        placeholder={`${t.fields.description}...`}
        onBlur={(e) => e.target.value !== (card.description || "") && onUpdate({ description: e.target.value })}
        className="min-h-[100px] resize-none"
        data-testid="input-task-description"
      />
    </div>
  );
}

// ── Priority ──────────────────────────────────────────────────────────────────

interface PriorityFieldProps {
  card: CardWithOwner;
  onUpdate: (data: Partial<KanbanCard>) => void;
  t: KanbanTranslations;
}

export function PriorityField({ card, onUpdate, t }: PriorityFieldProps) {
  return (
    <div className="flex items-center gap-2">
      <Flag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <Label className="min-w-[100px]">{t.fields.priority}</Label>
      <Select defaultValue={card.priority} onValueChange={(v) => onUpdate({ priority: v })}>
        <SelectTrigger data-testid="select-task-priority" className="flex-1 h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="urgent">{t.priority.urgent}</SelectItem>
          <SelectItem value="high">{t.priority.high}</SelectItem>
          <SelectItem value="normal">{t.priority.normal}</SelectItem>
          <SelectItem value="low">{t.priority.low}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

// ── Deadline ──────────────────────────────────────────────────────────────────

interface DeadlineFieldProps {
  card: CardWithOwner;
  onUpdate: (data: Partial<KanbanCard>) => void;
  t: KanbanTranslations;
}

export function DeadlineField({ card, onUpdate, t }: DeadlineFieldProps) {
  return (
    <div className="flex items-start gap-2">
      <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-2" />
      <Label className="min-w-[100px] mt-2">{t.fields.deadline}</Label>
      <div className="flex-1 space-y-2">
        <div className="flex gap-2 p-2 border-b" data-testid="quick-date-options">
          <Button variant="outline" size="sm" onClick={() => onUpdate({ dueDate: format(new Date(), "yyyy-MM-dd") })} data-testid="button-date-today">
            {t("today")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => onUpdate({ dueDate: format(addDays(new Date(), 1), "yyyy-MM-dd") })} data-testid="button-date-tomorrow">
            {t("ertaga")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            const today = new Date();
            const dayOfWeek = getDay(today);
            const daysUntilSaturday = dayOfWeek === 0 ? 6 : 6 - dayOfWeek;
            onUpdate({ dueDate: format(addDays(today, daysUntilSaturday), "yyyy-MM-dd") });
          }} data-testid="button-date-weekend">
            {t("haftaOxiri")}
          </Button>
        </div>
        <Input type="date" defaultValue={card.dueDate || ""} onChange={(e) => onUpdate({ dueDate: e.target.value })} data-testid="input-task-deadline" />
      </div>
    </div>
  );
}

// ── Assignee ──────────────────────────────────────────────────────────────────

interface AssigneeFieldProps {
  card: CardWithOwner;
  employees: Employee[];
  onUpdate: (data: Partial<KanbanCard>) => void;
  t: KanbanTranslations;
}

export function AssigneeField({ card, employees, onUpdate, t }: AssigneeFieldProps) {
  return (
    <div className="flex items-center gap-2">
      <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <Label className="min-w-[100px]">{t.fields.assignee}</Label>
      <Select defaultValue={card.ownerUserId || "none"} onValueChange={(v) => onUpdate({ ownerUserId: v === "none" ? null : v })}>
        <SelectTrigger data-testid="select-task-assignee" className="flex-1 h-9">
          <SelectValue placeholder={t.fields.assignee} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">-</SelectItem>
          {(Array.isArray(employees) ? employees : []).map((emp) => (
            <SelectItem key={emp.id} value={emp.id}>
              <div className="flex items-center gap-2">
                <Avatar className="h-4 w-4">
                  <AvatarImage src={getAvatar(emp)} />
                  <AvatarFallback className="text-[8px]">{initials(getName(emp))}</AvatarFallback>
                </Avatar>
                {getName(emp)}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ── Observers ────────────────────────────────────────────────────────────────

interface ObserversFieldProps {
  card: CardWithOwner;
  employees: Employee[];
  observers: ObserverWithUser[];
  onAddObserver: (userId: string) => void;
  onRemoveObserver: (observerId: string) => void;
  t: KanbanTranslations;
}

export function ObserversField({ card, employees, observers, onAddObserver, onRemoveObserver, t }: ObserversFieldProps) {
  return (
    <div className="flex items-start gap-2">
      <Eye className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-2" />
      <Label className="min-w-[100px] mt-2">{t.fields.observers}</Label>
      <div className="flex-1">
        <div className="flex flex-wrap gap-2 mb-2">
          {(Array.isArray(observers) ? observers : []).map((observer) => {
            const obsAny = observer as unknown as Record<string, unknown>;
            const nameSource = observer.user ?? obsAny;
            return (
              <div key={observer.id} className="flex items-center gap-1 bg-muted/50 rounded-full pl-1 pr-2 py-0.5" data-testid={`observer-${observer.id}`}>
                <Avatar className="h-5 w-5">
                  <AvatarImage src={getAvatar(nameSource)} />
                  <AvatarFallback className="text-[8px]">{initials(getName(nameSource))}</AvatarFallback>
                </Avatar>
                <span className="text-sm">{getName(nameSource)}</span>
                <button type="button" onClick={() => onRemoveObserver(observer.id)} className="ml-1 text-muted-foreground hover:text-destructive" data-testid={`button-remove-observer-${observer.id}`}>
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" data-testid="button-add-observer">
              <Plus className="h-3 w-3 mr-1" />{t.actions.add}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2" align="start">
            <ScrollArea className="h-48">
              {(Array.isArray(employees) ? employees : []).filter(emp => !(Array.isArray(observers) ? observers : []).some(o => {
                const oAny = o as unknown as Record<string, unknown>;
                return String(oAny.user_id ?? oAny.userId ?? o.userId) === String(emp.id);
              }) && emp.id !== card.ownerUserId)
                .map((emp) => (
                  <button key={emp.id} type="button" onClick={() => onAddObserver(emp.id)} className="w-full flex items-center gap-2 p-2 hover-elevate rounded text-left" data-testid={`option-observer-${emp.id}`}>
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={getAvatar(emp)} />
                      <AvatarFallback className="text-[8px]">{initials(getName(emp))}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{getName(emp)}</span>
                  </button>
                ))}
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

// ── Co-executors ─────────────────────────────────────────────────────────────

interface CoExecutorsFieldProps {
  card: CardWithOwner;
  employees: Employee[];
  coExecutors: CoExecutorWithUser[];
  onAddCoExecutor: (userId: string) => void;
  onRemoveCoExecutor: (coExecutorId: string) => void;
  t: KanbanTranslations;
}

export function CoExecutorsField({ card, employees, coExecutors, onAddCoExecutor, onRemoveCoExecutor, t }: CoExecutorsFieldProps) {
  return (
    <div className="flex items-start gap-2">
      <Users className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-2" />
      <Label className="min-w-[100px] mt-2">{t.fields.coExecutors}</Label>
      <div className="flex-1">
        <div className="flex flex-wrap gap-2 mb-2">
          {(Array.isArray(coExecutors) ? coExecutors : []).map((coExecutor) => {
            const ceAny = coExecutor as unknown as Record<string, unknown>;
            const nameSource = coExecutor.user ?? ceAny;
            return (
              <div key={coExecutor.id} className="flex items-center gap-1 bg-muted/50 rounded-full pl-1 pr-2 py-0.5" data-testid={`co-executor-${coExecutor.id}`}>
                <Avatar className="h-5 w-5">
                  <AvatarImage src={getAvatar(nameSource)} />
                  <AvatarFallback className="text-[8px]">{initials(getName(nameSource))}</AvatarFallback>
                </Avatar>
                <span className="text-sm">{getName(nameSource)}</span>
                <button type="button" onClick={() => onRemoveCoExecutor(coExecutor.id)} className="ml-1 text-muted-foreground hover:text-destructive" data-testid={`button-remove-co-executor-${coExecutor.id}`}>
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" data-testid="button-add-co-executor">
              <Plus className="h-3 w-3 mr-1" />{t.actions.add}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2" align="start">
            <ScrollArea className="h-48">
              {(Array.isArray(employees) ? employees : []).filter(emp => !(Array.isArray(coExecutors) ? coExecutors : []).some(c => {
                const cAny = c as unknown as Record<string, unknown>;
                return String(cAny.user_id ?? cAny.userId ?? c.userId) === String(emp.id);
              }) && emp.id !== card.ownerUserId)
                .map((emp) => (
                  <button key={emp.id} type="button" onClick={() => onAddCoExecutor(emp.id)} className="w-full flex items-center gap-2 p-2 hover-elevate rounded text-left" data-testid={`option-co-executor-${emp.id}`}>
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={getAvatar(emp)} />
                      <AvatarFallback className="text-[8px]">{initials(getName(emp))}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{getName(emp)}</span>
                  </button>
                ))}
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

// HiddenFieldsSection, TagsField, TaskRatingSection and re-exports live in MainTabContentExtras.tsx
export { HiddenFieldsSection, TagsField, TaskRatingSection, PRIORITY_CONFIG } from "./MainTabContentExtras";
export type { CardWithOwner, KanbanTranslations } from "./MainTabContentExtras";
