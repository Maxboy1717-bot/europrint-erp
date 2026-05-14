/** @module ApplicationsTable @description Table components for the Applications page: templates table and responses table. */

import { Eye, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageState } from "@/components/ui/page-state";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Application, ApplicationResponse } from "./ApplicationsTypes";

import { useTranslation } from '@/lib/i18n';
// ─── Templates table ──────────────────────────────────────────────────────────

interface TemplatesTableProps {
  applications: Application[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onDelete: (id: string) => void;
  isDeletePending: boolean;
}

export function TemplatesTable({applications,
  isLoading,
  isError,
  onRetry,
  onDelete,
  isDeletePending,
}: TemplatesTableProps) {
  const { t } = useTranslation('common');
  return (
    <PageState
      isLoading={isLoading}
      isError={isError}
      isEmpty={applications.length === 0}
      onRetry={onRetry}
      skeleton="table"
      skeletonRows={4}
      skeletonColumns={4}
      errorTitle="Arizalar yuklanmadi"
      errorMessage="Server bilan bog'lanishda xatolik."
      emptyIcon={FileText}
      emptyTitle="Hozircha ariza yo'q"
      emptyDescription="Yangi ariza shabloni yarating."
    >
      <div className="ep-table-scroll"><Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("arizaNomi")}</TableHead>
            <TableHead>{t("savollarSoni")}</TableHead>
            <TableHead>{t('status6')}</TableHead>
            <TableHead>{t("createdAt")}</TableHead>
            <TableHead className="text-right">{t("Amallar")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(Array.isArray(applications) ? applications : []).map((app) => (
            <TableRow key={app.id} data-testid={`row-application-${app.id}`} className="hover:bg-muted/40 transition-colors">
              <TableCell className="font-medium">{app.title}</TableCell>
              <TableCell>{app.questions.length}</TableCell>
              <TableCell>
                <Badge variant={app.isActive ? "default" : "secondary"}>
                  {app.isActive ? "Aktiv" : "No'ktiv"}
                </Badge>
              </TableCell>
              <TableCell>
                {new Date(app.createdAt).toLocaleDateString("uz-UZ")}
              </TableCell>
              <TableCell className="text-right">
                <DeleteConfirmDialog
                  title={t("arizaniOchirishniTasdiqlaysizmi")}
                  description={t("arizaVaUngaBogliqBarcha")}
                  onConfirm={() => onDelete(app.id)}
                  isPending={isDeletePending}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table></div>
    </PageState>
  );
}

// ─── Responses table ──────────────────────────────────────────────────────────

interface ResponsesTableProps {
  responses: ApplicationResponse[];
  applications: Application[];
  isLoading: boolean;
  onReview: (response: ApplicationResponse) => void;
}

export function ResponsesTable({ responses, applications, isLoading, onReview, }: ResponsesTableProps) {
  const { t } = useTranslation('common');
  if (isLoading) {
    return <p className="text-muted-foreground">{t("Yuklanmoqda...")}</p>;
  }

  if (responses.length === 0) {
    return <p className="text-muted-foreground">{t("hozirchaArizaYoq")}</p>;
  }

  return (
    <div className="ep-table-scroll"><Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("xodimId")}</TableHead>
          <TableHead>{t("ariza")}</TableHead>
          <TableHead>{t('status5')}</TableHead>
          <TableHead>{t("yuborilganSana")}</TableHead>
          <TableHead className="text-right">{t("Amallar")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(Array.isArray(responses) ? responses : []).map((response) => {
          const application = (Array.isArray(applications) ? applications : []).find(
            (a) => a.id === response.applicationId
          );
          return (
            <TableRow key={response.id} data-testid={`row-response-${response.id}`} className="hover:bg-muted/40 transition-colors">
              <TableCell>{response.userId.substring(0, 8)}</TableCell>
              <TableCell>{application?.title || "N/A"}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    response.status === "approved"
                      ? "default"
                      : response.status === "rejected"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {response.status === "pending"
                    ? "Kutilmoqda"
                    : response.status === "approved"
                    ? "Tasdiqlandi"
                    : "Rad etildi"}
                </Badge>
              </TableCell>
              <TableCell>
                {new Date(response.submittedAt).toLocaleDateString("uz-UZ")}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onReview(response)}
                  data-testid={`button-review-${response.id}`}
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table></div>
  );
}
