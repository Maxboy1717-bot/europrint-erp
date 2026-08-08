/** @module CRMSettings @description Route-level CRM Settings page. Owns state, queries, mutations, and top-level layout. */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { arrayMove } from "@dnd-kit/sortable";
import { DragEndEvent } from "@dnd-kit/core";
import { ChevronRight } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

import {
  CustomField,
  FieldFormState,
  MENU_ITEMS,
  crmFieldFormSchema,
  defaultFieldForm,
} from "./CRMSettingsTypes";
import { CustomFieldsTab } from "./CRMSettingsTabs";
import {
  RequisitesTab,
  AccessTab,
  ProductsTab,
  IntegrationsTab,
} from "./CRMSettingsPlaceholders";
import { FieldDialog } from "./CRMSettingsDialogs";
import { EPErrorState } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

export default function CRMSettings() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  // Navigation state
  const [activeMenu, setActiveMenu] = useState("custom-fields");
  // Custom-fields state
  const [entityType, setEntityType] = useState<"lead" | "deal" | "contact" | "company">("lead");
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [confirmDeleteFieldId, setConfirmDeleteFieldId] = useState<number | null>(null);
  const [fieldForm, setFieldForm] = useState<FieldFormState>(defaultFieldForm());
  const [newOption, setNewOption] = useState("");

  // -- Queries
  const { data: fields = [], isLoading, isError, error, refetch } = useQuery<CustomField[]>({
    queryKey: ["/api/crm/custom-fields", entityType],
    queryFn: async () => {
      return await apiRequest('GET', `/api/crm/custom-fields/${entityType}`);
    },
  });

  // -- Mutations
  const createFieldMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiRequest("POST", "/api/crm/custom-fields", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/custom-fields"] });
      setShowFieldModal(false);
      resetFieldForm();
      toast({ title: "Maydon yaratildi" });
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Maydon yaratishda xatolik", variant: "destructive" });
    },
  });

  const updateFieldMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      apiRequest("PATCH", `/api/crm/custom-fields/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/custom-fields"] });
      setShowFieldModal(false);
      setEditingField(null);
      resetFieldForm();
      toast({ title: "Maydon yangilandi" });
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Maydon yangilashda xatolik", variant: "destructive" });
    },
  });

  const deleteFieldMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/crm/custom-fields/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/custom-fields"] });
      toast({ title: "Maydon o'chirildi" });
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Maydon o'chirishda xatolik", variant: "destructive" });
    },
  });

  const reorderFieldsMutation = useMutation({
    mutationFn: (orderedIds: number[]) =>
      apiRequest("POST", `/api/crm/custom-fields/reorder`, { orderedIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/custom-fields"] });
    },
  });

  // -- Handlers
  const resetFieldForm = () => {
    setFieldForm(defaultFieldForm());
    setNewOption("");
  };

  const handleOpenFieldModal = (field?: CustomField) => {
    if (field) {
      setEditingField(field);
      setFieldForm({
        fieldName: field.fieldName,
        fieldLabel: field.fieldLabel,
        fieldLabelRu: field.fieldLabelRu ?? "",
        fieldType: field.fieldType,
        options: field.options ?? [],
        isRequired: field.isRequired,
        isVisible: field.isVisible,
        sort: field.sort,
      });
    } else {
      setEditingField(null);
      resetFieldForm();
    }
    setShowFieldModal(true);
  };

  const handleSaveField = () => {
    const validation = crmFieldFormSchema.safeParse(fieldForm);
    if (!validation.success) {
      toast({ title: validation.error.errors[0].message, variant: "destructive" });
      return;
    }
    const data = {
      entityType,
      fieldName:
        fieldForm.fieldName || fieldForm.fieldLabel.toLowerCase().replace(/\s+/g, "_"),
      fieldLabel: fieldForm.fieldLabel,
      fieldLabelRu: fieldForm.fieldLabelRu || null,
      fieldType: fieldForm.fieldType,
      options: ["select", "multiselect"].includes(fieldForm.fieldType)
        ? fieldForm.options
        : null,
      isRequired: fieldForm.isRequired,
      isVisible: fieldForm.isVisible,
      sort: fieldForm.sort,
    };
    if (editingField) {
      updateFieldMutation.mutate({ id: editingField.id, data });
    } else {
      createFieldMutation.mutate(data);
    }
  };

  const handleAddOption = () => {
    if (!newOption.trim()) return;
    const value = newOption.toLowerCase().replace(/\s+/g, "_");
    setFieldForm({ ...fieldForm, options: [...fieldForm.options, { value, label: newOption }] });
    setNewOption("");
  };

  const handleRemoveOption = (index: number) => {
    setFieldForm({
      ...fieldForm,
      options: (Array.isArray(fieldForm.options) ? fieldForm.options : []).filter(
        (_, i) => i !== index
      ),
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const safeFields = Array.isArray(fields) ? fields : [];
    const oldIndex = safeFields.findIndex((f) => f.id === active.id);
    const newIndex = safeFields.findIndex((f) => f.id === over.id);
    const reordered = arrayMove(safeFields, oldIndex, newIndex);
    reorderFieldsMutation.mutate(reordered.map((f) => f.id));
  };

  const handleCancelDialog = () => {
    setShowFieldModal(false);
    setEditingField(null);
    resetFieldForm();
  };

  // -- Active panel resolver
  const renderContent = () => {
    switch (activeMenu) {
      case "custom-fields":
        if (isError) {
          return <EPErrorState onRetry={() => refetch()} error={error} />;
        }
        return (
          <CustomFieldsTab
            entityType={entityType}
            onEntityTypeChange={setEntityType}
            fields={Array.isArray(fields) ? fields : []}
            isLoading={isLoading}
            onAdd={() => handleOpenFieldModal()}
            onEdit={handleOpenFieldModal}
            onDelete={(id) => setConfirmDeleteFieldId(id)}
            onDragEnd={handleDragEnd}
          />
        );
      case "requisites":
        return <RequisitesTab />;
      case "access":
        return <AccessTab />;
      case "products":
        return <ProductsTab />;
      case "integrations":
        return <IntegrationsTab />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r border-border p-4 space-y-1 bg-muted/40">
        <h1
          className="text-lg font-bold mb-4 text-foreground"
          data-testid="text-settings-title"
        >
          CRM <span className="text-primary">{t("sozlamalari")}</span>
        </h1>
        {MENU_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveMenu(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
              activeMenu === item.id
                ? "bg-primary text-white font-medium"
                : "text-muted-foreground hover:bg-muted"
            )}
            data-testid={`button-menu-${item.id}`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
            <ChevronRight className="h-4 w-4 ml-auto" />
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">{renderContent()}</div>
      </div>

      {/* Field create/edit dialog */}
      <FieldDialog
        open={showFieldModal}
        onOpenChange={setShowFieldModal}
        editingField={editingField}
        fieldForm={fieldForm}
        onFieldFormChange={setFieldForm}
        newOption={newOption}
        onNewOptionChange={setNewOption}
        onAddOption={handleAddOption}
        onRemoveOption={handleRemoveOption}
        onSave={handleSaveField}
        onCancel={handleCancelDialog}
        isSaving={createFieldMutation.isPending || updateFieldMutation.isPending}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={confirmDeleteFieldId !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteFieldId(null);
        }}
        title={t("maydonniOchirish")}
        description={t("ushbuCrmMaydoniniOchirishniTasdiqlaysizmi")}
        confirmText="O'chirish"
        cancelText="Bekor qilish"
        variant="destructive"
        onConfirm={() => {
          if (confirmDeleteFieldId !== null)
            deleteFieldMutation.mutate(confirmDeleteFieldId);
        }}
      />
    </div>
  );
}
