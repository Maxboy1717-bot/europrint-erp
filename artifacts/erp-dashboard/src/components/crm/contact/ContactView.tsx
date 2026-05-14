/**
 * @module ContactView
 * @description React UI component.
 */

import { User, Briefcase, Building2, Phone, Mail, Calendar } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Contact } from "./types";

import { useTranslation } from '@/lib/i18n';
interface ContactViewProps {
  contact: Contact | null;
}

export function ContactView({contact }: ContactViewProps) {
  const { t } = useTranslation('common');
  const getFullName = () => {
    if (!contact) return "";
    return [contact.lastName, contact.name, contact.secondName]
      .filter(Boolean)
      .join(" ") || "Nomsiz kontakt";
  };

  return (
    <div className="space-y-6 mt-6">
      {/* Contact Info */}
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <User className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div className="flex-1">
            <div className="text-sm text-muted-foreground">{t("toliqIsm")}</div>
            <div className="font-medium" data-testid="text-view-fullname">
              {getFullName()}
            </div>
          </div>
        </div>

        {contact?.post && (
          <div className="flex items-start gap-3">
            <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <div className="text-sm text-muted-foreground">{t("lavozim1")}</div>
              <div className="font-medium" data-testid="text-view-post">
                {contact.post}
              </div>
            </div>
          </div>
        )}

        {contact?.companyTitle && (
          <div className="flex items-start gap-3">
            <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <div className="text-sm text-muted-foreground">{t("company")}</div>
              <div className="font-medium" data-testid="text-view-company">
                {contact.companyTitle}
              </div>
            </div>
          </div>
        )}

        {contact?.phones && contact.phones.length > 0 && (
          <div className="flex items-start gap-3">
            <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <div className="text-sm text-muted-foreground">{t("telefonlar")}</div>
              <div className="space-y-1">
                {(Array.isArray(contact.phones) ? contact.phones : []).map((phone, idx) => (
                  <div key={idx} className="font-medium" data-testid={`text-view-phone-${idx}`}>
                    {phone.value}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {contact?.emails && contact.emails.length > 0 && (
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <div className="text-sm text-muted-foreground">{t('email1')}</div>
              <div className="space-y-1">
                {(Array.isArray(contact.emails) ? contact.emails : []).map((email, idx) => (
                  <div key={idx} className="font-medium" data-testid={`text-view-email-${idx}`}>
                    {email.value}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {contact?.birthdate && (
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <div className="text-sm text-muted-foreground">{t("tugilganSana")}</div>
              <div className="font-medium" data-testid="text-view-birthdate">
                {new Date(contact.birthdate).toLocaleDateString("uz-UZ")}
              </div>
            </div>
          </div>
        )}
      </div>

      {contact?.comments && (
        <>
          <Separator />
          <div>
            <div className="text-sm text-muted-foreground mb-2">{t("notes")}</div>
            <div className="text-sm" data-testid="text-view-comments">
              {contact.comments}
            </div>
          </div>
        </>
      )}

      <Separator />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-muted-foreground">{t("Yaratilgan")}</div>
          <div data-testid="text-view-created">
            {contact?.dateCreate ? new Date(contact.dateCreate).toLocaleDateString("uz-UZ") : "—"}
          </div>
        </div>
        <div>
          <div className="text-muted-foreground">{t("ozgartirilgan")}</div>
          <div data-testid="text-view-modified">
            {contact?.dateModify ? new Date(contact.dateModify).toLocaleDateString("uz-UZ") : "—"}
          </div>
        </div>
      </div>
    </div>
  );
}
