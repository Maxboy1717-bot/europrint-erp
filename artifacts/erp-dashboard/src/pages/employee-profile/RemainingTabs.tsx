import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, GraduationCap, AlertTriangle, AlertCircle, Award, BookOpen, Target, FileText, HardHat, Users, TrendingUp, CheckCircle2, XCircle, MinusCircle, MessageSquareWarning, ClipboardX, Lock, RefreshCw } from "lucide-react";
import type {
  DisciplineRecord, Certificate, CourseProgressRecord, SafetyViolation,
  DisciplineStats, SkillGapData, SkillGap, MentorshipData, MentorshipRecord,
  CustomerComplaint, AssessmentSkipRecord, TranslationFn
} from "./profile-types";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";

const COMPLAINT_TYPE_LABELS: Record<string, string> = {
  quality: "Sifat muammosi",
  delivery: "Yetkazib berish kechikdi",
  behavior: "Xizmat ko'rsatish",
  damage: "Mahsulot zarari",
  billing: "To'lov muammosi",
  other: "Boshqa",
};

const SEVERITY_LABELS: Record<string, { label: string; className: string }> = {
  low: { label: "Past", className: "border-yellow-300 text-yellow-700" },
  medium: { label: "O'rta", className: "border-orange-300 text-orange-700" },
  high: { label: "Yuqori", className: "border-red-300 text-red-700" },
};

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  open: { label: "Ochiq", variant: "destructive" },
  resolved: { label: "Hal qilindi", variant: "secondary" },
  rejected: { label: "Rad etildi", variant: "outline" },
};

interface DisciplineTabProps {
  tCommon: TranslationFn;
  loadingDiscipline: boolean;
  disciplineData: DisciplineRecord[] | undefined;
  disciplineStats: DisciplineStats;
  customerComplaints?: CustomerComplaint[];
  loadingComplaints?: boolean;
  assessmentSkips?: AssessmentSkipRecord[];
  loadingSkips?: boolean;
}

