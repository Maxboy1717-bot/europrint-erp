/**
 * @module BitrixActivityPanel
 * @description React UI component.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { BitrixActivityPanelProps, Activity, Comment, TimelineItem } from "./activity/types";
import { ActivityHeader } from "./activity/ActivityHeader";
import { CreateActivityForm } from "./activity/CreateActivityForm";
import { ActivityFeed } from "./activity/ActivityFeed";

export function BitrixActivityPanel({
  entityType,
  entityId,
  phone,
  email,
  onActivityCreated,
}: BitrixActivityPanelProps) {
  const [activeTab, setActiveTab] = useState("activity");
  const [timelineFilter, setTimelineFilter] = useState<"all" | "pending" | "completed">("all");

  // BE list endpoints filter by leadId/dealId (GET /api/crm/activities?leadId=… and
  // GET /api/crm/comments?leadId=…). The default queryFn would join the key array into the
  // path /api/crm/activities/lead/:id, which matches no route (404). Build the query-string URL
  // explicitly, mirroring DetailSheet's history/followup-activities queries; queryKey stays the
  // array so the activity/comment mutations' invalidations keep matching.
  // NOTE: entityType is lead/deal/contact/company at runtime (the prop type omits 'deal'); only
  // lead+deal have a BE filter today, so contact/company are not fetched (the BE list endpoints
  // lack an entity_type/entity_id filter — flagged for a separate decision).
  const et = entityType as string;
  const supported = et === "lead" || et === "deal";
  const idParam = et === "deal" ? "dealId" : "leadId";

  const { data: activities = [], isLoading: activitiesLoading } = useQuery<Activity[]>({
    queryKey: ["/api/crm/activities", entityType, entityId],
    queryFn: () => apiRequest("GET", `/api/crm/activities?${idParam}=${entityId}`),
    enabled: entityId != null && supported,
  });

  const { data: comments = [], isLoading: commentsLoading } = useQuery<Comment[]>({
    queryKey: ["/api/crm/comments", entityType, entityId],
    queryFn: () => apiRequest("GET", `/api/crm/comments?${idParam}=${entityId}`),
    enabled: entityId != null && supported,
  });

  // Build timeline
  const timeline: TimelineItem[] = [
    ...(Array.isArray(activities) ? activities : []).map((a) => ({
      id: a.id,
      type: (a.type === "call" ? "call" : "activity") as "call" | "activity",
      data: a,
      createdAt: a.createdAt,
    })),
    ...(Array.isArray(comments) ? comments : []).map((c) => ({
      id: c.id + 10000,
      type: "comment" as const,
      data: c,
      createdAt: c.createdAt,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const filteredTimeline = (Array.isArray(timeline) ? timeline : []).filter((item) => {
    if (timelineFilter === "all") return true;
    if (item.type === "comment") return true;
    const activity = item.data as Activity;
    if (timelineFilter === "pending") return !activity.completed;
    if (timelineFilter === "completed") return activity.completed;
    return true;
  });

  return (
    <Card className="h-full flex flex-col bg-card border-border overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <ActivityHeader 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          timelineFilter={timelineFilter}
          setTimelineFilter={setTimelineFilter}
        />

        <CardContent className="flex-1 overflow-hidden p-0 flex flex-col min-h-0">
          <div className="flex-none bg-background/50">
            <CreateActivityForm 
              activeTab={activeTab}
              entityType={entityType}
              entityId={entityId}
              phone={phone}
              email={email}
              onActivityCreated={onActivityCreated}
            />
          </div>

          <ActivityFeed 
            entityType={entityType}
            entityId={entityId}
            timeline={filteredTimeline}
            isLoading={activitiesLoading || commentsLoading}
          />
        </CardContent>
      </Tabs>
    </Card>
  );
}
