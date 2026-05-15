/**
 * @module AdvancedFilters
 * @description React UI component.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Filter, Save, Trash2, ChevronDown, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { SavedFilter } from "@shared/schema";
import { useTranslation } from '@/lib/i18n';

interface OrgDepartment {
  id: string;
  name: string;
}

interface Course {
  id: string;
  title: string;
}

interface CoursePagination {
  total: number;
  page: number;
  limit: number;
}

interface FilterConfig {
  dateRange: { start: string; end: string } | null;
  orgDepartments: string[];
  courses: string[];
  status: string | null;
}

interface AdvancedFiltersProps {
  onFilterChange: (filters: FilterConfig) => void;
}

const DATE_RANGES = [
  { value: "today", label: "Bugun" },
  { value: "week", label: "Bu hafta" },
  { value: "month", label: "Bu oy" },
  { value: "quarter", label: "Bu chorak" },
  { value: "year", label: "Bu yil" },
  { value: "custom", label: "Maxsus oraliq" },
];

export function AdvancedFilters({ onFilterChange }: AdvancedFiltersProps) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [confirmDeleteFilterId, setConfirmDeleteFilterId] = useState<string | number | null>(null);
  const [filterName, setFilterName] = useState("");
  const [filterDescription, setFilterDescription] = useState("");

  const [filters, setFilters] = useState<FilterConfig>({
    dateRange: null,
    orgDepartments: [],
    courses: [],
    status: null,
  });

  const { data: savedFilters = [] } = useQuery<SavedFilter[]>({
    queryKey: ["/api/filters"],
  });

  const { data: orgDepartments = [] } = useQuery<OrgDepartment[]>({
    queryKey: ["/api/org-departments"],
  });

  const { data: coursesResponse } = useQuery<{ data: Course[]; pagination: CoursePagination }>({
    queryKey: ["/api/courses"],
  });
  const courses = coursesResponse?.data || [];

  const saveFilterMutation = useMutation({
    mutationFn: (data: { name: string; description: string; filterData: FilterConfig; isPublic: boolean }) =>
      apiRequest('POST', '/api/filters', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/filters"] });
      toast({ title: "Filtr saqlandi" });
      setIsSaveDialogOpen(false);
      setFilterName("");
      setFilterDescription("");
    },
  });

  const deleteFilterMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/filters/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/filters"] });
      toast({ title: "Filtr o'chirildi" });
    },
  });

  const handleDateRangeChange = (value: string) => {
    const today = new Date();
    let start = "";
    let end = today.toISOString().split("T")[0];

    switch (value) {
      case "today":
        start = end;
        break;
      case "week":
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        start = weekAgo.toISOString().split("T")[0];
        break;
      case "month":
        const monthAgo = new Date(today);
        monthAgo.setMonth(today.getMonth() - 1);
        start = monthAgo.toISOString().split("T")[0];
        break;
      case "quarter":
        const quarterAgo = new Date(today);
        quarterAgo.setMonth(today.getMonth() - 3);
        start = quarterAgo.toISOString().split("T")[0];
        break;
      case "year":
        const yearAgo = new Date(today);
        yearAgo.setFullYear(today.getFullYear() - 1);
        start = yearAgo.toISOString().split("T")[0];
        break;
      case "custom":
        return;
    }

    const newFilters = { ...filters, dateRange: { start, end } };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleOrgDepartmentToggle = (orgDeptId: string) => {
    const newOrgDepts = filters.orgDepartments.includes(orgDeptId)
      ? filters.orgDepartments?.filter(id => id !== orgDeptId)
      : [...filters.orgDepartments, orgDeptId];
    
    const newFilters = { ...filters, orgDepartments: newOrgDepts };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleCourseToggle = (courseId: string) => {
    const newCourses = (Array.isArray(filters.courses) ? filters.courses : []).includes(courseId)
      ? (Array.isArray(filters.courses) ? filters.courses : []).filter(id => id !== courseId)
      : [...(Array.isArray(filters.courses) ? filters.courses : []), courseId];
    
    const newFilters = { ...filters, courses: newCourses };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    const resetFilters: FilterConfig = {
      dateRange: null,
      orgDepartments: [],
      courses: [],
      status: null,
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  const handleSaveFilter = () => {
    if (!filterName.trim()) {
      toast({ title: "Xatolik", description: "Filtr nomini kiriting", variant: "destructive" });
      return;
    }

    saveFilterMutation.mutate({
      name: filterName,
      description: filterDescription,
      filterData: filters,
      isPublic: true,
    });
  };

  const handleLoadFilter = (filter: SavedFilter) => {
    const loadedFilters = filter.filterData as FilterConfig;
    setFilters(loadedFilters);
    onFilterChange(loadedFilters);
    toast({ title: `"${filter.name}" yuklandi` });
  };

  const activeFiltersCount = 
    (filters.dateRange ? 1 : 0) +
    filters.orgDepartments.length +
    filters.courses.length +
    (filters.status ? 1 : 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2" data-testid="button-filters">
              <Filter className="h-4 w-4" />
              Filtrlar
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2">{activeFiltersCount}</Badge>
              )}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96" align="start">
            <div className="space-y-4">
              <div>
                <Label>{t("vaqtOraligi")}</Label>
                <Select onValueChange={handleDateRangeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("tanlang")} />
                  </SelectTrigger>
                  <SelectContent>
                    {(Array.isArray(DATE_RANGES) ? DATE_RANGES : []).map(range => (
                      <SelectItem key={range.value} value={range.value}>
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {filters.dateRange && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <Label>{t("boshlanish")}</Label>
                    <Input
                      type="date"
                      value={filters.dateRange?.start ?? ''}
                      onChange={(e) => {
                        const prev = filters.dateRange ?? { start: '', end: '' };
                        const newFilters: FilterConfig = {
                          ...filters,
                          dateRange: { start: e.target.value, end: prev.end ?? '' },
                        };
                        setFilters(newFilters);
                        onFilterChange(newFilters);
                      }}
                      min="2000-01-01"
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <Label>{t("tugash")}</Label>
                    <Input
                      type="date"
                      value={filters.dateRange?.end ?? ''}
                      onChange={(e) => {
                        const prev = filters.dateRange ?? { start: '', end: '' };
                        const newFilters: FilterConfig = {
                          ...filters,
                          dateRange: { start: prev.start ?? '', end: e.target.value },
                        };
                        setFilters(newFilters);
                        onFilterChange(newFilters);
                      }}
                      min={filters.dateRange?.start || "2000-01-01"}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
              )}

              <div>
                <Label>{t("tashkiliyTuzilma")}</Label>
                <div className="flex flex-wrap gap-2 mt-2 max-h-32 overflow-y-auto">
                  {(Array.isArray(orgDepartments) ? orgDepartments : []).map((dept: OrgDepartment) => (
                    <Badge
                      key={dept.id}
                      variant={filters.orgDepartments.includes(dept.id) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleOrgDepartmentToggle(dept.id)}
                    >
                      {dept.name}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>{t("kurslar")}</Label>
                <div className="flex flex-wrap gap-2 mt-2 max-h-32 overflow-y-auto">
                  {(Array.isArray(courses) ? courses : []).map((course: Course) => (
                    <Badge
                      key={course.id}
                      variant={filters.courses.includes(course.id) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleCourseToggle(course.id)}
                    >
                      {course.title}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={handleReset} className="flex-1">
                  {t("tozalash")}
                </Button>
                <Button size="sm" onClick={() => setIsSaveDialogOpen(true)} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  {t("Saqlash")}
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {savedFilters.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {(Array.isArray(savedFilters) ? savedFilters : []).map(filter => (
              <div key={filter.id} className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleLoadFilter(filter)}
                  data-testid={`button-load-filter-${filter.id}`}
                >
                  {filter.name}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => setConfirmDeleteFilterId(filter.id)}
                  data-testid={`button-delete-filter-${filter.id}`}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {activeFiltersCount > 0 && (
          <Button size="sm" variant="ghost" onClick={handleReset}>
            {t("hammasiniTozalash")}
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.dateRange && (
            <Badge variant="secondary" className="gap-1">
              <Calendar className="h-3 w-3" />
              {filters.dateRange.start} - {filters.dateRange.end}
            </Badge>
          )}
          {(Array.isArray(filters.orgDepartments) ? filters.orgDepartments : []).map(orgDeptId => {
            const dept = (Array.isArray(orgDepartments) ? orgDepartments : []).find((d: OrgDepartment) => d.id === orgDeptId);
            return dept ? (
              <Badge key={orgDeptId} variant="secondary">
                {dept.name}
              </Badge>
            ) : null;
          })}
          {(Array.isArray(filters.courses) ? filters.courses : []).map(courseId => {
            const course = (Array.isArray(courses) ? courses : []).find((c: Course) => c.id === courseId);
            return course ? (
              <Badge key={courseId} variant="secondary">
                Kurs: {course.title}
              </Badge>
            ) : null;
          })}
        </div>
      )}

      {/* Save Filter Dialog */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">{t("filtrniSaqlash")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t("filtrNomi")}</Label>
              <Input
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                placeholder={t("masalanBuOyningBolimFiltri")}
              />
            </div>
            <div>
              <Label>Tavsif (ixtiyoriy)</Label>
              <Input
                value={filterDescription}
                onChange={(e) => setFilterDescription(e.target.value)}
                placeholder={t("batafsilMalumot")}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
                {t("cancel")}
              </Button>
              <Button onClick={handleSaveFilter}>
                {t("Saqlash")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDeleteFilterId !== null}
        onOpenChange={(open) => { if (!open) setConfirmDeleteFilterId(null); }}
        title={t("filterniOchirish")}
        description={t("saqlanganFilterniOchirishniTasdiqlaysizmi")}
        confirmText="O'chirish"
        cancelText="Bekor qilish"
        variant="destructive"
        onConfirm={() => { if (confirmDeleteFilterId !== null) deleteFilterMutation.mutate(confirmDeleteFilterId as string & number); }}
      />
    </div>
  );
}
