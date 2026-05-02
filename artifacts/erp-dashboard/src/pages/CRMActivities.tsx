import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import { 
  Phone, 
  Calendar, 
  CheckSquare, 
  Mail, 
  Video, 
  Plus, 
  Search, 
  Clock, 
  User, 
  Building2,
  Check,
  X,
  Filter
} from "lucide-react";
import { format } from "date-fns";
import { ErrorState } from "@/components/ui/error-state";

interface Activity {
  id: number;
  type: string;
  subject: string;
  description: string | null;
  status: string;
  priority: string;
  dealId: number | null;
  contactId: number | null;
  companyId: number | null;
  assignedById: string | null;
  scheduledAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

interface Deal {
  id: number;
  title: string;
}

interface Contact {
  id: number;
  name: string;
}

const activityTypes = [
  { value: "call", labelKey: "callType", icon: Phone, color: "bg-blue-500" },
  { value: "meeting", labelKey: "meetingType", icon: Calendar, color: "bg-green-500" },
  { value: "task", labelKey: "taskType", icon: CheckSquare, color: "bg-orange-500" },
  { value: "email", labelKey: "emailType", icon: Mail, color: "bg-purple-500" },
  { value: "video", labelKey: "videoCallType", icon: Video, color: "bg-red-500" },
];

const priorityColors: Record<string, string> = {
  low: "bg-gray-500",
  medium: "bg-yellow-500",
  high: "bg-orange-500",
  urgent: "bg-red-500",
};

export default function CRMActivities() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation('crm');
  const { t: tCommon } = useTranslation('common');

  const [newActivity, setNewActivity] = useState({
    type: "call",
    subject: "",
    description: "",
    priority: "medium",
    dealId: "",
    contactId: "",
    scheduledAt: "",
  });

