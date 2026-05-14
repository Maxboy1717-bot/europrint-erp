/**
 * @module Adaptation
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Users, FileText, PartyPopper, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AdaptationProgram, WelcomeEvent } from "@shared/schema";
import { ProgramsTab } from "./adaptation/ProgramsTab";
import { NewEmployeesTab } from "./adaptation/NewEmployeesTab";
import { FeedbackTab } from "./adaptation/FeedbackTab";
import { WelcomeEventsTab } from "./adaptation/WelcomeEventsTab";
import { EPErrorState } from "@/components/ep";

interface NewEmployeeResponse {
  id: string;
  userId: string;
  programId?: string | null;
  mentorId?: string | null;
  startDate: string;
  endDate?: string | null;
  status: string;
  progress: number;
  currentPhase?: string | null;
  notes?: string | null;
  tasksCompleted?: unknown;
  employeeName: string;
  employeeDepartment?: string;
  employeePosition?: string;
  programTitle?: string;
  mentorName?: string;
}

interface FeedbackResponse {
  id: string;
  newEmployeeId: string;
  feedbackType: string;
  scheduledDate: string;
  completedDate?: string | null;
  rating?: number | null;
  satisfactionLevel?: string | null;
  strengths?: string | null;
  weaknesses?: string | null;
  suggestions?: string | null;
  employeeFeedback?: string | null;
  mentorFeedback?: string | null;
  status: string;
  actionItems?: unknown;
  conductedBy?: string | null;
  employeeName: string;
}

interface UserItem {
  id: string;
  fullName: string;
  phone?: string;
}

interface DepartmentItem {
  id: string;
  name: string;
}

interface PositionItem {
  id: string;
  name: string;
}

export default function Adaptation() {
  const [activeTab, setActiveTab] = useState("programs");

  const { data: programs = [], isLoading: isLoadingPrograms, isError, refetch} = useQuery<AdaptationProgram[]>({
    queryKey: ["/api/adaptation/programs"],
  });

  const { data: newEmployees = [], isLoading: isLoadingEmployees } = useQuery<NewEmployeeResponse[]>({
    queryKey: ["/api/adaptation/new-employees"],
  });

  const { data: feedbacks = [], isLoading: isLoadingFeedbacks } = useQuery<FeedbackResponse[]>({
    queryKey: ["/api/adaptation/feedback"],
  });

  const { data: events = [], isLoading: isLoadingEvents } = useQuery<WelcomeEvent[]>({
    queryKey: ["/api/adaptation/welcome-events"],
  });

  const { data: users = [] } = useQuery<UserItem[]>({ queryKey: ["/api/users"] });
  const { data: departments = [] } = useQuery<DepartmentItem[]>({ queryKey: ["/api/departments"] });
  const { data: positions = [] } = useQuery<PositionItem[]>({ queryKey: ["/api/positions"] });

  const isLoading = isLoadingPrograms || isLoadingEmployees || isLoadingFeedbacks || isLoadingEvents;

  if (isError) {
    return <EPErrorState onRetry={refetch} />;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
        <div>
          <Skeleton className="h-9 w-48 rounded-lg" />
          <Skeleton className="h-5 w-96 mt-2 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-full max-w-2xl rounded-lg" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 rounded-lg" />
            <Skeleton className="h-4 w-64 mt-2 rounded-lg" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {([1, 2, 3, 4, 5]).map((i) => (
                <Skeleton key={`k-${i}`} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="ep-h1">Adaptatsiya</h1>
          <p className="text-muted-foreground">
            Yangi xodimlarni kompaniyaga moslashtirishni boshqarish
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Yangilash
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 lg:grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="programs" data-testid="tab-programs">
            <FileText className="w-4 h-4 mr-2" />
            Dasturlar
          </TabsTrigger>
          <TabsTrigger value="employees" data-testid="tab-employees">
            <Users className="w-4 h-4 mr-2" />
            Yangi xodimlar
          </TabsTrigger>
          <TabsTrigger value="feedback" data-testid="tab-feedback">
            <Calendar className="w-4 h-4 mr-2" />
            Feedbacklar
          </TabsTrigger>
          <TabsTrigger value="events" data-testid="tab-events">
            <PartyPopper className="w-4 h-4 mr-2" />
            Tadbirlar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="programs">
          <ProgramsTab programs={programs} departments={departments} positions={positions} />
        </TabsContent>

        <TabsContent value="employees">
          <NewEmployeesTab
            employees={newEmployees}
            programs={programs}
            users={users}
          />
        </TabsContent>

        <TabsContent value="feedback">
          <FeedbackTab feedbacks={feedbacks} employees={newEmployees} />
        </TabsContent>

        <TabsContent value="events">
          <WelcomeEventsTab events={events} users={users} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
