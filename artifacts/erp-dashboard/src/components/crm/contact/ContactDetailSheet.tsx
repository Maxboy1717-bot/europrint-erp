/**
 * @module ContactDetailSheet
 * @description React UI component.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Contact, Company, ContactFormValues } from "./types";
import { ContactHeader } from "./ContactHeader";
import { ContactEditForm } from "./ContactEditForm";
import { ContactView } from "./ContactView";

interface ContactDetailSheetProps {
  contactId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContactDetailSheet({
  contactId,
  open,
  onOpenChange,
}: ContactDetailSheetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const { data: contact, isLoading } = useQuery<Contact>({
    queryKey: ["/api/crm/contacts", contactId],
    enabled: open && !!contactId,
  });

  const { data: companies } = useQuery<Company[]>({
    queryKey: ["/api/crm/companies"],
    enabled: isEditing,
  });

  const updateMutation = useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      return apiRequest("PATCH", `/api/crm/contacts/${contactId}`, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/contacts", contactId] });
      setIsEditing(false);
      toast({
        title: "Saqlandi",
        description: "Kontakt muvaffaqiyatli yangilandi",
      });
    },
    onError: () => {
      toast({
        title: "Xatolik",
        description: "Kontaktni yangilashda xatolik yuz berdi",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (values: ContactFormValues) => {
    const transformed = {
      ...values,
      phones: values.phones?.map(p => ({ value: p, type: "WORK", valueType: "WORK" })),
      emails: values.emails?.map(e => ({ value: e, type: "WORK", valueType: "WORK" })),
    };
    updateMutation.mutate(transformed);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[600px] overflow-y-auto p-6">
        <ContactHeader
          contact={contact || null}
          isLoading={isLoading}
          isEditing={isEditing}
          onEdit={() => setIsEditing(true)}
        />

        {isLoading ? (
          <div className="space-y-4 mt-6">
            {([...Array(6)]).map((_, i) => (
              <Skeleton key={`k-${i}`} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : isEditing ? (
          <ContactEditForm
            contact={contact || null}
            companies={companies}
            isPending={updateMutation.isPending}
            onSubmit={handleSubmit}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <ContactView contact={contact || null} />
        )}
      </SheetContent>
    </Sheet>
  );
}
