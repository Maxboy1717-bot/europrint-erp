import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Award, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";

interface LMSLeaderboardEntry {
  userId: string;
  fullName: string;
  employeeId?: string;
  completedLessons: number;
  completedCourses: number;
  averageScore: number;
  passedTests: number;
  overallScore: number;
}

interface GamificationTabProps {
  leaderboard: LMSLeaderboardEntry[];
  isLoading: boolean;
}

export function GamificationTab({ leaderboard, isLoading }: GamificationTabProps) {
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api"] })} className="sr-only" aria-label="Yangilash"><RefreshCw className="h-4 w-4" /></Button>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Award className="w-5 h-5 text-yellow-500" />O'quv Reytingi (Leaderboard)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  {(["#", "Xodim", "XP Ball", "Kurslar", "Testlar", "Sertifikatlar", "Daraja"]).map(h => <TableHead key={h}>{h}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  ([...Array(5)]).map((_, i) => (
                    <TableRow key={`k-${i}`}>{([...Array(7)]).map((__, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
                  ))
                ) : leaderboard.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Ma'lumot mavjud emas</TableCell></TableRow>
                ) : leaderboard.slice(0, 10).map((r, idx) => {
                  const rank = idx + 1;
                  const score = Math.round(r.overallScore || 0);
                  const level = score >= 200 ? "Ekspert" : score >= 100 ? "Katta" : score >= 50 ? "O'rta" : "Yangi";
                  return (
                    <TableRow key={r.userId} data-testid={`row-leaderboard-${rank}`}>
                      <TableCell>
                        <span className={`font-bold text-lg ${rank === 1 ? "text-yellow-500" : rank === 2 ? "text-on-surface-variant" : rank === 3 ? "text-amber-700" : "text-muted-foreground"}`}>{rank}</span>
                      </TableCell>
                      <TableCell className="font-medium">{r.fullName || "—"}</TableCell>
                      <TableCell><span className="font-mono font-bold text-primary">{score.toLocaleString()}</span></TableCell>
                      <TableCell>{r.completedCourses ?? 0}</TableCell>
                      <TableCell>{r.passedTests ?? 0}</TableCell>
                      <TableCell>{r.completedLessons ?? 0}</TableCell>
                      <TableCell><Badge variant={level === "Ekspert" ? "default" : level === "Katta" ? "secondary" : "outline"}>{level}</Badge></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-base">XP Tizimi</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-2">
            {([
              { action: "Kursni tugatish", xp: "+50 XP" },
              { action: "Test yechish", xp: "+20 XP" },
              { action: "Sertifikat olish", xp: "+100 XP" },
              { action: "Reja bajarish (haftalik)", xp: "+30 XP" },
              { action: "Birinchi bo'lib tugatish", xp: "+150 XP" },
            ]).map((item, i) => (
              <div key={`k-${i}`} className="flex justify-between items-center">
                <span className="text-muted-foreground">{item.action}</span>
                <Badge variant="outline" className="font-mono">{item.xp}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Darajalar</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-2">
            {([
              { level: "Yangi", range: "0–999 XP" },
              { level: "O'rta", range: "1000–1999 XP" },
              { level: "Katta", range: "2000–2999 XP" },
              { level: "Ekspert", range: "3000+ XP" },
            ]).map((item, i) => (
              <div key={`k-${i}`} className="flex justify-between items-center">
                <span>{item.level}</span>
                <span className="text-muted-foreground text-xs font-mono">{item.range}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
}
