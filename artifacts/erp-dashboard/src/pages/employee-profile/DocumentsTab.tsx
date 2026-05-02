import { useState, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  FileText, ScrollText, FileCheck, Clock, CheckCircle2, XCircle, AlertCircle,
  Upload, Trash2, Download, FolderOpen, File, Image, FileType2,
  BookOpen, HeartPulse, Briefcase, User, FileSignature, Plus,
  ShoppingBag, Stethoscope, GraduationCap, MoreHorizontal,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { safeStorage } from '@/lib/safeStorage';
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const DOC_TYPE_LABELS: Record<string, string> = {
  LEAVE_REQUEST: "Ta'til so'rovi",
  ADVANCE_REQUEST: "Avans so'rovi",
  DISCIPLINE_NOTICE: "Intizom bildirishnomasi",
  EMPLOYMENT_CONTRACT: "Mehnat shartnomasi",
  AMENDMENT_CONTRACT: "Qo'shimcha kelishuv",
  DISMISSAL_ORDER: "Ishdan bo'shatish buyrug'i",
  TRANSFER_ORDER: "O'tkazish buyrug'i",
  TRAINING_REQUEST: "O'qitish so'rovi",
  TRAINING_CONTRACT: "O'qitish shartnomasi",
  EXPENSE_CLAIM: "Xarajatlar da'vosi",
  INVENTORY_RECEIPT: "Inventar qabul dalolatnomasi",
  INCIDENT_REPORT: "Hodisa dalolatnomasi",
  PIP_PLAN: "PIP Reja",
  OTHER: "Boshqa",
};

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  draft:     { label: "Qoralama",        icon: AlertCircle,   className: "text-gray-600 border-gray-300" },
  pending:   { label: "Kutilmoqda",      icon: Clock,         className: "text-amber-600 border-amber-300" },
  approved:  { label: "Tasdiqlandi",     icon: CheckCircle2,  className: "text-green-600 border-green-300" },
  rejected:  { label: "Rad etildi",      icon: XCircle,       className: "text-red-600 border-red-300" },
  cancelled: { label: "Bekor qilindi",   icon: XCircle,       className: "text-gray-500 border-gray-300" },
};

const FILE_CATEGORIES: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  personal:  { label: "Shaxsiy hujjatlar", icon: User,          color: "text-blue-500" },
  education: { label: "Ta'lim hujjatlari", icon: BookOpen,      color: "text-purple-500" },
  medical:   { label: "Tibbiy hujjatlar",  icon: HeartPulse,    color: "text-rose-500" },
  labor:     { label: "Mehnat hujjatlari", icon: Briefcase,     color: "text-amber-500" },
  contract:  { label: "Shartnomalar",      icon: FileSignature, color: "text-green-500" },
  other:     { label: "Boshqa",            icon: FolderOpen,    color: "text-gray-500" },
};

const EMP_DOC_CATEGORIES: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  contract: { label: "Mehnat shartnomalari",    icon: ScrollText,    color: "text-blue-500" },
  personal: { label: "Shaxsiy hujjatlar",       icon: User,          color: "text-indigo-500" },
  order:    { label: "Buyruqlar",               icon: FileText,      color: "text-amber-500" },
  payroll:  { label: "Oylik hisob-kitob",       icon: ShoppingBag,   color: "text-green-500" },
  medical:  { label: "Tibbiy hujjatlar",        icon: Stethoscope,   color: "text-rose-500" },
  training: { label: "O'qitish va sertifikatlar", icon: GraduationCap, color: "text-purple-500" },
  other:    { label: "Boshqa",                  icon: MoreHorizontal, color: "text-gray-500" },
};

interface HrDocument {
  id: number;
  doc_number: string;
  doc_type: string;
  title: string;
  status: string;
  created_at: string;
  submitted_at?: string;
  total_steps?: number;
  approved_steps?: number;
}

