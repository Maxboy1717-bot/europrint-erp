/** @module ApplicationsDialogs @description Dialog components for the Applications page: review/approve/reject dialog. */

import { CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Application, ApplicationResponse, UserStub } from "./ApplicationsTypes";

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedResponse: ApplicationResponse | null;
  applications: Application[];
  users: UserStub[];
  reviewNotes: string;
  onReviewNotesChange: (val: string) => void;
  reviewResponse: string;
  onReviewResponseChange: (val: string) => void;
  assignedTo: string;
  onAssignedToChange: (val: string) => void;
  onAssign: (responseId: string, userId: string | null) => void;
  onApprove: () => void;
  onReject: () => void;
  isPending: boolean;
}

export function ReviewDialog({
  open,
  onOpenChange,
  selectedResponse,
  applications,
  users,
  reviewNotes,
  onReviewNotesChange,
  reviewResponse,
  onReviewResponseChange,
  assignedTo,
  onAssignedToChange,
  onAssign,
  onApprove,
  onReject,
  isPending,
}: ReviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">Arizani ko'rish</DialogTitle>
          <DialogDescription>
            Xodim tomonidan yuborilgan ariza tafsilotlari
          </DialogDescription>
        </DialogHeader>

        {selectedResponse && (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Javoblar:</h3>
              {(Array.isArray(selectedResponse.answers) ? selectedResponse.answers : []).map((ans, idx) => {
                const application = (Array.isArray(applications) ? applications : []).find(
                  (a) => a.id === selectedResponse.applicationId
                );
                const question = application?.questions?.find((q) => q.id === ans.questionId);
                return (
                  <div key={idx} className="mb-3 p-3 bg-muted rounded">
                    <p className="text-sm text-muted-foreground mb-1">
                      {question?.question || "Savol topilmadi"}
                    </p>
                    <p className="font-medium">{ans.answer}</p>
                  </div>
                );
              })}
            </div>

            <div className="space-y-1">
          <Label htmlFor="reviewNotes">Izohlar (ixtiyoriy, faqat HR ko'radi)</Label>
              <Textarea
                id="reviewNotes"
                value={reviewNotes}
                onChange={(e) => onReviewNotesChange(e.target.value)}
                placeholder="HR uchun eslatmalar..."
                rows={3}
                data-testid="textarea-review-notes"
              />
            </div>

            <div className="space-y-1">
          <Label htmlFor="reviewResponse">Xodimga javob (ixtiyoriy)</Label>
              <Textarea
                id="reviewResponse"
                value={reviewResponse}
                onChange={(e) => onReviewResponseChange(e.target.value)}
                placeholder="Xodimga ko'rinadigan javob yoki izoh..."
                rows={3}
                data-testid="textarea-review-response"
              />
            </div>

            <div className="space-y-1">
          <Label htmlFor="assignedTo">Mas'ul xodim (ixtiyoriy)</Label>
              <Select
                value={assignedTo}
                onValueChange={(value) => {
                  onAssignedToChange(value);
                  onAssign(selectedResponse.id, value === "none" ? null : value);
                }}
              >
                <SelectTrigger data-testid="select-assigned-to" className="h-9">
                  <SelectValue placeholder="Xodimni tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tanlangan xodim yo'q</SelectItem>
                  {(Array.isArray(users) ? users : []).map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.fullName} ({user.employeeId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="destructive"
                onClick={onReject}
                disabled={isPending}
                data-testid="button-reject-application"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Rad etish
              </Button>
              <Button
                onClick={onApprove}
                disabled={isPending}
                data-testid="button-approve-application"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Tasdiqlash
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