export function DisciplineTab({
  tCommon, loadingDiscipline, disciplineData, disciplineStats,
  customerComplaints, loadingComplaints, assessmentSkips, loadingSkips,
}: DisciplineTabProps) {
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api"] })} className="sr-only" aria-label="Yangilash"><RefreshCw className="h-4 w-4" /></Button>
    <div className="space-y-6">
      {loadingDiscipline ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-64" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Ogohlantirishlar</p>
                    <p className="text-3xl font-bold text-yellow-600">{disciplineStats.warnings}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Jarimalar</p>
                    <p className="text-3xl font-bold text-red-600">{disciplineStats.penalties}</p>
                    {disciplineStats.totalPenaltyAmount > 0 && (
                      <p className="text-xs text-muted-foreground">{disciplineStats.totalPenaltyAmount.toLocaleString()} so'm</p>
                    )}
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Mukofotlar</p>
                    <p className="text-3xl font-bold text-green-600">{disciplineStats.rewards}</p>
                    {disciplineStats.totalRewardAmount > 0 && (
                      <p className="text-xs text-muted-foreground">{disciplineStats.totalRewardAmount.toLocaleString()} so'm</p>
                    )}
                  </div>
                  <Award className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Intizom tarixi — o'zgarmas jurnal */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Intizom tarixi
                  </CardTitle>
                  <CardDescription>Ogohlantirish, jarima va mukofotlar</CardDescription>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-on-surface-variant bg-surface-container rounded-md px-2.5 py-1.5">
                  <Lock className="h-3.5 w-3.5 text-slate-500" />
                  <span>O'zgarmas jurnal — o'chirib bo'lmaydi</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {disciplineData && disciplineData.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sana</TableHead>
                      <TableHead>Turi</TableHead>
                      <TableHead>Sabab</TableHead>
                      <TableHead>Summa</TableHead>
                      <TableHead>Bergan</TableHead>
                      <TableHead>Holat</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Array.isArray(disciplineData) ? disciplineData : []).map((record: DisciplineRecord) => (
                      <TableRow key={record.id} data-testid={`row-discipline-${record.id}`}>
                        <TableCell>{record.createdAt ? new Date(record.createdAt).toLocaleDateString('uz-UZ') : "-"}</TableCell>
                        <TableCell>
                          {record.type === "warning" && <Badge className="bg-yellow-500">Ogohlantirish</Badge>}
                          {record.type === "penalty" && <Badge variant="destructive">Jarima</Badge>}
                          {record.type === "reward" && <Badge className="bg-green-500">Mukofot</Badge>}
                        </TableCell>
                        <TableCell className="max-w-[200px]">{record.reason || "-"}</TableCell>
                        <TableCell>
                          {record.amount ? (
                            <span className={record.type === "reward" ? "text-green-600" : record.type === "penalty" ? "text-red-600" : ""}>
                              {record.amount.toLocaleString()} so'm
                            </span>
                          ) : "-"}
                        </TableCell>
                        <TableCell>{record.givenByName || "-"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs text-slate-400">
                            <Lock className="h-3 w-3" />
                            <span>Yozildi</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-8">{tCommon('noData')}</p>
              )}
            </CardContent>
          </Card>

          {/* Mijoz shikoyatlari */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquareWarning className="h-5 w-5 text-orange-500" />
                Mijoz shikoyatlari
              </CardTitle>
              <CardDescription>Ushbu xodim bilan bog'liq mijoz shikoyatlari</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingComplaints ? (
                <div className="space-y-2">
                  {([...Array(3)]).map((_, i) => <Skeleton key={`k-${i}`} className="h-12" />)}
                </div>
              ) : customerComplaints && customerComplaints.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sana</TableHead>
                      <TableHead>Mijoz</TableHead>
                      <TableHead>Turi</TableHead>
                      <TableHead>Darajasi</TableHead>
                      <TableHead>Holati</TableHead>
                      <TableHead>Tavsif</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Array.isArray(customerComplaints) ? customerComplaints : []).map((complaint) => {
                      const sev = SEVERITY_LABELS[complaint.severity] || { label: complaint.severity, className: "" };
                      const st = STATUS_LABELS[complaint.status] || { label: complaint.status, variant: "outline" as const };
                      return (
                        <TableRow key={complaint.id} data-testid={`row-complaint-${complaint.id}`}>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(complaint.createdAt).toLocaleDateString('uz-UZ')}
                          </TableCell>
                          <TableCell className="font-medium text-sm">{complaint.customerName || "—"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {COMPLAINT_TYPE_LABELS[complaint.complaintType] || complaint.complaintType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-xs ${sev.className}`}>{sev.label}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={st.variant} className="text-xs">{st.label}</Badge>
                          </TableCell>
                          <TableCell className="text-sm max-w-[200px] truncate text-muted-foreground">
                            {complaint.description}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center py-8 text-muted-foreground">
                  <MessageSquareWarning className="h-8 w-8 mb-2 opacity-20" />
                  <p className="text-sm">Mijoz shikoyatlari topilmadi</p>
                  <p className="text-xs opacity-60 mt-1">Ushbu xodim bilan bog'liq shikoyat qayd etilmagan</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Baholash o'tkazib yuborishlar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardX className="h-5 w-5 text-red-500" />
                Baholash o'tkazib yuborishlar
              </CardTitle>
              <CardDescription>360° baholash va attestatsiyalarni o'tkazib yuborish qaydlari</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSkips ? (
                <div className="space-y-2">
                  {([...Array(3)]).map((_, i) => <Skeleton key={`k-${i}`} className="h-12" />)}
                </div>
              ) : assessmentSkips && assessmentSkips.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Davr</TableHead>
                      <TableHead>Kutilgan sana</TableHead>
                      <TableHead>Sabab</TableHead>
                      <TableHead>Kim tomonidan</TableHead>
                      <TableHead>Holati</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Array.isArray(assessmentSkips) ? assessmentSkips : []).map((skip) => (
                      <TableRow key={skip.id} data-testid={`row-skip-${skip.id}`}>
                        <TableCell className="font-medium">
                          {skip.periodYear}-{String(skip.periodMonth).padStart(2, "0")}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(skip.expectedDate).toLocaleDateString('uz-UZ')}
                        </TableCell>
                        <TableCell className="text-sm max-w-[180px] truncate">
                          {skip.reason || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {skip.skippedBy === "employee" ? "Xodim" : skip.skippedBy === "manager" ? "Rahbar" : "Tizim"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {skip.status === "unexcused" ? (
                            <Badge variant="destructive" className="text-xs">Uzrsiz</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Uzrli</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center py-8 text-muted-foreground">
                  <ClipboardX className="h-8 w-8 mb-2 opacity-20" />
                  <p className="text-sm">Baholash o'tkazib yuborishlar topilmadi</p>
                  <p className="text-xs opacity-60 mt-1">Xodim barcha rejalashtirilgan baholashlarda qatnashgan</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
    </>
  );
}

interface LearningTabProps {
  tCommon: TranslationFn;
  loadingCertificates: boolean;
  loadingProgress: boolean;
  certificatesData: Certificate[] | undefined;
  courseProgress: CourseProgressRecord[] | undefined;
  skillGapData?: SkillGapData | null;
  loadingSkillGap?: boolean;
  mentorshipData?: MentorshipData | null;
  loadingMentorship?: boolean;
}

export function LearningTab({ tCommon, loadingCertificates, loadingProgress, certificatesData, courseProgress, skillGapData, loadingSkillGap, mentorshipData, loadingMentorship }: LearningTabProps) {
  return (
    <div className="space-y-6">
            {loadingCertificates || loadingProgress ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                </div>
                <Skeleton className="h-64" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Kurslar</p>
                          <p className="text-3xl font-bold text-blue-600">{courseProgress?.length || 0}</p>
                        </div>
                        <BookOpen className="h-8 w-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Sertifikatlar</p>
                          <p className="text-3xl font-bold text-green-600">{certificatesData?.length || 0}</p>
                        </div>
                        <Award className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">O'rtacha ball</p>
                          <p className="text-3xl font-bold text-purple-600">
                            {certificatesData && certificatesData.length > 0
                              ? Math.round((Array.isArray(certificatesData) ? certificatesData : []).reduce((sum, c) => sum + (c.score || 0), 0) / certificatesData.length)
                              : 0}%
                          </p>
                        </div>
                        <Target className="h-8 w-8 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {courseProgress && courseProgress.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5" />
                        Kurs taraqqiyoti
                      </CardTitle>
                      <CardDescription>Davom etayotgan va tugatilgan kurslar</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(Array.isArray(courseProgress) ? courseProgress : []).map((progress: CourseProgressRecord) => {
                          const progressPercent = progress.completedLessons > 0 && progress.totalLessons > 0
                            ? Math.round((progress.completedLessons / progress.totalLessons) * 100)
                            : 0;
                          return (
                            <Card key={progress.id} className="border" data-testid={`card-progress-${progress.id}`}>
                              <CardContent className="pt-4">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-medium">{progress.course?.title || "Kurs"}</h4>
                                  {progress.isCompleted ? (
                                    <Badge className="bg-green-500">Tugatildi</Badge>
                                  ) : (
                                    <Badge variant="outline">{progressPercent}%</Badge>
                                  )}
                                </div>
                                <div className="w-full bg-secondary rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full ${progress.isCompleted ? 'bg-green-500' : 'bg-blue-500'}`}
                                    style={{ width: `${progressPercent}%` }}
                                  />
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">
                                  {progress.completedLessons || 0}/{progress.totalLessons || 0} darslar
                                </p>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5" />
                      Sertifikatlar
                    </CardTitle>
                    <CardDescription>Olingan sertifikatlar va ularning holati</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {certificatesData && certificatesData.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Sertifikat nomi</TableHead>
                            <TableHead>Beruvchi</TableHead>
                            <TableHead>Berilgan sana</TableHead>
                            <TableHead>Amal qilish</TableHead>
                            <TableHead>Holat</TableHead>
                            <TableHead>Ball</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(Array.isArray(certificatesData) ? certificatesData : []).map((cert: Certificate) => {
                            const isExpired = cert.expiryDate && new Date(cert.expiryDate) < new Date();
                            return (
                              <TableRow key={cert.id} data-testid={`row-certificate-${cert.id}`}>
                                <TableCell className="font-medium">{cert.name || cert.certificateNumber || "-"}</TableCell>
                                <TableCell>{cert.issuer || cert.course?.title || "-"}</TableCell>
                                <TableCell>
                                  {cert.issueDate 
                                    ? new Date(cert.issueDate).toLocaleDateString('uz-UZ') 
                                    : cert.issuedAt 
                                      ? new Date(cert.issuedAt).toLocaleDateString('uz-UZ')
                                      : "-"}
                                </TableCell>
                                <TableCell>
                                  {cert.expiryDate 
                                    ? new Date(cert.expiryDate).toLocaleDateString('uz-UZ') 
                                    : "Muddatsiz"}
                                </TableCell>
                                <TableCell>
                                  {isExpired ? (
                                    <Badge variant="destructive">Muddati o'tgan</Badge>
                                  ) : (
                                    <Badge className="bg-green-500">Amalda</Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {cert.score ? (
                                    <Badge variant="outline">{cert.score}%</Badge>
                                  ) : "-"}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        {tCommon('noData')}
                      </p>
                    )}
                  </CardContent>
                </Card>

                {(loadingSkillGap || (skillGapData && skillGapData.gaps.length > 0)) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-orange-500" />
                        Ko'nikma tahlili (Skill Gap)
                      </CardTitle>
                      <CardDescription>
                        Lavozim talablari va xodim ko'nikmalarini solishtirish
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loadingSkillGap ? (
                        <Skeleton className="h-32" />
                      ) : skillGapData ? (
                        <>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="text-center">
                              <p className="text-2xl font-bold">{skillGapData.summary.totalRequired}</p>
                              <p className="text-xs text-muted-foreground">Jami talab</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-green-600">{skillGapData.summary.met}</p>
                              <p className="text-xs text-muted-foreground">Bajarilgan</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-yellow-600">{skillGapData.summary.gaps}</p>
                              <p className="text-xs text-muted-foreground">Etishmovchi</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-red-600">{skillGapData.summary.missing}</p>
                              <p className="text-xs text-muted-foreground">Mavjud emas</p>
                            </div>
                          </div>
                          {skillGapData.summary.gapPercent > 0 && (
                            <div className="mb-4">
                              <div className="flex justify-between text-sm mb-1">
                                <span>Ko'nikma bo'shlig'i</span>
                                <span className="font-medium text-orange-600">{skillGapData.summary.gapPercent}%</span>
                              </div>
                              <div className="w-full bg-secondary rounded-full h-2">
                                <div
                                  className="h-2 rounded-full bg-orange-500"
                                  style={{ width: `${skillGapData.summary.gapPercent}%` }}
                                />
                              </div>
                            </div>
                          )}
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Ko'nikma</TableHead>
                                <TableHead>Kategoriya</TableHead>
                                <TableHead>Talab</TableHead>
                                <TableHead>Hozirgi</TableHead>
                                <TableHead>Holat</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(Array.isArray(skillGapData.gaps) ? skillGapData.gaps : []).map((gap: SkillGap) => (
                                <TableRow key={gap.skillName} data-testid={`row-skillgap-${gap.skillName}`}>
                                  <TableCell>
                                    <div className="font-medium">{gap.skillName}</div>
                                    {gap.isMandatory && <Badge variant="destructive" className="text-xs mt-1">Majburiy</Badge>}
                                  </TableCell>
                                  <TableCell className="text-muted-foreground text-sm">{gap.skillCategory}</TableCell>
                                  <TableCell>
                                    <div className="flex gap-1">
                                      {Array.from({ length: 5 }).map((_, i) => (
                                        <div key={`k-${i}`} className={`w-3 h-3 rounded-full ${i < gap.requiredLevel ? 'bg-primary' : 'bg-secondary'}`} />
                                      ))}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex gap-1">
                                      {Array.from({ length: 5 }).map((_, i) => (
                                        <div key={`k-${i}`} className={`w-3 h-3 rounded-full ${i < gap.currentLevel ? 'bg-green-500' : 'bg-secondary'}`} />
                                      ))}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {gap.status === "met" && (
                                      <div className="flex items-center gap-1 text-green-600">
                                        <CheckCircle2 className="h-4 w-4" />
                                        <span className="text-sm">Bajarilgan</span>
                                      </div>
                                    )}
                                    {gap.status === "gap" && (
                                      <div className="flex items-center gap-1 text-yellow-600">
                                        <MinusCircle className="h-4 w-4" />
                                        <span className="text-sm">Etishmovchi ({gap.gap} ball)</span>
                                      </div>
                                    )}
                                    {gap.status === "missing" && (
                                      <div className="flex items-center gap-1 text-red-600">
                                        <XCircle className="h-4 w-4" />
                                        <span className="text-sm">Mavjud emas</span>
                                      </div>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </>
                      ) : null}
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-indigo-500" />
                      Mentor / Mentee bog'liqligi
                    </CardTitle>
                    <CardDescription>Mentorlik munosabatlari</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingMentorship ? (
                      <Skeleton className="h-24" />
                    ) : mentorshipData && (mentorshipData.asMentor.length > 0 || mentorshipData.asMentee.length > 0) ? (
                      <div className="space-y-4">
                        {mentorshipData.asMentor.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-indigo-600 mb-2">Mentor sifatida</p>
                            <div className="space-y-2">
                              {(Array.isArray(mentorshipData.asMentor) ? mentorshipData.asMentor : []).map((m: MentorshipRecord) => (
                                <div key={m.id} className="flex items-center justify-between p-3 rounded-md bg-indigo-50/50 dark:bg-indigo-950/20" data-testid={`row-mentor-${m.id}`}>
                                  <div>
                                    <p className="font-medium text-sm">{m.partnerName || "Noma'lum"}</p>
                                    {m.goals && <p className="text-xs text-muted-foreground mt-1">{m.goals}</p>}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">{m.startDate}</Badge>
                                    <Badge className={m.status === "active" ? "bg-green-500" : "bg-muted-foreground"}>
                                      {m.status === "active" ? "Faol" : m.status === "completed" ? "Tugagan" : "Bekor"}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {mentorshipData.asMentee.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-purple-600 mb-2">Mentee sifatida</p>
                            <div className="space-y-2">
                              {(Array.isArray(mentorshipData.asMentee) ? mentorshipData.asMentee : []).map((m: MentorshipRecord) => (
                                <div key={m.id} className="flex items-center justify-between p-3 rounded-md bg-purple-50/50 dark:bg-purple-950/20" data-testid={`row-mentee-${m.id}`}>
                                  <div>
                                    <p className="font-medium text-sm">Mentor: {m.partnerName || "Noma'lum"}</p>
                                    {m.goals && <p className="text-xs text-muted-foreground mt-1">{m.goals}</p>}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">{m.startDate}</Badge>
                                    <Badge className={m.status === "active" ? "bg-green-500" : "bg-muted-foreground"}>
                                      {m.status === "active" ? "Faol" : m.status === "completed" ? "Tugagan" : "Bekor"}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        Mentorlik munosabatlari topilmadi
                      </p>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
    </div>
  );
}

interface SafetyTabProps {
  loadingSafety: boolean;
  safetyViolations: SafetyViolation[] | undefined;
}

export function SafetyTab({ loadingSafety, safetyViolations }: SafetyTabProps) {
  return (
    <div className="space-y-6">
            {loadingSafety ? (
              <div className="space-y-4">
                <Skeleton className="h-24" />
                <Skeleton className="h-64" />
              </div>
            ) : (
              <>
                <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center ${safetyViolations && safetyViolations.length > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                        <HardHat className="h-8 w-8" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Xavfsizlik holati</p>
                        {safetyViolations && safetyViolations.length > 0 ? (
                          <>
                            <p className="text-2xl font-bold text-red-600">{safetyViolations.length} buzilish</p>
                            <p className="text-sm text-muted-foreground">
                              {(Array.isArray(safetyViolations) ? safetyViolations : []).filter(v => !v.resolved).length} ta hal qilinmagan
                            </p>
                          </>
                        ) : (
                          <p className="text-2xl font-bold text-green-600">Xavfsizlik buzilmagan</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <HardHat className="h-5 w-5" />
                      Xavfsizlik qoidalari buzilishi
                    </CardTitle>
                    <CardDescription>AI kamera orqali aniqlangan buzilishlar</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {safetyViolations && safetyViolations.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Sana</TableHead>
                            <TableHead>Turi</TableHead>
                            <TableHead>Kamera</TableHead>
                            <TableHead>Holat</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(Array.isArray(safetyViolations) ? safetyViolations : []).map((violation: SafetyViolation) => (
                            <TableRow key={violation.id} data-testid={`row-violation-${violation.id}`}>
                              <TableCell>
                                {violation.createdAt 
                                  ? new Date(violation.createdAt).toLocaleString('uz-UZ') 
                                  : "-"}
                              </TableCell>
                              <TableCell>{violation.violationType || "-"}</TableCell>
                              <TableCell>{violation.cameraName || "-"}</TableCell>
                              <TableCell>
                                <Badge variant={violation.resolved ? "default" : "destructive"}>
                                  {violation.resolved ? "Hal qilindi" : "Ochiq"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-12">
                        <HardHat className="h-16 w-16 mx-auto text-green-500 mb-4" />
                        <p className="text-lg font-medium text-green-600">Xavfsizlik buzilmagan</p>
                        <p className="text-muted-foreground">Bu xodimda xavfsizlik qoidalari buzilishi qayd etilmagan</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
    </div>
  );
}

export function DocumentsTab() {
  return (
    <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Hujjatlar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  Hujjatlar yuklanmagan
                </p>
              </CardContent>
            </Card>
    </div>
  );
}
