/**
 * @module useEmployeeFiles
 * @description React UI component.
 */

import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { EmployeeFile } from "./types";

import { tLabel } from '@/lib/i18n/tLabel';
interface FilesTabProps {
  id: string | undefined;
  employeeFiles: EmployeeFile[];
  filesLoading: boolean;
  formatFileSize: (bytes: number) => string;
}

export function useEmployeeFiles(id: string | undefined) {
  const { toast } = useToast();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDescription, setFileDescription] = useState("");

  const uploadFileMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest('POST', `/api/employees/${id}/files`) as unknown as Response;
      if (!response.ok) throw new Error("Failed to upload file");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees", id, "files"] });
      toast({
        title: "Muvaffaqiyat",
        description: "Fayl yuklandi",
      });
      setIsUploadOpen(false);
      setSelectedFile(null);
      setFileDescription("");
    },
    onError: () => {
      toast({
        title: "Xatolik",
        description: tLabel('hr.useEmployeeFiles.faylniYuklabBolmadi', "Faylni yuklab bo'lmadi"),
        variant: "destructive",
      });
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: string) => {
      await apiRequest("DELETE", `/api/employee-files/${fileId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees", id, "files"] });
      toast({
        title: "Muvaffaqiyat",
        description: tLabel('hr.useEmployeeFiles.faylOchirildi', "Fayl o'chirildi"),
      });
    },
    onError: () => {
      toast({
        title: "Xatolik",
        description: tLabel('hr.useEmployeeFiles.faylniOchiribBolmadi', "Faylni o'chirib bo'lmadi"),
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = () => {
    if (!selectedFile) {
      toast({
        title: "Xatolik",
        description: "Iltimos, fayl tanlang",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("description", fileDescription);

    uploadFileMutation.mutate(formData);
  };

  return {
    isUploadOpen,
    setIsUploadOpen,
    selectedFile,
    setSelectedFile,
    fileDescription,
    setFileDescription,
    handleFileUpload,
    uploadFileMutation,
    deleteFileMutation,
  };
}
