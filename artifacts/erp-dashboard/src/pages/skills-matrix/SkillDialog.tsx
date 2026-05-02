import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { Skill, SkillFormValues } from "./types";

interface SkillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<SkillFormValues>;
  editingSkill: Skill | null;
  onSubmit: (data: SkillFormValues) => void;
  isPending: boolean;
  onCancel: () => void;
}

export function SkillDialog({ open, onOpenChange, form, editingSkill, onSubmit, isPending, onCancel }: SkillDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button data-testid="button-create-skill">
          <Plus className="mr-2 h-4 w-4" />
          Ko'nikma yaratish
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl" data-testid="dialog-create-skill">
        <DialogHeader>
          <DialogTitle>{editingSkill ? "Ko'nikmani tahrirlash" : "Ko'nikma yaratish"}</DialogTitle>
          <DialogDescription>
            {editingSkill ? "Ko'nikma ma'lumotlarini yangilang" : "Ko'nikmalar matritsa uchun yangi ko'nikma yarating"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="code" render={({ field }) => (
                <FormItem>
                  <FormLabel>Kod</FormLabel>
                  <FormControl><Input {...field} placeholder="PYTHON" data-testid="input-skill-code" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>Kategoriya</FormLabel>
                  <FormControl><Input {...field} placeholder="Dasturlash" data-testid="input-skill-category" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom (O'zbekcha)</FormLabel>
                  <FormControl><Input {...field} placeholder="Python dasturlash" data-testid="input-skill-name-uz" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="nameRu" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom (Русский)</FormLabel>
                  <FormControl><Input {...field} placeholder="Программирование Python" data-testid="input-skill-name-ru" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tavsif (O'zbekcha)</FormLabel>
                  <FormControl><Textarea {...field} placeholder="Python dasturlash tillari..." data-testid="input-skill-desc-uz" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="descriptionRu" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tavsif (Русский)</FormLabel>
                  <FormControl><Textarea {...field} placeholder="Языки программирования Python..." data-testid="input-skill-desc-ru" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel">Bekor qilish</Button>
              <Button type="submit" disabled={isPending} data-testid="button-submit">
                {editingSkill ? "Yangilash" : "Yaratish"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
