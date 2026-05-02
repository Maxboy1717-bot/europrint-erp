import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  Plus, Calendar, Clock, User, X, Eye,
  CalendarDays, FolderKanban, Users,
  ChevronDown, ChevronRight, Hash, Tag, TrendingUp, Timer,
  Flag, Star, Folder,
} from "lucide-react";
import { format, addDays, getDay } from "date-fns";
import type { KanbanCard, TaskTag } from "@shared/schema";
import {
  type CardWithOwner,
  type ObserverWithUser,
  type CoExecutorWithUser,
  type Employee,
  type KanbanTranslations,
  TAG_COLORS,
  PRIORITY_CONFIG,
} from "../kanban-types";
import { TimeTrackingWidget } from "../TimeTrackingWidget";

interface MainTabContentProps {
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
  t: KanbanTranslations;
}

export function MainTabContent({
  card, employees, observers, coExecutors, tags, allCards, projects, deals,
  onUpdate, onAddObserver, onRemoveObserver, onAddCoExecutor, onRemoveCoExecutor,
  onAddTag, onRemoveTag, onStartTime, onStopTime,
  newTagName, onNewTagNameChange, showHiddenFields, onToggleHiddenFields,
  taskRating, onTaskRatingChange, hoveredRating, onHoveredRatingChange, t,
}: MainTabContentProps) {
  const priorityConfig = PRIORITY_CONFIG[card.priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.normal;

  return (
    <div className="space-y-4">
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

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Flag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <Label className="min-w-[100px]">{t.fields.priority}</Label>
          <Select defaultValue={card.priority} onValueChange={(v) => onUpdate({ priority: v })}>
            <SelectTrigger data-testid="select-task-priority" className="flex-1">
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

        <div className="flex items-start gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-2" />
          <Label className="min-w-[100px] mt-2">{t.fields.deadline}</Label>
          <div className="flex-1 space-y-2">
            <div className="flex gap-2 p-2 border-b" data-testid="quick-date-options">
              <Button variant="outline" size="sm" onClick={() => onUpdate({ dueDate: format(new Date(), "yyyy-MM-dd") })} data-testid="button-date-today">
                Bugun
              </Button>
              <Button variant="outline" size="sm" onClick={() => onUpdate({ dueDate: format(addDays(new Date(), 1), "yyyy-MM-dd") })} data-testid="button-date-tomorrow">
                Ertaga
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                const today = new Date();
                const dayOfWeek = getDay(today);
                const daysUntilSaturday = dayOfWeek === 0 ? 6 : 6 - dayOfWeek;
                onUpdate({ dueDate: format(addDays(today, daysUntilSaturday), "yyyy-MM-dd") });
              }} data-testid="button-date-weekend">
                Hafta oxiri
              </Button>
            </div>
            <Input type="date" defaultValue={card.dueDate || ""} onChange={(e) => onUpdate({ dueDate: e.target.value })} data-testid="input-task-deadline" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <Label className="min-w-[100px]">{t.fields.assignee}</Label>
          <Select defaultValue={card.ownerUserId || "none"} onValueChange={(v) => onUpdate({ ownerUserId: v === "none" ? null : v })}>
            <SelectTrigger data-testid="select-task-assignee" className="flex-1">
              <SelectValue placeholder={t.fields.assignee} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">-</SelectItem>
              {(Array.isArray(employees) ? employees : []).map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={emp.profileImageUrl || undefined} />
                      <AvatarFallback className="text-[8px]">{emp.fullName.split(" ").map(n => n[0]).join("").substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    {emp.fullName}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-start gap-2">
          <Eye className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-2" />
          <Label className="min-w-[100px] mt-2">{t.fields.observers}</Label>
          <div className="flex-1">
            <div className="flex flex-wrap gap-2 mb-2">
              {(Array.isArray(observers) ? observers : []).map((observer) => (
                <div key={observer.id} className="flex items-center gap-1 bg-muted/50 rounded-full pl-1 pr-2 py-0.5" data-testid={`observer-${observer.id}`}>
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={observer.user.profileImageUrl || undefined} />
                    <AvatarFallback className="text-[8px]">{observer.user.fullName.split(" ").map(n => n[0]).join("").substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{observer.user.fullName}</span>
                  <button type="button" onClick={() => onRemoveObserver(observer.id)} className="ml-1 text-muted-foreground hover:text-destructive" data-testid={`button-remove-observer-${observer.id}`}>
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" data-testid="button-add-observer">
                  <Plus className="h-3 w-3 mr-1" />
                  {t.actions.add}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2" align="start">
                <ScrollArea className="h-48">
                  {(Array.isArray(employees) ? employees : []).filter(emp => !(Array.isArray(observers) ? observers : []).some(o => o.userId === emp.id) && emp.id !== card.ownerUserId)
                    .map((emp) => (
                      <button key={emp.id} type="button" onClick={() => onAddObserver(emp.id)} className="w-full flex items-center gap-2 p-2 hover-elevate rounded text-left" data-testid={`option-observer-${emp.id}`}>
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={emp.profileImageUrl || undefined} />
                          <AvatarFallback className="text-[8px]">{emp.fullName.split(" ").map(n => n[0]).join("").substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{emp.fullName}</span>
                      </button>
                    ))}
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Users className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-2" />
          <Label className="min-w-[100px] mt-2">{t.fields.coExecutors}</Label>
          <div className="flex-1">
            <div className="flex flex-wrap gap-2 mb-2">
              {(Array.isArray(coExecutors) ? coExecutors : []).map((coExecutor) => (
                <div key={coExecutor.id} className="flex items-center gap-1 bg-muted/50 rounded-full pl-1 pr-2 py-0.5" data-testid={`co-executor-${coExecutor.id}`}>
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={coExecutor.user.profileImageUrl || undefined} />
                    <AvatarFallback className="text-[8px]">{coExecutor.user.fullName.split(" ").map(n => n[0]).join("").substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{coExecutor.user.fullName}</span>
                  <button type="button" onClick={() => onRemoveCoExecutor(coExecutor.id)} className="ml-1 text-muted-foreground hover:text-destructive" data-testid={`button-remove-co-executor-${coExecutor.id}`}>
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" data-testid="button-add-co-executor">
                  <Plus className="h-3 w-3 mr-1" />
                  {t.actions.add}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2" align="start">
                <ScrollArea className="h-48">
                  {(Array.isArray(employees) ? employees : []).filter(emp => !(Array.isArray(coExecutors) ? coExecutors : []).some(c => c.userId === emp.id) && emp.id !== card.ownerUserId)
                    .map((emp) => (
                      <button key={emp.id} type="button" onClick={() => onAddCoExecutor(emp.id)} className="w-full flex items-center gap-2 p-2 hover-elevate rounded text-left" data-testid={`option-co-executor-${emp.id}`}>
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={emp.profileImageUrl || undefined} />
                          <AvatarFallback className="text-[8px]">{emp.fullName.split(" ").map(n => n[0]).join("").substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{emp.fullName}</span>
                      </button>
                    ))}
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="pt-2 border-t">
          <Button variant="ghost" size="sm" onClick={onToggleHiddenFields} className="w-full justify-start text-muted-foreground" data-testid="button-toggle-hidden-fields">
            {showHiddenFields ? (
              <><ChevronDown className="h-4 w-4 mr-2" />Kamroq ko'rsatish</>
            ) : (
              <><ChevronRight className="h-4 w-4 mr-2" />Yana ko'proq</>
            )}
          </Button>
        </div>

        {showHiddenFields && (
          <div className="space-y-3 pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2">
              <Folder className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Label className="min-w-[100px]">Ota vazifa</Label>
              <Select defaultValue={card.parentCardId || "none"} onValueChange={(v) => onUpdate({ parentCardId: v === "none" ? null : v })}>
                <SelectTrigger data-testid="select-parent-task" className="flex-1"><SelectValue placeholder="Ota vazifa tanlang" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-</SelectItem>
                  {(Array.isArray(allCards) ? allCards : []).filter(c => c.id !== card.id).map((c) => (
                    <SelectItem key={c.id ?? ""} value={c.id ?? ""}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Label className="min-w-[100px]">Loyiha</Label>
              <Select defaultValue={card.projectId || "none"} onValueChange={(v) => onUpdate({ projectId: v === "none" ? null : v })}>
                <SelectTrigger data-testid="select-project" className="flex-1"><SelectValue placeholder="Loyiha tanlang" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-</SelectItem>
                  {(Array.isArray(projects) ? projects : []).map((p) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Label className="min-w-[100px]">CRM bitim</Label>
              <Select defaultValue={card.relatedType === 'deal' ? card.relatedId || "none" : "none"} onValueChange={(v) => {
                if (v && v !== "none") { onUpdate({ relatedType: 'deal', relatedId: v }); }
                else { onUpdate({ relatedType: null, relatedId: null }); }
              }}>
                <SelectTrigger data-testid="select-crm-deal" className="flex-1"><SelectValue placeholder="Bitim tanlang" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-</SelectItem>
                  {(Array.isArray(deals) ? deals : []).map((deal) => (<SelectItem key={deal.id} value={deal.id}>{deal.name} - {deal.amount?.toLocaleString()} so'm</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Label className="min-w-[100px]">Rejalashtirilgan vaqt (soat)</Label>
              <Input type="number" className="flex-1" placeholder="0" defaultValue={card.estimatedTime || ""} onChange={(e) => {
                const val = e.target.value.trim();
                onUpdate({ estimatedTime: val ? parseInt(val) : null });
              }} data-testid="input-estimated-time" />
            </div>

            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Label className="min-w-[100px]">Boshlanish sanasi</Label>
              <Input type="date" className="flex-1" defaultValue={card.startDate || ""} onChange={(e) => onUpdate({ startDate: e.target.value || null })} data-testid="input-start-date" />
            </div>

            <Separator className="my-2" />

            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Label className="min-w-[100px]">Takrorlanish</Label>
              <Select defaultValue={card.recurrencePattern || "none"} onValueChange={(v) => onUpdate({ recurrencePattern: v === "none" ? null : v })}>
                <SelectTrigger data-testid="select-recurrence-pattern" className="flex-1"><SelectValue placeholder="Yo'q" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Yo'q</SelectItem>
                  <SelectItem value="daily">Har kuni</SelectItem>
                  <SelectItem value="weekly">Har hafta</SelectItem>
                  <SelectItem value="monthly">Har oy</SelectItem>
                  <SelectItem value="yearly">Har yil</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {card.recurrencePattern && (
              <>
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <Label className="min-w-[100px]">Har necha</Label>
                  <Input type="number" min={1} className="flex-1" placeholder="1" defaultValue={card.recurrenceInterval || 1} onChange={(e) => onUpdate({ recurrenceInterval: parseInt(e.target.value) || 1 })} data-testid="input-recurrence-interval" />
                  <span className="text-sm text-muted-foreground">
                    {card.recurrencePattern === 'daily' ? 'kun' : card.recurrencePattern === 'weekly' ? 'hafta' : card.recurrencePattern === 'monthly' ? 'oy' : 'yil'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <Label className="min-w-[100px]">Tugash sanasi</Label>
                  <Input type="date" className="flex-1" defaultValue={card.recurrenceEndDate || ""} onChange={(e) => onUpdate({ recurrenceEndDate: e.target.value || null })} data-testid="input-recurrence-end-date" />
                </div>
              </>
            )}
          </div>
        )}

        <div className="flex items-start gap-2">
          <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-2" />
          <Label className="min-w-[100px] mt-2">{t.fields.tags}</Label>
          <div className="flex-1">
            <div className="flex flex-wrap gap-1">
              {(Array.isArray(tags) ? tags : []).map((tag, idx) => (
                <Badge key={tag.id} className={`${TAG_COLORS[idx % TAG_COLORS.length]} cursor-pointer`} onClick={() => onRemoveTag(tag.id)}>
                  #{tag.name}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <Input value={newTagName} onChange={(e) => onNewTagNameChange(e.target.value)} placeholder="Yangi teg..." onKeyDown={(e) => e.key === "Enter" && newTagName.trim() && onAddTag(newTagName)} data-testid="input-new-tag" />
              <Button size="icon" onClick={() => newTagName.trim() && onAddTag(newTagName)} disabled={!newTagName.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Folder className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <Label className="min-w-[100px]">{t.fields.project}</Label>
          <span className="text-sm text-muted-foreground">-</span>
        </div>
      </div>

      <Separator />

      <TimeTrackingWidget card={card} onStart={onStartTime} onStop={onStopTime} t={t} />

      <Separator />

      <div className="bg-muted/50 rounded-md p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Vazifani baholash</span>
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
    </div>
  );
}