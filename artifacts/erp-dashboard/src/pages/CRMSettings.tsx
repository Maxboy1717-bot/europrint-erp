import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  GripVertical,
  Edit,
  Trash2,
  Settings,
  FileText,
  Users,
  Building2,
  Package,
  Key,
  Layers,
  CheckSquare,
  Type,
  Hash,
  Calendar,
  List,
  Phone,
  Mail,
  Eye,
  EyeOff,
  ChevronRight,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ErrorState } from "@/components/ui/error-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface CustomField {
  id: number;
  entityType: string;
  fieldName: string;
  fieldLabel: string;
  fieldLabelRu: string | null;
  fieldType: string;
  options: { value: string; label: string }[] | null;
  isRequired: boolean;
  isVisible: boolean;
  sort: number;
}

interface SortableFieldRowProps {
  field: CustomField;
  onEdit: (field: CustomField) => void;
  onDelete: (id: number) => void;
}

const crmFieldFormSchema = z.object({
  fieldName: z.string().max(100, "Maydon nomi 100 belgidan oshmasligi kerak"),
  fieldLabel: z.string().min(1, "Maydon yorlig'ini kiriting").max(200, "Yorliq 200 belgidan oshmasligi kerak"),
  fieldLabelRu: z.string().max(200, "Yorliq 200 belgidan oshmasligi kerak"),
  fieldType: z.string().min(1, "Maydon turini tanlang"),
  options: z.array(z.object({ value: z.string(), label: z.string() })),
  isRequired: z.boolean(),
  isVisible: z.boolean(),
  sort: z.number().min(0, "Tartib raqami 0 dan kam bo'lmasligi kerak").max(10000, "Tartib raqami 10000 dan oshmasligi kerak"),
});

const FIELD_TYPES = [
  { value: "text", label: "Matn", icon: Type },
  { value: "number", label: "Raqam", icon: Hash },
  { value: "date", label: "Sana", icon: Calendar },
  { value: "select", label: "Tanlov", icon: List },
  { value: "multiselect", label: "Ko'p tanlov", icon: Layers },
  { value: "checkbox", label: "Checkbox", icon: CheckSquare },
  { value: "phone", label: "Telefon", icon: Phone },
  { value: "email", label: "Email", icon: Mail },
];

const ENTITY_TYPES = [
  { value: "lead", label: "Lidlar", icon: FileText },
  { value: "deal", label: "Bitimlar", icon: Package },
  { value: "contact", label: "Kontaktlar", icon: Users },
  { value: "company", label: "Kompaniyalar", icon: Building2 },
];

const MENU_ITEMS = [
  { id: "requisites", label: "Mening rekvizitlarim", icon: FileText },
  { id: "access", label: "Kirish huquqlari", icon: Key },
  { id: "products", label: "Tovarlar va omborlar", icon: Package },
  { id: "integrations", label: "Integratsiyalar", icon: Layers },
  { id: "custom-fields", label: "Maxsus maydonlar", icon: Settings },
];

