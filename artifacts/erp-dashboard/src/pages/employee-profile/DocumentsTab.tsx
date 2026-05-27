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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  type DocumentsTabProps, type HrDocument, type EmploymentContract,
  type EmployeeFile, type EmployeeDocument,
} from "./DocumentsTabTypes";
import { KPICards, EmployeeDocsSection, FileFolderSection, ContractsSection, HRDocsSection } from "./DocumentsTabSections";
import { UploadDialog, AddDocDialog } from "./DocumentsTabDialogs";
import { apiRequest } from '@/lib/queryClient';
import { useTranslation } from '@/lib/i18n';

export function DocumentsTab({ employeeId }: DocumentsTabProps) {
  const { t } = useTranslation("common");
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
      try {
        const json = await apiRequest('GET', `/api/employees/${employeeId}/contracts`) as unknown;
        const arr = Array.isArray(json) ? json : (Array.isArray((json as { data?: unknown[] })?.data) ? (json as { data: unknown[] }).data : []);
        return arr as EmploymentContract[];
      } catch {
        return [];
      }
    },
    enabled: !!employeeId,
  });

  const { data: hrDocs, isLoading: loadingDocs } = useQuery<HrDocument[]>({
    queryKey: ["/api/hr-v2/workflow/employee", employeeId, "documents"],
    queryFn: async () => {
      try {
        const json = await apiRequest('GET', `/api/hr-v2/workflow/employee/${employeeId}/documents`) as unknown;
        const arr = Array.isArray(json) ? json : (Array.isArray((json as { data?: unknown[] })?.data) ? (json as { data: unknown[] }).data : []);
        return arr as HrDocument[];
      } catch {
        return [];
      }
    },
    enabled: !!employeeId,
  });

  const { data: employeeFiles, isLoading: loadingFiles } = useQuery<EmployeeFile[]>({
    queryKey: ["/api/employees", employeeId, "files"],
    queryFn: async () => {
      try {
        const json = await apiRequest('GET', `/api/employees/${employeeId}/files`) as unknown;
        const arr = Array.isArray(json) ? json : (Array.isArray((json as { data?: unknown[] })?.data) ? (json as { data: unknown[] }).data : []);
        return arr as EmployeeFile[];
      } catch {
        return [];
      }
    },
    enabled: !!employeeId,
  });

  const { data: empDocs, isLoading: loadingEmpDocs } = useQuery<EmployeeDocument[]>({
    queryKey: ["/api/hr/employees", employeeId, "documents"],
    queryFn: async () => {
      // Auth carried by httpOnly cookie via apiRequest's `credentials: 'include'`.
      try {
        const json = await apiRequest('GET', `/api/hr/employees/${employeeId}/documents`) as unknown;
        const arr = Array.isArray(json) ? json : (Array.isArray((json as { data?: unknown[] })?.data) ? (json as { data: unknown[] }).data : []);
        return arr as EmployeeDocument[];
      } catch {
        return [];
      }
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
      await apiRequest('DELETE', `/api/employees/${employeeId}/files/${fileId}`);
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
      // Auth via httpOnly cookie; apiRequest sets `credentials: 'include'` internally.
      await apiRequest('DELETE', `/api/hr/employees/${employeeId}/documents/${docId}`);
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
        title={t("faylniOchirish")}
        description={t("ushbuFaylniOchirishniTasdiqlaysizmiBu")}
        confirmText="O'chirish" cancelText="Bekor qilish" variant="destructive"
        onConfirm={() => { if (confirmDeleteFileId !== null) handleDelete(confirmDeleteFileId); }}
      />
      <ConfirmDialog
        open={confirmDeleteDocId !== null}
        onOpenChange={open => { if (!open) setConfirmDeleteDocId(null); }}
        title={t("hujjatniOchirish")}
        description={t("ushbuHujjatniOchirishniTasdiqlaysizmiBu")}
        confirmText="O'chirish" cancelText="Bekor qilish" variant="destructive"
        onConfirm={() => { if (confirmDeleteDocId !== null) handleDeleteDoc(confirmDeleteDocId); }}
      />
    </div>
  );
}
