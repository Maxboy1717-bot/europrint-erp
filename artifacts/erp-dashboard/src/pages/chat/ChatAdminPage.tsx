/**
 * @module ChatAdminPage
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Shield, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest, getAuthHeaders } from '@/lib/queryClient';
import { AdminRoom, AdminMember, AuditLog, Tab } from "./ChatAdminPageTypes";
import { RoomsSection, AuditSection } from "./ChatAdminPageSections";
import { RoomMembersSheet, RemoveMemberConfirm } from "./ChatAdminPageDialogs";

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
      const res = await apiRequest('GET', "/api/chat/admin/rooms");
      if (!res.ok) throw new Error("Failed to load rooms");
      return res.json();
    },
    staleTime: 30_000,
  });

  const { data: auditData, isLoading: auditLoading } = useQuery({
    queryKey: ["chat-audit-logs", auditPage],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/chat/admin/audit-logs?page=${auditPage}&limit=50`);
      if (!res.ok) throw new Error("Failed to load audit logs");
      return res.json() as Promise<{ logs: AuditLog[]; total: number; pages: number }>;
    },
    enabled: tab === "audit",
    staleTime: 30_000,
  });

  const { data: roomMembers = [], isLoading: membersLoading } = useQuery<AdminMember[]>({
    queryKey: ["chat-admin-room-members", selectedRoom?.id],
    queryFn: async () => {
      const res = await fetch(`/api/chat/admin/rooms/${selectedRoom?.id ?? ''}/members`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to load members");
      return res.json();
    },
    enabled: !!selectedRoom,
  });

  const archiveMutation = useMutation({
    mutationFn: async ({ roomId, archive }: { roomId: string; archive: boolean }) => {
      const res = await apiRequest('PATCH', `/api/chat/admin/rooms/${roomId}/archive`, { archive });
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
      const res = await apiRequest('DELETE', `/api/chat/admin/rooms/${roomId}/members/${userId}`);
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
      const res = await apiRequest('PATCH', `/api/chat/admin/rooms/${roomId}/members/${userId}/role`, { role });
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

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5 text-[var(--ep-blue)]" />
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
        <RoomsSection
          search={search}
          setSearch={setSearch}
          roomsLoading={roomsLoading}
          filteredRooms={filteredRooms}
          onSelectRoom={setSelectedRoom}
          archiveMutation={archiveMutation}
        />
      )}

      {tab === "audit" && (
        <AuditSection
          auditLoading={auditLoading}
          auditData={auditData}
          auditPage={auditPage}
          setAuditPage={setAuditPage}
        />
      )}

      <RoomMembersSheet
        selectedRoom={selectedRoom}
        onClose={() => setSelectedRoom(null)}
        membersLoading={membersLoading}
        roomMembers={roomMembers}
        confirmRemove={confirmRemove}
        setConfirmRemove={setConfirmRemove}
        removeMemberMutation={removeMemberMutation}
        changeRoleMutation={changeRoleMutation}
      />

      <RemoveMemberConfirm
        confirmRemove={confirmRemove}
        onClose={() => setConfirmRemove(null)}
        onConfirm={() => {
          if (confirmRemove) removeMemberMutation.mutate({ roomId: confirmRemove.roomId, userId: confirmRemove.userId });
        }}
      />
    </div>
  );
}
