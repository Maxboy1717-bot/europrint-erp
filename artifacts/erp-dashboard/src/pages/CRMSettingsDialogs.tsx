/** @module CRMSettingsDialogs @description Dialog components for CRM Settings: field create/edit dialog. */

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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2 } from "lucide-react";
import { CustomField, FieldFormState, FIELD_TYPES } from "./CRMSettingsTypes";
import { useTranslation } from '@/lib/i18n';

// ---------------------------------------------------------------------------
// FieldDialog props
// ---------------------------------------------------------------------------

interface FieldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingField: CustomField | null;
  fieldForm: FieldFormState;
  onFieldFormChange: (form: FieldFormState) => void;
  newOption: string;
  onNewOptionChange: (value: string) => void;
  onAddOption: () => void;
  onRemoveOption: (index: number) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
}

// ---------------------------------------------------------------------------
// FieldDialog component
// ---------------------------------------------------------------------------

export function FieldDialog({
  open,
  onOpenChange,
  editingField,
  fieldForm,
  onFieldFormChange,
  newOption,
  onNewOptionChange,
  onAddOption,
  onRemoveOption,
  onSave,
  onCancel,
  isSaving,
}: FieldDialogProps) {
  const { t } = useTranslation("common");
  const isSelectType = ["select", "multiselect"].includes(fieldForm.fieldType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold"> {editingField ? "Maydonni tahrirlash" : "Yangi maydon qo'shish"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Label (Uzbek) */}
          <div className="space-y-1">
          <Label>{t("maydonNomi")}</Label>
            <Input
              value={fieldForm.fieldLabel}
              onChange={(e) =>
                onFieldFormChange({ ...fieldForm, fieldLabel: e.target.value })
              }
              placeholder={t("maydonNominiKiriting")}
              data-testid="input-field-label"
            />
          </div>

          {/* Label (Russian) */}
          <div className="space-y-1">
          <Label>{t("maydonNomiRuscha")}</Label>
            <Input
              value={fieldForm.fieldLabelRu}
              onChange={(e) =>
                onFieldFormChange({ ...fieldForm, fieldLabelRu: e.target.value })
              }
              placeholder={t("untitled")}
              data-testid="input-field-label-ru"
            />
          </div>

          {/* Field type */}
          <div className="space-y-1">
          <Label>{t("maydonTuri")}</Label>
            <Select
              value={fieldForm.fieldType}
              onValueChange={(v) =>
                onFieldFormChange({ ...fieldForm, fieldType: v })
              }
            >
              <SelectTrigger data-testid="select-field-type" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIELD_TYPES.map((type) => (
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

          {/* Select options */}
          {isSelectType && (
            <div className="space-y-1">
          <Label>{t("variantlar")}</Label>
              <div className="space-y-2">
                {(Array.isArray(fieldForm.options) ? fieldForm.options : []).map(
                  (opt, index) => (
                    <div key={`k-${index}`} className="flex items-center gap-2">
                      <Input value={opt.label} disabled className="flex-1" />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemoveOption(index)}
                        data-testid={`button-remove-option-${index}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )
                )}
                <div className="flex items-center gap-2">
                  <Input
                    value={newOption}
                    onChange={(e) => onNewOptionChange(e.target.value)}
                    placeholder={t("yangiVariant")}
                    onKeyDown={(e) => e.key === "Enter" && onAddOption()}
                    data-testid="input-new-option"
                  />
                  <Button
                    variant="outline"
                    onClick={onAddOption}
                    data-testid="button-add-option"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Required toggle */}
          <div className="flex items-center justify-between">
            <Label>{t("required")}</Label>
            <Switch
              checked={fieldForm.isRequired}
              onCheckedChange={(v) =>
                onFieldFormChange({ ...fieldForm, isRequired: v })
              }
              data-testid="switch-is-required"
            />
          </div>

          {/* Visible toggle */}
          <div className="flex items-center justify-between">
            <Label>{t("korinadi")}</Label>
            <Switch
              checked={fieldForm.isVisible}
              onCheckedChange={(v) =>
                onFieldFormChange({ ...fieldForm, isVisible: v })
              }
              data-testid="switch-is-visible"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onCancel}
            data-testid="button-field-cancel"
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={onSave}
            disabled={!fieldForm.fieldLabel || isSaving}
            data-testid="button-field-save"
          >
            {isSaving ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
