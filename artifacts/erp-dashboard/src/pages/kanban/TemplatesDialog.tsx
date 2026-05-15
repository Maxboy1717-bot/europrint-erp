/**
 * @module TemplatesDialog
 * @description React page component. Route-level UI.
 */

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, FileText, Settings, Zap, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { format } from "date-fns";
import type { KanbanColumn } from "@shared/schema";
import { type T, type KanbanTemplate, PRIORITY_CONFIG } from "./kanban-types";
export function TemplatesDialog({
  open,
  onOpenChange,
  boardId,
  columns,
  t: tProp,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string | null;
  columns: KanbanColumn[];
  t: typeof T.uz & ((key: string) => string) & ((key: string, params?: Record<string, string | number>) => string);
}) {
  const t = tProp;
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<KanbanTemplate | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", title: "", description: "", priority: "normal" });
  const itemsPerPage = 10;

  const { data: templates = [], refetch } = useQuery<KanbanTemplate[]>({
    queryKey: ["/api/kanban/templates"],
    queryFn: async () => {
      try {
        const res = await apiRequest<{ data?: unknown[] }>("GET", "/api/kanban/templates");
        return (Array.isArray(res.data) ? res.data : []) as KanbanTemplate[];
      } catch { return []; }
    },
    enabled: open,
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      await apiRequest("POST", "/api/kanban/templates", data);
    },
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/kanban/templates"] });
      setShowForm(false);
      setFormData({ name: "", title: "", description: "", priority: "normal" });
      toast({ title: "Shablon yaratildi" });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & typeof formData) => {
      await apiRequest("PUT", `/api/kanban/templates/${id}`, data);
    },
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/kanban/templates"] });
      setShowForm(false);
      setEditingTemplate(null);
      setFormData({ name: "", title: "", description: "", priority: "normal" });
      toast({ title: "Shablon yangilandi" });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/kanban/templates/${id}`);
    },
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/kanban/templates"] });
      toast({ title: "Shablon o'chirildi" });
    },
  });

  const applyTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      await apiRequest("POST", `/api/kanban/templates/${templateId}/apply`, { boardId, columnId: columns[0]?.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kanban/boards"] });
      toast({ title: "Shablon qo'llandi" });
    },
  });

  const filteredTemplates = useMemo(() => {
    if (!searchTerm) return templates;
    return (Array.isArray(templates) ? templates : []).filter((tpl) =>
      tpl.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tpl.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [templates, searchTerm]);

  const totalPages = Math.ceil(filteredTemplates.length / itemsPerPage);
  const paginatedTemplates = filteredTemplates.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleEdit = (template: KanbanTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name || "",
      title: template.title || "",
      description: template.description || "",
      priority: template.priority || "normal",
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate.id, ...formData });
    } else {
      createTemplateMutation.mutate(formData);
    }
  };

  const priorityConfig = PRIORITY_CONFIG;

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t.templates.title}
          </DialogTitle>
        </DialogHeader>

        {showForm ? (
          <div className="space-y-4">
            <div>
              <Label>{t.templates.name}</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t.templates.name}
                data-testid="input-template-name"
              />
            </div>
            <div>
              <Label>{t.templates.taskTitle}</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={t.templates.taskTitle}
                data-testid="input-template-title"
              />
            </div>
            <div>
              <Label>{t.fields.description}</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t.fields.description}
                data-testid="input-template-description"
              />
            </div>
            <div>
              <Label>{t.fields.priority}</Label>
              <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                <SelectTrigger data-testid="select-template-priority" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">{t.priority.urgent}</SelectItem>
                  <SelectItem value="high">{t.priority.high}</SelectItem>
                  <SelectItem value="normal">{t.priority.normal}</SelectItem>
                  <SelectItem value="low">{t.priority.low}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setShowForm(false); setEditingTemplate(null); setFormData({ name: "", title: "", description: "", priority: "normal" }); }}>
                {t.actions.cancel}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!formData.name || !formData.title || createTemplateMutation.isPending || updateTemplateMutation.isPending}
                data-testid="button-save-template"
              >
                {t.actions.save}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  placeholder={t.templates.search}
                  className="pl-8"
                  data-testid="input-template-search"
                />
              </div>
              <Button onClick={() => setShowForm(true)} data-testid="button-create-template">
                <Plus className="h-4 w-4 mr-1" />
                {t.templates.createNew}
              </Button>
            </div>

            <ScrollArea className="flex-1">
              {paginatedTemplates.length > 0 ? (
                <div className="ep-table-scroll"><Table>
                  <TableHeader className="sticky top-0 z-10 bg-card">
                    <TableRow>
                      <TableHead>{t.templates.name}</TableHead>
                      <TableHead>{t.templates.taskTitle}</TableHead>
                      <TableHead>{t.fields.priority}</TableHead>
                      <TableHead>{t.table.deadline}</TableHead>
                      <TableHead className="text-right">{t("Amallar")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Array.isArray(paginatedTemplates) ? paginatedTemplates : []).map((tpl) => {
                      const pConfig = priorityConfig[tpl.priority as keyof typeof priorityConfig] || priorityConfig.normal;
                      return (
                        <TableRow key={tpl.id} data-testid={`template-row-${tpl.id}`} className="hover:bg-muted/40 transition-colors">
                          <TableCell className="font-medium">{tpl.name}</TableCell>
                          <TableCell>{tpl.title}</TableCell>
                          <TableCell>
                            <Badge className={pConfig.color}>
                              {t.priority[tpl.priority as keyof typeof t.priority] || t.priority.normal}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {tpl.createdAt ? format(new Date(tpl.createdAt), "dd.MM.yyyy") : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label={t("edit")}
                                    onClick={() => handleEdit(tpl)}
                                    data-testid={`button-edit-template-${tpl.id}`}
                                  >
                                    <Settings className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>{t("edit")}</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label={t("qollash")}
                                    onClick={() => applyTemplateMutation.mutate(tpl.id)}
                                    disabled={!boardId || columns.length === 0 || applyTemplateMutation.isPending}
                                    data-testid={`button-apply-template-${tpl.id}`}
                                  >
                                    <Zap className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>{t("qollash")}</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label={t("delete")}
                                    onClick={() => setConfirmDeleteId(tpl.id)}
                                    data-testid={`button-delete-template-${tpl.id}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>{t("delete")}</TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table></div>
              ) : (
                <div className="text-center py-12 text-[13px] text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>{t.templates.empty}</p>
                </div>
              )}
            </ScrollArea>

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t mt-4">
                <p className="text-sm text-muted-foreground">
                  {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredTemplates.length)} / {filteredTemplates.length}
                </p>
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label={t("previousPageAria")}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        data-testid="button-prev-page"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t("previousPageAria")}</TooltipContent>
                  </Tooltip>
                  <span className="text-sm">{currentPage} / {totalPages}</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label={t("nextPageAria")}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        data-testid="button-next-page"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t("nextPageAria")}</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>

    <ConfirmDialog
      open={confirmDeleteId !== null}
      onOpenChange={(open) => { if (!open) setConfirmDeleteId(null); }}
      title={t("shablonniOchirish")}
      description={t("ushbuKanbanShabloniniOchirishniTasdiqlaysizmi")}
      confirmText="O'chirish"
      cancelText="Bekor qilish"
      variant="destructive"
      onConfirm={() => { if (confirmDeleteId !== null) deleteTemplateMutation.mutate(confirmDeleteId); }}
    />
    </>
  );
}
