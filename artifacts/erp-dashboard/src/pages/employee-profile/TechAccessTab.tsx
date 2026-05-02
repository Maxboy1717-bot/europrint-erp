import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, CheckCircle, XCircle, Tablet, Key, Clock, Award, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";

interface Certificate {
  id: number;
  name: string;
  expiryDate: string;
  issuer: string;
}

interface TechAccessTabProps {
  employeeId: string;
  employeeRole: string;
  employeeHireDate?: string;
  employeeCreatedAt?: string;
  certificates: Certificate[];
  loadingCertificates: boolean;
}

const MODULE_PERMISSIONS: Record<string, string[]> = {
  super_admin: ["HR", "Moliya", "LMS", "Savdo", "Ombor", "Ishlab chiqarish", "Sifat nazorati", "MES", "IoT", "Kamera AI", "Sozlamalar", "Hisobotlar"],
  admin: ["HR", "Moliya", "LMS", "Savdo", "Ombor", "Ishlab chiqarish", "Sifat nazorati", "MES", "Hisobotlar"],
  director: ["HR", "Moliya", "LMS", "Savdo", "Ombor", "Ishlab chiqarish", "Sifat nazorati", "MES", "Hisobotlar"],
  hr_manager: ["HR", "LMS", "Hisobotlar"],
  hr: ["HR", "LMS"],
  finance_manager: ["Moliya", "Hisobotlar"],
  finance: ["Moliya"],
  cfo: ["Moliya", "Hisobotlar"],
  accountant: ["Moliya"],
  lms_manager: ["LMS", "Hisobotlar"],
  pp_manager: ["Ishlab chiqarish", "MES", "Hisobotlar"],
  qc_manager: ["Sifat nazorati", "Ishlab chiqarish", "Hisobotlar"],
  production_manager: ["Ishlab chiqarish", "MES", "Ombor"],
  production: ["Ishlab chiqarish", "MES"],
  warehouse_manager: ["Ombor", "Hisobotlar"],
  warehouse: ["Ombor"],
  sales: ["Savdo", "CRM"],
  manager: ["HR", "Hisobotlar", "LMS"],
  it: ["HR", "Moliya", "LMS", "Savdo", "Ombor", "Ishlab chiqarish", "Sifat nazorati", "MES", "IoT", "Sozlamalar"],
  employee: ["LMS"],
};

const ALL_MODULES = ["HR", "Moliya", "LMS", "Savdo", "Ombor", "Ishlab chiqarish", "Sifat nazorati", "MES", "IoT", "Kamera AI", "Sozlamalar", "Hisobotlar", "CRM"];

const IOT_ROLES = ["super_admin", "admin", "it", "pp_manager", "production_manager", "production", "qc_manager"];

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Administrator",
  director: "Direktor",
  hr_manager: "HR Menejer",
  hr: "HR Mutaxassisi",
  finance_manager: "Moliya Menejer",
  finance: "Moliya Xodimi",
  cfo: "CFO",
  accountant: "Buxgalter",
  lms_manager: "LMS Menejer",
  pp_manager: "PP Menejer",
  qc_manager: "QC Menejer",
  production_manager: "Ishlab Chiqarish Menejer",
  production: "Ishlab Chiqarish Xodimi",
  warehouse_manager: "Ombor Menejer",
  warehouse: "Omborchi",
  sales: "Savdo Vakili",
  manager: "Menejer",
  it: "IT Mutaxassis",
  employee: "Xodim",
};

export function TechAccessTab({ employeeId, employeeRole, employeeHireDate, employeeCreatedAt, certificates, loadingCertificates }: TechAccessTabProps) {
  const allowedModules = MODULE_PERMISSIONS[employeeRole] || MODULE_PERMISSIONS["employee"];
  const hasIoTAccess = IOT_ROLES.includes(employeeRole);

  const certBasedAccess: string[] = [];
  if (certificates && certificates.length > 0) {
    (Array.isArray(certificates) ? certificates : []).forEach((cert) => {
      const name = (cert.name || "").toLowerCase();
      if (name.includes("forklift") || name.includes("loader")) certBasedAccess.push("Forklift / Yuk ko'targich");
      if (name.includes("crane") || name.includes("kran")) certBasedAccess.push("Kran operatori");
      if (name.includes("electrical") || name.includes("elektr")) certBasedAccess.push("Elektr jihozlar");
      if (name.includes("welding") || name.includes("payvand")) certBasedAccess.push("Payvandlash uskunalari");
      if (name.includes("safety") || name.includes("xavfsizlik")) certBasedAccess.push("Xavfsizlik jihozlari");
    });
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api"] })} className="sr-only" aria-label="Yangilash"><RefreshCw className="h-4 w-4" /></Button>
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Tizim roli</p>
                <p className="text-lg font-bold text-blue-600 mt-1">
                  {ROLE_LABELS[employeeRole] || employeeRole}
                </p>
              </div>
              <Key className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className={`border ${hasIoTAccess ? "bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20" : "bg-muted/30"}`}>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">IoT Planshet kirish</p>
                {hasIoTAccess ? (
                  <div className="flex items-center gap-1 mt-1">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="font-bold text-green-600">Ruxsat bor</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 mt-1">
                    <XCircle className="h-5 w-5 text-muted-foreground" />
                    <span className="font-bold text-muted-foreground">Ruxsat yo'q</span>
                  </div>
                )}
              </div>
              <Tablet className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Ochiq modullar</p>
                <p className="text-2xl font-bold text-purple-600">{allowedModules.length}</p>
                <p className="text-xs text-muted-foreground">{ALL_MODULES.length} dan</p>
                {employeeHireDate && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Kirish berilgan: {new Date(employeeHireDate).toLocaleDateString("uz-UZ")}
                  </p>
                )}
                {employeeCreatedAt && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Oxirgi kirish: {new Date(employeeCreatedAt).toLocaleDateString("uz-UZ")} (taxminiy)
                  </p>
                )}
              </div>
              <Shield className="h-6 w-6 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Modul kirish matritsasi
          </CardTitle>
          <CardDescription>Rol asosidagi tizim ruxsatlari</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {(Array.isArray(ALL_MODULES) ? ALL_MODULES : []).map((module) => {
              const hasAccess = allowedModules.includes(module);
              return (
                <div
                  key={module}
                  className={`flex items-center gap-2 rounded-md p-3 border ${
                    hasAccess
                      ? "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400"
                      : "bg-muted/30 border-border text-muted-foreground"
                  }`}
                  data-testid={`module-access-${module}`}
                >
                  {hasAccess ? (
                    <CheckCircle className="h-4 w-4 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 shrink-0" />
                  )}
                  <span className="text-sm font-medium truncate">{module}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {loadingCertificates ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Sertifikatdan avtomatik uskuna ruxsatlari
            </CardTitle>
            <CardDescription>LMS sertifikatlariga asoslanib aniqlangan uskuna ruxsatlari</CardDescription>
          </CardHeader>
          <CardContent>
            {certBasedAccess.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(Array.isArray(certBasedAccess) ? certBasedAccess : []).map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-md p-3 bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-400"
                    data-testid={`cert-access-${idx}`}
                  >
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    <span className="text-sm font-medium">{item}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Award className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  Maxsus uskuna ruxsatlarini talab qiluvchi sertifikatlar aniqlanmadi
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
    </>
  );
}
