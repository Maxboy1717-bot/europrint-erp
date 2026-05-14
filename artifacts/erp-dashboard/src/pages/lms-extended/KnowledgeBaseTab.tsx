/**
 * @module KnowledgeBaseTab
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, RefreshCw } from "lucide-react";
import { EPStatusPill } from "@/components/ep";

export function KnowledgeBaseTab() {
  const [kbSearch, setKbSearch] = useState("");
  const [kbCategory, setKbCategory] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<Record<string, unknown> | null>(null);

  const { data: kbArticles = [], isLoading: kbLoading, refetch: refetchKb } = useQuery<Record<string, unknown>[]>({
    queryKey: ["/api/lms-knowledge"],
  });

  const filteredKb = (Array.isArray(kbArticles) ? kbArticles : []).filter((a: Record<string, unknown>) => {
    const matchSearch = !kbSearch || String(a.title ?? "").toLowerCase().includes(kbSearch.toLowerCase());
    const matchCat = !kbCategory || a.category === kbCategory;
    return matchSearch && matchCat;
  });

  const kbCategories = Array.from(new Set((Array.isArray(kbArticles) ? kbArticles : []).map((a: Record<string, unknown>) => String(a.category ?? "")).filter(Boolean)));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-semibold">Bilim Bazasi</h2>
        <Button variant="outline" size="sm" onClick={() => refetchKb()}><RefreshCw className="h-3.5 w-3.5 mr-1.5" />Yangilash</Button>
      </div>
      <div className="flex gap-2 flex-wrap">
        <Input data-testid="input-kb-search" placeholder="Qidirish..." value={kbSearch} onChange={e => setKbSearch(e.target.value)} className="max-w-xs" />
        <Select value={kbCategory || "all"} onValueChange={v => setKbCategory(v === "all" ? "" : v)}>
          <SelectTrigger className="w-40 h-9" data-testid="select-kb-category"><SelectValue placeholder="Kategoriya" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barchasi</SelectItem>
            {(Array.isArray(kbCategories) ? kbCategories : []).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {kbLoading ? (
        <div className="space-y-2">{([1,2,3]).map(i => <Card key={`k-${i}`}><CardContent className="py-4 h-16" /></Card>)}</div>
      ) : filteredKb.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Bilim bazasi bo'sh. {kbSearch ? "Boshqa kalit so'z kiriting." : "Maqolalar tez orada qo'shiladi."}</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {(Array.isArray(filteredKb) ? filteredKb : []).map((article: Record<string, unknown>, idx: number) => (
            <Card key={String(article.id ?? idx)} className="hover-elevate cursor-pointer" data-testid={`card-kb-${String(article.id ?? idx)}`} onClick={() => setSelectedArticle(article)}>
              <CardContent className="py-3 px-4">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <p className="font-medium">{String(article.title ?? "")}</p>
                    {!!article.title_ru && <p className="text-xs text-muted-foreground">{String(article.title_ru)}</p>}
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {!!article.category && <EPStatusPill tone="neutral" className="text-xs">{String(article.category)}</EPStatusPill>}
                    {Array.isArray(article.tags) && article.tags.slice(0, 2).map((tag: string, ti: number) => (
                      <Badge key={ti} variant="outline" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Dialog open={!!selectedArticle} onOpenChange={() => setSelectedArticle(null)}>
        <DialogContent className="max-w-2xl p-6">
          <DialogHeader><DialogTitle className="text-[18px] font-semibold">{String(selectedArticle?.title ?? "")}</DialogTitle></DialogHeader>
          <div className="prose prose-sm max-w-none">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{String(selectedArticle?.content ?? "Kontent mavjud emas")}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
