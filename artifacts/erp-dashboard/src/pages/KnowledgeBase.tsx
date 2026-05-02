import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Plus, Edit, Trash2, BookOpen, Filter, Upload, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { KnowledgeBase } from "@shared/schema";
import { useTranslation } from "@/lib/i18n";
import { ErrorState } from "@/components/ui/error-state";

const knowledgeBaseFormSchema = z.object({
  title: z.string().min(1, "Sarlavha (O'zbek) talab qilinadi"),
  titleRu: z.string().min(1, "Sarlavha (Rus) talab qilinadi"),
  content: z.string().min(1, "Ma'lumot (O'zbek) talab qilinadi"),
  contentRu: z.string().min(1, "Ma'lumot (Rus) talab qilinadi"),
  category: z.string().min(1, "Kategoriya talab qilinadi"),
  tags: z.string().optional(),
  order: z.number().default(0),
  isActive: z.string().default("true"),
});

type KnowledgeBaseFormValues = z.infer<typeof knowledgeBaseFormSchema>;
type KnowledgeBasePayload = Omit<KnowledgeBaseFormValues, 'tags'> & { tags: string[] };

export default function KnowledgeBasePage() {
  const { t } = useTranslation('lms');
  const { t: tCommon } = useTranslation('common');
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeBase | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [uploadMode, setUploadMode] = useState<"text" | "file">("text");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: items = [], isLoading, isError, refetch} = useQuery<KnowledgeBase[]>({
    queryKey: ["/api/knowledge-base"],
  });

  const form = useForm<KnowledgeBaseFormValues>({
    resolver: zodResolver(knowledgeBaseFormSchema),
    defaultValues: {
      title: "",
      titleRu: "",
      content: "",
      contentRu: "",
      category: "about_company",
      tags: "",
      order: 0,
      isActive: "true",
    },
  });

  useEffect(() => {
    if (editingItem) {
      form.reset({
        title: editingItem.title || "",
        titleRu: editingItem.titleRu || "",
        content: editingItem.content || "",
        contentRu: editingItem.contentRu || "",
        category: editingItem.category || "about_company",
        tags: editingItem.tags?.join(", ") || "",
        order: editingItem.order || 0,
        isActive: editingItem.isActive ? "true" : "false",
      });
    } else {
      form.reset({
        title: "",
        titleRu: "",
        content: "",
        contentRu: "",
        category: "about_company",
        tags: "",
        order: 0,
        isActive: "true",
      });
    }
  }, [editingItem, form]);

  const createMutation = useMutation({
    mutationFn: async (data: KnowledgeBasePayload) => {
      const res = await fetch("/api/knowledge-base", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-base"] });
      setIsDialogOpen(false);
      toast({
        title: tCommon('success'),
        description: tCommon('createdSuccessfully'),
      });
    },
    onError: () => {
      toast({
        title: tCommon('error'),
        description: tCommon('operationFailed'),
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: KnowledgeBasePayload }) => {
      const res = await fetch(`/api/knowledge-base/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-base"] });
      setIsDialogOpen(false);
      setEditingItem(null);
      toast({
        title: tCommon('success'),
        description: tCommon('updatedSuccessfully'),
      });
    },
    onError: () => {
      toast({
        title: tCommon('error'),
        description: tCommon('operationFailed'),
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/knowledge-base/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-base"] });
      toast({
        title: tCommon('success'),
        description: tCommon('deletedSuccessfully'),
      });
    },
    onError: () => {
      toast({
        title: tCommon('error'),
        description: tCommon('operationFailed'),
        variant: "destructive",
      });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/knowledge-base/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to upload");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-base"] });
      setIsDialogOpen(false);
      setSelectedFile(null);
      setUploadMode("text");
      toast({
        title: tCommon('success'),
        description: tCommon('savedSuccessfully'),
      });
    },
    onError: () => {
      toast({
        title: tCommon('error'),
        description: tCommon('operationFailed'),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: KnowledgeBaseFormValues) => {
    if (uploadMode === "file" && selectedFile) {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("title", values.title);
      formData.append("titleRu", values.titleRu);
      formData.append("category", values.category);
      uploadMutation.mutate(formData);
    } else {
      const data = {
        title: values.title,
        titleRu: values.titleRu,
        content: values.content,
        contentRu: values.contentRu,
        category: values.category,
        tags: values.tags?.split(",").map(t => t.trim()).filter(Boolean) || [],
        order: values.order,
        isActive: values.isActive,
      };

      if (editingItem) {
        updateMutation.mutate({ id: editingItem.id, data });
      } else {
        createMutation.mutate(data);
      }
    }
  };

  const handleEdit = (item: KnowledgeBase) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
    setUploadMode("text");
    setSelectedFile(null);
    form.reset();
  };

  const filteredItems = filterCategory === "all" 
    ? items 
    : (Array.isArray(items) ? items : []).filter(item => item.category === filterCategory);

  const categories = [
    { value: "about_company", label: tCommon('company') },
    { value: "products", label: "Mahsulotlar" },
    { value: "services", label: "Xizmatlar" },
    { value: "policies", label: "Siyosatlar" },
    { value: "procedures", label: "Tartib-qoidalar" },
    { value: "faq", label: "FAQ" },
    { value: "history", label: "Tarix" },
    { value: "team", label: "Jamoa" },
    { value: "other", label: "Boshqa" },
  ];

  const getCategoryLabel = (category: string) => {
    return (categories ?? []).find(c => c.value === category)?.label || category;
  };

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-80 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-6 w-16" />
            </div>
          </CardContent>
        </Card>
        <div className="grid gap-4">
          {([1, 2, 3]).map((i) => (
            <Card key={`k-${i}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Skeleton className="h-6 w-64 mb-2" />
                    <Skeleton className="h-4 w-48 mb-2" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-6 w-24" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('knowledgeBase')}</h1>
          <p className="text-muted-foreground mt-2">
            {tCommon('description')}
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} data-testid="button-add-knowledge">
          <Plus className="w-4 h-4 mr-2" />
          {tCommon('add')}
        </Button>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-64" data-testid="select-category-filter">
                <SelectValue placeholder={`${tCommon('all')} ${tCommon('category').toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tCommon('all')} {tCommon('category').toLowerCase()}</SelectItem>
                {(Array.isArray(categories) ? categories : []).map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="secondary">{tCommon('total')}: {filteredItems.length}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <div className="grid gap-4">
        {filteredItems.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{tCommon('noData')}</p>
            </CardContent>
          </Card>
        ) : (
          (Array.isArray(filteredItems) ? filteredItems : []).map((item) => (
            <Card key={item.id} data-testid={`knowledge-card-${item.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle>{item.title}</CardTitle>
                      {!item.isActive && <Badge variant="destructive">{tCommon('inactive')}</Badge>}
                    </div>
                    <CardDescription>{item.titleRu}</CardDescription>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">{getCategoryLabel(item.category)}</Badge>
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {(Array.isArray(item.tags) ? item.tags : []).map((tag: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(item)}
                      data-testid={`button-edit-${item.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(item.id)}
                      data-testid={`button-delete-${item.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium mb-1">O'zbekcha:</p>
                    <p className="text-sm text-muted-foreground line-clamp-3">{item.content}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Русский:</p>
                    <p className="text-sm text-muted-foreground line-clamp-3">{item.contentRu}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-knowledge-form">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? tCommon('edit') : tCommon('add')}
            </DialogTitle>
            <DialogDescription>
              {t('knowledgeBase')}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {!editingItem && (
                <div className="flex gap-2 mb-4">
                  <Button
                    type="button"
                    variant={uploadMode === "text" ? "default" : "outline"}
                    onClick={() => setUploadMode("text")}
                    data-testid="button-mode-text"
                    className="flex-1"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    {tCommon('description')}
                  </Button>
                  <Button
                    type="button"
                    variant={uploadMode === "file" ? "default" : "outline"}
                    onClick={() => setUploadMode("file")}
                    data-testid="button-mode-file"
                    className="flex-1"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {tCommon('upload')}
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tCommon('name')} (UZ) *</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-title" />
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
                      <FormLabel>{tCommon('name')} (RU) *</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-titleRu" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tCommon('category')} *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(Array.isArray(categories) ? categories : []).map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {uploadMode === "text" ? (
                <>
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tCommon('description')} (UZ) *</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            rows={6}
                            data-testid="textarea-content"
                            placeholder="Kompaniya haqida batafsil ma'lumot..."
                          />
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
                        <FormLabel>{tCommon('description')} (RU) *</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            rows={6}
                            data-testid="textarea-contentRu"
                            placeholder="Подробная информация о компании..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              ) : (
                <div className="space-y-2">
                  <FormLabel>{tCommon('upload')} (PDF, DOCX, TXT) *</FormLabel>
                  <div className="flex flex-col gap-2">
                    <Input
                      id="file"
                      type="file"
                      accept=".pdf,.docx,.txt"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      data-testid="input-file"
                    />
                    {selectedFile && (
                      <Badge variant="secondary" className="w-fit">
                        {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                      </Badge>
                    )}
                    <p className="text-xs text-muted-foreground">
                      PDF, DOCX va TXT formatdagi fayllar qo'llab-quvvatlanadi. Maksimal hajm: 100MB
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tCommon('tags')}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="europrint, print, bosma"
                          data-testid="input-tags"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tCommon('sortBy')}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-order"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tCommon('status')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-isActive">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="true">{tCommon('active')}</SelectItem>
                        <SelectItem value="false">{tCommon('inactive')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog} data-testid="button-cancel-knowledge">
                  {tCommon('cancel')}
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending || uploadMutation.isPending}
                  data-testid="button-submit-knowledge"
                >
                  {editingItem ? tCommon('update') : tCommon('add')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => { if (!v) setDeleteId(null); }}
        title="Bilimlar bazasini o'chirish"
        description="Ushbu yozuvni o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi."
        confirmText="O'chirish"
        variant="destructive"
        onConfirm={() => { if (deleteId) { deleteMutation.mutate(deleteId); setDeleteId(null); } }}
      />
    </div>
  );
}
