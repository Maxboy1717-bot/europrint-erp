/**
 * @module recruiting/helpers-channel-status
 * @description ChannelStatusPanel — vacancy channel toggle and announce
 *   buttons. Split out so sibling files stay under 300 lines.
 */

import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Globe, Send, RefreshCcw } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

import {
  ALL_CHANNELS,
  CHANNEL_COLORS,
  CHANNEL_LABELS,
  CHANNEL_STATUS_LABELS,
} from "./helpers-constants";
import type { Vacancy } from "@/components/recruiting/types";

export function ChannelStatusPanel({
  vacancy,
  onUpdate,
}: {
  vacancy: Vacancy;
  onUpdate?: () => void;
}) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const channels = vacancy.channels ?? {};

  const updateChannelMutation = useMutation({
    mutationFn: ({ channel, status }: { channel: string; status: string }) =>
      apiRequest("POST", `/api/hr/recruitment/vacancies/${vacancy.id}/channel-status`, { channel, status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/recruitment/vacancies"] });
      toast({ title: "Kanal holati yangilandi" });
      onUpdate?.();
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const announceOnTelegramMutation = useMutation({
    mutationFn: () =>
      apiRequest<{ ok?: boolean; message?: string }>(
        "POST",
        `/api/hr/recruitment/vacancies/${vacancy.id}/telegram-announce`,
        {}
      ),
    onSuccess: (data: { ok?: boolean; message?: string }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/recruitment/vacancies"] });
      toast({
        title: data?.ok ? "Telegram kanaliga e'lon yuborildi!" : "E'lon yuborilmadi",
        description: data?.message ?? "",
      });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const notifyAlumniMutation = useMutation({
    mutationFn: () =>
      apiRequest<{ message?: string }>(
        "POST",
        `/api/hr/recruitment/vacancies/${vacancy.id}/alumni-notify`,
        {}
      ),
    onSuccess: (data: { message?: string }) => {
      toast({ title: `Alumni bildirishnomasi`, description: data?.message ?? "Yuborildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  return (
    <div className="border border-border/40 rounded-lg p-3 bg-muted/20 space-y-2">
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-xs font-semibold text-foreground flex items-center gap-1">
          <Globe className="w-3.5 h-3.5 text-primary" />
          {t("kanalHolatlari")}
        </p>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-[10px] px-2 gap-1 border-sky-500/40 text-sky-400 hover:bg-[var(--ep-blue)]/90/10"
            onClick={() => announceOnTelegramMutation.mutate()}
            disabled={announceOnTelegramMutation.isPending}
            data-testid={`button-telegram-announce-${vacancy.id}`}
          >
            <Send className="w-2.5 h-2.5" />
            {t("telegram")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-[10px] px-2 gap-1 border-indigo-500/40 text-indigo-400 hover:bg-[var(--ep-blue)]/90/10"
            onClick={() => notifyAlumniMutation.mutate()}
            disabled={notifyAlumniMutation.isPending}
            data-testid={`button-alumni-notify-${vacancy.id}`}
          >
            <RefreshCcw className="w-2.5 h-2.5" />
            {t("alumni")}
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-1.5">
        {ALL_CHANNELS.map((ch) => {
          const chData = channels[ch] as { active?: boolean; status?: string } | undefined;
          const status = chData?.status ?? (chData?.active ? "posted" : "not_posted");
          const statusInfo = CHANNEL_STATUS_LABELS[status] ?? CHANNEL_STATUS_LABELS.not_posted;
          return (
            <div key={ch} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${CHANNEL_COLORS[ch] ?? "bg-gray-400"}`} />
                <span className="text-xs text-foreground">{CHANNEL_LABELS[ch] ?? ch}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className={`text-[10px] border rounded-full px-2 py-0.5 ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
                <Select
                  value={status}
                  onValueChange={(newStatus) =>
                    updateChannelMutation.mutate({ channel: ch, status: newStatus })
                  }
                >
                  <SelectTrigger className="h-5 text-[10px] w-24 px-1.5 border-border/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="posted">{t("elonBerildi")}</SelectItem>
                    <SelectItem value="pending">Ждёт</SelectItem>
                    <SelectItem value="not_posted">{t("berilmadi")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
