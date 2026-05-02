import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, Lock, TrendingUp, Clock, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface LearningStep {
  id: string;
  title: string;
  type: "course" | "test" | "certificate" | "skill";
  status: "completed" | "in_progress" | "locked" | "available";
  progress?: number;
  duration?: string;
  score?: number;
  earnedAt?: string;
}

interface LearningPathProps {
  userId: string;
  userName: string;
  position: string;
  steps: LearningStep[];
  overallProgress: number;
}

export function LearningPathVisualization({ userId, userName, position, steps, overallProgress }: LearningPathProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />;
      case "in_progress":
        return <Circle className="h-5 w-5 text-primary animate-pulse" />;
      case "locked":
        return <Lock className="h-5 w-5 text-muted-foreground" />;
      case "available":
        return <Circle className="h-5 w-5 text-muted-foreground" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "border-green-500 bg-green-500/10";
      case "in_progress":
        return "border-primary bg-primary/10 shadow-lg shadow-primary/20";
      case "locked":
        return "border-muted bg-muted/20";
      case "available":
        return "border-border bg-card";
      default:
        return "border-border bg-card";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "course":
        return "Kurs";
      case "test":
        return "Test";
      case "certificate":
        return "Sertifikat";
      case "skill":
        return "Ko'nikma";
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "course":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      case "test":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
      case "certificate":
        return "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20";
      case "skill":
        return "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20";
      default:
        return "bg-muted/10 text-muted-foreground border-muted/20";
    }
  };

  return (
    <Card className="backdrop-blur-sm bg-card/60">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl">{userName} - O'quv yo'li</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{position}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary">{overallProgress}%</div>
            <div className="text-xs text-muted-foreground">Umumiy progress</div>
          </div>
        </div>
        <Progress value={overallProgress} className="mt-4" />
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Vertical Timeline Line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

          {/* Learning Steps */}
          <div className="space-y-6">
            {(Array.isArray(steps) ? steps : []).map((step, index) => (
              <div key={step.id} className="relative flex gap-4 group">
                {/* Timeline Node */}
                <div className={cn(
                  "relative z-10 flex items-center justify-center h-12 w-12 rounded-full border-2 bg-background transition-all",
                  getStatusColor(step.status)
                )}>
                  {getStatusIcon(step.status)}
                </div>

                {/* Step Card */}
                <Card className={cn(
                  "flex-1 transition-all hover-elevate",
                  step.status === "in_progress" && "ring-2 ring-primary/30"
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold">{step.title}</h4>
                          <Badge variant="outline" className={getTypeColor(step.type)}>
                            {getTypeLabel(step.type)}
                          </Badge>
                          {step.status === "completed" && step.score && (
                            <Badge variant="default" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                              <Award className="h-3 w-3 mr-1" />
                              {step.score}%
                            </Badge>
                          )}
                        </div>

                        {step.progress !== undefined && step.status === "in_progress" && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Jarayon</span>
                              <span className="font-medium">{step.progress}%</span>
                            </div>
                            <Progress value={step.progress} className="h-1.5" />
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {step.duration && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {step.duration}
                            </div>
                          )}
                          {step.earnedAt && (
                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              {new Date(step.earnedAt).toLocaleDateString("uz")}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Step Number */}
                      <div className="text-right">
                        <div className="text-2xl font-bold text-muted-foreground/30">
                          {String(index + 1).padStart(2, "0")}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {(Array.isArray(steps) ? steps : []).filter(s => s.status === "completed").length}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Yakunlangan</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {(Array.isArray(steps) ? steps : []).filter(s => s.status === "in_progress").length}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Jarayonda</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-muted-foreground">
              {(Array.isArray(steps) ? steps : []).filter(s => s.status === "available" || s.status === "locked").length}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Qolgan</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
