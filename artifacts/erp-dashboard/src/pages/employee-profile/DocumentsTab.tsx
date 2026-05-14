/**
 * DocumentsTab — Employee profile documents tab.
 * State, queries, and orchestration only; rendering delegated to sub-components.
 */
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { getAuthHeaders } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { safeStorage } from "@/lib/safeStorage";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  type DocumentsTabProps, type HrDocument, type EmploymentContract,
  type EmployeeFile, type EmployeeDocument,
} from "./DocumentsTabTypes";
import { KPICards, EmployeeDocsSection, FileFolderSection, ContractsSection, HRDocsSection } from "./DocumentsTabSections";
import { UploadDialog, AddDocDialog } from "./DocumentsTabDialogs";
import { apiRequest } from '@/lib/queryClient';

export function DocumentsTab({ employeeId }: DocumentsTabProps) {
  const { toast }           = useToast();
  const { hasRole }         = useAuth();
  const qc                  = useQueryClient();
  const isAdminOrHrManager  = hasRole("admin", "super_admin", "hr_manager");

  // ── Dialog visibility ────────────────────────────────────────────────────────
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [addDocOpen, setAddDocOpen]             = useState(false);

  // ── File-folder state ────────────────────────────────────────────────────────
  const [activeFileCategory, setActiveFileCategory]   = useState<string>("all");
  const [deletingId, setDeletingId]                   = useState<number | null>(null);
  const [confirmDeleteFileId, setConfirmDeleteFileId] = useState<number | null>(null);

  // ── Document-list state ──────────────────────────────────────────────────────
  const [deletingDocId, setDeletingDocId]             = useState<number | null>(null);
  const [confirmDeleteDocId, setConfirmDeleteDocId]   = useState<number | null>(null);

  // ── Queries ──────────────────────────────────────────────────────────────────
  const { data: contracts, isLoading: loadingContracts } = useQuery<EmploymentContract[]>({
    queryKey: ["/api/employees", employeeId, "contracts"],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/employees/${employeeId}/contracts`);
      if (!res.ok) return [];
      const json = await res.json();
      return Array.isArray(json) ? json : (Array.isArray(json?.data) ? json.data : []);
    },
    enabled: !!employeeId,
  });

  const { data: hrDocs, isLoading: loadingDocs } = useQuery<HrDocument[]>({
    queryKey: ["/api/hr-v2/documents/employee", employeeId],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/hr-v2/documents/employee/${employeeId}`);
      if (!res.ok) return [];
      const json = await res.json();
      return Array.isArray(json) ? json : (Array.isArray(json?.data) ? json.data : []);
    },
    enabled: !!employeeId,
  });

  const { data: employeeFiles, isLoading: loadingFiles } = useQuery<EmployeeFile[]>({
    queryKey: ["/api/employees", employeeId, "files"],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/employees/${employeeId}/files`);
      if (!res.ok) return [];
      const json = await res.json();
      return Array.isArray(json) ? json : (Array.isArray(json?.data) ? json.data : []);
    },
    enabled: !!employeeId,
  });

  const { data: empDocs, isLoading: loadingEmpDocs } = useQuery<EmployeeDocument[]>({
    queryKey: ["/api/hr/employees", employeeId, "documents"],
    queryFn: async () => {
      const token = safeStorage.getItem("access_token");
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await apiRequest('GET', `/api/hr/employees/${employeeId}/documents`);
      if (!res.ok) return [];
      const json = await res.json();
      return Array.isArray(json) ? json : (Array.isArray(json?.data) ? json.data : []);
    },
    enabled: !!employeeId,
  });

  // ── Derived values ───────────────────────────────────────────────────────────
  const contractsArr  = Array.isArray(contracts) ? contracts : [];
  const hrDocsArr     = Array.isArray(hrDocs) ? hrDocs : [];
  const activeContract = contractsArr.find(c => !c.endDate || new Date(c.endDate) > new Date());
  const pendingDocs   = hrDocsArr.filter(d => d.status === "pending").length;
  const approvedDocs  = hrDocsArr.filter(d => d.status === "approved").length;
  const totalFiles    = employeeFiles?.length ?? 0;

  // ── Delete handlers ──────────────────────────────────────────────────────────
  async function handleDelete(fileId: number) {
    setDeletingId(fileId);
    try {
      const res = await apiRequest('DELETE', `/api/employees/${employeeId}/files/${fileId}`);
      if (!res.ok) throw new Error("O'chirishda xatolik");
      await qc.invalidateQueries({ queryKey: ["/api/employees", employeeId, "files"] });
      toast({ title: "Fayl o'chirildi" });
    } catch {
      toast({ title: "Xatolik", description: "Faylni o'chirib bo'lmadi", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  }

  async function handleDeleteDoc(docId: number) {
    setDeletingDocId(docId);
    try {
      const token = safeStorage.getItem("access_token");
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await apiRequest('DELETE', `/api/hr/employees/${employeeId}/documents/${docId}`);
      if (!res.ok) throw new Error("O'chirishda xatolik");
      await qc.invalidateQueries({ queryKey: ["/api/hr/employees", employeeId, "documents"] });
      toast({ title: "Hujjat o'chirildi" });
    } catch {
      toast({ title: "Xatolik", description: "Hujjatni o'chirib bo'lmadi", variant: "destructive" });
    } finally {
      setDeletingDocId(null);
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loadingContracts || loadingDocs || loadingFiles || loadingEmpDocs) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <KPICards
        totalContracts={contractsArr.length}
        activeContract={activeContract}
        pendingDocs={pendingDocs}
        approvedDocs={approvedDocs}
        totalFiles={totalFiles}
      />

      <EmployeeDocsSection
        empDocs={empDocs}
        isAdminOrHrManager={isAdminOrHrManager}
        deletingDocId={deletingDocId}
        onAddDocClick={() => setAddDocOpen(true)}
        onDeleteDocClick={id => setConfirmDeleteDocId(id)}
      />

      <FileFolderSection
        employeeFiles={employeeFiles}
        totalFiles={totalFiles}
        activeFileCategory={activeFileCategory}
        onCategoryChange={setActiveFileCategory}
        deletingId={deletingId}
        onDeleteFileClick={id => setConfirmDeleteFileId(id)}
        onUploadClick={() => setUploadDialogOpen(true)}
      />

      <ContractsSection contractsArr={contractsArr} />

      <HRDocsSection hrDocsArr={hrDocsArr} />

      {/* Dialogs */}
      <UploadDialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen} employeeId={employeeId} />
      <AddDocDialog open={addDocOpen} onOpenChange={setAddDocOpen} employeeId={employeeId} />

      {/* Confirm deletions */}
      <ConfirmDialog
        open={confirmDeleteFileId !== null}
        onOpenChange={open => { if (!open) setConfirmDeleteFileId(null); }}
        title="Faylni o'chirish"
        description="Ushbu faylni o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi."
        confirmText="O'chirish" cancelText="Bekor qilish" variant="destructive"
        onConfirm={() => { if (confirmDeleteFileId !== null) handleDelete(confirmDeleteFileId); }}
      />
      <ConfirmDialog
        open={confirmDeleteDocId !== null}
        onOpenChange={open => { if (!open) setConfirmDeleteDocId(null); }}
        title="Hujjatni o'chirish"
        description="Ushbu hujjatni o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi."
        confirmText="O'chirish" cancelText="Bekor qilish" variant="destructive"
        onConfirm={() => { if (confirmDeleteDocId !== null) handleDeleteDoc(confirmDeleteDocId); }}
      />
    </div>
  );
}