function SortableFieldRow({ field, onEdit, onDelete }: SortableFieldRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const FieldIcon = FIELD_TYPES.find((t) => t.value === field.fieldType)?.icon || Type;
  const fieldTypeLabel = FIELD_TYPES.find((t) => t.value === field.fieldType)?.label || field.fieldType;

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && "opacity-50 bg-muted")}
      data-testid={`row-field-${field.id}`}
    >
      <TableCell className="w-10">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab p-1 hover:bg-muted rounded"
          data-testid={`button-drag-field-${field.id}`}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      </TableCell>
      <TableCell className="font-medium">{field.fieldLabel}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <FieldIcon className="h-4 w-4 text-muted-foreground" />
          <span>{fieldTypeLabel}</span>
        </div>
      </TableCell>
      <TableCell>
        {field.isRequired ? (
          <Badge variant="secondary">Ha</Badge>
        ) : (
          <span className="text-muted-foreground">Yo'q</span>
        )}
      </TableCell>
      <TableCell>
        {field.isVisible ? (
          <Eye className="h-4 w-4 text-green-600" />
        ) : (
          <EyeOff className="h-4 w-4 text-muted-foreground" />
        )}
      </TableCell>
      <TableCell className="text-muted-foreground">{field.sort}</TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(field)}
            data-testid={`button-edit-field-${field.id}`}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(field.id)}
            data-testid={`button-delete-field-${field.id}`}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function CRMSettings() {
  const { toast } = useToast();
  const [activeMenu, setActiveMenu] = useState("custom-fields");
  const [entityType, setEntityType] = useState<"lead" | "deal" | "contact" | "company">("lead");
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [confirmDeleteFieldId, setConfirmDeleteFieldId] = useState<number | null>(null);
  
  const [fieldForm, setFieldForm] = useState({
    fieldName: "",
    fieldLabel: "",
    fieldLabelRu: "",
    fieldType: "text",
    options: [] as { value: string; label: string }[],
    isRequired: false,
    isVisible: true,
    sort: 500,
  });

  const [newOption, setNewOption] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const { data: fields = [], isLoading, isError, refetch} = useQuery<CustomField[]>({
    queryKey: ["/api/crm/custom-fields", entityType],
    queryFn: async () => {
      const res = await fetch(`/api/crm/custom-fields/${entityType}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load fields");
      return res.json();
    },
  });

  const createFieldMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      return apiRequest("POST", "/api/crm/custom-fields", data);
    },
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
    mutationFn: async ({ id, data }: { id: number; data: Record<string, unknown> }) => {
      return apiRequest("PATCH", `/api/crm/custom-fields/${id}`, data);
    },
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
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/crm/custom-fields/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/custom-fields"] });
      toast({ title: "Maydon o'chirildi" });
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Maydon o'chirishda xatolik", variant: "destructive" });
    },
  });

  const reorderFieldsMutation = useMutation({
    mutationFn: async (orderedIds: number[]) => {
      return apiRequest("POST", `/api/crm/custom-fields/reorder`, { orderedIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/custom-fields"] });
    },
  });

  const resetFieldForm = () => {
    setFieldForm({
      fieldName: "",
      fieldLabel: "",
      fieldLabelRu: "",
      fieldType: "text",
      options: [],
      isRequired: false,
      isVisible: true,
      sort: 500,
    });
    setNewOption("");
  };

  const handleOpenFieldModal = (field?: CustomField) => {
    if (field) {
      setEditingField(field);
      setFieldForm({
        fieldName: field.fieldName,
        fieldLabel: field.fieldLabel,
        fieldLabelRu: field.fieldLabelRu || "",
        fieldType: field.fieldType,
        options: field.options || [],
        isRequired: field.isRequired,
        isVisible: field.isVisible,
        sort: field.sort,
      });
    } else {
      resetFieldForm();
    }
    setShowFieldModal(true);
  };

  const handleSaveField = () => {
    const validation = crmFieldFormSchema.safeParse(fieldForm);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast({ title: firstError.message, variant: "destructive" });
      return;
    }
    const data = {
      entityType,
      fieldName: fieldForm.fieldName || fieldForm.fieldLabel.toLowerCase().replace(/\s+/g, "_"),
      fieldLabel: fieldForm.fieldLabel,
      fieldLabelRu: fieldForm.fieldLabelRu || null,
      fieldType: fieldForm.fieldType,
      options: ["select", "multiselect"].includes(fieldForm.fieldType) ? fieldForm.options : null,
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
    setFieldForm({
      ...fieldForm,
      options: [...fieldForm.options, { value, label: newOption }],
    });
    setNewOption("");
  };

  const handleRemoveOption = (index: number) => {
    setFieldForm({
      ...fieldForm,
      options: fieldForm.options?.filter((_, i) => i !== index),
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = (Array.isArray(fields) ? fields : []).findIndex((f) => f.id === active.id);
    const newIndex = (Array.isArray(fields) ? fields : []).findIndex((f) => f.id === over.id);
    
    const reordered = arrayMove(fields, oldIndex, newIndex);
    const orderedIds = (Array.isArray(reordered) ? reordered : []).map((f) => f.id);
    reorderFieldsMutation.mutate(orderedIds);
  };

  const renderContent = () => {
    switch (activeMenu) {
      case "custom-fields":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Maxsus maydonlar</h2>
                <p className="text-sm text-muted-foreground">
                  CRM elementlari uchun qo'shimcha maydonlar
                </p>
              </div>
              <Button
                onClick={() => handleOpenFieldModal()}
                data-testid="button-add-field"
              >
                <Plus className="h-4 w-4 mr-2" />
                Maydon qo'shish
              </Button>
            </div>

            <Tabs value={entityType} onValueChange={(v) => setEntityType(v as "lead" | "deal" | "contact" | "company")}>
              <TabsList>
                {(Array.isArray(ENTITY_TYPES) ? ENTITY_TYPES : []).map((type) => (
                  <TabsTrigger
                    key={type.value}
                    value={type.value}
                    data-testid={`tab-entity-${type.value}`}
                  >
                    <type.icon className="h-4 w-4 mr-2" />
                    {type.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {isLoading ? (
              <div className="space-y-2">
                {([1, 2, 3]).map((i) => (
                  <Skeleton key={`k-${i}`} className="h-14 w-full" />
                ))}
              </div>
            ) : fields.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Hozircha maxsus maydonlar yo'q
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => handleOpenFieldModal()}
                    data-testid="button-add-first-field"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Birinchi maydonni qo'shing
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10"></TableHead>
                        <TableHead>Nom</TableHead>
                        <TableHead>Tur</TableHead>
                        <TableHead>Majburiy</TableHead>
                        <TableHead>Ko'rinadi</TableHead>
                        <TableHead>Tartib</TableHead>
                        <TableHead className="w-24">Amallar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <SortableContext
                        items={(Array.isArray(fields) ? fields : []).map((f) => f.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {(Array.isArray(fields) ? fields : []).map((field) => (
                          <SortableFieldRow
                            key={field.id}
                            field={field}
                            onEdit={handleOpenFieldModal}
                            onDelete={(id) => setConfirmDeleteFieldId(id)}
                          />
                        ))}
                      </SortableContext>
                    </TableBody>
                  </Table>
                </DndContext>
              </Card>
            )}
          </div>
        );
      case "requisites":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Mening rekvizitlarim</h2>
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Rekvizitlar sozlamalari
                </p>
              </CardContent>
            </Card>
          </div>
        );
      case "access":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Kirish huquqlari</h2>
            <Card>
              <CardContent className="py-12 text-center">
                <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Kirish huquqlari sozlamalari
                </p>
              </CardContent>
            </Card>
          </div>
        );
      case "products":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Tovarlar va omborlar</h2>
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Tovarlar va omborlar sozlamalari
                </p>
              </CardContent>
            </Card>
          </div>
        );
      case "integrations":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Integratsiyalar</h2>
            <Card>
              <CardContent className="py-12 text-center">
                <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Tashqi tizimlar bilan integratsiya
                </p>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full bg-surface">
      <div className="w-64 border-r border-outline-variant p-4 space-y-1 bg-surface-container-low">
        <h1 className="text-lg font-bold mb-4 text-on-surface" data-testid="text-settings-title">
          CRM <span className="text-primary">Sozlamalari</span>
        </h1>
        {(Array.isArray(MENU_ITEMS) ? MENU_ITEMS : []).map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveMenu(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
              activeMenu === item.id
                ? "bg-primary text-white font-medium"
                : "text-on-surface-variant hover:bg-surface-container-high"
            )}
            data-testid={`button-menu-${item.id}`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
            <ChevronRight className="h-4 w-4 ml-auto" />
          </button>
        ))}
      </div>

      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          {renderContent()}
        </div>
      </div>

      <Dialog open={showFieldModal} onOpenChange={setShowFieldModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingField ? "Maydonni tahrirlash" : "Yangi maydon qo'shish"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Maydon nomi</Label>
              <Input
                value={fieldForm.fieldLabel}
                onChange={(e) =>
                  setFieldForm({ ...fieldForm, fieldLabel: e.target.value })
                }
                placeholder="Maydon nomini kiriting"
                data-testid="input-field-label"
              />
            </div>

            <div className="space-y-2">
              <Label>Maydon nomi (ruscha)</Label>
              <Input
                value={fieldForm.fieldLabelRu}
                onChange={(e) =>
                  setFieldForm({ ...fieldForm, fieldLabelRu: e.target.value })
                }
                placeholder="Название поля"
                data-testid="input-field-label-ru"
              />
            </div>

            <div className="space-y-2">
              <Label>Maydon turi</Label>
              <Select
                value={fieldForm.fieldType}
                onValueChange={(v) => setFieldForm({ ...fieldForm, fieldType: v })}
              >
                <SelectTrigger data-testid="select-field-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Array.isArray(FIELD_TYPES) ? FIELD_TYPES : []).map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {["select", "multiselect"].includes(fieldForm.fieldType) && (
              <div className="space-y-2">
                <Label>Variantlar</Label>
                <div className="space-y-2">
                  {(Array.isArray(fieldForm.options) ? fieldForm.options : []).map((opt, index) => (
                    <div key={`k-${index}`} className="flex items-center gap-2">
                      <Input value={opt.label} disabled className="flex-1" />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveOption(index)}
                        data-testid={`button-remove-option-${index}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <Input
                      value={newOption}
                      onChange={(e) => setNewOption(e.target.value)}
                      placeholder="Yangi variant"
                      onKeyDown={(e) => e.key === "Enter" && handleAddOption()}
                      data-testid="input-new-option"
                    />
                    <Button
                      variant="outline"
                      onClick={handleAddOption}
                      data-testid="button-add-option"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <Label>Majburiy maydon</Label>
              <Switch
                checked={fieldForm.isRequired}
                onCheckedChange={(v) => setFieldForm({ ...fieldForm, isRequired: v })}
                data-testid="switch-is-required"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Ko'rinadi</Label>
              <Switch
                checked={fieldForm.isVisible}
                onCheckedChange={(v) => setFieldForm({ ...fieldForm, isVisible: v })}
                data-testid="switch-is-visible"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowFieldModal(false);
                setEditingField(null);
                resetFieldForm();
              }}
              data-testid="button-field-cancel"
            >
              Bekor qilish
            </Button>
            <Button
              onClick={handleSaveField}
              disabled={
                !fieldForm.fieldLabel ||
                createFieldMutation.isPending ||
                updateFieldMutation.isPending
              }
              data-testid="button-field-save"
            >
              {createFieldMutation.isPending || updateFieldMutation.isPending
                ? "Saqlanmoqda..."
                : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDeleteFieldId !== null}
        onOpenChange={(open) => { if (!open) setConfirmDeleteFieldId(null); }}
        title="Maydonni o'chirish"
        description="Ushbu CRM maydonini o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi."
        confirmText="O'chirish"
        cancelText="Bekor qilish"
        variant="destructive"
        onConfirm={() => { if (confirmDeleteFieldId !== null) deleteFieldMutation.mutate(confirmDeleteFieldId); }}
      />
    </div>
  );
}