interface EmploymentContract {
  id: number;
  contractNumber: string;
  contractType: string;
  startDate: string;
  endDate?: string;
  salary?: number;
  workSchedule?: string;
  status?: string;
  createdAt?: string;
}

interface EmployeeFile {
  id: number;
  employee_id: number;
  file_name: string;
  file_url: string;
  file_size?: number;
  mime_type?: string;
  category: string;
  description?: string;
  uploaded_by_name?: string;
  created_at: string;
}

interface EmployeeDocument {
  id: number;
  employee_id: number;
  category: string;
  title: string;
  file_name?: string;
  file_url?: string;
  file_size?: number;
  mime_type?: string;
  notes?: string;
  uploaded_by?: number;
  uploaded_by_name?: string;
  created_at: string;
}

const addDocFormSchema = z.object({
  category: z.string().default("personal"),
  title: z.string().min(1, "Sarlavha kiritilishi shart"),
  fileName: z.string().optional(),
  fileUrl: z.string().optional(),
  notes: z.string().optional(),
});

type AddDocFormValues = z.infer<typeof addDocFormSchema>;

interface DocumentsTabProps {
  employeeId: string;
}

function formatBytes(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ mimeType }: { mimeType?: string }) {
  if (!mimeType) return <File className="h-4 w-4 text-muted-foreground" />;
  if (mimeType.startsWith("image/"))        return <Image className="h-4 w-4 text-blue-400" />;
  if (mimeType === "application/pdf")       return <FileText className="h-4 w-4 text-red-400" />;
  if (mimeType.includes("word"))            return <FileType2 className="h-4 w-4 text-blue-600" />;
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet"))
                                            return <FileType2 className="h-4 w-4 text-green-600" />;
  return <File className="h-4 w-4 text-muted-foreground" />;
}

