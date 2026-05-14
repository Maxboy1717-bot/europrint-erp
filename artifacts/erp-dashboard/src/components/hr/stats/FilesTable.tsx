/**
 * @module FilesTable
 * @description React UI component.
 */

import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Trash2, FileText, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmployeeFile } from "./types";

interface FilesTableProps {
  files: EmployeeFile[];
  isLoading: boolean;
  isUploadOpen: boolean;
  setIsUploadOpen: (open: boolean) => void;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  fileDescription: string;
  setFileDescription: (desc: string) => void;
  handleFileUpload: () => void;
  isUploading: boolean;
  onDeleteFile: (id: string) => void;
  isDeleting: boolean;
  formatFileSize: (bytes: number) => string;
}

export function FilesTable({
  files,
  isLoading,
  isUploadOpen,
  setIsUploadOpen,
  selectedFile,
  setSelectedFile,
  fileDescription,
  setFileDescription,
  handleFileUpload,
  isUploading,
  onDeleteFile,
  isDeleting,
  formatFileSize,
}: FilesTableProps) {
  const [confirmDeleteFileId, setConfirmDeleteFileId] = useState<string | null>(null);

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Xodim fayllari</CardTitle>
            <CardDescription>
              Shartnomalar, buyruqlar va boshqa hujjatlar
            </CardDescription>
          </div>
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-upload-file">
                <Upload className="w-4 h-4 mr-2" />
                Fayl yuklash
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-[18px] font-semibold">Fayl yuklash</DialogTitle>
                <DialogDescription>
                  Xodim uchun yangi hujjat yuklang
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-1">
          <Label htmlFor="file">Fayl</Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    data-testid="input-file"
                  />
                </div>
                <div className="space-y-1">
          <Label htmlFor="description">Tavsif (ixtiyoriy)</Label>
                  <Textarea
                    id="description"
                    value={fileDescription}
                    onChange={(e) => setFileDescription(e.target.value)}
                    placeholder="Fayl haqida qisqacha ma'lumot..."
                    data-testid="input-description"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsUploadOpen(false)}
                  data-testid="button-cancel-upload"
                >
                  Bekor qilish
                </Button>
                <Button
                  onClick={handleFileUpload}
                  disabled={isUploading}
                  data-testid="button-confirm-upload"
                >
                  {isUploading ? "Yuklanmoqda..." : "Yuklash"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Yuklanmoqda...</div>
          </div>
        ) : files.length > 0 ? (
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fayl nomi</TableHead>
                <TableHead>Turi</TableHead>
                <TableHead>O'lchami</TableHead>
                <TableHead>Tavsif</TableHead>
                <TableHead>Yuklangan sana</TableHead>
                <TableHead className="text-right">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(files) ? files : []).map((file: EmployeeFile) => (
                <TableRow key={file.id} data-testid={`row-file-${file.id}`} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-medium">{file.fileName}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{file.fileType}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatFileSize(file.fileSize)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {file.description || "—"}
                  </TableCell>
                  <TableCell>
                    {new Date(file.createdAt).toLocaleDateString('uz-UZ')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(file.filePath, '_blank')}
                        data-testid={`button-download-${file.id}`}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmDeleteFileId(file.id)}
                        disabled={isDeleting}
                        data-testid={`button-delete-${file.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Hozircha fayllar mavjud emas</p>
            <Button onClick={() => setIsUploadOpen(true)} data-testid="button-upload-first-file">
              <Upload className="w-4 h-4 mr-2" />
              Birinchi faylni yuklash
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
    <ConfirmDialog
      open={confirmDeleteFileId !== null}
      onOpenChange={(open) => { if (!open) setConfirmDeleteFileId(null); }}
      title="Faylni o'chirish"
      description="Haqiqatan ham bu faylni o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi."
      confirmText="O'chirish"
      cancelText="Bekor qilish"
      variant="destructive"
      onConfirm={() => { if (confirmDeleteFileId !== null) onDeleteFile(confirmDeleteFileId); }}
    />
    </>
  );
}
