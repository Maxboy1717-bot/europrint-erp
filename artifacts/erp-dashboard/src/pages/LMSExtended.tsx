/**
 * @module LMSExtended
 * @description React page component. Route-level UI.
 */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsTrigger, TabsList } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BookOpen, Award, Plus, Play, RefreshCw, ClipboardList, Zap, Send, CheckCircle2 } from "lucide-react";
import type { LMSCourse, LMSTest } from "./lms-extended/types";
import { URL_TAB_MAP, tabMeta } from "./lms-extended/types";
import { MicroLearningTab } from "./lms-extended/MicroLearningTab";
import { KnowledgeBaseTab } from "./lms-extended/KnowledgeBaseTab";
import { GamificationTab } from "./lms-extended/GamificationTab";
import { EPPageHeader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
import { useAuth } from "@/hooks/useAuth";

const CourseSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  duration: z.string().min(1),
  level: z.string().min(1),
  status: z.string().min(1),
});

const TestSchema = z.object({
  title: z.string().min(1),
  courseId: z.string().min(1),
  passingScore: z.string().min(1),
  timeLimit: z.string().min(1),
});

export default function LMSExtended() {
  const { t } = useTranslation("common");
  const { hasRole } = useAuth();
  const canSubmitCourse = hasRole('TRAINING_OFFICER', 'HR_MANAGER', 'DIRECTOR', 'SUPER_ADMIN');
  const canApproveCourse = hasRole('HR_MANAGER', 'DIRECTOR', 'SUPER_ADMIN');
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState(URL_TAB_MAP[location] || "author");
  useEffect(() => { const tab = URL_TAB_MAP[location]; if (tab) setActiveTab(tab); }, [location]);

  const { toast } = useToast();
  const [showCourseDialog, setShowCourseDialog] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);

  const courseForm = useForm({ resolver: zodResolver(CourseSchema), defaultValues: { title: "", description: "", duration: "", level: "beginner", status: "draft" } });
  const testForm = useForm({ resolver: zodResolver(TestSchema), defaultValues: { title: "", courseId: "", passingScore: "70", timeLimit: "60" } });

  const { data: courses = [], isLoading: coursesLoading, refetch: refetchCourses } = useQuery<LMSCourse[]>({ queryKey: ["/api/courses"] });
  const { data: tests = [], isLoading: testsLoading, refetch: refetchTests } = useQuery<LMSTest[]>({ queryKey: ["/api/tests"] });

  const createCourse = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/courses", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/courses"] }); setShowCourseDialog(false); courseForm.reset(); toast({ title: "Kurs yaratildi" }); },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  const createTest = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/tests", { ...data, passingScore: Number(data.passingScore), timeLimit: Number(data.timeLimit) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/tests"] }); setShowTestDialog(false); testForm.reset(); toast({ title: "Test yaratildi" }); },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  const submitCourseForReview = useMutation({
    mutationFn: (courseId: number | string) => apiRequest("POST", `/api/lms/courses/${courseId}/submit`, {}),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/courses"] }); toast({ title: "Kurs ko'rib chiqishga yuborildi" }); },
    onError: (e: Error) => toast({ title: "Xatolik", description: e?.message, variant: "destructive" }),
  });

  const approveCourseMutation = useMutation({
    mutationFn: (courseId: number | string) => apiRequest("POST", `/api/lms/courses/${courseId}/approve`, {}),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/courses"] }); toast({ title: "Kurs tasdiqlandi" }); },
    onError: (e: Error) => toast({ title: "Xatolik", description: e?.message, variant: "destructive" }),
  });

  const publishedCourses = (Array.isArray(courses) ? courses : []).filter((c) => c.status === "published" || c.isPublished);
  const draftCourses = (Array.isArray(courses) ? courses : []).filter((c) => c.status === "draft" || (!c.isPublished && c.status !== "published"));

  const { data: leaderboardRaw = [], isLoading: leaderboardLoading } = useQuery<Array<{
    userId: string; fullName: string; employeeId: string; positionName?: string; departmentName?: string;
    completedLessons: number; completedCourses: number; averageScore: number; passedTests: number; totalBonus: number; overallScore: number;
  }>>({ queryKey: ["/api/analytics/leaderboard/employees"] });

  const leaderboard = (Array.isArray(leaderboardRaw) ? leaderboardRaw : []).map((e, i) => ({
    rank: i + 1, name: e.fullName, points: e.overallScore, courses: e.completedCourses,
    badge: e.overallScore >= 100 ? "Ekspert" : e.overallScore >= 50 ? "Senior" : e.overallScore >= 20 ? "Intermediate" : "Boshlang'ich",
  }));

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-primary" />
          <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("lmsKengaytirilgan")}</b></>}
        title={t("lmsKengaytirilgan")}
      />
          {courses.length > 0 && <Badge className="ml-2 bg-muted/60 text-foreground border-none shadow-none rounded-full px-2.5 py-0.5 text-xs font-semibold">{courses.length} kurs</Badge>}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b border-border px-4 bg-muted/40">
          <TabsList className="bg-transparent h-12 gap-4">
            {Object.entries(tabMeta).map(([key, meta]) => (
              <TabsTrigger key={key} value={key} className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-4 text-muted-foreground font-medium transition-all">
                <meta.icon className="h-4 w-4 mr-2" />{meta.title}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="flex-1 overflow-auto p-6 bg-background">
          <TabsContent value="author" className="mt-0 space-y-6 outline-none">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">{t("kurslarBoshqaruvi")}</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => refetchCourses()} className="bg-muted/60 text-foreground hover:bg-muted border-none rounded-lg px-4 font-medium"><RefreshCw className="h-3.5 w-3.5 mr-1.5" />{t("refresh")}</Button>
                <Button size="sm" onClick={() => setShowCourseDialog(true)} data-testid="button-create-course" className="bg-primary text-white rounded-lg px-5 py-2 text-sm font-semibold shadow-none"><Plus className="h-3.5 w-3.5 mr-1.5" />{t("yangiKurs")}</Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {([{ l: "Jami kurslar", v: courses.length, c: "text-foreground" }, { l: "Nashr qilingan", v: publishedCourses.length, c: "text-[var(--ep-green)]" }, { l: "Qoralama", v: draftCourses.length, c: "text-[var(--ep-yellow)]" }, { l: "Testlar", v: tests.length, c: "text-primary" }]).map(s => (
                <div key={s.l} className="bg-card rounded-lg p-5 border border-border"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{s.l}</p><p className={`text-4xl font-bold tracking-tight ${s.c}`}>{s.v}</p></div>
              ))}
            </div>
            <Card className="bg-card border-border shadow-none">
              <CardContent className="p-0">
                <div className="ep-table-scroll"><Table>
                  <TableHeader className="sticky top-0 z-10 bg-card"><TableRow className="border-none hover:bg-transparent">
                    {(["Kurs nomi","Daraja","Davomiylik","Holati","Tasdiq","Amallar"]).map((h,i) => <TableHead key={h} className={`bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 ${i===0?"rounded-l-lg":""} ${i===5?"text-right rounded-r-lg":""}`}>{h}</TableHead>)}
                  </TableRow></TableHeader>
                  <TableBody>
                    {coursesLoading ? <TableRow className="border-none"><TableCell colSpan={6} className="text-center py-6 text-[13px] text-muted-foreground">{t("Yuklanmoqda...")}</TableCell></TableRow>
                    : courses.length === 0 ? <TableRow className="border-none"><TableCell colSpan={6} className="text-center py-8 text-[13px] text-muted-foreground"><BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />{t("kurslarYoq")}</TableCell></TableRow>
                    : (Array.isArray(courses) ? courses : []).slice(0, 15).map((c) => {
                      const approvalStatus = c.approval_status ?? 'draft';
                      return (
                      <TableRow key={c.id} data-testid={`row-course-${c.id}`} className="border-none hover:bg-muted/40 transition-colors">
                        <TableCell className="font-medium px-6 text-foreground">{c.title || c.name}</TableCell>
                        <TableCell className="px-6"><Badge variant="outline" className="border-border text-foreground bg-muted/60 rounded-full px-2 py-0.5 text-xs font-medium">{c.level === "beginner" ? "Boshlang'ich" : c.level === "intermediate" ? "O'rta" : c.level === "advanced" ? "Yuqori" : c.level || "—"}</Badge></TableCell>
                        <TableCell className="text-muted-foreground px-6">{c.duration ? `${c.duration} soat` : "—"}</TableCell>
                        <TableCell className="px-6"><Badge className={c.status === "published" || c.isPublished ? "bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-none border-none" : "bg-muted/60 text-foreground rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-none border-none"}>{c.status === "published" || c.isPublished ? "Nashr" : "Qoralama"}</Badge></TableCell>
                        <TableCell className="px-6" data-testid={`badge-approval-${c.id}`}>
                          <Badge className={
                            approvalStatus === "approved" ? "bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-none border-none"
                            : approvalStatus === "review" ? "bg-yellow-100 text-yellow-800 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-none border-none"
                            : "bg-muted/60 text-foreground rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-none border-none"
                          }>
                            {approvalStatus === "approved" ? "Tasdiqlangan" : approvalStatus === "review" ? "Ko'rib chiqilmoqda" : "Qoralama"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right px-6">
                          <div className="flex items-center justify-end gap-1">
                            {approvalStatus === "draft" && canSubmitCourse && (
                              <Button
                                size="sm" variant="outline"
                                data-testid={`button-submit-course-${c.id}`}
                                disabled={submitCourseForReview.isPending}
                                onClick={() => submitCourseForReview.mutate(c.id)}
                                className="bg-muted/60 text-foreground hover:bg-muted border-none rounded-lg px-3 text-xs font-medium"
                              ><Send className="h-3.5 w-3.5 mr-1.5" />Yuborish</Button>
                            )}
                            {approvalStatus === "review" && canApproveCourse && (
                              <Button
                                size="sm"
                                data-testid={`button-approve-course-${c.id}`}
                                disabled={approveCourseMutation.isPending}
                                onClick={() => approveCourseMutation.mutate(c.id)}
                                className="bg-primary text-white rounded-lg px-3 text-xs font-semibold shadow-none"
                              ><CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />Tasdiqlash</Button>
                            )}
                            <Button size="icon" variant="ghost" data-testid={`button-play-${c.id}`} className="hover:bg-muted text-foreground"><Play className="h-3.5 w-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      );
                    })}
                  </TableBody>
                </Table></div>
              </CardContent>
            </Card>
            <Dialog open={showCourseDialog} onOpenChange={setShowCourseDialog}>
              <DialogContent className="bg-card border-border p-6">
                <DialogHeader><DialogTitle className="text-foreground">{t("yangiKursYaratish")}</DialogTitle></DialogHeader>
                <form onSubmit={courseForm.handleSubmit(d => createCourse.mutate(d))} className="space-y-4">
                  <div className="space-y-2"><Label className="text-foreground">{t("kursNomi")}</Label><Input {...courseForm.register("title")} placeholder={t("kursNominiKiriting")} data-testid="input-course-title" className="bg-muted/40 border-border" /></div>
                  <div className="space-y-2"><Label className="text-foreground">{t("progress.description")}</Label><Input {...courseForm.register("description")} placeholder={t("qisqaTavsif")} className="bg-muted/40 border-border" /></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2"><Label className="text-foreground">{t("davomiylikSoat")}</Label><Input type="number" {...courseForm.register("duration")} placeholder="4" className="bg-muted/40 border-border" /></div>
                    <div className="space-y-2"><Label className="text-foreground">{t("daraja")}</Label><Controller control={courseForm.control} name="level" render={({ field }) => (<Select value={field.value} onValueChange={field.onChange}><SelectTrigger className="bg-muted/40 border-border h-9"><SelectValue /></SelectTrigger><SelectContent className="bg-card border-border"><SelectItem value="beginner">{t("boshlangich")}</SelectItem><SelectItem value="intermediate">{t("medium")}</SelectItem><SelectItem value="advanced">{t("high")}</SelectItem></SelectContent></Select>)} /></div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" type="button" onClick={() => setShowCourseDialog(false)} className="bg-muted/60 text-foreground hover:bg-muted border-none rounded-lg font-medium">{t("Bekor")}</Button>
                    <Button type="submit" disabled={createCourse.isPending} className="bg-primary text-white rounded-lg px-5 py-2 text-sm font-semibold shadow-none">{t("Yaratish")}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="tests" className="mt-0 space-y-6 outline-none">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">{t("testlarBoshqaruvi")}</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => refetchTests()} className="bg-muted/60 text-foreground hover:bg-muted border-none rounded-lg px-4 font-medium"><RefreshCw className="h-3.5 w-3.5 mr-1.5" />{t("refresh")}</Button>
                <Button size="sm" onClick={() => setShowTestDialog(true)} data-testid="button-create-test" className="bg-primary text-white rounded-lg px-5 py-2 text-sm font-semibold shadow-none"><Plus className="h-3.5 w-3.5 mr-1.5" />{t("testYaratish")}</Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[{ l: "Jami testlar", v: tests.length, c: "text-primary" }, { l: "Faol testlar", v: (Array.isArray(tests) ? tests : []).filter((t) => t.isActive).length, c: "text-[var(--ep-green)]" }, { l: "O'rtacha o'tish bali", v: tests.length > 0 ? `${Math.round((Array.isArray(tests) ? tests : []).reduce((s, t) => s + (t.passingScore || 70), 0) / tests.length)}%` : "70%", c: "text-foreground" }].map(s => (
                <div key={s.l} className="bg-card rounded-lg p-5 border border-border"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{s.l}</p><p className={`text-4xl font-bold tracking-tight ${s.c}`}>{s.v}</p></div>
              ))}
            </div>
            <Card className="bg-card border-border shadow-none">
              <CardContent className="p-0">
                <div className="ep-table-scroll"><Table>
                  <TableHeader className="sticky top-0 z-10 bg-card"><TableRow className="border-none hover:bg-transparent">
                    {(["Test nomi","Kurs","O'tish bali","Vaqt (min)","Holati"]).map((h,i) => <TableHead key={h} className={`bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 ${i===0?"rounded-l-lg":""} ${i===4?"rounded-r-lg":""}`}>{h}</TableHead>)}
                  </TableRow></TableHeader>
                  <TableBody>
                    {testsLoading ? <TableRow className="border-none"><TableCell colSpan={5} className="text-center py-6 text-[13px] text-muted-foreground">{t("Yuklanmoqda...")}</TableCell></TableRow>
                    : tests.length === 0 ? <TableRow className="border-none"><TableCell colSpan={5} className="text-center py-8 text-[13px] text-muted-foreground"><ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-30" />{t("testlarYoq")}</TableCell></TableRow>
                    : (Array.isArray(tests) ? tests : []).slice(0, 15).map((t) => (
                      <TableRow key={t.id} data-testid={`row-test-${t.id}`} className="border-none hover:bg-muted/40 transition-colors">
                        <TableCell className="font-medium px-6 text-foreground">{t.title || t.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground px-6">{t.courseId ? `Kurs #${t.courseId}` : "—"}</TableCell>
                        <TableCell className="px-6"><Badge variant="outline" className="border-border text-foreground bg-muted/60 rounded-full px-2 py-0.5 text-xs font-medium">{t.passingScore || 70}%</Badge></TableCell>
                        <TableCell className="px-6 text-foreground">{t.timeLimit || 60} min</TableCell>
                        <TableCell className="px-6"><Badge className={t.isActive ? "bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-none border-none" : "bg-muted/60 text-foreground rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-none border-none"}>{t.isActive ? "Faol" : "Nofaol"}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table></div>
              </CardContent>
            </Card>
            <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
              <DialogContent className="bg-card border-border p-6">
                <DialogHeader><DialogTitle className="text-foreground">{t("yangiTestYaratish1")}</DialogTitle></DialogHeader>
                <form onSubmit={testForm.handleSubmit(d => createTest.mutate(d))} className="space-y-4">
                  <div className="space-y-2"><Label className="text-foreground">{t("testNomi")}</Label><Input {...testForm.register("title")} placeholder={t("testNominiKiriting")} data-testid="input-test-title" className="bg-muted/40 border-border" /></div>
                  <div className="space-y-2"><Label className="text-foreground">{t("kurs")}</Label><Controller control={testForm.control} name="courseId" render={({ field }) => (<Select value={field.value} onValueChange={field.onChange}><SelectTrigger className="bg-muted/40 border-border h-9"><SelectValue placeholder={t("kursniTanlang")} /></SelectTrigger><SelectContent className="bg-card border-border">{(Array.isArray(courses) ? courses : []).map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.title || c.name}</SelectItem>)}</SelectContent></Select>)} /></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2"><Label className="text-foreground">{t("oTishBali")}</Label><Input type="number" {...testForm.register("passingScore")} min="0" max="100" className="bg-muted/40 border-border" /></div>
                    <div className="space-y-2"><Label className="text-foreground">{t("vaqtChegarasiMin")}</Label><Input type="number" {...testForm.register("timeLimit")} min="1" className="bg-muted/40 border-border" /></div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" type="button" onClick={() => setShowTestDialog(false)} className="bg-muted/60 text-foreground hover:bg-muted border-none rounded-lg font-medium">{t("Bekor")}</Button>
                    <Button type="submit" disabled={createTest.isPending} className="bg-primary text-white rounded-lg px-5 py-2 text-sm font-semibold shadow-none">{t("Yaratish")}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="cert" className="mt-0 space-y-6 outline-none">
            <h2 className="text-xl font-bold text-foreground">{t("operatorSertifikatsiyaMesUchunRuxsat")}</h2>
            <div className="p-4 rounded-lg bg-primary/10/10 border border-primary/20 text-sm text-foreground flex items-start gap-3"><Zap className="h-4 w-4 text-primary mt-0.5" /><p>{t("mesTizimigaKirishUchunStanoq")}</p></div>
            <Card className="bg-card border-border shadow-none">
              <CardContent className="p-0"><div className="ep-table-scroll"><Table><TableHeader className="sticky top-0 z-10 bg-card"><TableRow className="border-none hover:bg-transparent">{(["Operator","Daraja","Tasdiqlangan sertifikatlar","Kutilayotgan"]).map((h,i) => <TableHead key={h} className={`bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 ${i===0?"rounded-l-lg":""} ${i===3?"rounded-r-lg":""}`}>{h}</TableHead>)}</TableRow></TableHeader><TableBody><TableRow className="border-none"><TableCell colSpan={4} className="text-center py-10 text-[13px] text-muted-foreground"><Award className="h-10 w-10 mx-auto mb-3 opacity-20" /><p className="font-medium">{t("sertifikatMalumotlariMavjudEmas")}</p><p className="text-sm mt-1 opacity-70">{t("operatorSertifikatlariMesTizimiOrqali")}</p></TableCell></TableRow></TableBody></Table></div></CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leaderboard" className="mt-0 space-y-6 outline-none">
            <h2 className="text-xl font-bold text-foreground">{t("leaderboard")}</h2>
            {leaderboardLoading ? <div className="space-y-3">{([1,2,3]).map(i => <Skeleton key={`k-${i}`} className="h-20 w-full rounded-lg" />)}</div> : (<>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(Array.isArray(leaderboard) ? leaderboard : []).slice(0, 3).map((l, i) => (
                <div key={`k-${i}`} className={`bg-card rounded-xl p-6 text-center border-2 ${i === 0 ? "border-yellow-400" : i === 1 ? "border-border" : "border-amber-400"}`}>
                  <div className={`text-3xl font-bold mb-2 ${i === 0 ? "text-[var(--ep-yellow)]" : i === 1 ? "text-muted-foreground" : "text-[var(--ep-yellow)]"}`}>#{l.rank}</div>
                  <div className="font-bold text-lg text-foreground">{l.name}</div>
                  <div className="text-4xl font-bold text-primary mt-2 tracking-tight">{l.points}</div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-1">ball</div>
                  <Badge className="mt-4 bg-muted/60 text-foreground border-none shadow-none rounded-full px-3 py-1">{l.badge}</Badge>
                </div>
              ))}
            </div>
            <Card className="bg-card border-border shadow-none">
              <CardContent className="p-0">
                <div className="ep-table-scroll"><Table>
                  <TableHeader className="sticky top-0 z-10 bg-card"><TableRow className="border-none hover:bg-transparent">{(["O'rin","Xodim","Ball","Kurslar","Daraja"]).map((h,i) => <TableHead key={h} className={`bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 ${i===0?"rounded-l-lg w-16 text-center":""} ${i===4?"rounded-r-lg":""}`}>{h}</TableHead>)}</TableRow></TableHeader>
                  <TableBody>{(Array.isArray(leaderboard) ? leaderboard : []).map(l => (
                    <TableRow key={l.rank} data-testid={`row-leader-${l.rank}`} className="border-none hover:bg-muted/40 transition-colors">
                      <TableCell className="font-bold text-center px-6 text-foreground">#{l.rank}</TableCell>
                      <TableCell className="font-medium">{l.name}</TableCell>
                      <TableCell><span className="font-bold text-primary">{l.points}</span></TableCell>
                      <TableCell>{l.courses} ta</TableCell>
                      <TableCell><Badge variant="outline">{l.badge}</Badge></TableCell>
                    </TableRow>
                  ))}</TableBody>
                </Table></div>
              </CardContent>
            </Card>
            </>)}
          </TabsContent>

          <TabsContent value="micro" className="mt-0 outline-none"><MicroLearningTab /></TabsContent>

          <TabsContent value="budget" className="mt-0 space-y-4">
            <h2 className="text-lg font-semibold">{t("talimByudjeti")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {([{ l: "Yillik byudjet", v: "—", c: "text-primary" }, { l: "Sarflangan", v: "—", c: "text-[var(--ep-green)]" }, { l: "Qolgan", v: "—", c: "text-[var(--ep-blue)]" }]).map(s => (<Card key={s.l}><CardContent className="pt-4 pb-3"><div className={`text-2xl font-bold ${s.c}`}>{s.v}</div><div className="text-sm text-muted-foreground">{s.l}</div></CardContent></Card>))}
            </div>
            <Card><CardHeader><CardTitle className="text-base">{t("bolimlarBoyichaTalimByudjeti")}</CardTitle></CardHeader><CardContent className="space-y-3">
              {([{ dept: "Bosma sexi operatorlari", alloc: 35, spent: 22 }, { dept: "Texnolog va Muhandislar", alloc: 25, spent: 15 }, { dept: "Savdo va Marketing", alloc: 20, spent: 8 }, { dept: "HR va Moliya", alloc: 15, spent: 3 }, { dept: "IT va Xavfsizlik", alloc: 25, spent: 0 }]).map(r => {
                const pct = Math.round((r.spent / r.alloc) * 100);
                return (<div key={r.dept}><div className="flex justify-between text-sm mb-1"><span>{r.dept}</span><span className="text-muted-foreground">{r.spent}M/{r.alloc}M so'm</span></div><div className="h-2 bg-muted rounded"><div className={`h-2 rounded ${pct >= 80 ? "bg-red-500" : pct >= 50 ? "bg-yellow-500" : "bg-primary"}`} style={{ width: `${pct}%` }} /></div></div>);
              })}
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="knowledge" className="mt-0 outline-none"><KnowledgeBaseTab /></TabsContent>
          <TabsContent value="gamification" className="mt-0 outline-none"><GamificationTab /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
