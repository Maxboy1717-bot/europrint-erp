/**
 * @module HRLMSSkills
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { GraduationCap, BookOpen, AlertTriangle, CheckCircle, Users, Target, Award, Search } from "lucide-react";
import { EPErrorState } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
interface PositionSkill {
  id: string;
  positionName: string;
  skillName: string;
  skillCategory: string;
  requiredLevel: number;
  isMandatory: boolean;
  certificationRequired: boolean;
}

interface EmployeeSkill {
  id: string;
  skillName: string;
  skillCategory: string;
  currentLevel: number;
  certifiedDate: string | null;
  status: string;
  employee: { fullName: string } | null;
}

interface ExpiringCert {
  id: string;
  skillName: string;
  expiryDate: string;
  employee: { fullName: string } | null;
}

interface SkillStats {
  totalPositionSkills: number;
  totalEmployeeSkills: number;
  byCategory: { category: string; count: number }[];
}

export default function HRLMSSkills() {
  const { t } = useTranslation("common");
  const [skillCategory, setSkillCategory] = useState<string>("all");

  const { data: positionSkills, isError, error, isLoading, refetch} = useQuery<PositionSkill[]>({
    queryKey: ["/api/integration/hr-lms/position-skills"],
  });

  const { data: employeeSkills } = useQuery<EmployeeSkill[]>({
    queryKey: ["/api/integration/hr-lms/employee-skills"],
  });

  const { data: expiringCerts } = useQuery<ExpiringCert[]>({
    queryKey: ["/api/integration/hr-lms/expiring-certifications"],
  });

  const { data: stats } = useQuery<SkillStats>({
    queryKey: ["/api/integration/hr-lms/stats"],
  });

  const levelBadge = (level: number) => {
    const labels = ["", "Boshlang'ich", "O'rta", "Yuqori", "Ekspert", "Master"];
    const colors = ["", "bg-muted/40 text-foreground dark:bg-gray-800 dark:text-gray-200", "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200", "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"];
    return <Badge className={colors[level] || colors[1]}>{labels[level] || `Daraja ${level}`}</Badge>;
  };

  const filteredPositionSkills = skillCategory === "all" ? (positionSkills || []) : (positionSkills || []).filter(s => s.skillCategory === skillCategory);
  const filteredEmployeeSkills = skillCategory === "all" ? (employeeSkills || []) : (employeeSkills || []).filter(s => s.skillCategory === skillCategory);

  const categories = Array.from(new Set([...(positionSkills || []).map(s => s.skillCategory), ...(employeeSkills || []).map(s => s.skillCategory)])).filter(Boolean);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="text-muted-foreground">{t("Yuklanmoqda...")}</div></div>;
  }

  if (isError) {
    return <EPErrorState onRetry={refetch}  error={error} />;
  }

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5" data-testid="page-hr-lms-skills">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">{t("hrLmsIntegratsiya")}</h1>
          <p className="text-muted-foreground">{t("lavozimTalablariKonikmaBoshliqlariSertifikat")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Select value={skillCategory} onValueChange={setSkillCategory}>
          <SelectTrigger className="w-40 h-9" data-testid="select-category"><SelectValue placeholder={t("category")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("Barchasi")}</SelectItem>
            {(Array.isArray(categories) ? categories : []).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900"><BookOpen className="w-5 h-5 text-[var(--ep-blue)]" /></div><div><p className="text-sm text-muted-foreground">{t("lavozimTalablari")}</p><p className="text-2xl font-bold">{stats?.totalPositionSkills || 0}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-md bg-green-100 dark:bg-green-900"><Users className="w-5 h-5 text-[var(--ep-green)]" /></div><div><p className="text-sm text-muted-foreground">{t("xodimKonikmalari1")}</p><p className="text-2xl font-bold">{stats?.totalEmployeeSkills || 0}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-md bg-orange-100 dark:bg-orange-900"><AlertTriangle className="w-5 h-5 text-[var(--ep-primary)]" /></div><div><p className="text-sm text-muted-foreground">{t("tugayotganSertifikatlar")}</p><p className="text-2xl font-bold">{(expiringCerts || []).length}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-md bg-purple-100 dark:bg-purple-900"><GraduationCap className="w-5 h-5 text-[var(--ep-purple)]" /></div><div><p className="text-sm text-muted-foreground">{t("kategoriyalar")}</p><p className="text-2xl font-bold">{(stats?.byCategory || []).length}</p></div></div></CardContent></Card>
      </div>

      <Tabs defaultValue="positions" className="w-full">
        <TabsList>
          <TabsTrigger value="positions" data-testid="tab-positions">{t("lavozimTalablari")}</TabsTrigger>
          <TabsTrigger value="employee-skills" data-testid="tab-employee-skills">{t("xodimKonikmalari1")}</TabsTrigger>
          <TabsTrigger value="expiring" data-testid="tab-expiring">{t("tugayotganSertifikatlar")}</TabsTrigger>
        </TabsList>
        <TabsContent value="positions">
          <Card>
            <CardContent className="p-0">
              {filteredPositionSkills.length === 0 ? (
                <div className="text-center py-12 text-[13px] text-muted-foreground"><BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>{t("haliLavozimTalablariBelgilanmagan")}</p></div>
              ) : (
                <div className="ep-table-scroll"><Table>
                  <TableHeader><TableRow><TableHead>{t("lavozim1")}</TableHead><TableHead>{t("konikma")}</TableHead><TableHead>{t("category")}</TableHead><TableHead>{t("talabDarajasi")}</TableHead><TableHead>{t("majburiy")}</TableHead><TableHead>{t("sertifikat")}</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {(Array.isArray(filteredPositionSkills) ? filteredPositionSkills : []).map((s) => (
                      <TableRow key={s.id} data-testid={`row-position-skill-${s.id}`} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="font-medium">{s.positionName}</TableCell>
                        <TableCell>{s.skillName}</TableCell>
                        <TableCell><Badge variant="outline">{s.skillCategory}</Badge></TableCell>
                        <TableCell>{levelBadge(s.requiredLevel)}</TableCell>
                        <TableCell>{s.isMandatory ? <CheckCircle className="w-4 h-4 text-[var(--ep-green)]" /> : <span className="text-muted-foreground">-</span>}</TableCell>
                        <TableCell>{s.certificationRequired ? <Award className="w-4 h-4 text-[var(--ep-blue)]" /> : "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table></div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="employee-skills">
          <Card>
            <CardContent className="p-0">
              {filteredEmployeeSkills.length === 0 ? (
                <div className="text-center py-12 text-[13px] text-muted-foreground"><Users className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>{t("haliXodimKonikmalariKiritilmagan")}</p></div>
              ) : (
                <div className="ep-table-scroll"><Table>
                  <TableHeader><TableRow><TableHead>{t("xodim1")}</TableHead><TableHead>{t("konikma")}</TableHead><TableHead>{t("category")}</TableHead><TableHead>{t("joriyDaraja1")}</TableHead><TableHead>{t("sertifikat")}</TableHead><TableHead>{t("status28")}</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {(Array.isArray(filteredEmployeeSkills) ? filteredEmployeeSkills : []).map((s) => (
                      <TableRow key={s.id} data-testid={`row-employee-skill-${s.id}`} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="font-medium">{s.employee?.fullName || "-"}</TableCell>
                        <TableCell>{s.skillName}</TableCell>
                        <TableCell><Badge variant="outline">{s.skillCategory}</Badge></TableCell>
                        <TableCell>{levelBadge(s.currentLevel)}</TableCell>
                        <TableCell>{s.certifiedDate || "-"}</TableCell>
                        <TableCell><Badge variant={s.status === "active" ? "default" : "secondary"}>{s.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table></div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="expiring">
          <Card>
            <CardContent className="p-0">
              {(expiringCerts || []).length === 0 ? (
                <div className="text-center py-12 text-[13px] text-muted-foreground"><CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>{t("hechQandaySertifikatMuddatiTugamayapti")}</p></div>
              ) : (
                <div className="ep-table-scroll"><Table>
                  <TableHeader><TableRow><TableHead>{t("xodim1")}</TableHead><TableHead>{t("konikma")}</TableHead><TableHead>{t("endDate")}</TableHead><TableHead>{t("status28")}</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {(expiringCerts || []).map((c) => (
                      <TableRow key={c.id} data-testid={`row-cert-${c.id}`} className="hover:bg-muted/40 transition-colors">
                        <TableCell>{c.employee?.fullName || "-"}</TableCell>
                        <TableCell>{c.skillName}</TableCell>
                        <TableCell className="text-[var(--ep-primary)] font-mono">{c.expiryDate}</TableCell>
                        <TableCell><Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />{t("tugayapti")}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table></div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
