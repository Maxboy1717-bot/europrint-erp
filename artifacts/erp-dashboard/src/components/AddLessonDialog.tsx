/**
 * @module AddLessonDialog
 * @description React UI component.
 */

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
;

import { useTranslation } from '@/lib/i18n';
import { EPLoader } from "@/components/ep";
const lessonSchema = z.object({
  title: z.string().min(1, "Dars nomi majburiy"),
  titleRu: z.string().min(1, "Dars nomi (Rus) majburiy"),
  content: z.string().min(1, "Kontent majburiy"),
  contentRu: z.string().min(1, "Kontent (Rus) majburiy"),
  type: z.enum(["text", "video", "pdf"]),
  duration: z.string().optional(),
  filePath: z.string().optional(),
});

type LessonFormData = z.infer<typeof lessonSchema>;

interface AddLessonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleId: string;
  onClose?: () => void;
}

export function AddLessonDialog({open, onOpenChange, moduleId, onClose }: AddLessonDialogProps) {
  const { t } = useTranslation('common');
  const { toast } = useToast();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const form = useForm<LessonFormData>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      title: "",
      titleRu: "",
      content: "",
      contentRu: "",
      type: "text",
      duration: "",
      filePath: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: LessonFormData) => {
      const response = await apiRequest("POST", "/api/lessons", {
        ...data,
        moduleId,
        order: 0,
        duration: data.duration ? parseInt(data.duration) : null,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({
        title: "Muvaffaqiyat",
        description: "Dars muvaffaqiyatli yaratildi",
      });
      onOpenChange(false);
      onClose?.();
      form.reset();
      setUploadedFile(null);
    },
    onError: () => {
      toast({
        title: "Xatolik",
        description: "Dars yaratishda xatolik yuz berdi",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const data = await apiRequest<{ filePath: string }>('POST', '/api/upload', formDataUpload);
      form.setValue("filePath", data.filePath);
      toast({
        title: "Yuklandi",
        description: "Fayl muvaffaqiyatli yuklandi",
      });
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Fayl yuklashda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (data: LessonFormData) => {
    createMutation.mutate(data);
  };
  
  const lessonType = form.watch("type");
  const filePath = form.watch("filePath");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">Yangi dars qo'shish</DialogTitle>
          <DialogDescription>
            Modulga yangi dars qo'shish uchun ma'lumotlarni kiriting
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dars turi <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-lesson-type" className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="text">Matn</SelectItem>
                        <SelectItem value="video">{t('video')}</SelectItem>
                        <SelectItem value="pdf">PDF</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Davomiyligi (daqiqa)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" placeholder="30" data-testid="input-duration" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dars nomi (O'zbek) <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Kirish: Asosiy tushunchalar" data-testid="input-lesson-title" />
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
                  <FormLabel>Dars nomi (Rus) <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Введение: Основные понятия" data-testid="input-lesson-title-ru" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {lessonType === "video" && (
              <FormField
                control={form.control}
                name="filePath"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Video link (YouTube, Vimeo yoki boshqa) <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input {...field} type="url" placeholder="https://www.youtube.com/watch?v=..." data-testid="input-video-link" />
                    </FormControl>
                    <p className="text-sm text-muted-foreground">
                      Video linkini kiriting (YouTube, Vimeo yoki boshqa video hosting)
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {lessonType === "pdf" && (
              <div className="space-y-2">
                <FormLabel>PDF fayl yuklash <span className="text-destructive">*</span></FormLabel>
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setUploadedFile(file);
                        handleFileUpload(file);
                      }
                    }}
                    disabled={uploading}
                    data-testid="input-file-upload"
                  />
                  {uploading && <EPLoader className="w-4 h-4" />}
                </div>
                {filePath && (
                  <p className="text-sm text-muted-foreground">
                    Yuklandi: {filePath}
                  </p>
                )}
              </div>
            )}

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kontent (O'zbek) <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Dars mazmuni yoki tavsifi..." rows={4} data-testid="input-lesson-content" />
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
                  <FormLabel>Kontent (Rus) <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Содержание или описание урока..." rows={4} data-testid="input-lesson-content-ru" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  onClose?.();
                }}
                disabled={createMutation.isPending}
              >
                Bekor qilish
              </Button>
              <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-lesson">
                {createMutation.isPending && <EPLoader className="w-4 h-4 mr-2" />}
                Saqlash
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
