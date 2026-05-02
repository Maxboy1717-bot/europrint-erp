import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { OrgDepartment, EmployeeDialogProps } from "./types";

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
  employee
}: OrgStructureSectionProps) {
  return (
    <div className="p-4 bg-muted/50 rounded-lg space-y-3">
      <p className="font-medium">Tashkiliy tuzilma funksiyalari</p>
      <p className="text-sm text-muted-foreground">
        Xodimni biriktirilgan funksiyalarni tanlang (bir funksiyaga faqat bitta xodim)
      </p>
      
      <Input
        placeholder="Funksiya qidirish..."
        value={orgSearchQuery}
        onChange={(e) => setOrgSearchQuery(e.target.value)}
        className="mb-2"
        data-testid="input-org-search"
      />
      
      {selectedOrgDepts.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {(Array.isArray(selectedOrgDepts) ? selectedOrgDepts : []).map(deptId => {
            const dept = (Array.isArray(orgDepartments) ? orgDepartments : []).find(d => d.id === deptId);
            return dept ? (
              <div key={deptId} className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-sm">
                <span>{dept.name}</span>
                <button
                  type="button"
                  onClick={() => setSelectedOrgDepts((Array.isArray(selectedOrgDepts) ? selectedOrgDepts : []).filter(id => id !== deptId))}
                  className="ml-1 hover:text-destructive"
                  data-testid={`button-remove-org-${deptId}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : null;
          })}
        </div>
      )}
      
      <div className="max-h-40 overflow-y-auto border rounded-md">
        {(Array.isArray(orgDepartments) ? orgDepartments : []).filter(dept => {
            const searchMatch = !orgSearchQuery || 
              dept.name.toLowerCase().includes(orgSearchQuery.toLowerCase()) ||
              dept.nameRu?.toLowerCase().includes(orgSearchQuery.toLowerCase());
            const isVacant = !dept.headUserId;
            const isAssignedToThisEmployee = dept.headUserId === employee?.id;
            const isSelected = selectedOrgDepts.includes(dept.id);
            return searchMatch && (isVacant || isAssignedToThisEmployee || isSelected);
          })
          .map(dept => {
            const isSelected = selectedOrgDepts.includes(dept.id);
            const isOccupiedByOther = dept.headUserId && dept.headUserId !== employee?.id;
            
            return (
              <div
                key={dept.id}
                className={`flex items-center justify-between p-2 cursor-pointer hover:bg-muted ${
                  isSelected ? 'bg-primary/5' : ''
                } ${isOccupiedByOther ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => {
                  if (isOccupiedByOther) return;
                  if (isSelected) {
                    setSelectedOrgDepts((Array.isArray(selectedOrgDepts) ? selectedOrgDepts : []).filter(id => id !== dept.id));
                  } else {
                    setSelectedOrgDepts([...selectedOrgDepts, dept.id]);
                  }
                }}
                data-testid={`option-org-${dept.id}`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-primary border-primary' : 'border-input'}`}>
                    {isSelected && <span className="text-primary-foreground text-xs">✓</span>}
                  </div>
                  <span className="text-sm">{dept.name}</span>
                  {dept.tskp && (
                    <span className="text-xs text-muted-foreground">({dept.tskp})</span>
                  )}
                </div>
                {dept.headUserName && dept.headUserId !== employee?.id && (
                  <span className="text-xs text-muted-foreground italic">
                    Egallangan: {dept.headUserName}
                  </span>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
