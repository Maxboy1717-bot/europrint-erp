import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Users, BookOpen, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface CourseCardProps {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  duration: string;
  enrolledCount: number;
  completionRate: number;
  isRequired?: boolean;
  moduleCount: number;
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
}

export function CourseCard({
  id,
  title,
  description,
  thumbnail,
  duration,
  enrolledCount,
  completionRate,
  isRequired = false,
  moduleCount,
  onEdit,
  onDelete,
  onView,
}: CourseCardProps) {
  return (
    <Card className="hover-elevate overflow-visible" data-testid={`card-course-${id}`}>
      {thumbnail && (
        <div className="aspect-video w-full overflow-hidden rounded-t-md bg-muted">
          <img 
            src={thumbnail} 
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <CardHeader className="space-y-0 pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg line-clamp-2">{title}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8 shrink-0"
                data-testid={`button-course-menu-${id}`}
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit} data-testid={`button-edit-course-${id}`}>
                <Edit2 className="w-4 h-4 mr-2" />
                Tahrirlash
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={onDelete} 
                className="text-destructive"
                data-testid={`button-delete-course-${id}`}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                O'chirish
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
          {description}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{duration}</span>
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            <span>{moduleCount} modul</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{enrolledCount}</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tugatish</span>
            <span className="font-medium">{completionRate}%</span>
          </div>
          <Progress value={completionRate} className="h-2" />
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-2 pt-0">
        {isRequired ? (
          <Badge className="bg-primary-container text-on-primary-container rounded-full px-2.5 py-0.5 text-xs font-semibold">Majburiy</Badge>
        ) : (
          <Badge className="bg-surface-container text-on-surface-variant rounded-full px-2.5 py-0.5 text-xs font-semibold">Ixtiyoriy</Badge>
        )}
        <Button 
          variant="outline" 
          size="sm"
          onClick={onView}
          data-testid={`button-view-course-${id}`}
        >
          Ko'rish
        </Button>
      </CardFooter>
    </Card>
  );
}
