import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LeadForm } from "./quick-create/LeadForm";
import { DealForm } from "./quick-create/DealForm";

interface CrmUser {
  id: string;
  fullName: string;
}

interface CrmContact {
  id: number;
  name: string | null;
  lastName: string | null;
}

interface CrmCompany {
  id: number;
  title: string;
}

interface QuickCreateModalProps {
  entityType: "lead" | "deal";
  onClose: () => void;
  onCreated?: (entity: Record<string, unknown>) => void;
}

export function QuickCreateModal({
  entityType,
  onClose,
  onCreated,
}: QuickCreateModalProps) {
  const { data: users = [], isLoading: usersLoading } = useQuery<CrmUser[]>({
    queryKey: ["/api/users"],
  });

  const { data: contacts = [], isLoading: contactsLoading } = useQuery<CrmContact[]>({
    queryKey: ["/api/crm/contacts"],
    enabled: entityType === "deal",
  });

  const { data: companies = [], isLoading: companiesLoading } = useQuery<CrmCompany[]>({
    queryKey: ["/api/crm/companies"],
    enabled: entityType === "deal",
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col" data-testid="quick-create-modal">
        <DialogHeader>
          <DialogTitle data-testid="modal-title">
            {entityType === "lead" ? "Yangi lid yaratish" : "Yangi bitim yaratish"}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          {entityType === "lead" ? (
            <LeadForm
              users={users}
              usersLoading={usersLoading}
              onClose={onClose}
              onCreated={onCreated}
            />
          ) : (
            <DealForm
              users={users}
              usersLoading={usersLoading}
              contacts={contacts}
              contactsLoading={contactsLoading}
              companies={companies}
              companiesLoading={companiesLoading}
              onClose={onClose}
              onCreated={onCreated}
            />
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
