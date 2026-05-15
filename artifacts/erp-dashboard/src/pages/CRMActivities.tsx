/**
 * @module CRMActivities
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DialogTrigger } from "@/components/ui/dialog";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import { Plus, Search } from "lucide-react";
import {
  type Activity,
  type Deal,
  type Contact,
  type NewActivityState,
  INITIAL_NEW_ACTIVITY,
  activityTypes,
} from "./CRMActivitiesTypes";
import { PendingActivitiesSection, CompletedActivitiesSection } from "./CRMActivitiesSections";
import { CreateActivityDialog } from "./CRMActivitiesDialogs";
import { EPErrorState, EPPageHeader } from "@/components/ep";

export default function CRMActivities() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newActivity, setNewActivity] = useState<NewActivityState>(INITIAL_NEW_ACTIVITY);

  const { toast } = useToast();
  const { t } = useTranslation("crm");
  const { t: tCommon } = useTranslation('common');

  const { data: activities, isLoading, isError, error, refetch } = useQuery<Activity[]>({
    queryKey: ["/api/crm/activities"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const { data: deals } = useQuery<Deal[]>({
    queryKey: ["/api/crm/deals"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const { data: contacts } = useQuery<Contact[]>({
    queryKey: ["/api/crm/contacts"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const createActivityMutation = useMutation({
    mutationFn: async (data: NewActivityState) => {
      return apiRequest("POST", "/api/crm/activities", {
        ...data,
        dealId:      data.dealId      ? parseInt(data.dealId)      : null,
        contactId:   data.contactId   ? parseInt(data.contactId)   : null,
        scheduledAt: data.scheduledAt || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/activities"] });
      setIsCreateOpen(false);
      setNewActivity(INITIAL_NEW_ACTIVITY);
      toast({ title: t("activityCreated") });
    },
    onError: () => {
      toast({ title: tCommon("error"), description: t("activityCreateError"), variant: "destructive" });
    },
  });

  const completeActivityMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("PATCH", `/api/crm/activities/${id}`, {
        status: "completed",
        completedAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/activities"] });
      toast({ title: t("activityCompleted") });
    },
  });

  const cancelActivityMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("PATCH", `/api/crm/activities/${id}`, { status: "cancelled" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/activities"] });
      toast({ title: t("activityCancelled") });
    },
  });

  const filteredActivities = (Array.isArray(activities) ? activities : []).filter((activity) => {
    const matchesSearch = activity.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType   = activeTab === "all" || activity.type === activeTab;
    return matchesSearch && matchesType;
  });

  const pendingActivities   = filteredActivities.filter(a => a.status === "pending" || a.status === "in_progress");
  const completedActivities = filteredActivities.filter(a => a.status === "completed");

  if (isError)   return <EPErrorState onRetry={refetch}  error={error} />;
  if (isLoading) return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-4">
      <Skeleton className="h-10 w-full rounded-lg" />
      <div className="grid gap-4">
        {([1, 2, 3, 4, 5]).map((i) => <Skeleton key={`k-${i}`} className="h-24 w-full rounded-lg" />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 min-h-full" data-testid="crm-activities-page">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("crmFaoliyatlar")}</b></>}
        title={t("crmFaoliyatlar")}
        subtitle={t("activitiesSubtitle")}
      />
        </div>
        <div className="flex items-center gap-2">
          <Button
            data-testid="button-create-activity"
            className="bg-primary text-white rounded-lg px-5 py-2.5 text-sm font-semibold"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            {t("newActivity")}
          </Button>
        </div>
      </div>

      <CreateActivityDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        newActivity={newActivity}
        onActivityChange={setNewActivity}
        deals={deals}
        createActivityMutation={createActivityMutation}
        t={t}
        tCommon={tCommon}
      />

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={tCommon("search") + "..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-activities"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all">
            {t("allActivities")} ({filteredActivities.length})
          </TabsTrigger>
          {(Array.isArray(activityTypes) ? activityTypes : []).map((type) => {
            const Icon  = type.icon;
            const count = (Array.isArray(activities) ? activities : []).filter(a => a.type === type.value).length;
            return (
              <TabsTrigger key={type.value} value={type.value} data-testid={`tab-${type.value}`}>
                <Icon className="h-4 w-4 mr-1" />
                {t(type.labelKey)} ({count})
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <div className="grid gap-6 md:grid-cols-2">
            <PendingActivitiesSection
              pendingActivities={pendingActivities}
              completeActivityMutation={completeActivityMutation}
              cancelActivityMutation={cancelActivityMutation}
              t={t}
            />
            <CompletedActivitiesSection
              completedActivities={completedActivities}
              t={t}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
