/**
 * @module MarketingWebsiteCMS
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, selectArray } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Globe, Pencil, Trash2, Eye, Sparkles, Send, Newspaper } from "lucide-react";
import type { BlogPost } from "@shared/schema";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { NewsItem } from "./MarketingWebsiteCMSTypes";
import { EPErrorState } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

export default function MarketingWebsiteCMS() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    titleUz: "", titleRu: "", slug: "", bodyUz: "", bodyRu: "",
    excerpt: "", coverImage: "", seoTitle: "", seoDescription: "",
    tags: "",
  });
  const [aiTopic, setAiTopic] = useState("");
  const [aiLang, setAiLang] = useState("uz");
  const [mainTab, setMainTab] = useState("blog");

  const { data: posts = [], isLoading, isError, refetch} = useQuery<BlogPost[]>({
    queryKey: ["/api/marketing/website/blog"],
    select: selectArray<BlogPost>,
  });

  const { data: news = [], isLoading: newsLoading } = useQuery<NewsItem[]>({
    queryKey: ["/api/website/news"],
    enabled: mainTab === "news",
    select: selectArray<NewsItem>,
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/marketing/website/blog", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/website/blog"] });
      setOpen(false); resetForm();
      toast({ title: "Blog post yaratildi" });
    },
    onError: (e: unknown) => toast({ title: "Xatolik", description: (e as Error).message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => apiRequest("PATCH", `/api/marketing/website/blog/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/website/blog"] });
      setOpen(false); resetForm();
      toast({ title: "Post yangilandi" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/marketing/website/blog/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/website/blog"] });
      toast({ title: "Post o'chirildi" });
    },
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/marketing/website/blog/${id}/publish`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/website/blog"] });
      toast({ title: "Post nashr qilindi" });
    },
  });

  const aiMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/marketing/website/blog/ai-generate", data),
    onSuccess: (data: Record<string, unknown>) => {
      setForm(prev => ({
        ...prev,
        titleUz: (data.title as string) || prev.titleUz,
        bodyUz: (data.body as string) || prev.bodyUz,
        excerpt: (data.excerpt as string) || prev.excerpt,
        seoTitle: (data.seoTitle as string) || prev.seoTitle,
        seoDescription: (data.seoDescription as string) || prev.seoDescription,
        tags: Array.isArray(data.tags) ? (data.tags as string[]).join(", ") : prev.tags,
      }));
      toast({ title: "AI maqola tayyor" });
    },
    onError: () => toast({ title: "AI xatolik", variant: "destructive" }),
  });

  const resetForm = () => {
    setForm({ titleUz: "", titleRu: "", slug: "", bodyUz: "", bodyRu: "", excerpt: "", coverImage: "", seoTitle: "", seoDescription: "", tags: "" });
    setEditId(null);
  };

  const handleEdit = (p: BlogPost) => {
    setEditId(p.id);
    setForm({
      titleUz: p.titleUz, titleRu: p.titleRu || "", slug: p.slug,
      bodyUz: p.bodyUz || "", bodyRu: p.bodyRu || "",
      excerpt: p.excerpt || "", coverImage: p.coverImage || "",
      seoTitle: p.seoTitle || "", seoDescription: p.seoDescription || "",
      tags: Array.isArray(p.tags) ? (p.tags as string[]).join(", ") : "",
    });
    setOpen(true);
  };

  const handleSubmit = () => {
    const payload = {
      ...form,
      slug: form.slug || form.titleUz.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
    };
    if (editId) updateMutation.mutate({ id: editId, data: payload });
    else createMutation.mutate(payload);
  };

  const published = posts?.filter(p => p.isPublished) || [];
  const drafts = posts?.filter(p => !p.isPublished) || [];

  if (isLoading) return <div className="p-4 space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={`k-${i}`} className="h-24 rounded-lg" />)}</div>;
  if (isError) return <EPErrorState onRetry={refetch} />;

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-4" data-testid="marketing-website-cms">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Globe className="h-6 w-6 text-[var(--ep-green)]" />{t("webSaytCms")}
        </h1>
        {mainTab === "blog" && (
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-blog"><Plus className="h-4 w-4 mr-1" />{t("yangiMaqola")}</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
              <DialogHeader><DialogTitle className="text-[18px] font-semibold">{editId ? "Maqolani tahrirlash" : "Yangi Blog Maqola"}</DialogTitle></DialogHeader>
              <Tabs defaultValue="content">
                <TabsList className="grid w-full grid-cols-1 md:grid-cols-3">
                  <TabsTrigger value="content">{t("kontent")}</TabsTrigger>
                  <TabsTrigger value="seo">SEO</TabsTrigger>
                  <TabsTrigger value="ai">{t("aiYordamchi")}</TabsTrigger>
                </TabsList>
                <TabsContent value="content" className="space-y-3 mt-3">
                  <div><Label>Sarlavha (UZ) *</Label><Input data-testid="input-blog-title-uz" value={form.titleUz} onChange={(e) => setForm({ ...form, titleUz: e.target.value })} /></div>
                  <div><Label>Sarlavha (RU)</Label><Input value={form.titleRu} onChange={(e) => setForm({ ...form, titleRu: e.target.value })} /></div>
                  <div><Label>{t("slug")}</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="avtomatik-yaratiladi" /></div>
                  <div><Label>Matn (UZ)</Label><Textarea data-testid="input-blog-body-uz" value={form.bodyUz} onChange={(e) => setForm({ ...form, bodyUz: e.target.value })} className="min-h-[200px]" /></div>
                  <div><Label>Matn (RU)</Label><Textarea value={form.bodyRu} onChange={(e) => setForm({ ...form, bodyRu: e.target.value })} className="min-h-[120px]" /></div>
                  <div><Label>{t("qisqaTavsif")}</Label><Textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} /></div>
                  <div><Label>{t("coverRasmUrl")}</Label><Input value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} /></div>
                  <div><Label>Teglar (vergul bilan)</Label><Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder={t("qadoqlashQutiGofra")} /></div>
                </TabsContent>
                <TabsContent value="seo" className="space-y-3 mt-3">
                  <div><Label>{t("seoSarlavha")}</Label><Input value={form.seoTitle} onChange={(e) => setForm({ ...form, seoTitle: e.target.value })} /></div>
                  <div><Label>{t("seoTavsif")}</Label><Textarea value={form.seoDescription} onChange={(e) => setForm({ ...form, seoDescription: e.target.value })} /></div>
                </TabsContent>
                <TabsContent value="ai" className="space-y-3 mt-3">
                  <div><Label>{t("mavzu")}</Label><Input value={aiTopic} onChange={(e) => setAiTopic(e.target.value)} placeholder={t("gofraQutilariSifatiHaqida")} /></div>
                  <div className="flex gap-2">
                    <Button variant={aiLang === "uz" ? "default" : "outline"} onClick={() => setAiLang("uz")}>{t("language.uz")}</Button>
                    <Button variant={aiLang === "ru" ? "default" : "outline"} onClick={() => setAiLang("ru")}>{t("ruscha")}</Button>
                  </div>
                  <Button onClick={() => aiMutation.mutate({ topic: aiTopic, language: aiLang })} disabled={!aiTopic || aiMutation.isPending} data-testid="button-ai-generate-blog">
                    <Sparkles className="h-4 w-4 mr-1" />{aiMutation.isPending ? "Yaratilmoqda..." : "AI bilan yaratish"}
                  </Button>
                </TabsContent>
              </Tabs>
              <Button onClick={handleSubmit} disabled={!form.titleUz || createMutation.isPending || updateMutation.isPending} className="w-full mt-3" data-testid="button-submit-blog">
                {editId ? "Saqlash" : "Yaratish"}
              </Button>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList>
          <TabsTrigger value="blog">{t("blogMaqolalar")}</TabsTrigger>
          <TabsTrigger value="news"><Newspaper className="h-4 w-4 mr-1" />{t("yangiliklar")}</TabsTrigger>
        </TabsList>

        <TabsContent value="blog" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold" data-testid="text-published-count">{published.length}</p>
                <p className="text-sm text-muted-foreground">{t("nashrQilingan")}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold" data-testid="text-draft-count">{drafts.length}</p>
                <p className="text-sm text-muted-foreground">{t("draft")}</p>
              </CardContent>
            </Card>
          </div>
          {posts?.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">{t("hozirchaBlogPostlarYoq")}</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {posts?.map((p) => (
                <Card key={p.id} data-testid={`card-blog-${p.id}`}>
                  <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base">{p.titleUz}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">/{p.slug}</p>
                    </div>
                    <div className="flex gap-1">
                      {!p.isPublished && (
                        <Button size="icon" variant="ghost" onClick={() => publishMutation.mutate(p.id)} data-testid={`button-publish-${p.id}`}>
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(p)} data-testid={`button-edit-blog-${p.id}`}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => setDeleteId(p.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {p.excerpt && <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{p.excerpt}</p>}
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={p.isPublished ? "default" : "secondary"}>{p.isPublished ? "Nashr qilingan" : "Qoralama"}</Badge>
                      {p.isAiGenerated && <Badge variant="outline"><Sparkles className="h-3 w-3 mr-1" />AI</Badge>}
                      <Badge variant="outline"><Eye className="h-3 w-3 mr-1" />{p.viewCount || 0}</Badge>
                      {Array.isArray(p.tags) && (p.tags as string[]).map((t, i) => (
                        <Badge key={`k-${i}`} variant="outline" className="text-xs">{t}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="news" className="mt-4">
          {newsLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={`k-${i}`} className="h-20 rounded-lg" />)}</div>
          ) : !news || news.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">{t("hozirchaYangiliklarYoq")}</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {(Array.isArray(news) ? news : []).map((item) => (
                <Card key={item.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{item.title}</CardTitle>
                      {item.is_published !== undefined && (
                        <Badge variant={item.is_published ? "default" : "secondary"}>
                          {item.is_published ? "Nashr qilingan" : "Qoralama"}
                        </Badge>
                      )}
                    </div>
                    {item.title_ru && <p className="text-sm text-muted-foreground">{item.title_ru}</p>}
                  </CardHeader>
                  {item.summary && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">{item.summary}</p>
                      {item.published_at && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(item.published_at).toLocaleDateString('uz-UZ')}
                        </p>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => { if (!v) setDeleteId(null); }}
        title={t("maqolaniOchirish")}
        description={t("ushbuBlogMaqolasiniOchirishniTasdiqlaysizmi")}
        confirmText="O'chirish"
        variant="destructive"
        onConfirm={() => { if (deleteId) { deleteMutation.mutate(deleteId); setDeleteId(null); } }}
      />
    </div>
  );
}
