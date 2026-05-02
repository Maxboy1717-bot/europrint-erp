import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { ListTodo, CheckCircle2, AlertTriangle, Timer, Calendar } from "lucide-react";
import { format, isToday, isBefore, isThisWeek, startOfDay } from "date-fns";
import { type CardWithOwner, type T, PRIORITY_CONFIG, formatTimeShort } from "./kanban-types";

export function MyPlanView({
  cards,
  onCardClick,
  onToggleComplete,
  t,
}: {
  cards: CardWithOwner[];
  onCardClick: (card: CardWithOwner) => void;
  onToggleComplete: (card: CardWithOwner) => void;
  t: typeof T.uz;
}) {
  const groupedTasks = useMemo(() => {
    const today: CardWithOwner[] = [];
    const thisWeek: CardWithOwner[] = [];
    const later: CardWithOwner[] = [];
    
    (Array.isArray(cards) ? cards : []).forEach((card) => {
      if (!card.dueDate) {
        later.push(card);
        return;
      }
      const dueDate = new Date(card.dueDate);
      if (isToday(dueDate) || isBefore(dueDate, startOfDay(new Date()))) {
        today.push(card);
      } else if (isThisWeek(dueDate, { weekStartsOn: 1 })) {
        thisWeek.push(card);
      } else {
        later.push(card);
      }
    });
    
    return { today, thisWeek, later };
  }, [cards]);

  const stats = useMemo(() => {
    const totalTasks = cards.length;
    const completedTasks = (Array.isArray(cards) ? cards : []).filter((c) => c.status === "completed").length;
    const totalTrackedTime = (Array.isArray(cards) ? cards : []).reduce((acc, c) => acc + (c.totalTrackedTime || 0), 0);
    const overdueCount = (Array.isArray(cards) ? cards : []).filter((c) => c.dueDate && isBefore(new Date(c.dueDate), startOfDay(new Date())) && c.status !== "completed").length;
    
    return { totalTasks, completedTasks, totalTrackedTime, overdueCount };
  }, [cards]);

  const TaskGroup = ({ title, tasks, color }: { title: string; tasks: CardWithOwner[]; color: string }) => (
    <div className="mb-6" data-testid={`task-group-${title.toLowerCase().replace(/\s/g, "-")}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`h-3 w-3 rounded-full ${color}`} />
        <h3 className="font-semibold">{title}</h3>
        <Badge variant="secondary" className="text-xs">{tasks.length}</Badge>
      </div>
      <div className="space-y-2">
        {(Array.isArray(tasks) ? tasks : []).map((task) => {
          const priorityConfig = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.normal;
          const isCompleted = task.status === "completed";
          const isOverdue = task.dueDate && isBefore(new Date(task.dueDate), startOfDay(new Date())) && !isCompleted;
          
          return (
            <div
              key={task.id}
              className="flex items-center gap-3 p-3 bg-card border rounded-md hover-elevate"
              data-testid={`myplan-task-${task.id}`}
            >
              <Checkbox
                checked={isCompleted}
                onCheckedChange={() => onToggleComplete(task)}
                data-testid={`checkbox-${task.id}`}
              />
              <div className={`h-2 w-2 rounded-full flex-shrink-0 ${priorityConfig.dotColor}`} />
              <div
                className="flex-1 cursor-pointer"
                onClick={() => onCardClick(task)}
              >
                <p className={`text-sm font-medium ${isCompleted ? "line-through text-muted-foreground" : ""}`}>
                  {task.title}
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  {task.dueDate && (
                    <span className={`flex items-center gap-1 ${isOverdue ? "text-red-400" : ""}`}>
                      {isOverdue && <AlertTriangle className="h-3 w-3" />}
                      <Calendar className="h-3 w-3" />
                      {format(new Date(task.dueDate), "dd.MM")}
                    </span>
                  )}
                  {(task.totalTrackedTime || 0) > 0 && (
                    <span className="flex items-center gap-1">
                      <Timer className="h-3 w-3" />
                      {formatTimeShort(task.totalTrackedTime || 0)}
                    </span>
                  )}
                </div>
              </div>
              {task.owner && (
                <Avatar className="h-6 w-6">
                  <AvatarImage src={task.owner.profileImageUrl || undefined} />
                  <AvatarFallback className="text-[8px]">
                    {task.owner.fullName.split(" ").map((n) => n[0]).join("").substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          );
        })}
        {tasks.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">Vazifalar yo'q</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col" data-testid="myplan-view">
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
              <ListTodo className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalTasks}</p>
              <p className="text-xs text-muted-foreground">Jami vazifalar</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.completedTasks}</p>
              <p className="text-xs text-muted-foreground">Bajarilgan</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.overdueCount}</p>
              <p className="text-xs text-muted-foreground">Kechikkan</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Timer className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatTimeShort(stats.totalTrackedTime)}</p>
              <p className="text-xs text-muted-foreground">Sarflangan vaqt</p>
            </div>
          </div>
        </Card>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="max-w-3xl">
          <TaskGroup title={t.columns.today} tasks={groupedTasks.today} color="bg-orange-500" />
          <TaskGroup title={t.columns.thisWeek} tasks={groupedTasks.thisWeek} color="bg-yellow-500" />
          <TaskGroup title="Keyinroq" tasks={groupedTasks.later} color="bg-gray-500" />
        </div>
      </ScrollArea>
    </div>
  );
}
