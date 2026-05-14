/**
 * @module EmergencyContactCard
 * @description Card component that lists the employee's emergency contacts
 * and provides an inline Dialog for adding a new emergency contact.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Contact, PhoneCall, Plus } from "lucide-react";
import type { EmergencyContact } from "./profile-types";
import type { EmergencyCardProps } from "./PersonalTabTypes";
import { EPStatusPill } from "@/components/ep";

export function EmergencyContactCard({ t, tCommon, emergencyContacts, loadingEmergency, emergencyDialogOpen, setEmergencyDialogOpen, emergencyForm, setEmergencyForm, saveEmergencyMutation, }: EmergencyCardProps) {
  const contacts = Array.isArray(emergencyContacts) ? emergencyContacts : [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <Contact className="h-5 w-5" />
          {t("emergencyContacts")}
        </CardTitle>
        <Dialog open={emergencyDialogOpen} onOpenChange={setEmergencyDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" data-testid="button-add-emergency">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg p-6">
            <DialogHeader>
              <DialogTitle className="text-[18px] font-semibold">{t("emergencyContacts")}</DialogTitle>
              <DialogDescription>{t("employeeDetails")}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
          <Label>{t("contactName")}</Label>
                  <Input
                    value={emergencyForm.contactName}
                    onChange={(e) => setEmergencyForm({ ...emergencyForm, contactName: e.target.value })}
                    placeholder={t("ismFamiliya")}
                    data-testid="input-emergency-name"
                  />
                </div>
                <div className="space-y-1">
          <Label>{t("relationship")}</Label>
                  <Input
                    value={emergencyForm.relationship}
                    onChange={(e) => setEmergencyForm({ ...emergencyForm, relationship: e.target.value })}
                    placeholder="Ota / Ona / Turmush o'rtog'i"
                    data-testid="input-emergency-relationship"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
          <Label>{tCommon("phone")}</Label>
                  <Input
                    value={emergencyForm.phoneNumber}
                    onChange={(e) => setEmergencyForm({ ...emergencyForm, phoneNumber: e.target.value })}
                    placeholder="+998 90 123 45 67"
                    data-testid="input-emergency-phone"
                  />
                </div>
                <div className="space-y-1">
          <Label>{t("alternativePhone")}</Label>
                  <Input
                    value={emergencyForm.alternativePhone}
                    onChange={(e) => setEmergencyForm({ ...emergencyForm, alternativePhone: e.target.value })}
                    placeholder="+998 90 123 45 67"
                    data-testid="input-emergency-alt-phone"
                  />
                </div>
              </div>
              <div className="space-y-1">
          <Label>{t("address")}</Label>
                <Input
                  value={emergencyForm.address}
                  onChange={(e) => setEmergencyForm({ ...emergencyForm, address: e.target.value })}
                  placeholder={t("address")}
                  data-testid="input-emergency-address"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => saveEmergencyMutation.mutate(emergencyForm)}
                disabled={
                  saveEmergencyMutation.isPending ||
                  !emergencyForm.contactName ||
                  !emergencyForm.phoneNumber
                }
                data-testid="button-save-emergency"
              >
                {saveEmergencyMutation.isPending ? tCommon("loading") : tCommon("save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loadingEmergency ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4 rounded-lg" />
          </div>
        ) : contacts.length > 0 ? (
          <div className="space-y-4">
            {contacts.map((contact: EmergencyContact) => (
              <div key={contact.id} className="p-3 border rounded-md space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PhoneCall className="h-4 w-4 text-[var(--ep-red)]" />
                    <p className="font-medium">{contact.contactName}</p>
                  </div>
                  {contact.isPrimary && <EPStatusPill tone="neutral">{tCommon("primary")}</EPStatusPill>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">{t("relationship")}</p>
                    <p>{contact.relationship || tCommon("notSpecified")}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{tCommon("phone")}</p>
                    <p>{contact.phoneNumber}</p>
                  </div>
                  {contact.alternativePhone && (
                    <div>
                      <p className="text-muted-foreground">{t("alternativePhone")}</p>
                      <p>{contact.alternativePhone}</p>
                    </div>
                  )}
                  {contact.address && (
                    <div>
                      <p className="text-muted-foreground">{t("address")}</p>
                      <p>{contact.address}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">{tCommon("noData")}</p>
        )}
      </CardContent>
    </Card>
  );
}