export function DocumentsTab({ employeeId }: DocumentsTabProps) {
  const { toast } = useToast();
  const { hasRole } = useAuth();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdminOrHrManager = hasRole("admin", "super_admin", "hr_manager");

  const [activeFileCategory, setActiveFileCategory] = useState<string>("all");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadCategory, setUploadCategory] = useState("personal");
  const [uploadDescription, setUploadDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteFileId, setConfirmDeleteFileId] = useState<number | null>(null);

  const [addDocOpen, setAddDocOpen] = useState(false);
  const [savingDoc, setSavingDoc] = useState(false);
  const [deletingDocId, setDeletingDocId] = useState<number | null>(null);
  const [confirmDeleteDocId, setConfirmDeleteDocId] = useState<number | null>(null);

  const addDocForm = useForm<AddDocFormValues>({
    resolver: zodResolver(addDocFormSchema),
    defaultValues: { category: "personal", title: "", fileName: "", fileUrl: "", notes: "" },
  });

  const { data: contracts, isLoading: loadingContracts } = useQuery<EmploymentContract[]>({
    queryKey: ["/api/employees", employeeId, "contracts"],
    enabled: !!employeeId,
  });

  const { data: hrDocs, isLoading: loadingDocs } = useQuery<HrDocument[]>({
    queryKey: ["/api/hr-v2/documents/employee", employeeId],
    queryFn: async () => {
      const res = await fetch(`/api/hr-v2/documents/employee/${employeeId}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!employeeId,
  });

  const { data: employeeFiles, isLoading: loadingFiles } = useQuery<EmployeeFile[]>({
    queryKey: ["/api/employees", employeeId, "files"],
    queryFn: async () => {
      const res = await fetch(`/api/employees/${employeeId}/files`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!employeeId,
  });

  const { data: empDocs, isLoading: loadingEmpDocs } = useQuery<EmployeeDocument[]>({
    queryKey: ["/api/hr/employees", employeeId, "documents"],
    queryFn: async () => {
      const token = safeStorage.getItem("access_token");
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`/api/hr/employees/${employeeId}/documents`, {
        credentials: "include",
        headers,
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!employeeId,
  });

  const isLoading = loadingContracts || loadingDocs || loadingFiles || loadingEmpDocs;

  const totalContracts = contracts?.length ?? 0;
  const activeContract = contracts?.find(c => !c.endDate || new Date(c.endDate) > new Date());
  const pendingDocs = hrDocs?.filter(d => d.status === "pending").length ?? 0;
  const approvedDocs = hrDocs?.filter(d => d.status === "approved").length ?? 0;
  const totalFiles = employeeFiles?.length ?? 0;

  const filteredFiles = activeFileCategory === "all"
    ? (Array.isArray(employeeFiles) ? employeeFiles : [])
    : (Array.isArray(employeeFiles) ? employeeFiles : []).filter(f => f.category === activeFileCategory);

  async function handleUpload() {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("category", uploadCategory);
      if (uploadDescription) formData.append("description", uploadDescription);

      const res = await fetch(`/api/employees/${employeeId}/files`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Yuklash xatoligi");
      }
      await qc.invalidateQueries({ queryKey: ["/api/employees", employeeId, "files"] });
      toast({ title: "Fayl muvaffaqiyatli yuklandi" });
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setUploadDescription("");
    } catch (err: unknown) {
      toast({ title: "Xatolik", description: err instanceof Error ? err.message : "Yuklash xatoligi", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(fileId: number) {
    setDeletingId(fileId);
    try {
      const res = await fetch(`/api/employees/${employeeId}/files/${fileId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("O'chirishda xatolik");
      await qc.invalidateQueries({ queryKey: ["/api/employees", employeeId, "files"] });
      toast({ title: "Fayl o'chirildi" });
    } catch {
      toast({ title: "Xatolik", description: "Faylni o'chirib bo'lmadi", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  }

  function resetAddDocForm() {
    addDocForm.reset({ category: "personal", title: "", fileName: "", fileUrl: "", notes: "" });
  }

  async function handleAddDoc(values: AddDocFormValues) {
    setSavingDoc(true);
    try {
      const token = safeStorage.getItem("access_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const res = await fetch(`/api/hr/employees/${employeeId}/documents`, {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({
          category: values.category,
          title: values.title.trim(),
          file_name: values.fileName || undefined,
          file_url: values.fileUrl || undefined,
          notes: values.notes || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Saqlashda xatolik");
      }
      await qc.invalidateQueries({ queryKey: ["/api/hr/employees", employeeId, "documents"] });
      toast({ title: "Hujjat muvaffaqiyatli qo'shildi" });
      setAddDocOpen(false);
      resetAddDocForm();
    } catch (err: unknown) {
      toast({ title: "Xatolik", description: err instanceof Error ? err.message : "Saqlashda xatolik", variant: "destructive" });
    } finally {
      setSavingDoc(false);
    }
  }

  async function handleDeleteDoc(docId: number) {
    setDeletingDocId(docId);
    try {
      const token = safeStorage.getItem("access_token");
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`/api/hr/employees/${employeeId}/documents/${docId}`, {
        method: "DELETE",
        credentials: "include",
        headers,
      });
      if (!res.ok) throw new Error("O'chirishda xatolik");
      await qc.invalidateQueries({ queryKey: ["/api/hr/employees", employeeId, "documents"] });
      toast({ title: "Hujjat o'chirildi" });
    } catch {
      toast({ title: "Xatolik", description: "Hujjatni o'chirib bo'lmadi", variant: "destructive" });
    } finally {
      setDeletingDocId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {([...Array(4)]).map((_, i) => <Skeleton key={`k-${i}`} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI kartalar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Shartnomalar</p>
                <p className="text-2xl font-bold text-blue-600">{totalContracts}</p>
                {activeContract && <p className="text-xs text-blue-500 mt-0.5">1 ta faol</p>}
              </div>
              <ScrollText className="h-7 w-7 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 border-amber-500/20">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Kutilayotgan</p>
                <p className="text-2xl font-bold text-amber-600">{pendingDocs}</p>
              </div>
              <Clock className="h-7 w-7 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Tasdiqlangan</p>
                <p className="text-2xl font-bold text-green-600">{approvedDocs}</p>
              </div>
              <FileCheck className="h-7 w-7 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Yuklangan fayllar</p>
                <p className="text-2xl font-bold text-purple-600">{totalFiles}</p>
              </div>
              <FolderOpen className="h-7 w-7 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===== HUJJATLAR PAPKASI (employee_documents table) ===== */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                Hujjatlar
              </CardTitle>
              <CardDescription>Xodimning rasmiy hujjatlari (kategoriya bo'yicha guruhlangan)</CardDescription>
            </div>
            {isAdminOrHrManager && (
              <Button
                size="sm"
                onClick={() => { resetAddDocForm(); setAddDocOpen(true); }}
                className="gap-2 bg-primary hover:bg-primary/90"
                data-testid="button-add-document"
              >
                <Plus className="h-4 w-4" />
                Hujjat qo'shish
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!empDocs || empDocs.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mb-3 opacity-15" />
              <p className="text-sm font-medium">Hujjat qo'shilmagan</p>
              <p className="text-xs opacity-60 mt-1">Xodim uchun hali hujjat yuklanmagan</p>
              {isAdminOrHrManager && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4 gap-2"
                  onClick={() => { resetAddDocForm(); setAddDocOpen(true); }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Hujjat qo'shish
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(EMP_DOC_CATEGORIES).map(([catKey, catCfg]) => {
                const docs = (Array.isArray(empDocs) ? empDocs : []).filter(d => d.category === catKey);
                if (docs.length === 0) return null;
                const CatIcon = catCfg.icon;
                return (
                  <div key={catKey}>
                    <div className={`flex items-center gap-2 mb-2 text-sm font-semibold ${catCfg.color}`}>
                      <CatIcon className="h-4 w-4" />
                      {catCfg.label}
                      <span className="text-muted-foreground font-normal text-xs">({docs.length})</span>
                    </div>
                    <div className="space-y-1 pl-2">
                      {(Array.isArray(docs) ? docs : []).map(doc => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 px-3 py-2 hover:bg-muted/50 transition-colors"
                          data-testid={`row-empdoc-${doc.id}`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <File className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{doc.title}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {doc.file_name && <span className="truncate max-w-[140px]">{doc.file_name}</span>}
                                {doc.notes && <span className="truncate max-w-[160px] opacity-70">{doc.notes}</span>}
                                <span>{new Date(doc.created_at).toLocaleDateString("uz-UZ")}</span>
                                {doc.uploaded_by_name && <span>• {doc.uploaded_by_name}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            {doc.file_url && (
                              <a
                                href={doc.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center rounded h-7 w-7 hover:bg-muted transition-colors"
                                title="Ko'rish"
                              >
                                <Download className="h-3.5 w-3.5 text-muted-foreground" />
                              </a>
                            )}
                            {isAdminOrHrManager && (
                              <button
                                onClick={() => setConfirmDeleteDocId(doc.id)}
                                disabled={deletingDocId === doc.id}
                                className="inline-flex items-center justify-center rounded h-7 w-7 hover:bg-destructive/10 transition-colors"
                                title="O'chirish"
                                data-testid={`button-delete-doc-${doc.id}`}
                              >
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===== XODIM PAPKASI ===== */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-purple-500" />
                Xodim Papkasi
              </CardTitle>
              <CardDescription>Xodimning shaxsiy hujjatlari va fayllari</CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => setUploadDialogOpen(true)}
              className="gap-2 bg-primary hover:bg-primary/90"
              data-testid="button-upload-file"
            >
              <Upload className="h-4 w-4" />
              Fayl yuklash
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Category tabs */}
          <div className="flex flex-wrap gap-1 mb-4">
            <button
              onClick={() => setActiveFileCategory("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeFileCategory === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground"
              }`}
            >
              Barchasi ({totalFiles})
            </button>
            {Object.entries(FILE_CATEGORIES).map(([key, cfg]) => {
              const count = (Array.isArray(employeeFiles) ? employeeFiles : []).filter(f => f.category === key).length;
              const Icon = cfg.icon;
              return (
                <button
                  key={key}
                  onClick={() => setActiveFileCategory(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    activeFileCategory === key
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80 text-muted-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {cfg.label} {count > 0 && <span className="opacity-60">({count})</span>}
                </button>
              );
            })}
          </div>

          {/* Files table */}
          {filteredFiles.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Fayl nomi</TableHead>
                  <TableHead>Toifa</TableHead>
                  <TableHead>Izoh</TableHead>
                  <TableHead>Hajmi</TableHead>
                  <TableHead>Yuklagan</TableHead>
                  <TableHead>Sana</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(filteredFiles) ? filteredFiles : []).map(file => {
                  const catCfg = FILE_CATEGORIES[file.category] || FILE_CATEGORIES.other;
                  const CatIcon = catCfg.icon;
                  return (
                    <TableRow key={file.id} data-testid={`row-empfile-${file.id}`}>
                      <TableCell>
                        <FileIcon mimeType={file.mime_type} />
                      </TableCell>
                      <TableCell className="font-medium text-sm max-w-[200px] truncate">
                        {file.file_name}
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs flex items-center gap-1 ${catCfg.color}`}>
                          <CatIcon className="h-3 w-3" />
                          {catCfg.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">
                        {file.description || "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatBytes(file.file_size)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {file.uploaded_by_name || "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(file.created_at).toLocaleDateString("uz-UZ")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <a
                            href={file.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center rounded h-7 w-7 hover:bg-muted transition-colors"
                            title="Yuklab olish"
                          >
                            <Download className="h-3.5 w-3.5 text-muted-foreground" />
                          </a>
                          <button
                            onClick={() => setConfirmDeleteFileId(file.id)}
                            disabled={deletingId === file.id}
                            className="inline-flex items-center justify-center rounded h-7 w-7 hover:bg-destructive/10 transition-colors"
                            title="O'chirish"
                            data-testid={`button-delete-file-${file.id}`}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center py-12 text-muted-foreground">
              <FolderOpen className="h-12 w-12 mb-3 opacity-15" />
              <p className="text-sm font-medium">Fayllar topilmadi</p>
              <p className="text-xs opacity-60 mt-1">
                {activeFileCategory === "all"
                  ? "Xodim papkasiga hali fayl yuklanmagan"
                  : `${FILE_CATEGORIES[activeFileCategory]?.label} toifasida fayllar yo'q`}
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-4 gap-2"
                onClick={() => setUploadDialogOpen(true)}
              >
                <Upload className="h-3.5 w-3.5" />
                Fayl yuklash
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mehnat shartnomalari */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-blue-500" />
            Mehnat shartnomalari
          </CardTitle>
          <CardDescription>Xodim bilan tuzilgan barcha shartnomalar ro'yxati</CardDescription>
        </CardHeader>
        <CardContent>
          {contracts && contracts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shartnoma №</TableHead>
                  <TableHead>Turi</TableHead>
                  <TableHead>Boshlanish sanasi</TableHead>
                  <TableHead>Tugash sanasi</TableHead>
                  <TableHead>Maosh</TableHead>
                  <TableHead>Holati</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(contracts) ? contracts : []).map((contract) => {
                  const isActive = !contract.endDate || new Date(contract.endDate) > new Date();
                  return (
                    <TableRow key={contract.id} data-testid={`row-contract-${contract.id}`}>
                      <TableCell className="font-mono text-sm font-semibold">
                        {contract.contractNumber || `#${contract.id}`}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {contract.contractType === "indefinite" ? "Doimiy"
                            : contract.contractType === "temporary" ? "Muddatli"
                            : contract.contractType === "probation" ? "Sinov muddati"
                            : contract.contractType === "fixed-term" ? "Belgilangan muddat"
                            : contract.contractType || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {contract.startDate ? new Date(contract.startDate).toLocaleDateString("uz-UZ") : "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {contract.endDate ? new Date(contract.endDate).toLocaleDateString("uz-UZ") : "Muddatsiz"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {contract.salary ? `${Number(contract.salary).toLocaleString()} so'm` : "—"}
                      </TableCell>
                      <TableCell>
                        {isActive ? (
                          <Badge className="bg-green-100 text-green-800 border-none text-xs gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Faol
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Yakunlangan</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center py-10 text-muted-foreground">
              <ScrollText className="h-10 w-10 mb-3 opacity-20" />
              <p className="text-sm">Shartnomalar topilmadi</p>
              <p className="text-xs opacity-60 mt-1">Hech qanday mehnat shartnomasi qayd etilmagan</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* HR hujjatlar oqimi */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-500" />
            Hujjatlar oqimi
          </CardTitle>
          <CardDescription>Xodim tomonidan yaratilgan barcha hujjatlar</CardDescription>
        </CardHeader>
        <CardContent>
          {hrDocs && hrDocs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hujjat №</TableHead>
                  <TableHead>Turi</TableHead>
                  <TableHead>Sarlavha</TableHead>
                  <TableHead>Sana</TableHead>
                  <TableHead>Tasdiqlash</TableHead>
                  <TableHead>Holati</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(hrDocs) ? hrDocs : []).map((doc) => {
                  const statusCfg = STATUS_CONFIG[doc.status] || STATUS_CONFIG.draft;
                  const StatusIcon = statusCfg.icon;
                  const approvalProgress = doc.total_steps && doc.total_steps > 0
                    ? `${doc.approved_steps ?? 0}/${doc.total_steps}`
                    : "—";
                  return (
                    <TableRow key={doc.id} data-testid={`row-hrdoc-${doc.id}`}>
                      <TableCell className="font-mono text-xs font-semibold text-muted-foreground">
                        {doc.doc_number}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {DOC_TYPE_LABELS[doc.doc_type] || doc.doc_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm max-w-[180px] truncate">
                        {doc.title || "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(doc.created_at).toLocaleDateString("uz-UZ")}
                      </TableCell>
                      <TableCell className="text-sm text-center">
                        {approvalProgress}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs gap-1 ${statusCfg.className}`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusCfg.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center py-10 text-muted-foreground">
              <FileText className="h-10 w-10 mb-3 opacity-20" />
              <p className="text-sm">Hujjatlar topilmadi</p>
              <p className="text-xs opacity-60 mt-1">Hujjatlar oqimi orqali yaratilgan hujjatlar yo'q</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Fayl yuklash
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* File picker */}
            <div className="space-y-2">
              <Label>Fayl *</Label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  selectedFile ? "border-primary/50 bg-primary/5" : "border-muted-foreground/25 hover:border-primary/30"
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                {selectedFile ? (
                  <div className="flex flex-col items-center gap-1">
                    <FileIcon mimeType={selectedFile.type} />
                    <p className="text-sm font-medium mt-1">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">{formatBytes(selectedFile.size)}</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Upload className="h-8 w-8 opacity-40" />
                    <p className="text-sm">Fayl tanlash uchun bosing</p>
                    <p className="text-xs opacity-60">PDF, Word, Excel, rasm — max 15 MB</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.gif,.txt"
                  onChange={e => setSelectedFile(e.target.files?.[0] ?? null)}
                  data-testid="input-file"
                />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Toifa *</Label>
              <Select value={uploadCategory} onValueChange={setUploadCategory}>
                <SelectTrigger data-testid="select-category">
                  <SelectValue placeholder="Toifani tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FILE_CATEGORIES).map(([key, cfg]) => {
                    const Icon = cfg.icon;
                    return (
                      <SelectItem key={key} value={key}>
                        <span className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${cfg.color}`} />
                          {cfg.label}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Izoh (ixtiyoriy)</Label>
              <Input
                placeholder="Hujjat haqida qisqacha ma'lumot..."
                value={uploadDescription}
                onChange={e => setUploadDescription(e.target.value)}
                data-testid="input-description"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setUploadDialogOpen(false); setSelectedFile(null); }}>
              Bekor qilish
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="gap-2"
              data-testid="button-confirm-upload"
            >
              {uploading ? (
                <><Clock className="h-4 w-4 animate-spin" /> Yuklanmoqda...</>
              ) : (
                <><Upload className="h-4 w-4" /> Yuklash</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Document Dialog */}
      <Dialog open={addDocOpen} onOpenChange={open => { setAddDocOpen(open); if (!open) resetAddDocForm(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Hujjat qo'shish
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={addDocForm.handleSubmit(handleAddDoc)} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Kategoriya *</Label>
              <Controller control={addDocForm.control} name="category" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger data-testid="select-doc-category">
                    <SelectValue placeholder="Kategoriyani tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EMP_DOC_CATEGORIES).map(([key, cfg]) => {
                      const Icon = cfg.icon;
                      return (
                        <SelectItem key={key} value={key}>
                          <span className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${cfg.color}`} />
                            {cfg.label}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )} />
            </div>

            <div className="space-y-2">
              <Label>Sarlavha *</Label>
              <Input {...addDocForm.register("title")} placeholder="Masalan: Pasport nusxasi" data-testid="input-doc-title" />
              {addDocForm.formState.errors.title && <p className="text-sm text-destructive">{addDocForm.formState.errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Fayl nomi (ixtiyoriy)</Label>
              <Input {...addDocForm.register("fileName")} placeholder="Masalan: passport.pdf" data-testid="input-doc-filename" />
            </div>

            <div className="space-y-2">
              <Label>Fayl URL (ixtiyoriy)</Label>
              <Input {...addDocForm.register("fileUrl")} placeholder="Masalan: /uploads/emp/123/passport.pdf" data-testid="input-doc-fileurl" />
            </div>

            <div className="space-y-2">
              <Label>Izoh (ixtiyoriy)</Label>
              <Textarea {...addDocForm.register("notes")} placeholder="Hujjat haqida qo'shimcha ma'lumot..." rows={3} data-testid="input-doc-notes" />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setAddDocOpen(false); resetAddDocForm(); }}>
                Bekor qilish
              </Button>
              <Button type="submit" disabled={savingDoc} className="gap-2" data-testid="button-confirm-add-doc">
                {savingDoc ? (
                  <><Clock className="h-4 w-4 animate-spin" /> Saqlanmoqda...</>
                ) : (
                  <><Plus className="h-4 w-4" /> Saqlash</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDeleteFileId !== null}
        onOpenChange={(open) => { if (!open) setConfirmDeleteFileId(null); }}
        title="Faylni o'chirish"
        description="Ushbu faylni o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi."
        confirmText="O'chirish"
        cancelText="Bekor qilish"
        variant="destructive"
        onConfirm={() => { if (confirmDeleteFileId !== null) handleDelete(confirmDeleteFileId); }}
      />
      <ConfirmDialog
        open={confirmDeleteDocId !== null}
        onOpenChange={(open) => { if (!open) setConfirmDeleteDocId(null); }}
        title="Hujjatni o'chirish"
        description="Ushbu hujjatni o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi."
        confirmText="O'chirish"
        cancelText="Bekor qilish"
        variant="destructive"
        onConfirm={() => { if (confirmDeleteDocId !== null) handleDeleteDoc(confirmDeleteDocId); }}
      />
    </div>
  );
}
