/**
 * @module DealDetailSheet
 * @description React UI component.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Pencil, Save, X, Building2, User, Calendar, DollarSign } from "lucide-react";

type Deal = {
  id: number;
  title: string;
  categoryId: number;
  stageId: string;
  opportunity: number;
  currencyId: string;
  probability: number;
  companyId: number | null;
  contactIds: number[];
  beginDate: string | null;
  closeDate: string | null;
  assignedById: string;
  comments: string | null;
  additionalInfo: string | null;
  dateCreate: string;
  dateModify: string;
};

type Contact = {
  id: number;
  name: string;
  lastName: string;
};

type Company = {
  id: number;
  title: string;
};

interface DealDetailSheetProps {
  dealId: number | null;
  open: boolean;
  onClose: () => void;
}

const dealFormSchema = z.object({
  title: z.string().min(1, "Kelishuv nomi kerak"),
  opportunity: z.number().min(0, "Summa 0 dan katta bo'lishi kerak"),
  probability: z.number().min(0).max(100).optional(),
  companyId: z.number().nullable().optional(),
  beginDate: z.string().optional(),
  closeDate: z.string().optional(),
  comments: z.string().optional(),
  additionalInfo: z.string().optional(),
});

type DealFormValues = z.infer<typeof dealFormSchema>;

export function DealDetailSheet({ dealId, open, onClose }: DealDetailSheetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const { data: deal, isLoading } = useQuery<Deal>({
    queryKey: ["/api/crm/deals", dealId],
    enabled: !!dealId && open,
  });

  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ["/api/crm/contacts"],
    enabled: open,
  });

  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["/api/crm/companies"],
    enabled: open,
  });

  const form = useForm<DealFormValues>({
    resolver: zodResolver(dealFormSchema),
    values: deal
      ? {
          title: deal.title,
          opportunity: deal.opportunity,
          probability: deal.probability,
          companyId: deal.companyId,
          beginDate: deal.beginDate || "",
          closeDate: deal.closeDate || "",
          comments: deal.comments || "",
          additionalInfo: deal.additionalInfo || "",
        }
      : undefined,
  });

  const updateDealMutation = useMutation({
    mutationFn: async (values: DealFormValues) => {
      const res = await apiRequest("PATCH", `/api/crm/deals/${dealId}`, values);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/deals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/deals", dealId] });
      toast({
        title: "Saqlandi",
        description: "Kelishuv yangilandi",
      });
      setIsEditing(false);
    },
    onError: () => {
      toast({
        title: "Xatolik",
        description: "Saqlashda xatolik yuz berdi",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (values: DealFormValues) => {
    updateDealMutation.mutate(values);
  };

  const handleCancel = () => {
    form.reset();
    setIsEditing(false);
  };

  if (!deal && !isLoading) {
    return null;
  }

  const linkedCompany = (Array.isArray(companies) ? companies : []).find((c) => c.id === deal?.companyId);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-6">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <SheetTitle data-testid="text-deal-title">
                {deal?.title || "Yuklanmoqda..."}
              </SheetTitle>
              <SheetDescription>
                Kelishuv #{dealId} • {deal?.dateCreate && format(new Date(deal.dateCreate), "dd.MM.yyyy")}
              </SheetDescription>
            </div>
            {!isEditing ? (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsEditing(true)}
                data-testid="button-edit-deal"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        </SheetHeader>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">
            Yuklanmoqda...
          </div>
        ) : isEditing ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 pt-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kelishuv nomi *</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-deal-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="opportunity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Summa *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          data-testid="input-deal-opportunity"
                        />
                      </FormControl>
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
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          data-testid="input-deal-probability"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="companyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kompaniya</FormLabel>
                    <Select
                      value={field.value?.toString() || "none"}
                      onValueChange={(val) => field.onChange(val === "none" ? null : Number(val))}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-deal-company" className="h-9">
                          <SelectValue placeholder="Kompaniya tanlang" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Hech biri</SelectItem>
                        {(Array.isArray(companies) ? companies : []).map((company) => (
                          <SelectItem key={company.id} value={company.id.toString()}>
                            {company.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="beginDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Boshlanish sanasi</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-deal-begin-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="closeDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Yopilish sanasi</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-deal-close-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="comments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Izohlar</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} data-testid="input-deal-comments" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="additionalInfo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qo'shimcha ma'lumot</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} data-testid="input-deal-additional-info" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  data-testid="button-cancel-edit"
                >
                  <X className="h-4 w-4 mr-2" />
                  Bekor qilish
                </Button>
                <Button
                  type="submit"
                  disabled={updateDealMutation.isPending}
                  data-testid="button-save-deal"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateDealMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className="space-y-6 pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Summa:</span>
                <span className="font-semibold text-[var(--ep-green)]">
                  {deal?.opportunity.toLocaleString()} {deal?.currencyId}
                </span>
              </div>

              {deal?.probability !== undefined && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Ehtimollik:</span>
                  <Badge variant="secondary">{deal.probability}%</Badge>
                </div>
              )}

              {linkedCompany && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Kompaniya:</span>
                  <span className="font-medium">{linkedCompany.title}</span>
                </div>
              )}

              {deal?.beginDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Boshlanish:</span>
                  <span>{format(new Date(deal.beginDate), "dd.MM.yyyy")}</span>
                </div>
              )}

              {deal?.closeDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Yopilish:</span>
                  <span>{format(new Date(deal.closeDate), "dd.MM.yyyy")}</span>
                </div>
              )}
            </div>

            <Separator />

            {deal?.comments && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Izohlar</h4>
                <p className="text-sm whitespace-pre-wrap">{deal.comments}</p>
              </div>
            )}

            {deal?.additionalInfo && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Qo'shimcha ma'lumot</h4>
                <p className="text-sm whitespace-pre-wrap">{deal.additionalInfo}</p>
              </div>
            )}

            <Separator />

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Ma'lumot</h4>
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Mas'ul:</span>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {deal?.assignedById?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs">{deal?.assignedById}</span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Yaratilgan: {deal?.dateCreate && format(new Date(deal.dateCreate), "dd.MM.yyyy HH:mm")}
              </div>
              <div className="text-xs text-muted-foreground">
                Yangilangan: {deal?.dateModify && format(new Date(deal.dateModify), "dd.MM.yyyy HH:mm")}
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
