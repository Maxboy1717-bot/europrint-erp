/** @module SettingsTabGuidelines @description Guidelines tab — upload position guidelines (PDF/TXT/Word) and manage the existing list. */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUp, Download } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { useTranslation } from "@/lib/i18n";
import type { Position, Guideline } from "./SettingsTypes";

interface Props {
  positions: Position[] | undefined;
  guidelines: Guideline[] | undefined;
  selectedPosition: string;
  onPositionChange: (value: string) => void;
  uploadFile: File | null;
  onFileChange: (file: File | null) => void;
  onUpload: () => void;
  isUploading: boolean;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

export function SettingsTabGuidelines({
  positions,
  guidelines,
  selectedPosition,
  onPositionChange,
  uploadFile,
  onFileChange,
  onUpload,
  isUploading,
  onDelete,
  isDeleting,
}: Props) {
  const { t } = useTranslation('settings');
  const { t: tCommon } = useTranslation('common');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('roles')}</CardTitle>
        <CardDescription>{t('roleManagement')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="position-select">{tCommon('role')}</Label>
          <Select value={selectedPosition} onValueChange={onPositionChange}>
            <SelectTrigger id="position-select" data-testid="select-position" className="h-9">
              <SelectValue placeholder={tCommon('select')} />
            </SelectTrigger>
            <SelectContent>
              {positions?.map((position) => (
                <SelectItem key={position.id} value={position.id}>
                  {position.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="guideline-file">{tCommon('upload')} (PDF, TXT, Word)</Label>
          <Input
            id="guideline-file"
            type="file"
            accept=".pdf,.txt,.doc,.docx"
            onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
            data-testid="input-guideline-file"
          />
        </div>

        <Button
          onClick={onUpload}
          disabled={isUploading || !uploadFile || !selectedPosition}
          data-testid="button-upload-guideline"
        >
          <FileUp className="w-4 h-4 mr-2" />
          {isUploading ? tCommon('loading') : tCommon('upload')}
        </Button>

        <div className="mt-6 space-y-2">
          <Label>{tCommon('attachments')}</Label>
          <div className="space-y-2">
            {guidelines?.map((guideline) => (
              <div
                key={guideline.id}
                className="flex items-center justify-between p-3 border rounded-lg"
                data-testid={`guideline-item-${guideline.id}`}
              >
                <div className="flex-1">
                  <p className="font-medium">{guideline.positionName}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('version')}: {guideline.version}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    asChild
                    data-testid={`button-download-${guideline.id}`}
                  >
                    <a href={guideline.filePath} download>
                      <Download className="w-4 h-4" />
                    </a>
                  </Button>
                  <DeleteConfirmDialog
                    title={tCommon('confirmDelete')}
                    description={tCommon('deleteWarning')}
                    onConfirm={() => onDelete(guideline.id)}
                    isPending={isDeleting}
                  />
                </div>
              </div>
            ))}
            {(!guidelines || guidelines.length === 0) && (
              <p className="text-sm text-muted-foreground p-3">{tCommon('noData')}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
