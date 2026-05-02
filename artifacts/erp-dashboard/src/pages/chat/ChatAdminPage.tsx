import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAuthHeaders } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Archive, Users, MessageSquare, ChevronRight, Search,
  Shield, AlertTriangle, RefreshCw, ArchiveRestore,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface AdminRoom {
  id: string;
  name: string;
  type: string;
  description: string;
  is_archived: boolean;
  created_at: string;
  last_message_at: string;
  member_count: number;
  message_count: number;
  created_by_name: string;
}

interface AdminMember {
  userId: string;
  fullName: string;
  employeeId: string;
  avatarUrl: string;
  role: string;
  joinedAt: string;
  leftAt: string | null;
}

interface AuditLog {
  id: string;
  room_id: string;
  actor_id: string;
  action: string;
  target_user_id: string;
  message_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
  room_name: string;
  room_type: string;
  actor_name: string;
  target_name: string;
}

type Tab = "rooms" | "audit";

export default function ChatAdminPage() {
  const [tab, setTab] = useState<Tab>("rooms");
  const [search, setSearch] = useState("");
  const [selectedRoom, setSelectedRoom] = useState<AdminRoom | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<{ roomId: string; userId: string; name: string } | null>(null);
  const [auditPage, setAuditPage] = useState(1);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: rooms = [], isLoading: roomsLoading, refetch: refetchRooms } = useQuery<AdminRoom[]>({
    queryKey: ["chat-admin-rooms"],
    queryFn: async () => {
      const res = await fetch("/api/chat/admin/rooms", { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to load rooms");
      return res.json();
    },
    staleTime: 30_000,
  });

  const { data: auditData, isLoading: auditLoading } = useQuery({
    queryKey: ["chat-audit-logs", auditPage],
    queryFn: async () => {
      const res = await fetch(`/api/chat/admin/audit-logs?page=${auditPage}&limit=50`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to load audit logs");
      return res.json() as Promise<{ logs: AuditLog[]; total: number; pages: number }>;
    },
    enabled: tab === "audit",
    staleTime: 30_000,
  });

  const { data: roomMembers = [], isLoading: membersLoading } = useQuery<AdminMember[]>({
    queryKey: ["chat-admin-room-members", selectedRoom?.id],
    queryFn: async () => {
      const res = await fetch(`/api/chat/admin/rooms/${selectedRoom!.id}/members`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to load members");
      return res.json();
    },
    enabled: !!selectedRoom,
  });

  const archiveMutation = useMutation({
    mutationFn: async ({ roomId, archive }: { roomId: string; archive: boolean }) => {
      const res = await fetch(`/api/chat/admin/rooms/${roomId}/archive`, {
        method: "PATCH",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ archive }),
      });
      if (!res.ok) throw new Error("Failed to update archive status");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Muvaffaqiyatli", description: "Arxiv holati yangilandi" });
      refetchRooms();
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async ({ roomId, userId }: { roomId: string; userId: string }) => {
      const res = await fetch(`/api/chat/admin/rooms/${roomId}/members/${userId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to remove member");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "A'zo chiqarildi" });
      qc.invalidateQueries({ queryKey: ["chat-admin-room-members", selectedRoom?.id] });
    },
  });

  const changeRoleMutation = useMutation({
    mutationFn: async ({ roomId, userId, role }: { roomId: string; userId: string; role: string }) => {
      const res = await fetch(`/api/chat/admin/rooms/${roomId}/members/${userId}/role`, {
        method: "PATCH",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error("Failed to change role");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Rol o'zgartirildi" });
      qc.invalidateQueries({ queryKey: ["chat-admin-room-members", selectedRoom?.id] });
    },
  });

  const filteredRooms = (Array.isArray(rooms) ? rooms : []).filter((r) =>
    !search || r.name?.toLowerCase().includes(search.toLowerCase()) || r.created_by_name?.toLowerCase().includes(search.toLowerCase())
  );

  const actionLabels: Record<string, string> = {
    MEMBER_ADDED: "A'zo qo'shildi",
    MEMBER_REMOVED: "A'zo chiqarildi",
    ROLE_CHANGED: "Rol o'zgartirildi",
    MESSAGE_DELETED: "Xabar o'chirildi",
    MESSAGE_PINNED: "Xabar pinlandi",
    MESSAGE_UNPINNED: "Pin olib tashlandi",
    ROOM_ARCHIVED: "Xona arxivlandi",
  };

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-500" />
            Chat Admin Panel
          </h1>
          <p className="text-xs text-muted-foreground">Barcha xonalar va audit log boshqaruvi</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetchRooms()} className="gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" />
          Yangilash
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border/60 flex-shrink-0">
        {(["rooms", "audit"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              tab === t
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t === "rooms" ? "Xonalar" : "Audit Log"}
          </button>
        ))}
      </div>

      {tab === "rooms" && (
        <div className="flex-1 min-h-0 overflow-auto">
          <div className="mb-3">
            <div className="relative max-w-xs">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Xona qidirish..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
          </div>
          {roomsLoading ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              Yuklanmoqda...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Xona nomi</TableHead>
                  <TableHead>Tur</TableHead>
                  <TableHead className="text-center">A'zolar</TableHead>
                  <TableHead className="text-center">Xabarlar</TableHead>
                  <TableHead>Yaratilgan</TableHead>
                  <TableHead>Holat</TableHead>
                  <TableHead>Amal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(filteredRooms) ? filteredRooms : []).map((room) => (
                  <TableRow key={room.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{room.name || "—"}</p>
                        {room.created_by_name && (
                          <p className="text-xs text-muted-foreground">Yaratgan: {room.created_by_name}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">{room.type?.toLowerCase()}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="flex items-center justify-center gap-1 text-sm">
                        <Users className="w-3.5 h-3.5 text-muted-foreground" />
                        {room.member_count}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="flex items-center justify-center gap-1 text-sm">
                        <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                        {room.message_count}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {room.created_at ? format(new Date(room.created_at), "dd.MM.yyyy") : "—"}
                    </TableCell>
                    <TableCell>
                      {room.is_archived ? (
                        <Badge variant="outline" className="text-xs text-orange-500 border-orange-500/40">
                          Arxivda
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-green-600 border-green-500/40">
                          Faol
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs gap-1"
                          onClick={() => setSelectedRoom(room)}
                        >
                          <Users className="w-3 h-3" />
                          A'zolar
                          <ChevronRight className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className={cn("h-7 px-2 text-xs gap-1", room.is_archived ? "text-green-600" : "text-orange-500")}
                          onClick={() => archiveMutation.mutate({ roomId: room.id, archive: !room.is_archived })}
                          disabled={archiveMutation.isPending}
                        >
                          {room.is_archived ? (
                            <><ArchiveRestore className="w-3 h-3" /> Tiklash</>
                          ) : (
                            <><Archive className="w-3 h-3" /> Arxivlash</>
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredRooms.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Xonalar topilmadi
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {tab === "audit" && (
        <div className="flex-1 min-h-0 overflow-auto">
          {auditLoading ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              Yuklanmoqda...
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vaqt</TableHead>
                    <TableHead>Aktor</TableHead>
                    <TableHead>Harakat</TableHead>
                    <TableHead>Xona</TableHead>
                    <TableHead>Nishon</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(auditData?.logs || []).map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {log.created_at ? format(new Date(log.created_at), "dd.MM.yy HH:mm") : "—"}
                      </TableCell>
                      <TableCell className="text-sm font-medium">{log.actor_name || log.actor_id}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {actionLabels[log.action] || log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{log.room_name || log.room_id}</TableCell>
                      <TableCell className="text-sm">{log.target_name || log.target_user_id || "—"}</TableCell>
                    </TableRow>
                  ))}
                  {(auditData?.logs || []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        <AlertTriangle className="w-5 h-5 mx-auto mb-2 opacity-40" />
                        Audit log yozuvlari yo'q
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {(auditData?.pages || 0) > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                    disabled={auditPage <= 1}
                  >
                    Oldingi
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {auditPage} / {auditData?.pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAuditPage((p) => p + 1)}
                    disabled={auditPage >= (auditData?.pages || 1)}
                  >
                    Keyingi
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Room members sheet */}
      <Sheet open={!!selectedRoom} onOpenChange={(open) => !open && setSelectedRoom(null)}>
        <SheetContent className="w-[400px] sm:w-[480px] overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {selectedRoom?.name || "Xona"} — A'zolar
            </SheetTitle>
          </SheetHeader>
          {membersLoading ? (
            <div className="text-center text-muted-foreground py-8">Yuklanmoqda...</div>
          ) : (
            <div className="space-y-2">
              {(Array.isArray(roomMembers) ? roomMembers : []).map((m) => (
                <div
                  key={m.userId}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl border border-border/40",
                    m.leftAt ? "opacity-50" : ""
                  )}
                >
                  <div>
                    <p className="text-sm font-medium">{m.fullName}</p>
                    <p className="text-xs text-muted-foreground">{m.employeeId}</p>
                    {m.leftAt && (
                      <p className="text-xs text-red-500">
                        Chiqgan: {format(new Date(m.leftAt), "dd.MM.yyyy")}
                      </p>
                    )}
                  </div>
                  {!m.leftAt && (
                    <div className="flex items-center gap-2">
                      <Select
                        value={m.role}
                        onValueChange={(role) =>
                          changeRoleMutation.mutate({
                            roomId: selectedRoom!.id,
                            userId: m.userId,
                            role,
                          })
                        }
                      >
                        <SelectTrigger className="h-7 w-24 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OWNER">Egasi</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                          <SelectItem value="MEMBER">A'zo</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={() => setConfirmRemove({ roomId: selectedRoom!.id, userId: m.userId, name: m.fullName })}
                        disabled={removeMemberMutation.isPending}
                      >
                        Chiqarish
                      </Button>
                    </div>
                  )}
                </div>
              ))}
              {roomMembers.length === 0 && (
                <p className="text-center text-muted-foreground py-8 text-sm">A'zolar topilmadi</p>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={confirmRemove !== null}
        onOpenChange={(open) => { if (!open) setConfirmRemove(null); }}
        title="A'zoni chiqarish"
        description={`${confirmRemove?.name ?? ''} ni chatdan chiqarishni tasdiqlaysizmi?`}
        confirmText="Chiqarish"
        cancelText="Bekor qilish"
        variant="destructive"
        onConfirm={() => {
          if (confirmRemove) removeMemberMutation.mutate({ roomId: confirmRemove.roomId, userId: confirmRemove.userId });
        }}
      />
    </div>
  );
}
