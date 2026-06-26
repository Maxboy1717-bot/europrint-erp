/**
 * @module Courses
 * @description React page component. Route-level UI.
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { CourseCard } from "@/components/CourseCard";
import { SearchBar } from "@/components/SearchBar";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/Pagination";
import { Plus, Filter, AlertCircle, Package } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AddCourseDialog } from "@/components/AddCourseDialog";
import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EPErrorState, EPPageHeader, EPLoader } from "@/components/ep";

interface CourseForEdit {
  id: string;
  code: string;
  title: string;
  titleRu: string;
  description: string;
  descriptionRu: string;
  isRequired: boolean;
  level: "beginner" | "intermediate" | "advanced";
  departmentId: string | null;
  mentorId: string | null;
  startDate: string | null;
  endDate: string | null;
}

export default function Courses() {
  const { t } = useTranslation('lms');
  const { t: tCommon } = useTranslation('common');
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseForEdit | undefined>(undefined);
  const [deleteCourseId, setDeleteCourseId] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [search, filter]);

  const { data: coursesResponse, isLoading, error, isError, refetch} = useQuery<{
    data: Array<{
      id: string;
      title: string;
      description: string;
      departmentId: string | null;
      durationText: string | null;
      enrolledCount: number;
      completionRate: number;
      isRequired: boolean;
      moduleCount: number;
    }>;
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>({
    queryKey: ["/api/courses", page, pageSize, search, filter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
        ...(search && { search }),
        ...(filter !== "all" && { filter }),
      });
      return await apiRequest('GET', `/api/courses?${params}`);
    },
    enabled: !!isAuthenticated,
  });

  const courses = coursesResponse?.data || [];
  const pagination = coursesResponse?.pagination;

  const { data: departments = [] } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: ["/api/org-departments"],
    enabled: !!isAuthenticated,
  });

  const deleteMutation = useMutation({
    mutationFn: async (courseId: string) => {
      return await apiRequest("DELETE", `/api/courses/${courseId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({
        title: tCommon("muvaffaqiyatToast"),
        description: tCommon("kursMuvaffaqiyatliOchirildiToast"),
      });
    },
    onError: () => {
      toast({
        title: tCommon("xatolikTitle"),
        description: tCommon("kursOchirishdaXatolikToast"),
        variant: "destructive",
      });
    },
  });

  const transformedCourses = (Array.isArray(courses) ? courses : []).map(course => {
    const dept = (Array.isArray(departments) ? departments : []).find(d => d.id === course.departmentId);
    return {
      id: course.id,
      title: course.title || "",
      description: course.description || "",
      duration: course.durationText || "—",
      enrolledCount: course.enrolledCount || 0,
      completionRate: course.completionRate || 0,
      isRequired: course.isRequired || false,
      moduleCount: course.moduleCount || 0,
      department: dept?.name,
    };
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="loading-spinner">
        <EPLoader size={32} tone="muted" />
      </div>
    );
  }


  if (isError) {
    return <EPErrorState onRetry={refetch}  error={error} />;
  }
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2" data-testid="error-state">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-muted-foreground">{tCommon('operationFailed')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div>
          <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("kurslarKatalogi")}</b></>}
        title={t("kurslarKatalogi")}
        subtitle={t('courseContent')}
      />
        </div>
        <Button 
          onClick={() => setShowAddDialog(true)} 
          data-testid="button-add-course"
          className="bg-primary text-white shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('addCourse')}
        </Button>
      </div>

      <div className="flex items-center gap-4 flex-wrap bg-muted/40 p-4 rounded-xl mb-8">
        <SearchBar 
          placeholder={`${t('courses')} ${tCommon('search').toLowerCase()}...`}
          value={search}
          onChange={setSearch}
        />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48 bg-card border-border h-9" data-testid="select-filter">
            <Filter className="w-4 h-4 mr-2 text-primary" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">{tCommon('all')} {t('courses').toLowerCase()}</SelectItem>
            <SelectItem value="required">{t('mandatory')}</SelectItem>
            <SelectItem value="optional">{t('optional')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {([1, 2, 3, 4, 5, 6]).map((i) => (
            <Card key={`k-${i}`}>
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-48 rounded-lg" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4 rounded-lg" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-20 rounded-lg" />
                  <Skeleton className="h-4 w-24 rounded-lg" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-2 flex-1 rounded-full" />
                  <Skeleton className="h-4 w-10 rounded-lg" />
                </div>
                <div className="flex justify-end gap-2">
                  <Skeleton className="h-9 w-24 rounded-lg" />
                  <Skeleton className="h-9 w-20 rounded-lg" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : transformedCourses.length > 0 ? (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {(Array.isArray(transformedCourses) ? transformedCourses : []).map((course) => (
              <CourseCard
                key={course.id}
                {...course}
                onEdit={async () => {
                  const courseToEdit = (Array.isArray(courses) ? courses : []).find(c => c.id === course.id);
                  if (courseToEdit) {
                    try {
                      const fullCourse = (await apiRequest('GET', `/api/courses/${course.id}`)) as CourseForEdit;
                      setEditingCourse({
                        id: fullCourse.id,
                        code: fullCourse.code,
                        title: fullCourse.title,
                        titleRu: fullCourse.titleRu,
                        description: fullCourse.description,
                        descriptionRu: fullCourse.descriptionRu,
                        isRequired: fullCourse.isRequired,
                        level: fullCourse.level,
                        departmentId: fullCourse.departmentId,
                        mentorId: fullCourse.mentorId,
                        startDate: fullCourse.startDate,
                        endDate: fullCourse.endDate,
                      });
                      setShowAddDialog(true);
                    } catch (error) {
                      toast({
                        title: tCommon("xatolikTitle"),
                        description: tCommon("kursMalumotiniYuklashdaXatolik"),
                        variant: "destructive",
                      });
                    }
                  }
                }}
                onDelete={() => setDeleteCourseId(course.id)}
                onView={() => navigate(`/courses/${course.id}`)}
              />
            ))}
          </div>
          
          {pagination && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              pageSize={pagination.limit}
              totalItems={pagination.total}
              onPageChange={(newPage) => setPage(newPage)}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setPage(1);
              }}
            />
          )}
        </>
      ) : (
        <EmptyState
          title={tCommon('noResults')}
          description={tCommon('noData')}
          actionLabel={search || filter !== "all" ? tCommon('reset') : t('addCourse')}
          onAction={() => {
            if (search || filter !== "all") {
              setSearch("");
              setFilter("all");
            } else {
              setShowAddDialog(true);
            }
          }}
        />
      )}

      <AddCourseDialog 
        open={showAddDialog} 
        onOpenChange={(open) => {
          setShowAddDialog(open);
          if (!open) {
            setEditingCourse(undefined);
          }
        }} 
        course={editingCourse}
      />
      <ConfirmDialog
        open={!!deleteCourseId}
        onOpenChange={(v) => { if (!v) setDeleteCourseId(null); }}
        title={t("kursniOchirish")}
        description={t("ushbuKursniOchirishniTasdiqlaysizmiBu")}
        confirmText={tCommon("delete")}
        variant="destructive"
        onConfirm={() => { if (deleteCourseId) { deleteMutation.mutate(deleteCourseId); setDeleteCourseId(null); } }}
      />
    </div>
  );
}
