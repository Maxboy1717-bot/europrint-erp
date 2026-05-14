/** @module FaceRegistrationSections @description Panel-level section components for FaceRegistration: PageHeader, EmployeeSelectionPanel (left column), and RegisteredFacesList (right column). These are pure presentational components — all state and mutations live in the parent page. */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User, Search, CheckCircle } from 'lucide-react';
import type { Employee, FaceEmbedding, FaceRegTranslations } from './FaceRegistrationTypes';
import { DeleteFaceDialog } from './FaceRegistrationDialogs';
import { EPPageHeader, EPStatusPill, EPLoader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

// ---------------------------------------------------------------------------
// PageHeader
// ---------------------------------------------------------------------------

interface PageHeaderProps {
  text: FaceRegTranslations;
  modelsLoaded: boolean;
  lang: 'uz' | 'ru';
  onToggleLang: () => void;
}

export function PageHeader({ text, modelsLoaded, lang, onToggleLang }: PageHeaderProps) {
  const { t } = useTranslation("common");
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">Yuz Ro&apos;yxatdan O&apos;tkazish</b></>}
        title="Yuz Ro&apos;yxatdan O&apos;tkazish"
        subtitle={text.subtitle}
      />
      </div>
      <div className="flex items-center gap-4">
        <Badge variant={modelsLoaded ? 'default' : 'secondary'} className="gap-1">
          {modelsLoaded ? (
            <><CheckCircle className="h-3 w-3" /> {text.modelsReady}</>
          ) : (
            <><EPLoader size={12} /> {text.modelsLoading}</>
          )}
        </Badge>
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleLang}
          data-testid="button-lang-toggle"
        >
          {lang === 'uz' ? 'RU' : 'UZ'}
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// EmployeeSelectionPanel
// ---------------------------------------------------------------------------

interface EmployeeSelectionPanelProps {
  text: FaceRegTranslations;
  employees: Employee[];
  registeredFaces: FaceEmbedding[];
  isLoading: boolean;
  searchQuery: string;
  selectedEmployee: Employee | null;
  onSearchChange: (value: string) => void;
  onSelectEmployee: (emp: Employee) => void;
}

export function EmployeeSelectionPanel({
  text,
  employees,
  registeredFaces,
  isLoading,
  searchQuery,
  selectedEmployee,
  onSearchChange,
  onSelectEmployee,
}: EmployeeSelectionPanelProps) {
  const getEmployeeFaceCount = (employeeId: string) =>
    (Array.isArray(registeredFaces) ? registeredFaces : []).filter(
      (f) => f.employeeId === employeeId,
    ).length;

  const filtered = (Array.isArray(employees) ? employees : []).filter(
    (emp) =>
      emp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-[14px] font-semibold flex items-center gap-2">
          <User className="h-4 w-4" />
          {text.selectEmployee}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={text.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
            data-testid="input-search-employee"
          />
        </div>

        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <EPLoader size={24} />
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((emp) => (
                <div
                  key={emp.id}
                  onClick={() => onSelectEmployee(emp)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors flex items-center gap-3 ${
                    selectedEmployee?.id === emp.id
                      ? 'bg-primary/10 border border-primary'
                      : 'hover:bg-muted border border-transparent'
                  }`}
                  data-testid={`employee-card-${emp.id}`}
                >
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    {emp.profileImageUrl ? (
                      <img
                        src={emp.profileImageUrl}
                        alt=""
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{emp.fullName}</p>
                    <p className="text-xs text-muted-foreground">ID: {emp.employeeId}</p>
                  </div>
                  {getEmployeeFaceCount(emp.id) > 0 && (
                    <EPStatusPill tone="neutral" className="flex-shrink-0">
                      {getEmployeeFaceCount(emp.id)} yuz
                    </EPStatusPill>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// RegisteredFacesList
// ---------------------------------------------------------------------------

interface RegisteredFacesListProps {
  text: FaceRegTranslations;
  faces: FaceEmbedding[];
  isLoading: boolean;
  isDeletePending: boolean;
  onDeleteFace: (id: string) => void;
}

export function RegisteredFacesList({
  text,
  faces,
  isLoading,
  isDeletePending,
  onDeleteFace,
}: RegisteredFacesListProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-[14px] font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            {text.registeredFaces}
          </span>
          <Badge>{faces.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <EPLoader size={24} />
            </div>
          ) : faces.length === 0 ? (
            <div className="text-center py-8 text-[13px] text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>{text.noFaces}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(Array.isArray(faces) ? faces : []).map((face) => (
                <div
                  key={face.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                  data-testid={`face-card-${face.id}`}
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {face.imageUrl ? (
                      <img
                        src={face.imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{face.employeeName}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {Math.round(face.confidence)}%
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(face.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <DeleteFaceDialog
                    faceId={face.id}
                    isPending={isDeletePending}
                    onConfirm={onDeleteFace}
                  />
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
