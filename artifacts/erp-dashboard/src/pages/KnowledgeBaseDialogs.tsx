/**
 * @module KnowledgeBaseDialogs
 * @description Dialog components for the KnowledgeBase feature.
 *   KnowledgeBaseFormDialog handles create / edit.  All state is received via
 *   props from the parent orchestrator — no local state.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Upload } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { CategoryOption, KnowledgeBase, KnowledgeBaseFormValues } from "./KnowledgeBaseTypes";
import { EPStatusPill } from "@/components/ep";
import { useTranslation } from "@/lib/i18n";

export interface KnowledgeBaseFormDialogProps {
  open: boolean;
  onClose: () => void;
  editingItem: KnowledgeBase | null;
  form: UseFormReturn<KnowledgeBaseFormValues>;
  onSubmit: (values: KnowledgeBaseFormValues) => void;
  uploadMode: "text" | "file";
  onUploadModeChange: (mode: "text" | "file") => void;
  selectedFile: File | null;
  onFileChange: (file: File | null) => void;
  categories: CategoryOption[];
  isPending: boolean;
  tCommon: (key: string) => string;
  tLms: (key: string) => string;
}

export function KnowledgeBaseFormDialog({ open, onClose, editingItem, form, onSubmit, uploadMode, onUploadModeChange, selectedFile, onFileChange, categories, isPending, tCommon, tLms, }: KnowledgeBaseFormDialogProps) {
  const { t } = useTranslation("common");
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto p-6"
        data-testid="dialog-knowledge-form"
      >
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold"> {editingItem ? tCommon("edit") : tCommon("add")}</DialogTitle>
          <DialogDescription>{tLms("knowledgeBase")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {!editingItem && (
              <div className="flex gap-2 mb-4">
                <Button
                  type="button"
                  variant={uploadMode === "text" ? "default" : "outline"}
                  onClick={() => onUploadModeChange("text")}
                  data-testid="button-mode-text"
                  className="flex-1"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {tCommon("description")}
                </Button>
                <Button
                  type="button"
                  variant={uploadMode === "file" ? "default" : "outline"}
                  onClick={() => onUploadModeChange("file")}
                  data-testid="button-mode-file"
                  className="flex-1"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {tCommon("upload")}
                </Button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tCommon("name")} (UZ) *</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="titleRu"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tCommon("name")} (RU) *</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-titleRu" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tCommon("category")} *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-category" className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Array.isArray(categories) ? categories : []).map(
                        (cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {uploadMode === "text" ? (
              <>
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tCommon("description")} (UZ) *</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={6}
                          data-testid="textarea-content"
                          placeholder={t("kompaniyaHaqidaBatafsilMalumot")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contentRu"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tCommon("description")} (RU) *</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={6}
                          data-testid="textarea-contentRu"
                          placeholder="Подробная информация о компании..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            ) : (
              <div className="space-y-2">
                <FormLabel>{tCommon("upload")} (PDF, DOCX, TXT) *</FormLabel>
                <div className="flex flex-col gap-2">
                  <Input
                    id="file"
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
                    data-testid="input-file"
                  />
                  {selectedFile && (
                    <EPStatusPill tone="neutral" className="w-fit">
                      {selectedFile.name} (
                      {(selectedFile.size / 1024).toFixed(2)} KB)
                    </EPStatusPill>
                  )}
                  <p className="text-xs text-muted-foreground">
                    PDF, DOCX va TXT formatdagi fayllar qo&apos;llab-quvvatlanadi.
                    Maksimal hajm: 100MB
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tCommon("tags")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="europrint, print, bosma"
                        data-testid="input-tags"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tCommon("sortBy")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        data-testid="input-order"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tCommon("status")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-isActive" className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="true">{tCommon("active")}</SelectItem>
                      <SelectItem value="false">{tCommon("inactive")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                data-testid="button-cancel-knowledge"
              >
                {tCommon("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                data-testid="button-submit-knowledge"
              >
                {editingItem ? tCommon("update") : tCommon("add")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
