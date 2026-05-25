/**
 * @module CompanyDetailSheet
 * @description React UI component.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Company, Contact, Deal, CreditLimit } from "./company/types";
import { CompanyHeader } from "./company/CompanyHeader";
import { CompanyInfoTab } from "./company/CompanyInfoTab";
import { ContactsTab } from "./company/ContactsTab";
import { DealsTab } from "./company/DealsTab";
import { CreditTab } from "./company/CreditTab";
import { CompanyEditForm } from "./company/CompanyEditForm";
import { apiRequest } from '@/lib/queryClient';
import { useTranslation } from '@/lib/i18n';

interface CompanyDetailSheetProps {
  companyId: number | null;
  onClose: () => void;
}

export function CompanyDetailSheet({ companyId, onClose }: CompanyDetailSheetProps) {
  const { t } = useTranslation("common");
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState("info");

  const { data: company, isLoading } = useQuery<Company>({
    queryKey: ["/api/crm/companies", companyId],
    enabled: !!companyId,
  });

  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ["/api/crm/companies", companyId, "contacts"],
    queryFn: () => apiRequest<Contact[]>('GET', `/api/crm/companies/${companyId}/contacts`),
    enabled: !!companyId,
  });

  const { data: deals = [] } = useQuery<Deal[]>({
    queryKey: ["/api/crm/companies", companyId, "deals"],
    queryFn: () => apiRequest<Deal[]>('GET', `/api/crm/companies/${companyId}/deals`),
    enabled: !!companyId,
  });

  const { data: creditData } = useQuery<CreditLimit | null>({
    queryKey: ["/api/crm/companies", companyId, "credit"],
    queryFn: () => apiRequest<CreditLimit | null>('GET', `/api/crm/companies/${companyId}/credit`),
    enabled: !!companyId,
  });

  if (!companyId) return null;

  return (
    <Sheet open={!!companyId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4 rounded-lg" />
            <Skeleton className="h-4 w-1/2 rounded-lg" />
            <div className="space-y-2">
              {([...Array(5)]).map((_, i) => (
                <Skeleton key={`k-${i}`} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          </div>
        ) : company ? (
          <>
            <CompanyHeader
              company={company}
              isEditMode={isEditMode}
              onEditClick={() => setIsEditMode(true)}
            />

            <div className="mt-4">
              {isEditMode ? (
                <CompanyEditForm
                  company={company}
                  onCancel={() => setIsEditMode(false)}
                  onSuccess={() => setIsEditMode(false)}
                />
              ) : (
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
                    <TabsTrigger value="info">{t("malumotlar")}</TabsTrigger>
                    <TabsTrigger value="contacts">Kontaktlar ({contacts.length})</TabsTrigger>
                    <TabsTrigger value="deals">Bitimlar ({deals.length})</TabsTrigger>
                    <TabsTrigger value="credit">{t("loan")}</TabsTrigger>
                  </TabsList>

                  <TabsContent value="info">
                    <CompanyInfoTab company={company} />
                  </TabsContent>

                  <TabsContent value="contacts">
                    <ContactsTab companyId={companyId} contacts={contacts} />
                  </TabsContent>

                  <TabsContent value="deals">
                    <DealsTab deals={deals} />
                  </TabsContent>

                  <TabsContent value="credit">
                    <CreditTab companyId={companyId} creditData={creditData || null} />
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </>
        ) : (
          <div className="text-center text-muted-foreground">{t("kompaniyaTopilmadi")}</div>
        )}
      </SheetContent>
    </Sheet>
  );
}
