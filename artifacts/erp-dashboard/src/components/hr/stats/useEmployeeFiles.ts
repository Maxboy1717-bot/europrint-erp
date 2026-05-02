import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { EmployeeFile } from "./types";

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
      const response = await fetch(`/api/employees/${id}/files`, {
        method: "POST",
        body: data,
      });
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
        description: "Faylni yuklab bo'lmadi",
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
        description: "Fayl o'chirildi",
      });
    },
    onError: () => {
      toast({
        title: "Xatolik",
        description: "Faylni o'chirib bo'lmadi",
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
