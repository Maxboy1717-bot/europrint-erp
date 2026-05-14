/**
 * @module AddModuleDialog
 * @description React UI component.
 */

import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
;

import { EPLoader } from "@/components/ep";
const moduleSchema = z.object({
  title: z.string().min(1, "Modul nomi majburiy"),
  titleRu: z.string().min(1, "Modul nomi (Rus) majburiy"),
  description: z.string().optional(),
  descriptionRu: z.string().optional(),
});

type ModuleFormData = z.infer<typeof moduleSchema>;

interface AddModuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
}

export function AddModuleDialog({ open, onOpenChange, courseId }: AddModuleDialogProps) {
  const { toast } = useToast();
  const form = useForm<ModuleFormData>({
    resolver: zodResolver(moduleSchema),
    defaultValues: {
      title: "",
      titleRu: "",
      description: "",
      descriptionRu: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ModuleFormData) => {
      const response = await apiRequest("POST", "/api/modules", {
        ...data,
        courseId,
        order: 0,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId] });
      toast({
        title: "Muvaffaqiyat",
        description: "Modul muvaffaqiyatli yaratildi",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Xatolik",
        description: "Modul yaratishda xatolik yuz berdi",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: ModuleFormData) => {
    createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">Yangi modul qo'shish</DialogTitle>
          <DialogDescription>
            Kursga yangi modul qo'shish uchun ma'lumotlarni kiriting
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Modul nomi (O'zbek) <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="1-modul: Asoslar" data-testid="input-module-title" />
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
                  <FormLabel>Modul nomi (Rus) <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Модуль 1: Основы" data-testid="input-module-title-ru" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tavsif (O'zbek)</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Modul haqida qisqacha ma'lumot..." rows={2} data-testid="input-module-description" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descriptionRu"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tavsif (Rus)</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Краткое описание модуля..." rows={2} data-testid="input-module-description-ru" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createMutation.isPending}
              >
                Bekor qilish
              </Button>
              <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-module">
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
