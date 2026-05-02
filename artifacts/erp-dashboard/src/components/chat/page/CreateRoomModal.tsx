import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, X, Loader2 } from "lucide-react";
import { getAuthHeaders } from "@/lib/queryClient";
import { useChatStore } from "@/store/chatStore";
import { useEmployeeSearch } from "@/hooks/chat/useRooms";
import { ChatAvatar } from "./ChatAvatar";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface Employee {
  id: number;
  fullName: string;
  employeeId: string;
  avatarUrl?: string;
  departmentName?: string;
}

export function CreateRoomModal({ open, onClose }: Props) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"GROUP" | "CHANNEL">("GROUP");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const setRooms = useChatStore((s) => s.setRooms);

  const { data: employees = [] } = useEmployeeSearch(search);

  const toggleEmployee = (emp: Employee) => {
    setSelected((prev) =>
      (prev ?? []).find((e) => e.id === emp.id)
        ? (prev ?? []).filter((e) => e.id !== emp.id)
        : [...prev, emp]
    );
  };

  const handleCreate = async () => {
    if (!name.trim() || selected.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/chat/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          type,
          memberIds: (Array.isArray(selected) ? selected : []).map((e) => e.id),
        }),
      });
      if (res.ok) {
        const room = await res.json();
        const rooms = useChatStore.getState().rooms;
        useChatStore.getState().setRooms([room, ...rooms]);
        useChatStore.getState().setActiveRoomId(room.id);
        onClose();
        setName("");
        setSelected([]);
        setSearch("");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setName("");
    setSelected([]);
    setSearch("");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Yangi guruh yaratish</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            {(["GROUP", "CHANNEL"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  type === t
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-primary/50"
                }`}
              >
                {t === "GROUP" ? "👥 Guruh" : "📢 Kanal"}
              </button>
            ))}
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Guruh nomi</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masalan: Marketing jamoasi"
              className="h-9"
            />
          </div>

          {selected.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {(Array.isArray(selected) ? selected : []).map((e) => (
                <Badge key={e.id} variant="secondary" className="gap-1 pr-1">
                  {e.fullName}
                  <button onClick={() => toggleEmployee(e)} className="ml-1 hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">A'zolar qo'shish</Label>
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Xodimni qidirish..."
                className="pl-8 h-8 text-sm"
              />
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1 border border-border/50 rounded-lg p-1">
              {(Array.isArray(employees) ? (employees as Employee[]) : []).slice(0, 20).map((emp) => {
                const isSelected = (Array.isArray(selected) ? selected : []).some((e) => e.id === emp.id);
                return (
                  <button
                    key={emp.id}
                    onClick={() => toggleEmployee(emp)}
                    className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left transition-colors ${
                      isSelected ? "bg-primary/10" : "hover:bg-muted/60"
                    }`}
                  >
                    <ChatAvatar name={emp.fullName} url={emp.avatarUrl} size={28} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{emp.fullName}</p>
                      <p className="text-xs text-muted-foreground">{emp.departmentName || emp.employeeId}</p>
                    </div>
                    {isSelected && <span className="text-primary text-xs font-medium">✓</span>}
                  </button>
                );
              })}
              {(employees as Employee[]).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Xodim topilmadi</p>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="outline" onClick={handleClose} className="flex-1">Bekor</Button>
            <Button
              onClick={handleCreate}
              disabled={!name.trim() || selected.length === 0 || loading}
              className="flex-1"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Yaratish
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
