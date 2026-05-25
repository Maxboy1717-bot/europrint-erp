/**
 * @module AdvancedFiltersDialogs
 * @description Filter popover content and save-filter dialog sub-components.
 * Split from AdvancedFilters.tsx (Rule 16).
 */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Save } from "lucide-react";
import { tLabel } from '@/lib/i18n/tLabel';
import type { FilterConfig, OrgDepartment, Course } from './AdvancedFilters.types';
import { DATE_RANGES } from './AdvancedFilters.types';

interface FilterPopoverContentProps {
  filters: FilterConfig;
  orgDepartments: OrgDepartment[];
  courses: Course[];
  handleDateRangeChange: (value: string) => void;
  handleOrgDepartmentToggle: (id: string) => void;
  handleCourseToggle: (id: string) => void;
  handleReset: () => void;
  setIsSaveDialogOpen: (open: boolean) => void;
  t: (key: string) => string;
}

export function FilterPopoverContent({
  filters, orgDepartments, courses,
  handleDateRangeChange, handleOrgDepartmentToggle, handleCourseToggle,
  handleReset, setIsSaveDialogOpen, t,
}: FilterPopoverContentProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label>{t("vaqtOraligi")}</Label>
        <Select onValueChange={handleDateRangeChange}>
          <SelectTrigger>
            <SelectValue placeholder={t("tanlang")} />
          </SelectTrigger>
          <SelectContent>
            {DATE_RANGES.map(range => (
              <SelectItem key={range.value} value={range.value}>{range.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filters.dateRange && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <Label>{t("boshlanish")}</Label>
            <Input type="date" value={filters.dateRange?.start ?? ''}
              onChange={(e) => handleDateRangeChange('custom')}
              min="2000-01-01" max={new Date().toISOString().split('T')[0]} />
          </div>
          <div>
            <Label>{t("tugash")}</Label>
            <Input type="date" value={filters.dateRange?.end ?? ''}
              onChange={(e) => handleDateRangeChange('custom')}
              min={filters.dateRange?.start || "2000-01-01"}
              max={new Date().toISOString().split('T')[0]} />
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
              variant={filters.courses.includes(String(course.id)) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => handleCourseToggle(String(course.id))}
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
  );
}

interface SaveFilterDialogProps {
  isSaveDialogOpen: boolean;
  setIsSaveDialogOpen: (open: boolean) => void;
  filterName: string;
  setFilterName: (name: string) => void;
  filterDescription: string;
  setFilterDescription: (desc: string) => void;
  handleSaveFilter: () => void;
  t: (key: string) => string;
}

export function SaveFilterDialog({
  isSaveDialogOpen, setIsSaveDialogOpen,
  filterName, setFilterName, filterDescription, setFilterDescription,
  handleSaveFilter, t,
}: SaveFilterDialogProps) {
  return (
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
            <Label>{tLabel('common.AdvancedFilters.tavsifIxtiyoriy', "Tavsif (ixtiyoriy)")}</Label>
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
            <Button onClick={handleSaveFilter}>{t("Saqlash")}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
