/**
 * @module HRAIDashboardDialogs
 * @description Dialog/task-execution panel components for HRAIDashboard.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Send } from "lucide-react";
import { taskTypes } from "./HRAIDashboardTypes";

import { useTranslation } from '@/lib/i18n';
import { EPLoader } from "@/components/ep";
// ─── Task Form ───────────────────────────────────────────────────────────────

interface TaskFormProps {
  selectedTask: string;
  formData: Record<string, string>;
  onFormChange: (data: Record<string, string>) => void;
}

export function TaskForm({selectedTask, formData, onFormChange }: TaskFormProps) {
  const { t } = useTranslation('common');
  switch (selectedTask) {
    case "resume-parse":
      return (
        <div className="space-y-3">
          <label className="text-sm font-medium">{t('resumeMatni')}</label>
          <Textarea
            data-testid="input-resume-text"
            placeholder="Resume matnini kiriting..."
            value={formData.resumeText || ""}
            onChange={(e) => onFormChange({ ...formData, resumeText: e.target.value })}
            className="min-h-[120px]"
          />
        </div>
      );

    case "quiz-generate":
      return (
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Mavzu</label>
            <Input
              data-testid="input-topic"
              placeholder="Mavzuni kiriting"
              value={formData.topic || ""}
              onChange={(e) => onFormChange({ ...formData, topic: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Savollar soni</label>
            <Input
              data-testid="input-question-count"
              type="number"
              placeholder="10"
              value={formData.questionCount || ""}
              onChange={(e) => onFormChange({ ...formData, questionCount: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Qiyinlik darajasi</label>
            <Select
              value={formData.difficulty || ""}
              onValueChange={(val) => onFormChange({ ...formData, difficulty: val })}
            >
              <SelectTrigger data-testid="select-difficulty" className="h-9">
                <SelectValue placeholder="Tanlang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Oson</SelectItem>
                <SelectItem value="medium">O'rta</SelectItem>
                <SelectItem value="hard">Qiyin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );

    case "job-description":
      return (
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Lavozim nomi</label>
            <Input
              data-testid="input-job-title"
              placeholder="Lavozim nomini kiriting"
              value={formData.title || ""}
              onChange={(e) => onFormChange({ ...formData, title: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Bo'lim</label>
            <Input
              data-testid="input-department"
              placeholder="Bo'lim nomini kiriting"
              value={formData.department || ""}
              onChange={(e) => onFormChange({ ...formData, department: e.target.value })}
            />
          </div>
        </div>
      );

    case "salary-validation":
      return (
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Lavozim</label>
            <Input
              data-testid="input-position"
              placeholder="Lavozim"
              value={formData.position || ""}
              onChange={(e) => onFormChange({ ...formData, position: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Tajriba (yil)</label>
            <Input
              data-testid="input-experience"
              type="number"
              placeholder="3"
              value={formData.experience || ""}
              onChange={(e) => onFormChange({ ...formData, experience: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Hudud</label>
            <Input
              data-testid="input-region"
              placeholder="Toshkent"
              value={formData.region || ""}
              onChange={(e) => onFormChange({ ...formData, region: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Joriy maosh</label>
            <Input
              data-testid="input-current-salary"
              type="number"
              placeholder="5000000"
              value={formData.currentSalary || ""}
              onChange={(e) => onFormChange({ ...formData, currentSalary: e.target.value })}
            />
          </div>
        </div>
      );

    default:
      return (
        <div className="space-y-3">
          <label className="text-sm font-medium">Ma'lumot</label>
          <Textarea
            data-testid="input-generic-text"
            placeholder="Ma'lumotni kiriting..."
            value={formData.text || ""}
            onChange={(e) => onFormChange({ ...formData, text: e.target.value })}
            className="min-h-[120px]"
          />
        </div>
      );
  }
}

// ─── Task Execution Panel ────────────────────────────────────────────────────

interface TaskExecutionPanelProps {
  selectedTask: string;
  formData: Record<string, string>;
  taskLanguage: string;
  taskResult: string | null;
  isSubmitting: boolean;
  onFormChange: (data: Record<string, string>) => void;
  onLanguageChange: (lang: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export function TaskExecutionPanel({
  selectedTask,
  formData,
  taskLanguage,
  taskResult,
  isSubmitting,
  onFormChange,
  onLanguageChange,
  onSubmit,
  onClose,
}: TaskExecutionPanelProps) {
  return (
    <Card className="mt-6" data-testid="card-task-execution">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>
            {(Array.isArray(taskTypes) ? taskTypes : []).find(t => t.key === selectedTask)?.label || selectedTask}
          </CardTitle>
          <Button size="icon" variant="ghost" onClick={onClose} data-testid="button-close-task">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <TaskForm selectedTask={selectedTask} formData={formData} onFormChange={onFormChange} />

        <div>
          <label className="text-sm font-medium">Til</label>
          <Select value={taskLanguage} onValueChange={onLanguageChange}>
            <SelectTrigger data-testid="select-language" className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="uz">O'zbekcha</SelectItem>
              <SelectItem value="ru">Ruscha</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={onSubmit} disabled={isSubmitting} data-testid="button-submit-task">
          {isSubmitting ? (
            <EPLoader className="mr-2" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Yuborish
        </Button>

        {taskResult && (
          <div className="mt-4 p-4 rounded-md border bg-muted/30" data-testid="text-task-result">
            <pre className="text-sm whitespace-pre-wrap break-words">{taskResult}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
