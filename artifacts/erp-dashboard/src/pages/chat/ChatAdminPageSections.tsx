/**
 * @module ChatAdminPageSections
 * @description Table sections for ChatAdminPage (rooms list and audit log).
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Archive, Users, MessageSquare, ChevronRight, Search,
  AlertTriangle, ArchiveRestore,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { UseMutationResult } from "@tanstack/react-query";
import { AdminRoom, AuditLog, ACTION_LABEL_KEYS } from "./ChatAdminPageTypes";
import { useTranslation } from '@/lib/i18n';

// ─── Rooms Tab ────────────────────────────────────────────────────────────────
export function RoomsSection({
  search,
  setSearch,
  roomsLoading,
  filteredRooms,
  onSelectRoom,
  archiveMutation,
}: {
  search: string;
  setSearch: (v: string) => void;
  roomsLoading: boolean;
  filteredRooms: AdminRoom[];
  onSelectRoom: (room: AdminRoom) => void;
  archiveMutation: UseMutationResult<unknown, Error, { roomId: string; archive: boolean }, unknown>;
}) {
  const { t } = useTranslation("common");
  return (
    <div className="flex-1 min-h-0 overflow-auto">
      <div className="mb-3">
        <div className="relative max-w-xs">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder={t("xonaQidirish")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>
      {roomsLoading ? (
        <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
          {t("Yuklanmoqda...")}
        </div>
      ) : (
        <div className="ep-table-scroll"><Table>
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow>
              <TableHead>{t("xonaNomi")}</TableHead>
              <TableHead>{t("tur")}</TableHead>
              <TableHead className="text-center">{t("azolar")}</TableHead>
              <TableHead className="text-center">{t("xabarlar")}</TableHead>
              <TableHead>{t("Yaratilgan")}</TableHead>
              <TableHead>{t("status28")}</TableHead>
              <TableHead>{t("amal")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(Array.isArray(filteredRooms) ? filteredRooms : []).map((room) => (
              <TableRow key={room.id} className="hover:bg-muted/30">
                <TableCell>
                  <div>
                    <p className="font-medium text-sm">{room.name || "—"}</p>
                    {room.created_by_name && (
                      <p className="text-xs text-muted-foreground">{t("yaratganLabel")}: {room.created_by_name}</p>
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
                    <Badge variant="outline" className="text-xs text-[var(--ep-primary)] border-orange-500/40">
                      {t("arxivda")}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-[var(--ep-green)] border-green-500/40">
                      {t("active")}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm" variant="ghost"
                      className="h-7 px-2 text-xs gap-1"
                      onClick={() => onSelectRoom(room)}
                    >
                      <Users className="w-3 h-3" />
                      {t("azolar")}
                      <ChevronRight className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm" variant="ghost"
                      className={cn("h-7 px-2 text-xs gap-1", room.is_archived ? "text-[var(--ep-green)]" : "text-[var(--ep-primary)]")}
                      onClick={() => archiveMutation.mutate({ roomId: room.id, archive: !room.is_archived })}
                      disabled={archiveMutation.isPending}
                    >
                      {room.is_archived ? (
                        <><ArchiveRestore className="w-3 h-3" /> {t("restore")}</>
                      ) : (
                        <><Archive className="w-3 h-3" /> {t("archive")}</>
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredRooms.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  {t("xonalarTopilmadi")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table></div>
      )}
    </div>
  );
}

// ─── Audit Log Tab ────────────────────────────────────────────────────────────
export function AuditSection({
  auditLoading,
  auditData,
  auditPage,
  setAuditPage,
}: {
  auditLoading: boolean;
  auditData: { logs: AuditLog[]; total: number; pages: number } | undefined;
  auditPage: number;
  setAuditPage: (fn: (p: number) => number) => void;
}) {
  const { t } = useTranslation("common");
  return (
    <div className="flex-1 min-h-0 overflow-auto">
      {auditLoading ? (
        <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
          {t("Yuklanmoqda...")}
        </div>
      ) : (
        <>
          <div className="ep-table-scroll"><Table>
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow>
                <TableHead>{t("time")}</TableHead>
                <TableHead>{t("aktor")}</TableHead>
                <TableHead>{t("harakat")}</TableHead>
                <TableHead>{t("xona")}</TableHead>
                <TableHead>{t("nishon")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(auditData?.logs || []).map((log) => (
                <TableRow key={log.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {log.created_at ? format(new Date(log.created_at), "dd.MM.yy HH:mm") : "—"}
                  </TableCell>
                  <TableCell className="text-sm font-medium">{log.actor_name || log.actor_id}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {ACTION_LABEL_KEYS[log.action] ? t(ACTION_LABEL_KEYS[log.action]) : log.action}
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
                    {t("auditLogYozuvlariYoq")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table></div>
          {(auditData?.pages || 0) > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline" size="sm"
                onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                disabled={auditPage <= 1}
              >
                {t("previous")}
              </Button>
              <span className="text-sm text-muted-foreground">
                {auditPage} / {auditData?.pages}
              </span>
              <Button
                variant="outline" size="sm"
                onClick={() => setAuditPage((p) => p + 1)}
                disabled={auditPage >= (auditData?.pages || 1)}
              >
                {t("nextBtn")}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
