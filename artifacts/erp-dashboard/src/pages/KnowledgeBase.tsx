/**
 * @module KnowledgeBase
 * @description Route-level orchestrator for the KnowledgeBase page.
 *   Owns all React state, TanStack Query mutations, and form setup.
 *   Delegates rendering to KnowledgeBaseSections and KnowledgeBaseDialogs.
 */

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Plus } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import {
  buildCategories,
  knowledgeBaseFormSchema,
  type KnowledgeBase,
  type KnowledgeBaseFormValues,
  type KnowledgeBasePayload,
} from "./KnowledgeBaseTypes";
import { KnowledgeBaseLoadingSkeleton, KnowledgeBaseFilterBar, KnowledgeBaseItemsList } from "./KnowledgeBaseSections";
import { KnowledgeBaseFormDialog } from "./KnowledgeBaseDialogs";
import { apiRequest } from '@/lib/queryClient';
import { EPErrorState } from "@/components/ep";

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function KnowledgeBasePage() {
  const { t } = useTranslation("lms");
  const { t: tCommon } = useTranslation('common');
  const { toast } = useToast();

  // UI state
  const [isDialogOpen, setIsDialogOpen]     = useState(false);
  const [editingItem, setEditingItem]       = useState<KnowledgeBase | null>(null);
  const [deleteId, setDeleteId]             = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [uploadMode, setUploadMode]         = useState<"text" | "file">("text");
  const [selectedFile, setSelectedFile]     = useState<File | null>(null);

  const categories = buildCategories(tCommon);

  // Data fetching
  const { data: items = [], isLoading, isError, error, refetch } = useQuery<KnowledgeBase[]>({
    queryKey: ["/api/knowledge-base"],
  });

  // Form
  const form = useForm<KnowledgeBaseFormValues>({
    resolver: zodResolver(knowledgeBaseFormSchema),
    defaultValues: {
      title: "", titleRu: "", content: "", contentRu: "",
      category: "about_company", tags: "", order: 0, isActive: "true",
    },
  });

  useEffect(() => {
    if (editingItem) {
      form.reset({
        title:     editingItem.title     ?? "",
        titleRu:   editingItem.titleRu   ?? "",
        content:   editingItem.content   ?? "",
        contentRu: editingItem.contentRu ?? "",
        category:  editingItem.category  ?? "about_company",
        tags:      editingItem.tags?.join(", ") ?? "",
        order:     editingItem.order     ?? 0,
        isActive:  editingItem.isActive  ? "true" : "false",
      });
    } else {
      form.reset({
        title: "", titleRu: "", content: "", contentRu: "",
        category: "about_company", tags: "", order: 0, isActive: "true",
      });
    }
  }, [editingItem, form]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: KnowledgeBasePayload) => {
      return await apiRequest('POST', "/api/knowledge-base", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-base"] });
      setIsDialogOpen(false);
      toast({ title: tCommon("success"), description: tCommon("createdSuccessfully") });
    },
    onError: () => {
      toast({ title: tCommon("error"), description: tCommon("operationFailed"), variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: KnowledgeBasePayload }) => {
      return await apiRequest('PATCH', `/api/knowledge-base/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-base"] });
      setIsDialogOpen(false);
      setEditingItem(null);
      toast({ title: tCommon("success"), description: tCommon("updatedSuccessfully") });
    },
    onError: () => {
      toast({ title: tCommon("error"), description: tCommon("operationFailed"), variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/knowledge-base/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-base"] });
      toast({ title: tCommon("success"), description: tCommon("deletedSuccessfully") });
    },
    onError: () => {
      toast({ title: tCommon("error"), description: tCommon("operationFailed"), variant: "destructive" });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return await apiRequest('POST', "/api/knowledge-base/upload");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-base"] });
      setIsDialogOpen(false);
      setSelectedFile(null);
      setUploadMode("text");
      toast({ title: tCommon("success"), description: tCommon("savedSuccessfully") });
    },
    onError: () => {
      toast({ title: tCommon("error"), description: tCommon("operationFailed"), variant: "destructive" });
    },
  });

  // Handlers
  const onSubmit = (values: KnowledgeBaseFormValues) => {
    if (uploadMode === "file" && selectedFile) {
      const fd = new FormData();
      fd.append("file", selectedFile);
      fd.append("title", values.title);
      fd.append("titleRu", values.titleRu);
      fd.append("category", values.category);
      uploadMutation.mutate(fd);
    } else {
      const data: KnowledgeBasePayload = {
        ...values,
        tags: values.tags?.split(",").map((t) => t.trim()).filter(Boolean) ?? [],
      };
      if (editingItem) {
        updateMutation.mutate({ id: editingItem.id, data });
      } else {
        createMutation.mutate(data);
      }
    }
  };

  const handleEdit = (item: KnowledgeBase) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => setDeleteId(id);

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
    setUploadMode("text");
    setSelectedFile(null);
    form.reset();
  };

  const filteredItems =
    filterCategory === "all"
      ? items
      : (Array.isArray(items) ? items : []).filter(
          (item) => item.category === filterCategory,
        );

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    uploadMutation.isPending;

  // Render
  if (isError) return <EPErrorState onRetry={refetch}  error={error} />;

  if (isLoading) {
    return <KnowledgeBaseLoadingSkeleton addButtonLabel={tCommon("add")} />;
  }

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="ep-h1">{t("knowledgeBase")}</h1>
          <p className="text-muted-foreground mt-2">{tCommon("description")}</p>
        </div>
        <Button
          onClick={() => setIsDialogOpen(true)}
          data-testid="button-add-knowledge"
        >
          <Plus className="w-4 h-4 mr-2" />
          {tCommon("add")}
        </Button>
      </div>

      {/* Filter */}
      <KnowledgeBaseFilterBar
        categories={categories}
        filterCategory={filterCategory}
        onFilterChange={setFilterCategory}
        totalCount={filteredItems.length}
        allLabel={tCommon("all")}
        categoryLabel={tCommon("category")}
        totalLabel={tCommon("total")}
      />

      {/* List */}
      <div className="grid gap-4">
        <KnowledgeBaseItemsList
          items={filteredItems}
          categories={categories}
          noDataLabel={tCommon("noData")}
          inactiveLabel={tCommon("inactive")}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      {/* Form dialog */}
      <KnowledgeBaseFormDialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        editingItem={editingItem}
        form={form}
        onSubmit={onSubmit}
        uploadMode={uploadMode}
        onUploadModeChange={setUploadMode}
        selectedFile={selectedFile}
        onFileChange={setSelectedFile}
        categories={categories}
        isPending={isPending}
        tCommon={tCommon}
        tLms={t}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => { if (!v) setDeleteId(null); }}
        title={t("bilimlarBazasiniOchirish")}
        description={t("ushbuYozuvniOchirishniTasdiqlaysizmiBu")}
        confirmText="O'chirish"
        variant="destructive"
        onConfirm={() => {
          if (deleteId) {
            deleteMutation.mutate(deleteId);
            setDeleteId(null);
          }
        }}
      />
    </div>
  );
}
