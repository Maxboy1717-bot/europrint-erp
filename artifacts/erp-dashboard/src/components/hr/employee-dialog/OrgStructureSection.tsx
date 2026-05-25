/**
 * OrgStructureSection — xodim qo'shish/tahrirlash dialog'ida tashkiliy
 * tuzilma funksiyalarini tanlash bo'limi.
 *
 * MANTIQ:
 *   - Bir xodim BIR NECHTA funksiyada ishlashi mumkin (M:N — multi-assignment)
 *   - Har funksiyada bir nechta xodim bo'lishi mumkin
 *   - Saqlash uchun kamida BITTA funksiya tanlash SHART (backend validation)
 *
 * KO'RSATADI:
 *   - Har funksiyaning nomi, hozirgi xodim soni, rahbar
 *   - Joriy xodim allaqachon biriktirilgan funksiyalar tick bilan
 *   - Vakant funksiyalar alohida belgi bilan
 *   - Search filter (nom, ruscha nom, rahbar bo'yicha)
 */
import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Users, AlertCircle, Search } from "lucide-react";
import { OrgDepartment, EmployeeDialogProps } from "./types";
import { useTranslation } from '@/lib/i18n';

interface OrgStructureSectionProps {
  orgSearchQuery: string;
  setOrgSearchQuery: (query: string) => void;
  selectedOrgDepts: string[];
  setSelectedOrgDepts: (depts: string[]) => void;
  orgDepartments: OrgDepartment[];
  employee?: EmployeeDialogProps["employee"];
}

