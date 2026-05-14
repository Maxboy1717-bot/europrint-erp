/**
 * @module CreateTaskModal
 * @description React UI component.
 */

import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ChatMessage } from "@/store/chatStore";
import { CheckSquare } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { useTranslation } from '@/lib/i18n';
interface Employee {
  id: string;
  fullName: string;
  employeeId?: string;
}

interface Props {
  message: ChatMessage | null;
  open: boolean;
  onClose: () => void;
}

export function CreateTaskModal({message, open, onClose }: Props) {
  const { t } = useTranslation('common');
  const { toast } = useToast();
  const [title, setTitle] = useState(message?.content?.slice(0, 100) ?? "");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/chat/employees"],
    queryFn: () => apiRequest("GET", "/api/chat/employees").then((r: unknown) => r as Employee[]),
    enabled: open,
  });

  const filtered = search
    ? (Array.isArray(employees) ? employees : []).filter((e: Employee) => e.fullName.toLowerCase().includes(search.toLowerCase()))
    : employees;

  const handleCreate = async () => {
    if (!message || !title.trim()) return;
    setLoading(true);
    try {
      await apiRequest("POST", "/api/chat/message-tasks", {
        messageId: message.id,
        title: title.trim(),
        assignedTo: assignedTo || undefined,
        dueDate: dueDate || undefined,
      });
      toast({ title: "Task yaratildi!", description: title.trim() });
      onClose();
    } catch {
      toast({ title: "Xatolik", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-primary" />
            Xabardan Task Yaratish
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {message && (
            <div className="bg-muted/30 rounded-lg px-3 py-2 text-xs text-muted-foreground border border-border/50">
              <p className="font-medium text-foreground/80 mb-0.5">Asos xabar:</p>
              <p className="line-clamp-2">{message.content}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="task-title" className="text-xs">Sarlavha *</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('taskSarlavhasi')}
              className="text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Mas'ul xodim</Label>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Xodim qidirish..."
              className="text-sm mb-1"
            />
            {search && filtered.length > 0 && (
              <div className="border border-border rounded-lg overflow-hidden max-h-32 overflow-y-auto">
                {filtered.slice(0, 6).map((emp: Employee) => (
                  <button
                    key={emp.id}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/60 transition-colors text-sm ${
                      assignedTo === emp.id ? "bg-primary/10 font-medium" : ""
                    }`}
                    onClick={() => {
                      setAssignedTo(emp.id);
                      setSearch(emp.fullName);
                    }}
                  >
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary flex-shrink-0">
                      {emp.fullName[0]}
                    </div>
                    {emp.fullName}
                    {emp.employeeId && (
                      <span className="text-xs text-muted-foreground ml-auto">{emp.employeeId}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
            {assignedTo && (
              <p className="text-xs text-primary">Tanlandi: {(Array.isArray(employees) ? employees : []).find((e: Employee) => e.id === assignedTo)?.fullName ?? assignedTo}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-due" className="text-xs">Muddat</Label>
            <Input
              id="task-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="text-sm">
            Bekor qilish
          </Button>
          <Button
            onClick={handleCreate}
            disabled={loading || !title.trim()}
            className="text-sm"
          >
            {loading ? "Yaratilmoqda..." : "Task yaratish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
