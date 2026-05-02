import { Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Contact } from "./types";

interface ContactHeaderProps {
  contact: Contact | null;
  isLoading: boolean;
  isEditing: boolean;
  onEdit: () => void;
}

export function ContactHeader({ contact, isLoading, isEditing, onEdit }: ContactHeaderProps) {
  const getFullName = () => {
    if (!contact) return "";
    return [contact.lastName, contact.name, contact.secondName]
      .filter(Boolean)
      .join(" ") || "Nomsiz kontakt";
  };

  return (
    <SheetHeader>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <SheetTitle data-testid="text-sheet-title">
            {isLoading ? (
              <Skeleton className="h-6 w-48" />
            ) : (
              getFullName()
            )}
          </SheetTitle>
          <SheetDescription data-testid="text-sheet-description">
            {isLoading ? (
              <Skeleton className="h-4 w-32 mt-2" />
            ) : contact?.post ? (
              contact.post
            ) : (
              "Lavozim ko'rsatilmagan"
            )}
          </SheetDescription>
        </div>
        {!isEditing && !isLoading && (
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            data-testid="button-edit-contact"
          >
            <Edit className="h-4 w-4 mr-2" />
            Tahrirlash
          </Button>
        )}
      </div>
    </SheetHeader>
  );
}
