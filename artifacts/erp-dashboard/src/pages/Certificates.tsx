import { useQuery, useMutation } from "@tanstack/react-query";
import { ErrorState } from "@/components/ui/error-state";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Download, Award, Trash2 } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  certificateNumber: string;
  score: number | null;
  bonusAmount: number | null;
  issuedAt: string;
  expiresAt: string | null;
  userName: string;
  userEmployeeId: string;
  courseName: string;
  courseCode: string;
}

interface User {
  id: string;
  fullName: string;
  employeeId: string;
}

interface Course {
  id: string;
  code: string;
  title: string;
}

export default function Certificates() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [score, setScore] = useState("");
  const [bonusAmount, setBonusAmount] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const { data: certificates, isLoading, isError, refetch } = useQuery<Certificate[]>({
    queryKey: ["/api/certificates"],
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/employees"],
  });

  const { data: courses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { userId: string; courseId: string; score?: number; bonusAmount?: number; expiresAt?: string }) => {
      return await apiRequest("POST", "/api/certificates", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certificates"] });
      toast({
        title: "Muvaffaqiyatli",
        description: "Sertifikat muvaffaqiyatli yaratildi",
      });
      setIsDialogOpen(false);
      setSelectedUserId("");
      setSelectedCourseId("");
      setScore("");
      setBonusAmount("");
      setExpiresAt("");
    },
    onError: () => {
      toast({
        title: "Xatolik",
        description: "Sertifikat yaratishda xatolik yuz berdi",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/certificates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certificates"] });
      toast({
        title: "Muvaffaqiyatli",
        description: "Sertifikat o'chirildi",
      });
    },
    onError: () => {
      toast({
        title: "Xatolik",
        description: "Sertifikatni o'chirishda xatolik",
        variant: "destructive",
      });
    },
  });

  const handleDownload = (id: string) => {
    window.open(`/api/certificates/${id}/download`, "_blank");
  };

  const handleSubmit = () => {
    if (!selectedUserId || !selectedCourseId) {
      toast({
        title: "Xatolik",
        description: "Iltimos, xodim va kursni tanlang",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({
      userId: selectedUserId,
      courseId: selectedCourseId,
      score: score ? parseInt(score) : undefined,
      bonusAmount: bonusAmount ? parseInt(bonusAmount) : undefined,
      expiresAt: expiresAt || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Yuklanmoqda...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <ErrorState onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-surface p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-light tracking-tight text-on-surface">
            Sertifikatlar <span className="font-bold text-primary">Ro'yxati</span>
          </h1>
          <p className="text-on-surface-variant mt-2 font-medium">Kurs yakunlash sertifikatlarini boshqarish</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              data-testid="button-create-certificate"
              className="bg-gradient-to-br from-primary to-primary-dim text-white shadow-sm"
            >
              <Award className="w-4 h-4 mr-2" />
              Sertifikat Berish
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-surface-container-lowest border-outline-variant max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-on-surface text-xl">Yangi Sertifikat Berish</DialogTitle>
              <DialogDescription className="text-on-surface-variant">
                Kursni muvaffaqiyatli yakunlagan xodimga sertifikat yarating
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="employee" className="text-on-surface font-semibold">Xodim</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger id="employee" data-testid="select-employee" className="bg-surface-container-low border-outline-variant">
                    <SelectValue placeholder="Xodimni tanlang" />
                  </SelectTrigger>
                  <SelectContent className="bg-surface-container-lowest border-outline-variant">
                    {users?.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.fullName} ({user.employeeId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="course" className="text-on-surface font-semibold">Kurs</Label>
                <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                  <SelectTrigger id="course" data-testid="select-course" className="bg-surface-container-low border-outline-variant border-2 border-primary-container">
                    <SelectValue placeholder="Kursni tanlang" />
                  </SelectTrigger>
                  <SelectContent className="bg-surface-container-lowest border-outline-variant">
                    {courses?.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title} ({course.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="score" className="text-on-surface font-semibold">Yakuniy Ball</Label>
                  <Input
                    id="score"
                    data-testid="input-score"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0-100"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    className="bg-surface-container-low border-outline-variant"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bonus" className="text-on-surface font-semibold">Bonus Miqdori</Label>
                  <Input
                    id="bonus"
                    data-testid="input-bonus"
                    type="number"
                    min="0"
                    placeholder="so'm"
                    value={bonusAmount}
                    onChange={(e) => setBonusAmount(e.target.value)}
                    className="bg-surface-container-low border-outline-variant"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiresAt" className="text-on-surface font-semibold">Amal qilish muddati</Label>
                <Input
                  id="expiresAt"
                  data-testid="input-expires-at"
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  max="2099-12-31"
                  className="bg-surface-container-low border-outline-variant"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                data-testid="button-cancel"
                className="bg-surface-container text-on-surface border-none shadow-none"
              >
                Bekor qilish
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending}
                data-testid="button-submit"
                className="bg-gradient-to-br from-primary to-primary-dim text-white font-semibold shadow-none"
              >
                {createMutation.isPending ? "Yaratilmoqda..." : "Sertifikat Berish"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-on-surface">Barcha Sertifikatlar</h2>
          <p className="text-sm text-on-surface-variant">
            Berilgan sertifikatlarni ko'rish va boshqarish
          </p>
        </div>
        
        {!certificates || certificates.length === 0 ? (
          <div className="text-center py-12 text-on-surface-variant font-medium">
            Hali sertifikat berilmagan
          </div>
        ) : (
          <div className="rounded-lg border border-outline-variant overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 rounded-tl-lg">Sertifikat №</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Xodim</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Kurs</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Ball</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Bonus</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Berilgan Sana</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 text-right rounded-tr-lg">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(certificates) ? certificates : []).map((cert) => (
                  <TableRow key={cert.id} className="hover:bg-surface-container-low transition-colors border-outline-variant">
                    <TableCell className="font-mono text-sm px-6 text-primary font-semibold">
                      {cert.certificateNumber}
                    </TableCell>
                    <TableCell className="px-6">
                      <div>
                        <div className="font-bold text-on-surface">{cert.userName}</div>
                        <div className="text-xs text-on-surface-variant uppercase tracking-tighter">
                          {cert.userEmployeeId}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6">
                      <div>
                        <div className="text-on-surface font-medium">{cert.courseName}</div>
                        <div className="text-xs text-on-surface-variant">
                          {cert.courseCode}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 text-on-surface">
                      <span className="font-bold text-lg">{cert.score ? `${cert.score}%` : "—"}</span>
                    </TableCell>
                    <TableCell className="px-6">
                      {cert.bonusAmount ? (
                        <span className="text-green-600 font-bold">{cert.bonusAmount.toLocaleString()} <span className="text-[10px] uppercase">so'm</span></span>
                      ) : (
                        <span className="text-on-surface-variant">—</span>
                      )}
                    </TableCell>
                    <TableCell className="px-6 text-on-surface font-medium">
                      {new Date(cert.issuedAt).toLocaleDateString('uz-UZ')}
                    </TableCell>
                    <TableCell className="px-6 text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownload(cert.id)}
                          data-testid={`button-download-${cert.id}`}
                          className="text-primary hover:text-primary-dim"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Yuklab olish
                        </Button>
                        <DeleteConfirmDialog
                          title="Sertifikatni o'chirishni tasdiqlaysizmi?"
                          description="Sertifikat butunlay o'chiriladi."
                          onConfirm={() => deleteMutation.mutate(cert.id)}
                          isPending={deleteMutation.isPending}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
