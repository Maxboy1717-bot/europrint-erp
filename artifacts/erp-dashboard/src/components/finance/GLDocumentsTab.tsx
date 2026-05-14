/**
 * @module GLDocumentsTab
 * @description React UI component.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Check, X, FileText } from "lucide-react";
import type { GlDocument } from "@shared/schema";

const glDocumentFormSchema = z.object({
  documentNumber: z.string().min(1, "Hujjat raqami talab qilinadi"),
  documentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD format"),
  postingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD format"),
  documentType: z.enum(["invoice", "payment", "transfer", "adjustment"]),
  description: z.string().optional(),
  status: z.enum(["draft", "posted", "reversed"]).default("draft"),
});

type GlDocumentFormValues = z.infer<typeof glDocumentFormSchema>;

export function GLDocumentsTab() {
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const { data: glDocuments = [], isLoading } = useQuery<GlDocument[]>({
    queryKey: ["/api/fi/gl-documents"],
  });

  const form = useForm<GlDocumentFormValues>({
    resolver: zodResolver(glDocumentFormSchema),
    defaultValues: {
      documentNumber: "",
      documentDate: new Date().toISOString().split("T")[0],
      postingDate: new Date().toISOString().split("T")[0],
      documentType: "invoice",
      description: "",
      status: "draft",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: GlDocumentFormValues) => apiRequest("POST", "/api/fi/gl-documents", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fi/gl-documents"] });
      toast({ title: "Muvaffaqiyatli", description: "Hujjat yaratildi" });
      setIsAddOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Yaratishda xatolik yuz berdi", variant: "destructive" });
    },
  });

  const postMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/fi/gl-documents/${id}/post`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fi/gl-documents"] });
      toast({ title: "Muvaffaqiyatli", description: "Hujjat joylashtirildi" });
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Joylashtirishda xatolik yuz berdi", variant: "destructive" });
    },
  });

  const closeDialog = () => {
    setIsAddOpen(false);
    form.reset();
  };

  const getDocumentTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      invoice: "Faktura", payment: "To'lov", transfer: "O'tkazma", adjustment: "Tuzatish",
    };
    return types[type] || type;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "posted":
        return <Badge className="bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold border-none"><Check className="mr-1 h-3 w-3" />Joylashtirilgan</Badge>;
      case "reversed":
        return <Badge className="bg-red-100 text-red-800 rounded-full px-2.5 py-0.5 text-xs font-semibold border-none"><X className="mr-1 h-3 w-3" />Bekor qilingan</Badge>;
      default:
        return <Badge className="bg-muted/60 text-foreground rounded-full px-2.5 py-0.5 text-xs font-semibold border-none"><FileText className="mr-1 h-3 w-3" />Qoralama</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground" data-testid="text-gl-documents-title">
          Bosh Daftar Hujjatlari
        </h3>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsAddOpen(true)} data-testid="button-add-gl-document" className="bg-primary text-white rounded-lg px-5 py-2.5 text-sm font-semibold border-none">
              <Plus className="mr-2 h-4 w-4" />
              Yangi hujjat
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md bg-card border-none rounded-xl p-6">
            <DialogHeader>
              <DialogTitle className="text-foreground">Yangi GL hujjati</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Bosh daftar hujjati ma'lumotlarini kiriting
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
                <FormField control={form.control} name="documentNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground">Hujjat raqami</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="GL-2024-001" data-testid="input-gl-document-number" className="bg-background border-border text-foreground" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="documentDate" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground">Hujjat sanasi</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" data-testid="input-gl-document-date" className="bg-background border-border text-foreground" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="postingDate" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground">Joylashtirish sanasi</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" data-testid="input-gl-posting-date" className="bg-background border-border text-foreground" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="documentType" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground">Hujjat turi</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-gl-document-type" className="bg-background border-border text-foreground h-9">
                          <SelectValue placeholder="Turni tanlang" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-card border-none">
                        <SelectItem value="invoice">Faktura</SelectItem>
                        <SelectItem value="payment">To'lov</SelectItem>
                        <SelectItem value="transfer">O'tkazma</SelectItem>
                        <SelectItem value="adjustment">Tuzatish</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground">Tavsif</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Hujjat haqida..." data-testid="input-gl-document-description" className="bg-background border-border text-foreground" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={closeDialog} className="bg-muted/60 text-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-muted border-none">
                    Bekor qilish
                  </Button>
                  <Button type="submit" data-testid="button-save-gl-document" className="bg-primary text-white rounded-lg px-5 py-2.5 text-sm font-semibold border-none">
                    Yaratish
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-card border-none rounded-xl">
        <CardContent className="p-0">
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow className="bg-muted/60 hover:bg-muted/60 border-none">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">Hujjat raqami</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">Sana</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">Turi</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">Tavsif</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 text-right">Debet</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 text-right">Kredit</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">Holati</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 text-right">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-[13px] text-muted-foreground">Yuklanmoqda...</TableCell>
                </TableRow>
              ) : glDocuments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-[13px] text-muted-foreground">Hujjatlar topilmadi</TableCell>
                </TableRow>
              ) : (
                (Array.isArray(glDocuments) ? glDocuments : []).map((doc) => (
                  <TableRow key={doc.id} data-testid={`row-gl-document-${doc.id}`} className="hover:bg-muted/40 transition-colors border-none">
                    <TableCell className="py-3 px-6 font-mono text-foreground">{doc.documentNumber}</TableCell>
                    <TableCell className="py-3 px-6 text-foreground">{doc.documentDate}</TableCell>
                    <TableCell className="py-3 px-6 text-foreground">{getDocumentTypeLabel(doc.documentType)}</TableCell>
                    <TableCell className="py-3 px-6 text-foreground max-w-[200px] truncate">{doc.description || "-"}</TableCell>
                    <TableCell className="py-3 px-6 text-right font-mono text-primary font-semibold">
                      {doc.totalDebit?.toLocaleString() || "0"}
                    </TableCell>
                    <TableCell className="py-3 px-6 text-right font-mono text-[var(--ep-red)] font-semibold">
                      {doc.totalCredit?.toLocaleString() || "0"}
                    </TableCell>
                    <TableCell className="py-3 px-6">{getStatusBadge(doc.status)}</TableCell>
                    <TableCell className="py-3 px-6 text-right">
                      {doc.status === "draft" && (
                        <Button size="sm" variant="outline" onClick={() => postMutation.mutate(doc.id)}
                          data-testid={`button-post-gl-document-${doc.id}`}
                          className="bg-primary text-white hover:bg-primary/90 border-none">
                          <Check className="mr-1 h-3 w-3" />
                          Joylashtirish
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table></div>
        </CardContent>
      </Card>
    </div>
  );
}
