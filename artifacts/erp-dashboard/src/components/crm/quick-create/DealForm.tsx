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
import { CURRENCIES, dealFormSchema, type DealFormValues } from "./deal-schema";

interface DealFormProps {
  users: Array<{ id: string; fullName: string }>;
  usersLoading: boolean;
  contacts: Array<{ id: number; name: string | null; lastName: string | null }>;
  contactsLoading: boolean;
  companies: Array<{ id: number; title: string }>;
  companiesLoading: boolean;
  onClose: () => void;
  onCreated?: (entity: Record<string, unknown>) => void;
}

export function DealForm({
  users,
  usersLoading,
  contacts,
  contactsLoading,
  companies,
  companiesLoading,
  onClose,
  onCreated,
}: DealFormProps) {
  const { toast } = useToast();
  const form = useForm<DealFormValues>({
    resolver: zodResolver(dealFormSchema),
    defaultValues: {
      title: "",
      opportunity: 0,
      currencyId: "UZS",
      closeDate: "",
      probability: 50,
      companyId: undefined,
      contactId: undefined,
      assignedById: "",
      comments: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: DealFormValues) => {
      const payload = {
        title: data.title,
        opportunity: data.opportunity || 0,
        currencyId: data.currencyId || "UZS",
        closeDate: data.closeDate || null,
        probability: data.probability || 0,
        companyId: data.companyId || null,
        contactIds: data.contactId ? [data.contactId] : [],
        assignedById: data.assignedById || null,
        comments: data.comments || null,
      };
      return apiRequest("POST", "/api/crm/deals/quick", payload);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/deals"] });
      toast({
        title: "Bitim yaratildi",
        description: "Yangi bitim muvaffaqiyatli qo'shildi",
      });
      onCreated?.(result);
      onClose();
    },
    onError: () => {
      toast({
        title: "Xatolik",
        description: "Bitim yaratishda xatolik yuz berdi",
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
                  <FormLabel>Bitim nomi <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Bitim nomini kiriting" {...field} data-testid="input-title" autoFocus />
                  </FormControl>
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
                      <SelectTrigger data-testid="select-deal-assignedById">
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
              name="probability"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ehtimollik (%)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} max={100} placeholder="50" {...field} data-testid="input-probability" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contactId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kontakt</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value !== undefined ? String(field.value) : undefined}>
                    <FormControl>
                      <SelectTrigger data-testid="select-contactId">
                        <SelectValue placeholder={contactsLoading ? "Yuklanmoqda..." : "Kontaktni tanlang"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Array.isArray(contacts) ? contacts : []).map((contact) => (
                        <SelectItem key={contact.id} value={String(contact.id)} data-testid={`contact-option-${contact.id}`}>
                          {contact.name || contact.lastName || `Kontakt #${contact.id}`}
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
              name="companyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kompaniya</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value !== undefined ? String(field.value) : undefined}>
                    <FormControl>
                      <SelectTrigger data-testid="select-companyId">
                        <SelectValue placeholder={companiesLoading ? "Yuklanmoqda..." : "Kompaniyani tanlang"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Array.isArray(companies) ? companies : []).map((company) => (
                        <SelectItem key={company.id} value={String(company.id)} data-testid={`company-option-${company.id}`}>
                          {company.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
              name="opportunity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Umumiy summa <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} data-testid="input-opportunity" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="currencyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valyuta</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-currencyId">
                        <SelectValue placeholder="Valyutani tanlang" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Array.isArray(CURRENCIES) ? CURRENCIES : []).map((currency) => (
                        <SelectItem key={currency.value} value={currency.value} data-testid={`currency-option-${currency.value}`}>
                          {currency.label}
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
              name="closeDate"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Kutilayotgan yopilish sanasi</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} data-testid="input-closeDate" />
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
          <div className="grid grid-cols-1 gap-4">
            <FormField
              control={form.control}
              name="comments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Izohlar</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Qo'shimcha izohlar..." className="resize-none" rows={3} {...field} data-testid="input-deal-comments" />
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
