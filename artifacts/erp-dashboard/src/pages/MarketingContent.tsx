/**
 * @module MarketingContent
 * @description React page component. Route-level UI.
 */

import { useState, type ElementType } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, FileText, Pencil, Trash2, Sparkles, Send, Clock, Archive, Eye, Calendar } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EPErrorState, EPPageHeader } from "@/components/ep";

const statusLabels: Record<string, string> = { draft: "Qoralama", scheduled: "Rejalashtirilgan", published: "Nashr qilingan", failed: "Xatolik" };
const statusIcons: Record<string, ElementType> = { draft: FileText, scheduled: Clock, published: Send, failed: Archive };
const platformLabels: Record<string, string> = { telegram: "Telegram", instagram: "Instagram", facebook: "Facebook", website: "Veb-sayt", linkedin: "LinkedIn" };
const platformColors: Record<string, string> = { telegram: "text-[var(--ep-blue)]", instagram: "text-pink-500", facebook: "text-[var(--ep-blue)]", website: "text-[var(--ep-green)]", linkedin: "text-[var(--ep-blue)]" };

interface ContentPost {
  id: string;
  title: string;
  body: string;
  platform: string;
  status: string;
  mediaUrls: string[] | null;
  hashtags: string[] | null;
  scheduledAt: string | null;
  publishedAt: string | null;
  externalPostId: string | null;
  engagementData: Record<string, unknown> | null;
  isAiGenerated: boolean;
  campaignId: string | null;
  createdBy: string | null;
  createdAt: string;
}

