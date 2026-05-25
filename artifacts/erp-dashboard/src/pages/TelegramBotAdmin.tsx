/**
 * @module TelegramBotAdmin
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Send, Users, Bot, CheckCircle, XCircle, MessageSquare,
  Megaphone, User, AlertTriangle
} from "lucide-react";
import { EPPageHeader, EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

interface TelegramStats { botStatus?: string; totalEmployees?: number; telegramConnected?: number; activeToday?: number }
interface TelegramUser { id: number; fullName?: string; employeeId?: number; role?: string; telegramChatId?: string }

export default function TelegramBotAdmin() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [broadcastMsg, setBroadcastMsg] = useState("");

  const { data: stats, isLoading: loadingStats } = useQuery<TelegramStats>({
    queryKey: ["/api/telegram/admin/stats"],
    refetchInterval: 30000,
    enabled: !!isAuthenticated,
  });

  const { data: users, isLoading: loadingUsers } = useQuery<TelegramUser[]>({
    queryKey: ["/api/telegram/admin/users"],
    enabled: !!isAuthenticated,
  });

  const broadcastMutation = useMutation({
    mutationFn: () => apiRequest<Record<string, unknown>>("POST", "/api/telegram/admin/broadcast", { message: broadcastMsg }),
    onSuccess: (data) => {
      toast({ title: "Xabar yuborildi", description: `${data.sent} ta xodimga yetkazildi, ${data.failed} ta muvaffaqiyatsiz` });
      setBroadcastMsg("");
    },
    onError: () => toast({ title: "Xato", description: "Xabar yuborilmadi", variant: "destructive" }),
  });

  const botActive = stats?.botStatus === "active";

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("telegramBotBoshqaruvi")}</b></>}
        title={t("telegramBotBoshqaruvi")}
        subtitle={t("botStatistikasiUlanganFoydalanuvchilarVa")}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loadingStats ? Array(3).fill(0).map((_, i) => <Skeleton key={`k-${i}`} className="h-28 rounded-lg" />) : <>
          <Card data-testid="card-bot-status">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2"><Bot className="w-4 h-4" />{t("botHolati")}</div>
              {botActive
                ? <Badge className="bg-green-500/10 text-[var(--ep-green)] dark:text-green-400"><CheckCircle className="w-3 h-3 mr-1" />{t("active")}</Badge>
                : <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />{t("ochiq1")}</Badge>
              }
              {!botActive && <p className="text-xs text-muted-foreground mt-2">{t("telegramBotTokenSozlanmagan")}</p>}
            </CardContent>
          </Card>
          <Card data-testid="card-total-employees">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1"><Users className="w-4 h-4" />{t("jamiXodimlar1")}</div>
              <div className="text-3xl font-bold">{stats?.totalEmployees || 0}</div>
            </CardContent>
          </Card>
          <Card data-testid="card-telegram-connected">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1"><MessageSquare className="w-4 h-4" />{t("telegramUlangan")}</div>
              <div className="text-3xl font-bold text-[var(--ep-green)] dark:text-green-400">{stats?.telegramConnected || 0}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {stats?.totalEmployees ? Math.round(((stats.telegramConnected ?? 0) / stats.totalEmployees) * 100) : 0}% ulangan
              </div>
            </CardContent>
          </Card>
        </>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Broadcast */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><Megaphone className="w-4 h-4" />{t("ommaviyXabarYuborish")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!botActive && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {t("botUlangimaganTelegramBotToken")}
              </div>
            )}
            <div className="space-y-1">
          <Label htmlFor="broadcast-msg">{t("xabarMatniHtmlTeglariQoLlab")}</Label>
              <Textarea
                id="broadcast-msg"
                data-testid="input-broadcast-message"
                placeholder={`<b>${t("muhimXabar")}</b> Barcha xodimlarga...`}
                value={broadcastMsg}
                onChange={(e) => setBroadcastMsg(e.target.value)}
                rows={5}
              />
            </div>
            <Button
              data-testid="button-send-broadcast"
              onClick={() => broadcastMutation.mutate()}
              disabled={!broadcastMsg.trim() || broadcastMutation.isPending || !botActive}
              className="w-full"
            >
              {broadcastMutation.isPending
                ? <><span className="animate-spin mr-2">⟳</span>{t("submitBtnWait")}</>
                : <><Send className="w-4 h-4 mr-2" />Hammaga yuborish ({stats?.telegramConnected || 0} xodim)</>
              }
            </Button>
            <p className="text-xs text-muted-foreground">
              {t("faqatTelegramniUlaganXodimlarXabar")}
            </p>
          </CardContent>
        </Card>

        {/* Connected Users */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="w-4 h-4" />Ulangan xodimlar
              {users && <EPStatusPill tone="neutral">{users.length}</EPStatusPill>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingUsers ? <Skeleton className="h-48 rounded-lg" /> : (
              <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                {(Array.isArray(users) ? users : []).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">{t("hechKimTelegramniUlamagan")}</p>
                )}
                {(Array.isArray(users) ? users : []).map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-2 rounded-md hover-elevate" data-testid={`row-tg-user-${u.id}`}>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">{u.fullName || "—"}</div>
                        <div className="text-xs text-muted-foreground">{u.employeeId} · {u.role}</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="font-mono text-xs">
                      {u.telegramChatId}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
