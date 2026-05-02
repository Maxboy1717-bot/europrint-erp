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
import { ErrorState } from "@/components/ui/error-state";

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
  const [skillCategory, setSkillCategory] = useState<string>("all");

  const { data: positionSkills, isError, isLoading, refetch} = useQuery<PositionSkill[]>({
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
    const colors = ["", "bg-surface-container-low text-on-surface dark:bg-gray-800 dark:text-gray-200", "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200", "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"];
    return <Badge className={colors[level] || colors[1]}>{labels[level] || `Daraja ${level}`}</Badge>;
  };

  const filteredPositionSkills = skillCategory === "all" ? (positionSkills || []) : (positionSkills || []).filter(s => s.skillCategory === skillCategory);
  const filteredEmployeeSkills = skillCategory === "all" ? (employeeSkills || []) : (employeeSkills || []).filter(s => s.skillCategory === skillCategory);

  const categories = Array.from(new Set([...(positionSkills || []).map(s => s.skillCategory), ...(employeeSkills || []).map(s => s.skillCategory)])).filter(Boolean);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="text-muted-foreground">Yuklanmoqda...</div></div>;
  }

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  return (
    <div className="p-4 md:p-6 space-y-6" data-testid="page-hr-lms-skills">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">HR ↔ LMS Integratsiya</h1>
          <p className="text-muted-foreground">Lavozim talablari, ko'nikma bo'shliqlari, sertifikat monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Select value={skillCategory} onValueChange={setSkillCategory}>
          <SelectTrigger className="w-40" data-testid="select-category"><SelectValue placeholder="Kategoriya" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barchasi</SelectItem>
            {(Array.isArray(categories) ? categories : []).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900"><BookOpen className="w-5 h-5 text-blue-600" /></div><div><p className="text-sm text-muted-foreground">Lavozim talablari</p><p className="text-2xl font-bold">{stats?.totalPositionSkills || 0}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-md bg-green-100 dark:bg-green-900"><Users className="w-5 h-5 text-green-600" /></div><div><p className="text-sm text-muted-foreground">Xodim ko'nikmalari</p><p className="text-2xl font-bold">{stats?.totalEmployeeSkills || 0}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-md bg-orange-100 dark:bg-orange-900"><AlertTriangle className="w-5 h-5 text-orange-600" /></div><div><p className="text-sm text-muted-foreground">Tugayotgan sertifikatlar</p><p className="text-2xl font-bold">{(expiringCerts || []).length}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-md bg-purple-100 dark:bg-purple-900"><GraduationCap className="w-5 h-5 text-purple-600" /></div><div><p className="text-sm text-muted-foreground">Kategoriyalar</p><p className="text-2xl font-bold">{(stats?.byCategory || []).length}</p></div></div></CardContent></Card>
      </div>

      <Tabs defaultValue="positions" className="w-full">
        <TabsList>
          <TabsTrigger value="positions" data-testid="tab-positions">Lavozim talablari</TabsTrigger>
          <TabsTrigger value="employee-skills" data-testid="tab-employee-skills">Xodim ko'nikmalari</TabsTrigger>
          <TabsTrigger value="expiring" data-testid="tab-expiring">Tugayotgan sertifikatlar</TabsTrigger>
        </TabsList>
        <TabsContent value="positions">
          <Card>
            <CardContent className="p-0">
              {filteredPositionSkills.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground"><BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>Hali lavozim talablari belgilanmagan</p></div>
              ) : (
                <Table>
                  <TableHeader><TableRow><TableHead>Lavozim</TableHead><TableHead>Ko'nikma</TableHead><TableHead>Kategoriya</TableHead><TableHead>Talab darajasi</TableHead><TableHead>Majburiy</TableHead><TableHead>Sertifikat</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {(Array.isArray(filteredPositionSkills) ? filteredPositionSkills : []).map((s) => (
                      <TableRow key={s.id} data-testid={`row-position-skill-${s.id}`}>
                        <TableCell className="font-medium">{s.positionName}</TableCell>
                        <TableCell>{s.skillName}</TableCell>
                        <TableCell><Badge variant="outline">{s.skillCategory}</Badge></TableCell>
                        <TableCell>{levelBadge(s.requiredLevel)}</TableCell>
                        <TableCell>{s.isMandatory ? <CheckCircle className="w-4 h-4 text-green-600" /> : <span className="text-muted-foreground">-</span>}</TableCell>
                        <TableCell>{s.certificationRequired ? <Award className="w-4 h-4 text-blue-600" /> : "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="employee-skills">
          <Card>
            <CardContent className="p-0">
              {filteredEmployeeSkills.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground"><Users className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>Hali xodim ko'nikmalari kiritilmagan</p></div>
              ) : (
                <Table>
                  <TableHeader><TableRow><TableHead>Xodim</TableHead><TableHead>Ko'nikma</TableHead><TableHead>Kategoriya</TableHead><TableHead>Joriy daraja</TableHead><TableHead>Sertifikat</TableHead><TableHead>Holat</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {(Array.isArray(filteredEmployeeSkills) ? filteredEmployeeSkills : []).map((s) => (
                      <TableRow key={s.id} data-testid={`row-employee-skill-${s.id}`}>
                        <TableCell className="font-medium">{s.employee?.fullName || "-"}</TableCell>
                        <TableCell>{s.skillName}</TableCell>
                        <TableCell><Badge variant="outline">{s.skillCategory}</Badge></TableCell>
                        <TableCell>{levelBadge(s.currentLevel)}</TableCell>
                        <TableCell>{s.certifiedDate || "-"}</TableCell>
                        <TableCell><Badge variant={s.status === "active" ? "default" : "secondary"}>{s.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="expiring">
          <Card>
            <CardContent className="p-0">
              {(expiringCerts || []).length === 0 ? (
                <div className="text-center py-12 text-muted-foreground"><CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>Hech qanday sertifikat muddati tugamayapti</p></div>
              ) : (
                <Table>
                  <TableHeader><TableRow><TableHead>Xodim</TableHead><TableHead>Ko'nikma</TableHead><TableHead>Tugash sanasi</TableHead><TableHead>Holat</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {(expiringCerts || []).map((c) => (
                      <TableRow key={c.id} data-testid={`row-cert-${c.id}`}>
                        <TableCell>{c.employee?.fullName || "-"}</TableCell>
                        <TableCell>{c.skillName}</TableCell>
                        <TableCell className="text-orange-600 font-mono">{c.expiryDate}</TableCell>
                        <TableCell><Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Tugayapti</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
