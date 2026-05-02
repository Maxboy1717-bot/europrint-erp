import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Send, Users, Bot, CheckCircle, XCircle, MessageSquare,
  Megaphone, User, AlertTriangle
} from "lucide-react";

interface TelegramStats { botStatus?: string; totalEmployees?: number; telegramConnected?: number; activeToday?: number }
interface TelegramUser { id: number; fullName?: string; employeeId?: number; role?: string; telegramChatId?: string }

export default function TelegramBotAdmin() {
  const { toast } = useToast();
  const [broadcastMsg, setBroadcastMsg] = useState("");

  const { data: stats, isLoading: loadingStats } = useQuery<TelegramStats>({
    queryKey: ["/api/telegram/admin/stats"],
    refetchInterval: 30000,
  });

  const { data: users, isLoading: loadingUsers } = useQuery<TelegramUser[]>({
    queryKey: ["/api/telegram/admin/users"],
  });

  const broadcastMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/telegram/admin/broadcast", { message: broadcastMsg }),
    onSuccess: (data: Record<string, unknown>) => {
      toast({ title: "Xabar yuborildi", description: `${data.sent} ta xodimga yetkazildi, ${data.failed} ta muvaffaqiyatsiz` });
      setBroadcastMsg("");
    },
    onError: () => toast({ title: "Xato", description: "Xabar yuborilmadi", variant: "destructive" }),
  });

  const botActive = stats?.botStatus === "active";

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Telegram Bot Boshqaruvi"
        description="Bot statistikasi, ulangan foydalanuvchilar va broadcast xabarlar"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loadingStats ? Array(3).fill(0).map((_, i) => <Skeleton key={`k-${i}`} className="h-28" />) : <>
          <Card data-testid="card-bot-status">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2"><Bot className="w-4 h-4" />Bot holati</div>
              {botActive
                ? <Badge className="bg-green-500/10 text-green-700 dark:text-green-400"><CheckCircle className="w-3 h-3 mr-1" />Faol</Badge>
                : <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />O'chiq</Badge>
              }
              {!botActive && <p className="text-xs text-muted-foreground mt-2">TELEGRAM_BOT_TOKEN sozlanmagan</p>}
            </CardContent>
          </Card>
          <Card data-testid="card-total-employees">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1"><Users className="w-4 h-4" />Jami xodimlar</div>
              <div className="text-3xl font-bold">{stats?.totalEmployees || 0}</div>
            </CardContent>
          </Card>
          <Card data-testid="card-telegram-connected">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1"><MessageSquare className="w-4 h-4" />Telegram ulangan</div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats?.telegramConnected || 0}</div>
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
            <CardTitle className="flex items-center gap-2 text-base"><Megaphone className="w-4 h-4" />Ommaviy xabar yuborish</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!botActive && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Bot ulangimagan. TELEGRAM_BOT_TOKEN kerak.
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="broadcast-msg">Xabar matni (HTML teglari qo'llab-quvvatlanadi)</Label>
              <Textarea
                id="broadcast-msg"
                data-testid="input-broadcast-message"
                placeholder="<b>Muhim xabar!</b> Barcha xodimlarga..."
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
                ? <><span className="animate-spin mr-2">⟳</span>Yuborilmoqda...</>
                : <><Send className="w-4 h-4 mr-2" />Hammaga yuborish ({stats?.telegramConnected || 0} xodim)</>
              }
            </Button>
            <p className="text-xs text-muted-foreground">
              Faqat Telegramni ulagan xodimlar xabar oladi.
            </p>
          </CardContent>
        </Card>

        {/* Connected Users */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="w-4 h-4" />Ulangan xodimlar
              {users && <Badge variant="secondary">{users.length}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingUsers ? <Skeleton className="h-48" /> : (
              <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                {users?.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">Hech kim Telegramni ulamagan</p>
                )}
                {users?.map((u) => (
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
