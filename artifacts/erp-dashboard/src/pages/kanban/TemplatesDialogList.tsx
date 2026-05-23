/**
 * @module TemplatesDialogList
 * @description Template list/table/pagination inside TemplatesDialog.
 * Split from TemplatesDialog.tsx (Rule 16).
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Search, FileText, Settings, Zap, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { type T, type KanbanTemplate, PRIORITY_CONFIG } from "./kanban-types";

type TType = typeof T.uz & ((key: string) => string);

interface Props {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  setCurrentPage: (p: number | ((prev: number) => number)) => void;
  paginatedTemplates: KanbanTemplate[];
  filteredTemplates: KanbanTemplate[];
  totalPages: number;
  currentPage: number;
  boardId: string | null;
  columns: { id?: string }[];
  isApplyPending: boolean;
  onCreateNew: () => void;
  onEdit: (tpl: KanbanTemplate) => void;
  onApply: (id: string) => void;
  onDelete: (id: string) => void;
  t: TType;
}

const ITEMS_PER_PAGE = 10;

export function TemplatesDialogList({
  searchTerm, setSearchTerm, setCurrentPage,
  paginatedTemplates, filteredTemplates, totalPages, currentPage,
  boardId, columns, isApplyPending,
  onCreateNew, onEdit, onApply, onDelete, t,
}: Props) {
  const priorityConfig = PRIORITY_CONFIG;

  return (
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
        <Button onClick={onCreateNew} data-testid="button-create-template">
          <Plus className="h-4 w-4 mr-1" />
          {t.templates.createNew}
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {paginatedTemplates.length > 0 ? (
          <div className="ep-table-scroll">
            <Table>
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
                  const pConfig = priorityConfig[tpl.priority as keyof typeof priorityConfig] ?? priorityConfig.normal;
                  return (
                    <TableRow key={tpl.id} data-testid={`template-row-${tpl.id}`} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-medium">{tpl.name}</TableCell>
                      <TableCell>{tpl.title}</TableCell>
                      <TableCell>
                        <Badge className={pConfig.color}>
                          {t.priority[tpl.priority as keyof typeof t.priority] ?? t.priority.normal}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {tpl.createdAt ? format(new Date(tpl.createdAt), "dd.MM.yyyy") : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" aria-label={t("edit")} onClick={() => onEdit(tpl)} data-testid={`button-edit-template-${tpl.id}`}>
                                <Settings className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{t("edit")}</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" aria-label={t("qollash")} onClick={() => onApply(tpl.id)} disabled={!boardId || columns.length === 0 || isApplyPending} data-testid={`button-apply-template-${tpl.id}`}>
                                <Zap className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{t("qollash")}</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" aria-label={t("delete")} onClick={() => onDelete(tpl.id)} data-testid={`button-delete-template-${tpl.id}`}>
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
            </Table>
          </div>
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
            {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredTemplates.length)} / {filteredTemplates.length}
          </p>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" aria-label={t("previousPageAria")} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} data-testid="button-prev-page">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("previousPageAria")}</TooltipContent>
            </Tooltip>
            <span className="text-sm">{currentPage} / {totalPages}</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" aria-label={t("nextPageAria")} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} data-testid="button-next-page">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("nextPageAria")}</TooltipContent>
            </Tooltip>
          </div>
        </div>
      )}
    </div>
  );
}
