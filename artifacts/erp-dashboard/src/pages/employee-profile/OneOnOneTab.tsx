/**
 * @module OneOnOneTab
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Star, MessageSquare, Calendar } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { TranslationFn } from "./profile-types";
import { useTranslation } from '@/lib/i18n';

interface OneOnOneRecord {
  id: number;
  meetingDate: string;
  managerName: string | null;
  topics: string | null;
  actionItems: string | null;
  mood: number | null;
  notes: string | null;
  createdAt: string;
}

interface OneOnOneTabProps {
  userId: number;
  tCommon: TranslationFn;
}

const EMPTY_FORM = {
  meeting_date: "",
  topics: "",
  action_items: "",
  mood: "3",
  notes: "",
};

function StarRating({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < value ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"
          }`}
        />
      ))}
    </div>
  );
}

export function OneOnOneTab({ userId, tCommon }: OneOnOneTabProps) {
  const { t } = useTranslation("common");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: meetings, isLoading } = useQuery<OneOnOneRecord[]>({
    queryKey: [`/api/hr/employees/${userId}/one-on-ones`],
    queryFn: async () => {
      const res = (await apiRequest('GET', `/api/hr/employees/${userId}/one-on-ones`)) as unknown as Response;
      if (res.status === 404 || res.status === 204) return [];
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : data.meetings ?? [];
    },
    enabled: !!userId,
  });

  const createMeetingMutation = useMutation({
    mutationFn: async (payload: typeof EMPTY_FORM) =>
      apiRequest("POST", `/api/hr/employees/${userId}/one-on-ones`, {
        ...payload,
        mood: parseInt(payload.mood, 10) || 3,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/hr/employees/${userId}/one-on-ones`],
      });
      setDialogOpen(false);
      setForm(EMPTY_FORM);
    },
  });

  const list = meetings ?? [];
  const totalMeetings = list.length;

  const lastMeeting =
    list.length > 0
      ? list.reduce((latest, m) =>
          new Date(m.meetingDate) > new Date(latest.meetingDate) ? m : latest
        )
      : null;

  const avgMood =
    list.length > 0
      ? list.filter((m) => m.mood !== null && m.mood !== undefined).reduce((sum, m) => sum + (m.mood ?? 0), 0) /
        list.filter((m) => m.mood !== null && m.mood !== undefined).length
      : 0;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="from-blue-500/10 to-blue-600/10 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("jamiUchrashuvlar")}</p>
                <p className="text-3xl font-bold text-[var(--ep-blue)]">{totalMeetings}</p>
              </div>
              <Users className="h-8 w-8 text-[var(--ep-blue)]" />
            </div>
          </CardContent>
        </Card>

        <Card className="from-purple-500/10 to-purple-600/10 border-purple-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("oxirgiUchrashuv")}</p>
                <p className="text-lg font-bold text-[var(--ep-purple)]">
                  {lastMeeting
                    ? new Date(lastMeeting.meetingDate).toLocaleDateString("uz-UZ")
                    : "—"}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-[var(--ep-purple)]" />
            </div>
          </CardContent>
        </Card>

        <Card className="from-yellow-500/10 to-yellow-600/10 border-yellow-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("ortachaKayfiyat")}</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-3xl font-bold text-[var(--ep-yellow)]">
                    {avgMood > 0 ? avgMood.toFixed(1) : "—"}
                  </p>
                  {avgMood > 0 && (
                    <StarRating value={Math.round(avgMood)} />
                  )}
                </div>
              </div>
              <Star className="h-8 w-8 text-[var(--ep-yellow)]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Meetings List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                {t("k1On1UchrashuvlarTarixi")}
              </CardTitle>
              <CardDescription>
                {t("rahbarBilanIndividualUchrashuvlarVa")}
              </CardDescription>
            </div>
            <Button onClick={() => setDialogOpen(true)} size="sm">
              {t("uchrashuvQoshish")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {list.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-muted-foreground">
              <Users className="h-16 w-16 mb-4 opacity-20" />
              <p className="text-lg font-medium">{t("uchrashuvlarQaydEtilmagan")}</p>
              <p className="text-sm opacity-60 mt-1 mb-4">
                {t("birinchi1On1Uchrashuv")}
              </p>
              <Button onClick={() => setDialogOpen(true)} variant="outline">
                {t("uchrashuvQoshish")}
              </Button>
            </div>
          ) : (
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("date")}</TableHead>
                  <TableHead>{t("rahbar")}</TableHead>
                  <TableHead>{t("mavzular")}</TableHead>
                  <TableHead>{t("vazifalar")}</TableHead>
                  <TableHead>{t("kayfiyat")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((meeting) => (
                  <TableRow key={meeting.id} data-testid={`meeting-row-${meeting.id}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="whitespace-nowrap text-sm">
                      {new Date(meeting.meetingDate).toLocaleDateString("uz-UZ")}
                    </TableCell>
                    <TableCell className="text-sm">
                      {meeting.managerName ? (
                        <Badge variant="outline" className="text-xs">
                          {meeting.managerName}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      {meeting.topics ? (
                        <p className="text-sm line-clamp-2">{meeting.topics}</p>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      {meeting.actionItems ? (
                        <p className="text-sm line-clamp-2">{meeting.actionItems}</p>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {meeting.mood !== null && meeting.mood !== undefined ? (
                        <div className="flex items-center gap-1">
                          <StarRating value={meeting.mood} />
                          <span className="text-xs text-muted-foreground">
                            ({meeting.mood}/5)
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          )}
        </CardContent>
      </Card>

      {/* Create Meeting Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              {t("yangiUchrashuvQoshish")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="meeting-date">{t("uchrashuvSanasi")}</Label>
              <Input
                id="meeting-date"
                type="date"
                value={form.meeting_date}
                onChange={(e) => setForm({ ...form, meeting_date: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="meeting-topics">{t("muhokamaQilinganMavzular")}</Label>
              <Textarea
                id="meeting-topics"
                placeholder={t("uchrashuvDavomidaMuhokamaQilinganAsosiy")}
                value={form.topics}
                onChange={(e) => setForm({ ...form, topics: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="meeting-action-items">{t("kelgusidagiVazifalar")}</Label>
              <Textarea
                id="meeting-action-items"
                placeholder={t("uchrashuvNatijasidaBelgilanganVazifalar")}
                value={form.action_items}
                onChange={(e) => setForm({ ...form, action_items: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="meeting-mood">
                Kayfiyat (1 — past, 5 — yuqori)
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  id="meeting-mood"
                  type="number"
                  min={1}
                  max={5}
                  value={form.mood}
                  onChange={(e) => setForm({ ...form, mood: e.target.value })}
                  className="w-20"
                />
                <StarRating value={parseInt(form.mood, 10) || 0} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="meeting-notes">{t("qoshimchaIzohlar1")}</Label>
              <Textarea
                id="meeting-notes"
                placeholder={t("uchrashuvBoyichaQoshimchaEslatmalar")}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setForm(EMPTY_FORM);
              }}
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={() => createMeetingMutation.mutate(form)}
              disabled={!form.meeting_date || createMeetingMutation.isPending}
            >
              {createMeetingMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