export function OrgStructureSection({
  orgSearchQuery,
  setOrgSearchQuery,
  selectedOrgDepts,
  setSelectedOrgDepts,
  orgDepartments,
  employee,
}: OrgStructureSectionProps) {
  const { t } = useTranslation("common");
  // Xavfsizlik: backend kutilmagan format yuborsa ham crash bo'lmaydi
  const safeOrgDepts = Array.isArray(orgDepartments) ? orgDepartments : [];
  const safeSelected = Array.isArray(selectedOrgDepts) ? selectedOrgDepts : [];

  // Filter: search + tartiblash (selected birinchi, vakant ikkinchi, band oxirgi)
  const filteredDepts = useMemo(() => {
    const q = orgSearchQuery.toLowerCase().trim();
    const filtered = safeOrgDepts.filter((dept) => {
      if (!q) return true;
      return (
        (dept.name?.toLowerCase() ?? "").includes(q) ||
        (dept.nameRu?.toLowerCase() ?? "").includes(q) ||
        (dept.headUserName?.toLowerCase() ?? "").includes(q)
      );
    });

    return filtered.sort((a, b) => {
      const aSel = safeSelected.includes(a.id);
      const bSel = safeSelected.includes(b.id);
      if (aSel !== bSel) return aSel ? -1 : 1;
      // Hierarchy bo'yicha (level past birinchi)
      return (a.hierarchyLevel ?? 0) - (b.hierarchyLevel ?? 0);
    });
  }, [safeOrgDepts, safeSelected, orgSearchQuery]);

  const toggleDept = (deptId: string) => {
    if (safeSelected.includes(deptId)) {
      setSelectedOrgDepts(safeSelected.filter((id) => id !== deptId));
    } else {
      setSelectedOrgDepts([...safeSelected, deptId]);
    }
  };

  const removeDept = (deptId: string) => {
    setSelectedOrgDepts(safeSelected.filter((id) => id !== deptId));
  };

  return (
    <div className="p-4 bg-muted/50 rounded-lg space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium">{t("tashkiliyTuzilmaFunksiyalari")}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("xodimningTashkiliyTuzilmadagiRoliniTanlang")}
            <span className="text-destructive ml-1">{t("kamidaBittaFunksiyaTanlashShart")}</span>
          </p>
        </div>
        {safeSelected.length > 0 && (
          <Badge variant="secondary" className="shrink-0" data-testid="badge-selected-count">
            {safeSelected.length} ta tanlangan
          </Badge>
        )}
      </div>

      {safeSelected.length === 0 && (
        <div className="flex items-center gap-2 p-2 bg-destructive/10 text-destructive rounded text-xs">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{t("saqlashUchunKamida1Ta")}</span>
        </div>
      )}

      {/* Tanlanganlar — chips */}
      {safeSelected.length > 0 && (
        <div className="flex flex-wrap gap-2 pb-2 border-b">
          {safeSelected.map((deptId) => {
            const dept = safeOrgDepts.find((d) => String(d.id) === String(deptId));
            return dept ? (
              <div
                key={deptId}
                className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-sm"
              >
                <span>{dept.name}</span>
                {dept.nodeType && (
                  <span className="text-xs opacity-60">· {dept.nodeType}</span>
                )}
                <button
                  type="button"
                  onClick={() => removeDept(deptId)}
                  className="ml-1 hover:text-destructive"
                  data-testid={`button-remove-org-${deptId}`}
                  title={t("remove")}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div
                key={deptId}
                className="flex items-center gap-1 bg-muted text-muted-foreground px-2 py-1 rounded-md text-xs italic"
              >
                ID#{deptId} (yuklanmoqda...)
              </div>
            );
          })}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder={t("funksiyaBolimYokiRahbarBoyicha")}
          value={orgSearchQuery}
          onChange={(e) => setOrgSearchQuery(e.target.value)}
          className="pl-8"
          data-testid="input-org-search"
        />
      </div>

      {/* Funksiyalar ro'yxati */}
      <div className="max-h-64 overflow-y-auto border rounded-md bg-background">
        {filteredDepts.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground" data-testid="empty-state">
            {orgSearchQuery
              ? `"${orgSearchQuery}" uchun hech narsa topilmadi`
              : "Tashkiliy tuzilma yuklanmoqda yoki bo'sh"}
          </div>
        ) : (
          filteredDepts.map((dept) => {
            const isSelected = safeSelected.includes(String(dept.id));
            const employeeCount = (dept as { employeeCount?: number }).employeeCount ?? 0;
            const isVacant = employeeCount === 0;

            return (
              <div
                key={dept.id}
                className={`flex items-center justify-between p-2.5 cursor-pointer hover:bg-muted transition-colors border-b last:border-b-0 ${
                  isSelected ? "bg-primary/5" : ""
                }`}
                onClick={() => toggleDept(String(dept.id))}
                data-testid={`option-org-${dept.id}`}
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      isSelected ? "bg-primary border-primary" : "border-input"
                    }`}
                  >
                    {isSelected && <span className="text-primary-foreground text-xs">✓</span>}
                  </div>

                  {/* Color dot */}
                  {(dept as { color?: string }).color && (
                    <div
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: (dept as { color?: string }).color }}
                    />
                  )}

                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-medium truncate">{dept.name}</span>
                    {dept.nameRu && (
                      <span className="text-xs text-muted-foreground truncate">{dept.nameRu}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Xodim soni */}
                  <Badge
                    variant={isVacant ? "outline" : "secondary"}
                    className="text-xs h-5"
                    data-testid={`badge-emp-count-${dept.id}`}
                  >
                    <Users className="h-2.5 w-2.5 mr-1" />
                    {employeeCount}
                  </Badge>

                  {/* TSKP (vakansiya soni) */}
                  {dept.tskp && Number(dept.tskp) > 0 && (
                    <Badge variant="outline" className="text-xs h-5" title={t("vakansiyaSoni")}>
                      / {dept.tskp}
                    </Badge>
                  )}

                  {/* Rahbar (vep) */}
                  {dept.headUserName && (
                    <span
                      className="text-[10px] text-muted-foreground italic max-w-[120px] truncate"
                      title={dept.headUserName}
                    >
                      {dept.headUserName}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <p className="text-xs text-muted-foreground italic">
        💡 Maslahat: yashil = vakant, ko'k = band funksiyalar.
        Xodim qaysi funksiyalarda ishlashini bu yerdan tanlang.
      </p>
    </div>
  );
}
