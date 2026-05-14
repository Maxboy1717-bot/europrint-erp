/**
 * @module ContactsTab
 * @description React UI component.
 */

import { useState } from "react";
import { Users, User, X, Briefcase, Phone } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Contact } from "./types";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ContactsTabProps {
  companyId: number;
  contacts: Contact[];
}

export function ContactsTab({ companyId, contacts }: ContactsTabProps) {
  const [showLinkContactDialog, setShowLinkContactDialog] = useState(false);
  const [confirmUnlinkId, setConfirmUnlinkId] = useState<number | null>(null);
  const [linkContactId, setLinkContactId] = useState("");
  const [linkContactRole, setLinkContactRole] = useState("");
  const { toast } = useToast();

  const unlinkContactMutation = useMutation<unknown, Error, number>({
    mutationFn: async (contactId: number) => {
      return apiRequest("DELETE", `/api/crm/companies/${companyId}/contacts/${contactId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/companies", companyId, "contacts"] });
      toast({ title: "Uzildi", description: "Kontakt kompaniyadan uzildi" });
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Kontaktni uzishda xatolik", variant: "destructive" });
    },
  });

  const linkContactMutation = useMutation<unknown, Error, { contactId: number; role: string }>({
    mutationFn: async ({ contactId, role }: { contactId: number; role: string }) => {
      return apiRequest("POST", `/api/crm/companies/${companyId}/contacts`, { contactId, role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/companies", companyId, "contacts"] });
      toast({ title: "Ulandi", description: "Kontakt kompaniyaga ulandi" });
      setShowLinkContactDialog(false);
      setLinkContactId("");
      setLinkContactRole("");
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Kontaktni ulashda xatolik", variant: "destructive" });
    },
  });

  return (
    <div className="mt-4 space-y-3">
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={() => setShowLinkContactDialog(true)}>
          <Users className="h-3 w-3 mr-1" />
          Kontakt ulash
        </Button>
      </div>
      {contacts.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          <User className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Kontaktlar yo'q</p>
        </div>
      ) : (
        <div className="space-y-2">
          {(Array.isArray(contacts) ? contacts : []).map((contact) => (
            <div key={contact.id} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm flex items-center gap-1">
                  {([contact.lastName, contact.name]).filter(Boolean).join(' ') || 'Nomsiz kontakt'}
                  {contact.linkIsPrimary && (
                    <Badge variant="secondary" className="text-xs ml-1">Asosiy</Badge>
                  )}
                </div>
                {(contact.post || contact.linkRole) && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Briefcase className="h-3 w-3" />
                    {contact.linkRole || contact.post}
                  </div>
                )}
                {contact.phones?.[0] && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Phone className="h-3 w-3" />
                    {contact.phones[0].value}
                  </div>
                )}
              </div>
              {contact.linkId && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive ml-2 shrink-0"
                  disabled={unlinkContactMutation.isPending}
                  onClick={() => setConfirmUnlinkId(contact.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Link Contact Dialog */}
      <Dialog open={showLinkContactDialog} onOpenChange={setShowLinkContactDialog}>
        <DialogContent data-testid="dialog-link-contact" className="p-6">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">Kontakt ulash</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Kontakt ID *</label>
              <Input
                type="number"
                value={linkContactId}
                onChange={(e) => setLinkContactId(e.target.value)}
                placeholder="Kontakt ID raqamini kiriting"
                data-testid="input-link-contact-id"
              />
              <p className="text-xs text-muted-foreground">
                Kontaktlar ro'yxatidan ID raqamini toping
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Rol / Lavozim</label>
              <Input
                value={linkContactRole}
                onChange={(e) => setLinkContactRole(e.target.value)}
                placeholder="masalan: Direktor, Buxgalter"
                data-testid="input-link-contact-role"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkContactDialog(false)}>
              Bekor qilish
            </Button>
            <Button
              onClick={() => {
                const id = parseInt(linkContactId, 10);
                if (!id || isNaN(id)) {
                  toast({ title: "Xatolik", description: "Kontakt ID raqamini kiriting", variant: "destructive" });
                  return;
                }
                linkContactMutation.mutate({ contactId: id, role: linkContactRole });
              }}
              disabled={linkContactMutation.isPending}
              data-testid="button-link-contact-save"
            >
              {linkContactMutation.isPending ? "Ulanmoqda..." : "Ulash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmUnlinkId !== null}
        onOpenChange={(open) => { if (!open) setConfirmUnlinkId(null); }}
        title="Kontaktni uzish"
        description="Ushbu kontaktni kompaniyadan uzishni tasdiqlaysizmi?"
        confirmText="Uzish"
        cancelText="Bekor qilish"
        variant="destructive"
        onConfirm={() => { if (confirmUnlinkId !== null) unlinkContactMutation.mutate(confirmUnlinkId); }}
      />
    </div>
  );
}