export default function MarketingContent() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [form, setForm] = useState({
    title: "", body: "", platform: "telegram", status: "draft",
    hashtags: "", scheduledAt: "",
  });
  const [aiPrompt, setAiPrompt] = useState("");

  const { data: contentList = [], isLoading, isError, refetch} = useQuery<ContentPost[]>({
    queryKey: ["/api/marketing/content/posts"],
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/marketing/content/posts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/content/posts"] });
      setOpen(false); resetForm();
      toast({ title: "Kontent yaratildi" });
    },
    onError: (e: unknown) => toast({ title: "Xatolik", description: (e as Error).message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => apiRequest("PUT", `/api/marketing/content/posts/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/content/posts"] });
      setOpen(false); resetForm();
      toast({ title: "Kontent yangilandi" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/marketing/content/posts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/content/posts"] });
      toast({ title: "Kontent o'chirildi" });
    },
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/marketing/content/posts/${id}/publish`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/content/posts"] });
      toast({ title: "Kontent nashr qilindi" });
    },
    onError: (e: unknown) => toast({ title: "Nashr xatolik", description: (e as Error).message, variant: "destructive" }),
  });

  const aiMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/marketing/content/ai-generate", data),
    onSuccess: (data: Record<string, unknown>) => {
      setForm(prev => ({
        ...prev,
        title: (data.title as string) || prev.title,
        body: (data.body as string) || prev.body,
        hashtags: Array.isArray(data.hashtags) ? (data.hashtags as string[]).join(", ") : prev.hashtags,
      }));
      toast({ title: "AI kontent tayyor" });
    },
    onError: () => toast({ title: "AI xatolik", variant: "destructive" }),
  });

  const resetForm = () => {
    setForm({ title: "", body: "", platform: "telegram", status: "draft", hashtags: "", scheduledAt: "" });
    setEditId(null); setAiPrompt("");
  };

  const handleEdit = (c: ContentPost) => {
    setEditId(c.id);
    setForm({
      title: c.title, body: c.body || "", platform: c.platform || "telegram",
      status: c.status || "draft",
      hashtags: Array.isArray(c.hashtags) ? c.hashtags.join(", ") : "",
      scheduledAt: c.scheduledAt ? new Date(c.scheduledAt).toISOString().slice(0, 16) : "",
    });
    setOpen(true);
  };

  const handleSubmit = () => {
    const payload = {
      ...form,
      hashtags: form.hashtags ? form.hashtags.split(",").map(t => t.trim()).filter(Boolean) : [],
      scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : undefined,
    };
    if (editId) updateMutation.mutate({ id: editId, data: payload });
    else createMutation.mutate(payload);
  };

  const safeContentList = Array.isArray(contentList) ? contentList : [];

  const filtered = safeContentList.filter(c => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (platformFilter !== "all" && c.platform !== platformFilter) return false;
    return true;
  });

  const stats = {
    total: safeContentList.length,
    published: safeContentList.filter(c => c.status === "published").length,
    scheduled: safeContentList.filter(c => c.status === "scheduled").length,
    draft: safeContentList.filter(c => c.status === "draft").length,
  };

  if (isLoading) return <div className="p-4 space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={`k-${i}`} className="h-24 rounded-lg" />)}</div>;

  if (isError) {
    return <EPErrorState onRetry={refetch} />;
  }

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5" data-testid="marketing-content">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <EPPageHeader
        breadcrumb={<>Dashboard · <b className="text-foreground">Marketing Kontent</b></>}
        title="Marketing Kontent"
      />
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-white rounded-lg px-5 py-2.5 text-sm font-semibold gap-2" data-testid="button-create-content">
              <Plus className="h-4 w-4" />
              Yangi Kontent
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto bg-card border-none p-6">
            <DialogHeader><DialogTitle className="text-foreground font-bold">{editId ? "Kontentni tahrirlash" : "Yangi Kontent"}</DialogTitle></DialogHeader>
            <Tabs defaultValue="content" className="mt-4">
              <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 bg-muted/40 p-1 rounded-lg">
                <TabsTrigger value="content" className="data-[state=active]:bg-card data-[state=active]:text-primary rounded-md">Kontent</TabsTrigger>
                <TabsTrigger value="ai" className="data-[state=active]:bg-card data-[state=active]:text-primary rounded-md">AI Yordamchi</TabsTrigger>
              </TabsList>
              <TabsContent value="content" className="space-y-4 mt-4">
                <div className="space-y-1.5"><Label className="text-muted-foreground">Sarlavha *</Label><Input className="bg-background border-border" data-testid="input-content-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                <div className="space-y-1.5"><Label className="text-muted-foreground">Matn *</Label><Textarea className="bg-background border-border min-h-[120px]" data-testid="input-content-body" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground">Platforma</Label>
                    <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v })}>
                      <SelectTrigger className="bg-background border-border h-9"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-card border-border">{Object.entries(platformLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground">Holat</Label>
                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                      <SelectTrigger className="bg-background border-border h-9"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-card border-border">{Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5"><Label className="text-muted-foreground">Hashtag'lar (vergul bilan)</Label><Input className="bg-background border-border" value={form.hashtags} onChange={(e) => setForm({ ...form, hashtags: e.target.value })} placeholder="#europrint, #quti" /></div>
                <div className="space-y-1.5"><Label className="text-muted-foreground">Rejali vaqt</Label><Input className="bg-background border-border" type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} /></div>
              </TabsContent>
              <TabsContent value="ai" className="space-y-4 mt-4">
                <div className="space-y-1.5"><Label className="text-muted-foreground">AI prompt</Label><Textarea className="bg-background border-border min-h-[100px]" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="Qadoqlash sifati haqida post yozing..." /></div>
                <Button onClick={() => aiMutation.mutate({ prompt: aiPrompt, platform: form.platform })} disabled={!aiPrompt || aiMutation.isPending} className="w-full bg-primary text-white font-bold h-11" data-testid="button-ai-generate">
                  <Sparkles className="h-4 w-4 mr-2" />{aiMutation.isPending ? "Yaratilmoqda..." : "AI bilan yaratish"}
                </Button>
              </TabsContent>
            </Tabs>
            <Button onClick={handleSubmit} disabled={!form.title || !form.body || createMutation.isPending || updateMutation.isPending} className="w-full mt-6 bg-primary text-white font-bold h-11" data-testid="button-submit-content">
              {editId ? "Saqlash" : "Yaratish"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card rounded-lg p-5 border-none text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Jami</p>
          <p className="text-4xl font-bold tracking-tight text-foreground">{stats.total}</p>
        </Card>
        <Card className="bg-card rounded-lg p-5 border-none text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Nashr</p>
          <p className="text-4xl font-bold tracking-tight text-[var(--ep-green)]">{stats.published}</p>
        </Card>
        <Card className="bg-card rounded-lg p-5 border-none text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Rejada</p>
          <p className="text-4xl font-bold tracking-tight text-primary">{stats.scheduled}</p>
        </Card>
        <Card className="bg-card rounded-lg p-5 border-none text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Qoralama</p>
          <p className="text-4xl font-bold tracking-tight text-muted-foreground">{stats.draft}</p>
        </Card>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44 bg-card border-none h-9" data-testid="select-status-filter"><SelectValue placeholder="Holat" /></SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">Barchasi</SelectItem>
            {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="w-44 bg-card border-none h-9" data-testid="select-platform-filter"><SelectValue placeholder="Platforma" /></SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">Barchasi</SelectItem>
            {Object.entries(platformLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card className="bg-card border-none"><CardContent className="p-12 text-center text-muted-foreground">Kontent topilmadi</CardContent></Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {(Array.isArray(filtered) ? filtered : []).map((c) => {
            const StatusIcon = statusIcons[c.status] || FileText;
            return (
              <Card key={c.id} className="bg-card border-none shadow-sm hover:shadow-md transition-shadow overflow-hidden" data-testid={`card-content-${c.id}`}>
                <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 p-5">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-[14px] font-semibold font-bold text-foreground truncate">{c.title}</CardTitle>
                    <p className={`text-xs font-semibold mt-1.5 ${platformColors[c.platform] || "text-muted-foreground"}`}>
                      {platformLabels[c.platform] || c.platform}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {c.status === "draft" && (
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-primary hover:bg-primary/5 no-default-hover-elevate" onClick={() => publishMutation.mutate(c.id)} data-testid={`button-publish-${c.id}`}>
                        <Send className="h-4 w-4" />
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted no-default-hover-elevate" onClick={() => handleEdit(c)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50 no-default-hover-elevate" onClick={() => setDeleteId(c.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </CardHeader>
                <CardContent className="px-5 pb-5 pt-0">
                  {c.body && <p className="text-sm text-muted-foreground line-clamp-3 mb-4 leading-relaxed">{c.body}</p>}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="border-border text-foreground rounded-full px-2 py-0.5 text-[10px] font-bold no-default-hover-elevate"><StatusIcon className="h-3 w-3 mr-1" />{statusLabels[c.status] || c.status}</Badge>
                    {c.isAiGenerated && <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5 rounded-full px-2 py-0.5 text-[10px] font-bold no-default-hover-elevate"><Sparkles className="h-3 w-3 mr-1" />AI</Badge>}
                    {c.scheduledAt && <Badge variant="outline" className="border-border text-muted-foreground rounded-full px-2 py-0.5 text-[10px] font-bold no-default-hover-elevate"><Calendar className="h-3 w-3 mr-1" />{new Date(c.scheduledAt).toLocaleDateString("uz-UZ")}</Badge>}
                    {Array.isArray(c.hashtags) && c.hashtags.slice(0, 3).map((h, i) => (
                      <Badge key={`k-${i}`} variant="secondary" className="bg-muted/60 text-muted-foreground text-[10px] rounded-full px-2 py-0.5 font-bold no-default-hover-elevate">{h}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => { if (!v) setDeleteId(null); }}
        title="Kontentni o'chirish"
        description="Ushbu kontent postni o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi."
        confirmText="O'chirish"
        variant="destructive"
        onConfirm={() => { if (deleteId) { deleteMutation.mutate(deleteId); setDeleteId(null); } }}
      />
    </div>
  );
}
