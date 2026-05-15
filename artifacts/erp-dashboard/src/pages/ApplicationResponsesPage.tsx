/**
 * @module ApplicationResponsesPage
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ModulePage } from "@/components/ui/module-page";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Search } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { EPErrorState } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
interface ApplicationResponse {
  id: string | number;
  application_id?: string | number;
  applicationId?: string | number;
  responder_name?: string;
  responderName?: string;
  response_type?: string;
  responseType?: string;
  content?: string;
  body?: string;
  status?: string;
  is_read?: boolean;
  isRead?: boolean;
  created_at?: string;
  createdAt?: string;
  candidate_name?: string;
  candidateName?: string;
  position?: string;
}

const RESPONSE_TYPE_LABELS: Record<string, string> = {
  invitation:  "Taklif",
  rejection:   "Rad etish",
  offer:       "Taklif xati",
  interview:   "Intervyu",
  feedback:    "Fikr-mulohaza",
  information: "Ma'lumot",
};

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  sent:    { label: "Yuborildi",  variant: "default"   },
  draft:   { label: "Qoralama",   variant: "outline"   },
  read:    { label: "O'qildi",    variant: "secondary" },
  replied: { label: "Javob berildi", variant: "default" },
};

export default function ApplicationResponsesPage() {
  const { t } = useTranslation("common");
  const [applicationId, setApplicationId] = useState("");
  const [searched, setSearched]           = useState("");

  const { data: rawData, isLoading, isError, error, refetch } = useQuery<
    ApplicationResponse[] | { data?: ApplicationResponse[]; total?: number }
  >({
    queryKey: ["/api/application-responses", searched],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "50" });
      if (searched) params.set("applicationId", searched);
      return await apiRequest("GET", `/api/application-responses?${params}`);
    },
  });

  const responses: ApplicationResponse[] = Array.isArray(rawData)
    ? rawData
    : (rawData as { data?: ApplicationResponse[] })?.data ?? [];

  if (isError) return <EPErrorState onRetry={refetch}  error={error} />;

  return (
    <ModulePage
      module="hr"
      title={t("arizaJavoblari")}
      icon={<MessageSquare className="h-5 w-5" />}
    >
      <div className="space-y-4">
        <div className="flex gap-2 max-w-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("arizaId")}
              value={applicationId}
              onChange={e => setApplicationId(e.target.value)}
              onKeyDown={e => e.key === "Enter" && setSearched(applicationId)}
              className="pl-9"
              data-testid="input-application-id"
            />
          </div>
          <Button onClick={() => setSearched(applicationId)} data-testid="button-search">
            {t("search")}
          </Button>
          {searched && (
            <Button variant="outline" onClick={() => { setSearched(""); setApplicationId(""); }}>
              {t("tozalash")}
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={`k-${i}`}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48 rounded-lg" />
                    <Skeleton className="h-3 w-64 rounded-lg" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-lg" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : responses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searched ? `#${searched} uchun javoblar topilmadi` : "Barcha ariza javoblarini ko'rish uchun ariza ID kiriting"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {responses.map(r => {
              const rType   = r.response_type ?? r.responseType ?? "information";
              const status  = r.status ?? (r.is_read ?? r.isRead ? "read" : "sent");
              const sc      = STATUS_MAP[status] ?? STATUS_MAP.sent;
              const content = r.content ?? r.body ?? "";
              const by      = r.responder_name ?? r.responderName;
              const createdAt = r.created_at ?? r.createdAt;
              const candName = r.candidate_name ?? r.candidateName;
              return (
                <Card key={r.id} className="hover:shadow-md transition-shadow" data-testid={`card-response-${r.id}`}>
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">
                          {RESPONSE_TYPE_LABELS[rType] ?? rType}
                          {candName && ` — ${candName}`}
                        </p>
                        <Badge variant={sc.variant} className="text-xs">{sc.label}</Badge>
                        {r.position && (
                          <Badge variant="outline" className="text-xs">{r.position}</Badge>
                        )}
                      </div>
                      {content && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{content}</p>
                      )}
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                        {by && <span>Yuborgan: {by}</span>}
                        {r.application_id ?? r.applicationId ? (
                          <span>Ariza #{r.application_id ?? r.applicationId}</span>
                        ) : null}
                        {createdAt && (
                          <span>{new Date(createdAt).toLocaleString("uz-UZ", { dateStyle: "short", timeStyle: "short" })}</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </ModulePage>
  );
}
