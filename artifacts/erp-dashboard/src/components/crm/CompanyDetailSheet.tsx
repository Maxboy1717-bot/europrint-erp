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

interface CompanyDetailSheetProps {
  companyId: number | null;
  onClose: () => void;
}

export function CompanyDetailSheet({ companyId, onClose }: CompanyDetailSheetProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState("info");

  const { data: company, isLoading } = useQuery<Company>({
    queryKey: ["/api/crm/companies", companyId],
    enabled: !!companyId,
  });

  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ["/api/crm/companies", companyId, "contacts"],
    queryFn: () =>
      fetch(`/api/crm/companies/${companyId}/contacts`, { credentials: "include" }).then((res) => res.json()),
    enabled: !!companyId,
  });

  const { data: deals = [] } = useQuery<Deal[]>({
    queryKey: ["/api/crm/companies", companyId, "deals"],
    queryFn: () =>
      fetch(`/api/crm/companies/${companyId}/deals`, { credentials: "include" }).then((res) => res.json()),
    enabled: !!companyId,
  });

  const { data: creditData } = useQuery<CreditLimit | null>({
    queryKey: ["/api/crm/companies", companyId, "credit"],
    queryFn: () =>
      fetch(`/api/crm/companies/${companyId}/credit`, { credentials: "include" }).then((res) => res.json()),
    enabled: !!companyId,
  });

  if (!companyId) return null;

  return (
    <Sheet open={!!companyId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="space-y-2">
              {([...Array(5)]).map((_, i) => (
                <Skeleton key={`k-${i}`} className="h-16 w-full" />
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
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="info">Ma'lumotlar</TabsTrigger>
                    <TabsTrigger value="contacts">Kontaktlar ({contacts.length})</TabsTrigger>
                    <TabsTrigger value="deals">Bitimlar ({deals.length})</TabsTrigger>
                    <TabsTrigger value="credit">Kredit</TabsTrigger>
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
          <div className="text-center text-muted-foreground">Kompaniya topilmadi</div>
        )}
      </SheetContent>
    </Sheet>
  );
}
