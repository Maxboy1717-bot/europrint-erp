/**
 * @module Tests
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Clock, ListChecks, FileQuestion, MoreVertical, Trash2, Pencil, Eye, AlertCircle, Package } from "lucide-react";
import { PageState } from "@/components/ui/page-state";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { AddTestDialog } from "@/components/AddTestDialog";
import { SearchBar } from "@/components/SearchBar";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { EPErrorState, EPPageHeader, EPStatusPill, EPLoader } from "@/components/ep";
export default function Tests() {
  const [search, setSearch] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data: tests = [], isLoading, error, isError, refetch} = useQuery<Array<{
    id: string;
    title: string;
    titleRu?: string;
    courseId: string | null;
    passPercentage: number;
    timeLimit: number | null;
    maxAttempts: number;
    createdAt: string;
    questionCount?: number;
    attemptsCount?: number;
    passRate?: number;
    randomizeQuestions?: boolean;
  }>>({
    queryKey: ["/api/tests"],
  });

  const deleteTestMutation = useMutation({
    mutationFn: async (testId: string) => {
      const response = await apiRequest("DELETE", `/api/tests/${testId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tests"] });
      toast({ title: "Test o'chirildi" });
    },
    onError: () => {
      toast({ 
        title: "Xatolik", 
        description: "Testni o'chirishda xatolik yuz berdi",
        variant: "destructive" 
      });
    },
  });

  const { data: coursesResponse } = useQuery<{ data: Array<{ id: string; title: string; titleRu?: string }>; pagination: { total: number; page: number; limit: number } }>({
    queryKey: ["/api/courses"],
  });
  const courses = coursesResponse?.data || [];

  const filteredTests = (Array.isArray(tests) ? tests : []).filter(test => 
    test.title?.toLowerCase().includes(search.toLowerCase()) ||
    test.titleRu?.toLowerCase().includes(search.toLowerCase())
  );

  const getCourseTitle = (courseId: string | null) => {
    if (!courseId) return "Mustaqil test";
    const course = (Array.isArray(courses) ? courses : []).find(c => c.id === courseId);
    return course?.title || "—";
  };

  const handleViewTest = (testId: string) => {
    window.location.href = `/tests/${testId}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="loading-spinner">
        <EPLoader size={32} tone="muted" />
      </div>
    );
  }


  if (isError) {
    return <EPErrorState onRetry={refetch} />;
  }
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2" data-testid="error-state">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-muted-foreground">Ma'lumotlarni yuklashda xatolik yuz berdi</p>
      </div>
    );
  }

  if (!tests || tests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2" data-testid="empty-state">
        <Package className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-medium">Hozircha ma'lumot yo'q</p>
        <p className="text-sm text-muted-foreground">Yangi yozuv qo'shish uchun yuqoridagi tugmani bosing</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <EPPageHeader
        breadcrumb={<>Dashboard · <b className="text-foreground">Test banki</b></>}
        title="Test banki"
        subtitle="Testlar va savollar boshqaruvi"
      />
        </div>
        <Button 
          onClick={() => setShowAddDialog(true)} 
          data-testid="button-add-test"
          className="bg-primary text-white rounded-lg px-5 py-2.5 text-sm font-semibold shadow-none"
        >
          <Plus className="w-4 h-4 mr-2" />
          Test yaratish
        </Button>
      </div>

      <div className="bg-muted/40 p-4 rounded-lg">
        <SearchBar 
          placeholder="Testlarni qidirish..."
          value={search}
          onChange={setSearch}
          className="bg-card border-border"
        />
      </div>

      <PageState
        isLoading={isLoading}
        isError={isError}
        isEmpty={filteredTests.length === 0}
        onRetry={refetch}
        skeleton="card"
        errorTitle="Testlar yuklanmadi"
        errorMessage="Server bilan bog'lanishda xatolik."
        emptyIcon={FileQuestion}
        emptyTitle="Testlar mavjud emas"
        emptyDescription={search ? "Qidiruv natijasi topilmadi" : "Birinchi testni yaratib boshlang."}
      >
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {(Array.isArray(filteredTests) ? filteredTests : []).map((test) => (
            <Card key={test.id} className="hover-elevate overflow-visible" data-testid={`card-test-${test.id}`}>
              <CardHeader className="space-y-0 pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-[14px] font-semibold line-clamp-2">{test.title}</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        data-testid={`button-menu-test-${test.id}`}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => navigate(`/test/${test.id}`)}
                        data-testid={`action-view-test-${test.id}`}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ko'rish
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setConfirmDeleteId(test.id)}
                        data-testid={`action-delete-test-${test.id}`}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        O'chirish
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {getCourseTitle(test.courseId)}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{test.timeLimit ? `${test.timeLimit} daqiqa` : "Cheksiz"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ListChecks className="w-4 h-4 text-muted-foreground" />
                    <span>{test.maxAttempts} urinish</span>
                  </div>
                </div>
                
                {/* Real statistics from backend */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2 border-t text-sm">
                  <div className="text-center">
                    <div className="text-muted-foreground text-xs mb-1">Savollar</div>
                    <div className="font-medium">{test.questionCount || 0}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-muted-foreground text-xs mb-1">Urinishlar</div>
                    <div className="font-medium">{test.attemptsCount || 0}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-muted-foreground text-xs mb-1">O'tish %</div>
                    <div className="font-medium">{test.passRate || 0}%</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    Talab: {test.passPercentage}%
                  </Badge>
                  {test.randomizeQuestions && (
                    <EPStatusPill tone="neutral" className="text-xs">
                      Aralash
                    </EPStatusPill>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-0 gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1"
                  onClick={() => handleViewTest(test.id)}
                  data-testid={`button-view-test-${test.id}`}
                >
                  <FileQuestion className="w-4 h-4 mr-2" />
                  Savollar
                </Button>
                <DeleteConfirmDialog
                  title="Testni o'chirishni tasdiqlaysizmi?"
                  description="Test va barcha savollar ham o'chiriladi. Bu amalni qaytarib bo'lmaydi."
                  onConfirm={() => deleteTestMutation.mutate(test.id)}
                  isPending={deleteTestMutation.isPending}
                />
              </CardFooter>
            </Card>
          ))}
        </div>
      </PageState>

      <AddTestDialog open={showAddDialog} onOpenChange={setShowAddDialog} />

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onOpenChange={open => { if (!open) setConfirmDeleteId(null); }}
        title="Testni o'chirish"
        description="Ushbu test va barcha savollar ham o'chiriladi. Bu amalni qaytarib bo'lmaydi."
        confirmText="O'chirish" cancelText="Bekor qilish" variant="destructive"
        onConfirm={() => { if (confirmDeleteId) deleteTestMutation.mutate(confirmDeleteId); }}
      />
    </div>
  );
}