  const { data: activities, isLoading, isError, refetch} = useQuery<Activity[]>({
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
    mutationFn: async (data: typeof newActivity) => {
      return apiRequest("POST", "/api/crm/activities", {
        ...data,
        dealId: data.dealId ? parseInt(data.dealId) : null,
        contactId: data.contactId ? parseInt(data.contactId) : null,
        scheduledAt: data.scheduledAt || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/activities"] });
      setIsCreateOpen(false);
      setNewActivity({
        type: "call",
        subject: "",
        description: "",
        priority: "medium",
        dealId: "",
        contactId: "",
        scheduledAt: "",
      });
      toast({ title: t("activityCreated") });
    },
    onError: () => {
      toast({ 
        title: tCommon("error"), 
        description: t("activityCreateError"),
        variant: "destructive" 
      });
    },
  });

  const completeActivityMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("PATCH", `/api/crm/activities/${id}`, { 
        status: "completed",
        completedAt: new Date().toISOString()
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

  const filteredActivities = activities?.filter((activity) => {
    const matchesSearch = activity.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = activeTab === "all" || activity.type === activeTab;
    return matchesSearch && matchesType;
  }) || [];

  const pendingActivities = (Array.isArray(filteredActivities) ? filteredActivities : []).filter(a => a.status === "pending" || a.status === "in_progress");
  const completedActivities = (Array.isArray(filteredActivities) ? filteredActivities : []).filter(a => a.status === "completed");

  const getActivityIcon = (type: string) => {
    const actType = (activityTypes ?? []).find(t => t.value === type);
    return actType?.icon || CheckSquare;
  };

  const getActivityColor = (type: string) => {
    const actType = (activityTypes ?? []).find(t => t.value === type);
    return actType?.color || "bg-gray-500";
  };

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid gap-4">
          {([1, 2, 3, 4, 5]).map((i) => (
            <Skeleton key={`k-${i}`} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-surface min-h-full" data-testid="crm-activities-page">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-light tracking-tight text-on-surface" data-testid="text-page-title">
            CRM <span className="font-bold text-primary">Faoliyatlar</span>
          </h1>
          <p className="text-on-surface-variant">
            {t("activitiesSubtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-activity" className="bg-gradient-to-br from-primary to-primary-dim text-white rounded-lg px-5 py-2.5 text-sm font-semibold">
                <Plus className="h-4 w-4 mr-2" />
                {t("newActivity")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("createActivity")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>{tCommon("type")}</Label>
                  <Select 
                    value={newActivity.type} 
                    onValueChange={(v) => setNewActivity({...newActivity, type: v})}
                  >
                    <SelectTrigger data-testid="select-activity-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Array.isArray(activityTypes) ? activityTypes : []).map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {t(type.labelKey)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("subject")}</Label>
                  <Input
                    value={newActivity.subject}
                    onChange={(e) => setNewActivity({...newActivity, subject: e.target.value})}
                    placeholder={t("activitySubject")}
                    data-testid="input-activity-subject"
                  />
                </div>
                <div>
                  <Label>{tCommon("description")}</Label>
                  <Textarea
                    value={newActivity.description}
                    onChange={(e) => setNewActivity({...newActivity, description: e.target.value})}
                    placeholder={t("additionalInfo")}
                    data-testid="input-activity-description"
                  />
                </div>
                <div>
                  <Label>{tCommon("priority")}</Label>
                  <Select 
                    value={newActivity.priority} 
                    onValueChange={(v) => setNewActivity({...newActivity, priority: v})}
                  >
                    <SelectTrigger data-testid="select-activity-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">{tCommon("low")}</SelectItem>
                      <SelectItem value="medium">{tCommon("medium")}</SelectItem>
                      <SelectItem value="high">{tCommon("high")}</SelectItem>
                      <SelectItem value="urgent">{t("urgentPriority")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("deal")}</Label>
                  <Select 
                    value={newActivity.dealId} 
                    onValueChange={(v) => setNewActivity({...newActivity, dealId: v})}
                  >
                    <SelectTrigger data-testid="select-activity-deal">
                      <SelectValue placeholder={tCommon("select")} />
                    </SelectTrigger>
                    <SelectContent>
                      {deals?.map((deal) => (
                        <SelectItem key={deal.id} value={deal.id.toString()}>
                          {deal.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("scheduledTime")}</Label>
                  <Input
                    type="datetime-local"
                    value={newActivity.scheduledAt}
                    onChange={(e) => setNewActivity({...newActivity, scheduledAt: e.target.value})}
                    data-testid="input-activity-scheduled"
                  />
                </div>
                <Button 
                  onClick={() => createActivityMutation.mutate(newActivity)}
                  disabled={!newActivity.subject || createActivityMutation.isPending}
                  className="w-full"
                  data-testid="button-submit-activity"
                >
                  {createActivityMutation.isPending ? t("creating") : tCommon("create")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

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
            const Icon = type.icon;
            const count = activities?.filter(a => a.type === type.value).length || 0;
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  {t("pendingLabel")} ({pendingActivities.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {pendingActivities.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        {t("noActivities")}
                      </p>
                    ) : (
                      (Array.isArray(pendingActivities) ? pendingActivities : []).map((activity) => {
                        const Icon = getActivityIcon(activity.type);
                        return (
                          <Card key={activity.id} className="hover-elevate" data-testid={`card-activity-${activity.id}`}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                  <div className={`p-2 rounded-lg ${getActivityColor(activity.type)} text-white`}>
                                    <Icon className="h-4 w-4" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{activity.subject}</p>
                                    {activity.description && (
                                      <p className="text-sm text-muted-foreground line-clamp-2">
                                        {activity.description}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-2 mt-2">
                                      <Badge variant="outline" className={priorityColors[activity.priority]}>
                                        {activity.priority}
                                      </Badge>
                                      {activity.scheduledAt && (
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                          <Calendar className="h-3 w-3" />
                                          {format(new Date(activity.scheduledAt), "dd.MM.yyyy HH:mm")}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => completeActivityMutation.mutate(activity.id)}
                                    disabled={completeActivityMutation.isPending}
                                    data-testid={`button-complete-${activity.id}`}
                                  >
                                    <Check className="h-4 w-4 text-green-500" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => cancelActivityMutation.mutate(activity.id)}
                                    disabled={cancelActivityMutation.isPending}
                                    data-testid={`button-cancel-${activity.id}`}
                                  >
                                    <X className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  {t("completedActivities")} ({completedActivities.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {completedActivities.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        {t("noCompletedActivities")}
                      </p>
                    ) : (
                      (Array.isArray(completedActivities) ? completedActivities : []).map((activity) => {
                        const Icon = getActivityIcon(activity.type);
                        return (
                          <Card key={activity.id} className="opacity-75" data-testid={`card-activity-completed-${activity.id}`}>
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg ${getActivityColor(activity.type)} text-white opacity-50`}>
                                  <Icon className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate line-through">{activity.subject}</p>
                                  {activity.completedAt && (
                                    <span className="text-xs text-muted-foreground">
                                      {t("completedLabel")}: {format(new Date(activity.completedAt), "dd.MM.yyyy HH:mm")}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
