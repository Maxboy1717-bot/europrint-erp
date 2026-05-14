/** @module CRMSettingsTabs @description SortableFieldRow and CustomFieldsTab for the CRM Settings page. Placeholder panels live in CRMSettingsPlaceholders.tsx. */

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
  arrayMove as _arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  GripVertical,
  Edit,
  Trash2,
  Settings,
  Type,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CustomField,
  SortableFieldRowProps,
  FIELD_TYPES,
  ENTITY_TYPES,
} from "./CRMSettingsTypes";
import { EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

// ---------------------------------------------------------------------------
// SortableFieldRow
// ---------------------------------------------------------------------------

export function SortableFieldRow({ field, onEdit, onDelete }: SortableFieldRowProps) {
  const { t } = useTranslation("common");
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

  const FieldIcon =
    FIELD_TYPES.find((t) => t.value === field.fieldType)?.icon ?? Type;
  const fieldTypeLabel =
    FIELD_TYPES.find((t) => t.value === field.fieldType)?.label ?? field.fieldType;

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
          <EPStatusPill tone="neutral">Ha</EPStatusPill>
        ) : (
          <span className="text-muted-foreground">{t("no")}</span>
        )}
      </TableCell>
      <TableCell>
        {field.isVisible ? (
          <Eye className="h-4 w-4 text-[var(--ep-green)]" />
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

// ---------------------------------------------------------------------------
// CustomFieldsTab
// ---------------------------------------------------------------------------

interface CustomFieldsTabProps {
  entityType: "lead" | "deal" | "contact" | "company";
  onEntityTypeChange: (v: "lead" | "deal" | "contact" | "company") => void;
  fields: CustomField[];
  isLoading: boolean;
  onAdd: () => void;
  onEdit: (field: CustomField) => void;
  onDelete: (id: number) => void;
  onDragEnd: (event: DragEndEvent) => void;
}

export function CustomFieldsTab({
  entityType,
  onEntityTypeChange,
  fields,
  isLoading,
  onAdd,
  onEdit,
  onDelete,
  onDragEnd,
}: CustomFieldsTabProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{t("maxsusMaydonlar")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("crmElementlariUchunQoshimchaMaydonlar")}
          </p>
        </div>
        <Button onClick={onAdd} data-testid="button-add-field">
          <Plus className="h-4 w-4 mr-2" />
          {t("maydonQoshish")}
        </Button>
      </div>

      <Tabs
        value={entityType}
        onValueChange={(v) =>
          onEntityTypeChange(v as "lead" | "deal" | "contact" | "company")
        }
      >
        <TabsList>
          {ENTITY_TYPES.map((type) => (
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
          {[1, 2, 3].map((i) => (
            <Skeleton key={`k-${i}`} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : fields.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t("hozirchaMaxsusMaydonlarYoq")}</p>
            <Button
              variant="outline"
              className="mt-4 gap-2"
              onClick={onAdd}
              data-testid="button-add-first-field"
            >
              <Plus className="h-4 w-4" />
              {t("birinchiMaydonniQoshing")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
          >
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>{t("nom")}</TableHead>
                  <TableHead>{t("tur")}</TableHead>
                  <TableHead>{t("majburiy")}</TableHead>
                  <TableHead>{t("korinadi")}</TableHead>
                  <TableHead>{t("tartib")}</TableHead>
                  <TableHead className="w-24">{t("Amallar")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <SortableContext
                  items={fields.map((f) => f.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {fields.map((field) => (
                    <SortableFieldRow
                      key={field.id}
                      field={field}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  ))}
                </SortableContext>
              </TableBody>
            </Table></div>
          </DndContext>
        </Card>
      )}
    </div>
  );
}
