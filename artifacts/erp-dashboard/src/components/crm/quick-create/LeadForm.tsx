import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { LEAD_SOURCES, leadFormSchema, type LeadFormValues } from "./lead-schema";

interface LeadFormProps {
  users: Array<{ id: string; fullName: string }>;
  usersLoading: boolean;
  onClose: () => void;
  onCreated?: (entity: Record<string, unknown>) => void;
}

export function LeadForm({ users, usersLoading, onClose, onCreated }: LeadFormProps) {
  const { toast } = useToast();
  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      title: "",
      name: "",
      lastName: "",
      phone: "",
      email: "",
      companyTitle: "",
      source: "",
      sourceDescription: "",
      budget: 0,
      opportunityAmount: 0,
      comments: "",
      assignedById: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: LeadFormValues) => {
      const payload = {
        title: data.title,
        name: data.name || null,
        lastName: data.lastName || null,
        companyTitle: data.companyTitle || null,
        phones: data.phone ? [{ value: data.phone, type: "WORK" }] : [],
        emails: data.email ? [{ value: data.email, type: "WORK" }] : [],
        sourceId: data.source || null,
        sourceDescription: data.sourceDescription || null,
        budget: data.budget?.toString() || null,
        opportunityAmount: data.opportunityAmount?.toString() || null,
        comments: data.comments || null,
        assignedById: data.assignedById || null,
      };
      return apiRequest("POST", "/api/crm/leads/quick", payload);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads"] });
      toast({ title: "Lid yaratildi", description: "Yangi lid muvaffaqiyatli qo'shildi" });
      onCreated?.(result);
      onClose();
    },
    onError: () => {
      toast({
        title: "Xatolik",
        description: "Lid yaratishda xatolik yuz berdi",
        variant: "destructive",
      });
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">Asosiy ma'lumotlar</h4>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Lid nomi <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Lid nomini kiriting" {...field} data-testid="input-title" autoFocus />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ism</FormLabel>
                  <FormControl><Input placeholder="Ismini kiriting" {...field} data-testid="input-name" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Familiya</FormLabel>
                  <FormControl><Input placeholder="Familiyasini kiriting" {...field} data-testid="input-lastName" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefon</FormLabel>
                  <FormControl><Input placeholder="+998 90 123 45 67" {...field} data-testid="input-phone" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input type="email" placeholder="example@mail.com" {...field} data-testid="input-email" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="companyTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kompaniya nomi</FormLabel>
                  <FormControl><Input placeholder="Kompaniya nomini kiriting" {...field} data-testid="input-companyTitle" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">Moliyaviy ma'lumotlar</h4>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Manba</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-source">
                        <SelectValue placeholder="Manbani tanlang" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Array.isArray(LEAD_SOURCES) ? LEAD_SOURCES : []).map((source) => (
                        <SelectItem key={source.value} value={source.value} data-testid={`source-option-${source.value}`}>
                          {source.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="assignedById"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mas'ul shaxs</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-assignedById">
                        <SelectValue placeholder={usersLoading ? "Yuklanmoqda..." : "Mas'ul shaxsni tanlang"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Array.isArray(users) ? users : []).map((user) => (
                        <SelectItem key={user.id} value={user.id} data-testid={`user-option-${user.id}`}>
                          {user.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="budget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Byudjet (so'm)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} data-testid="input-budget" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="opportunityAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kutilayotgan daromad</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} data-testid="input-opportunityAmount" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">Qo'shimcha ma'lumotlar</h4>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="sourceDescription"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Manba tavsifi</FormLabel>
                  <FormControl>
                    <Input placeholder="Qiziqish mahsuloti yoki tavsif" {...field} data-testid="input-sourceDescription" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="comments"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Izohlar</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Qo'shimcha izohlar..." className="resize-none" rows={3} {...field} data-testid="input-comments" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel">
            Bekor qilish
          </Button>
          <Button type="submit" disabled={mutation.isPending} data-testid="button-submit">
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Yaratish
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
