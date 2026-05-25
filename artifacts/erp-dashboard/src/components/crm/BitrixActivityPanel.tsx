/**
 * @module BitrixActivityPanel
 * @description React UI component.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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

  const { data: activities = [], isLoading: activitiesLoading } = useQuery<Activity[]>({
    queryKey: ["/api/crm/activities", entityType, entityId],
  });

  const { data: comments = [], isLoading: commentsLoading } = useQuery<Comment[]>({
    queryKey: ["/api/crm/comments", entityType, entityId],
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
