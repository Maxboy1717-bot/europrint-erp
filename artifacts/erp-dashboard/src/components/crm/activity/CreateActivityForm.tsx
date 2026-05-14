/**
 * @module CreateActivityForm
 * @description React UI component.
 */

import { CallForm } from "./CallForm";
import { CommentForm } from "./CommentForm";
import { TaskForm } from "./TaskForm";
import { WhatsAppForm } from "./WhatsAppForm";
import { EmailForm } from "./EmailForm";
import { SlotsForm } from "./SlotsForm";
import { SmsForm } from "./SmsForm";

interface CreateActivityFormProps {
  entityType: string;
  entityId: number;
  phone?: string;
  email?: string;
  onActivityCreated?: () => void;
  activeTab: string;
}

export function CreateActivityForm({
  entityType,
  entityId,
  phone,
  email,
  onActivityCreated,
  activeTab,
}: CreateActivityFormProps) {
  if (activeTab === "activity") {
    return <CallForm entityType={entityType} entityId={entityId} onActivityCreated={onActivityCreated} />;
  }

  if (activeTab === "comment") {
    return <CommentForm entityType={entityType} entityId={entityId} />;
  }

  if (activeTab === "task") {
    return <TaskForm entityType={entityType} entityId={entityId} onActivityCreated={onActivityCreated} />;
  }

  if (activeTab === "whatsapp") {
    return <WhatsAppForm entityType={entityType} entityId={entityId} phone={phone} />;
  }

  if (activeTab === "sms") {
    return <SmsForm entityType={entityType} entityId={entityId} phone={phone} />;
  }

  if (activeTab === "email") {
    return <EmailForm entityType={entityType} entityId={entityId} email={email} />;
  }

  if (activeTab === "slots") {
    return <SlotsForm entityType={entityType} entityId={entityId} onActivityCreated={onActivityCreated} />;
  }

  return null;
}
