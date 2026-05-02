import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Medal, Star, Video, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";

export function GamificationTab() {
  const { data: achievements = [], isLoading: achievementsLoading } = useQuery<Record<string, unknown>[]>({
    queryKey: ["/api/achievements"],
  });

  const { data: videoProgress = [], isLoading: videoLoading } = useQuery<Record<string, unknown>[]>({
    queryKey: ["/api/video-progress"],
  });

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api"] })} className="sr-only" aria-label="Yangilash"><RefreshCw className="h-4 w-4" /></Button>
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-on-surface">Geymifikatsiya va Yutuqlar</h2>
      <p className="text-sm text-on-surface-variant -mt-4">O'quv jarayonini o'yin elementlari bilan jonlantirish</p>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Medal className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold text-on-surface">Yutuqlar (Achievements)</h3>
          <Badge className="bg-primary-container text-on-primary-container rounded-full px-2.5 py-0.5 text-xs border-none ml-auto">{achievements.length} ta</Badge>
        </div>
        {achievementsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{([1,2,3,4]).map(i => <Skeleton key={`k-${i}`} className="h-24 w-full rounded-lg" />)}</div>
        ) : achievements.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-xl p-6 text-center text-on-surface-variant">
            <Medal className="h-10 w-10 mx-auto mb-2 opacity-20" />
            <p className="font-medium">Yutuqlar mavjud emas</p>
            <p className="text-sm mt-1 opacity-70">Xodimlar kurslarni yakunlaganda avtomatik beriladi</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {achievements.slice(0, 8).map((ach, i) => (
              <div key={`k-${i}`} className="bg-surface-container-lowest rounded-xl p-4 flex flex-col items-center text-center gap-2" data-testid={`card-achievement-${i}`}>
                <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center"><Star className="h-6 w-6 text-primary" /></div>
                <div className="font-medium text-sm text-on-surface">{String(ach.name || ach.title || `Yutuq #${i+1}`)}</div>
                {!!ach.description && <div className="text-xs text-on-surface-variant">{String(ach.description)}</div>}
                {!!ach.points && <Badge className="bg-amber-100 text-amber-800 rounded-full px-2.5 py-0.5 text-xs font-semibold border-none">{Number(ach.points)} ball</Badge>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Video className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold text-on-surface">Video Ko'rish Progressi</h3>
          <Badge className="bg-surface-container text-on-surface rounded-full px-2.5 py-0.5 text-xs border-none ml-auto">{videoProgress.length} ta yozuv</Badge>
        </div>
        {videoLoading ? (
          <div className="space-y-2">{([1,2,3]).map(i => <Skeleton key={`k-${i}`} className="h-10 w-full rounded-lg" />)}</div>
        ) : videoProgress.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-xl p-6 text-center text-on-surface-variant">
            <Video className="h-10 w-10 mx-auto mb-2 opacity-20" />
            <p className="font-medium">Video progress ma'lumotlari yo'q</p>
            <p className="text-sm mt-1 opacity-70">Xodimlar videolarni tomosha qilganda progress qayd etiladi</p>
          </div>
        ) : (
          <Card className="bg-surface-container-lowest border-outline-variant shadow-none">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-none hover:bg-transparent">
                    {(["Foydalanuvchi", "Video", "Ko'rilgan", "Progress"]).map((h, i) => (
                      <TableHead key={h} className={`bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 ${i === 0 ? "rounded-l-lg" : i === 3 ? "rounded-r-lg" : ""}`}>{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {videoProgress.slice(0, 20).map((vp, i) => {
                    const pct = Number(vp.watchedPercent || vp.progress || 0);
                    return (
                      <TableRow key={`k-${i}`} data-testid={`row-videoprogress-${i}`} className="border-none hover:bg-surface-container-low transition-colors">
                        <TableCell className="px-6 text-on-surface font-medium">{String(vp.userName || vp.userId || "—")}</TableCell>
                        <TableCell className="px-6 text-on-surface">{String(vp.videoTitle || vp.videoId || "—")}</TableCell>
                        <TableCell className="px-6 text-on-surface">{String(vp.watchedSeconds || vp.duration || "—")} s</TableCell>
                        <TableCell className="px-6">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-surface-container rounded-full h-1.5"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(pct, 100)}%` }} /></div>
                            <span className="text-xs font-bold text-on-surface">{pct.toFixed(0)}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
    </>
  );
}
