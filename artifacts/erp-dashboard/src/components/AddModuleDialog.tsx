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
import { useTranslation } from '@/lib/i18n';
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
  const { t } = useTranslation("common");
  const { t: tLms } = useTranslation("lms");
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
        title: t("muvaffaqiyatli"),
        description: tLms("moduleCreatedSuccessfully"),
      });
      onOpenChange(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: t("xato"),
        description: tLms("moduleCreateError"),
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
          <DialogTitle className="text-[18px] font-semibold">{t("yangiModulQoshish")}</DialogTitle>
          <DialogDescription>
            {t("kursgaYangiModulQoshishUchun")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tLms("moduleNameUz")} <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t("k1ModulAsoslar")} data-testid="input-module-title" />
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
                  <FormLabel>{tLms("moduleNameRu")} <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={tLms("moduleNameRuPlaceholder")} data-testid="input-module-title-ru" />
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
                  <FormLabel>{tLms("descriptionUz")}</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder={t("modulHaqidaQisqachaMalumot")} rows={2} data-testid="input-module-description" />
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
                  <FormLabel>{tLms("descriptionRu")}</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder={tLms("descriptionRuPlaceholder")} rows={2} data-testid="input-module-description-ru" />
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
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-module">
                {createMutation.isPending && <EPLoader className="w-4 h-4 mr-2" />}
                {t("save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
