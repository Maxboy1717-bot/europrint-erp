/**
 * @module QuestionnaireSections
 * @description Major section components for the Questionnaire page:
 *   - getStatusBadge   — pure helper that maps a status string to a <Badge>
 *   - QuestionsSection — list of questionnaire questions with add/delete actions
 *   - ResponsesSection — table of candidate responses with view/download/delete actions
 */

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Check, X, Clock, Download } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { QuestionnaireQuestion, QuestionnaireResponse } from "./QuestionnaireTypes";
import { useTranslation } from '@/lib/i18n';

// ---------------------------------------------------------------------------
// getStatusBadge — exported so QuestionnaireDialogs can reuse it
// ---------------------------------------------------------------------------

export function getStatusBadge(status: string) {
  const { t } = useTranslation("common");
  switch (status) {
    case "pending":
      return (
        <Badge variant="secondary" className="flex items-center gap-1" data-testid="badge-pending">
          <Clock className="w-3 h-3" />{t("Kutilmoqda")}
        </Badge>
      );
    case "approved":
      return (
        <Badge variant="default" className="flex items-center gap-1 bg-green-600" data-testid="badge-approved">
          <Check className="w-3 h-3" />{t("approved")}
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="destructive" className="flex items-center gap-1" data-testid="badge-rejected">
          <X className="w-3 h-3" />{t("rejected")}
        </Badge>
      );
    case "hired":
      return (
        <Badge variant="default" className="flex items-center gap-1 bg-blue-600" data-testid="badge-hired">
          <Check className="w-3 h-3" />{t("ishgaOlindi")}
        </Badge>
      );
    case "not_hired":
      return (
        <Badge variant="destructive" className="flex items-center gap-1" data-testid="badge-not-hired">
          <X className="w-3 h-3" />{t("ishgaOlinmadi")}
        </Badge>
      );
    case "interviewed":
      return (
        <Badge variant="outline" className="flex items-center gap-1" data-testid="badge-interviewed">
          <Clock className="w-3 h-3" />{t("intervyuQilindi")}
        </Badge>
      );
    case "in_review":
      return (
        <Badge variant="outline" className="flex items-center gap-1" data-testid="badge-in-review">
          <Clock className="w-3 h-3" />{t("koribChiqilmoqda")}
        </Badge>
      );
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// QuestionsSection
// ---------------------------------------------------------------------------

type QuestionsSectionProps = {
  questions: QuestionnaireQuestion[];
  isLoading: boolean;
  onAddClick: () => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
};

export function QuestionsSection({
  questions,
  isLoading,
  onAddClick,
  onDelete,
  isDeleting,
}: QuestionsSectionProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle>{t("anketaSavollari")}</CardTitle>
          <CardDescription>{t("telegramBotdaKorsatiladiganSavollar")}</CardDescription>
        </div>
        <Button onClick={onAddClick} data-testid="button-add-question">
          <Plus className="w-4 h-4 mr-2" />
          {t("savolQoshish")}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center text-muted-foreground py-8">{t("Yuklanmoqda...")}</p>
        ) : questions.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">{t("hozirchaSavollarYoq")}</p>
        ) : (
          <div className="space-y-4">
            {(Array.isArray(questions) ? questions : []).map((q) => (
              <Card key={q.id} data-testid={`card-question-${q.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">#{q.order}</Badge>
                        <span className="font-semibold text-sm">{t("ozbek")}</span>
                      </div>
                      <p className="text-sm">{q.question}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="font-semibold text-sm">{t("rus")}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{q.questionRu}</p>
                    </div>
                    <DeleteConfirmDialog
                      title={t("savolniOchirishniTasdiqlaysizmi")}
                      description={t("savolButunlayOchiriladi")}
                      onConfirm={() => onDelete(q.id)}
                      isPending={isDeleting}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// ResponsesSection
// ---------------------------------------------------------------------------

type ResponsesSectionProps = {
  responses: QuestionnaireResponse[];
  isLoading: boolean;
  onView: (response: QuestionnaireResponse) => void;
  onDownload: (id: string, fullName: string) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
};

export function ResponsesSection({
  responses,
  isLoading,
  onView,
  onDownload,
  onDelete,
  isDeleting,
}: ResponsesSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("xodimArizalari")}</CardTitle>
        <CardDescription>{t("yangiXodimlardanKelganArizalar")}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center text-muted-foreground py-8">{t("Yuklanmoqda...")}</p>
        ) : responses.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">{t("hozirchaArizalarYoq")}</p>
        ) : (
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("toliqIsm")}</TableHead>
                <TableHead>{t("phone")}</TableHead>
                <TableHead>{t("language")}</TableHead>
                <TableHead>{t("status28")}</TableHead>
                <TableHead>{t("date")}</TableHead>
                <TableHead>{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(responses) ? responses : []).map((response) => (
                <TableRow key={response.id} data-testid={`row-response-${response.id}`} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-medium" data-testid={`text-name-${response.id}`}>
                    {response.fullName}
                  </TableCell>
                  <TableCell>{response.phone}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {response.lang === "uz" ? "O'zbek" : "Русский"}
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(response.status)}</TableCell>
                  <TableCell>
                    {new Date(response.createdAt).toLocaleDateString("uz-UZ")}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(response)}
                        data-testid={`button-view-${response.id}`}
                      >
                        {t("view")}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDownload(response.id, response.fullName)}
                        data-testid={`button-download-${response.id}`}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        {t("download")}
                      </Button>
                      <DeleteConfirmDialog
                        title={t("javobniOchirishniTasdiqlaysizmi")}
                        description={t("javobButunlayOchiriladi")}
                        onConfirm={() => onDelete(response.id)}
                        isPending={isDeleting}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        )}
      </CardContent>
    </Card>
  );
}
