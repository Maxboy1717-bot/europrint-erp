/** @module Settings @description Route-level settings page. Owns all state, queries, and mutations; delegates rendering to tab components. */

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import {
  DEFAULT_CONTACT_FORM,
  DEFAULT_SETTINGS_FORM,
  type ContactSettings,
  type SystemSettings,
  type Position,
  type Guideline,
} from "./SettingsTypes";
import { SettingsTabGeneral } from "./SettingsTabGeneral";
import { SettingsTabTax } from "./SettingsTabTax";
import { SettingsTabExam } from "./SettingsTabExam";
import { SettingsTabGuidelines } from "./SettingsTabGuidelines";
import { SettingsTabGpt } from "./SettingsTabGpt";
import { SettingsTabContact } from "./SettingsTabContact";
import { EPErrorState } from "@/components/ep";

export default function Settings() {
  const { t } = useTranslation('settings');
  const { t: tCommon } = useTranslation('common');
  const { toast } = useToast();

  const [selectedPosition, setSelectedPosition] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [contactForm, setContactForm] = useState(DEFAULT_CONTACT_FORM);
  const [settingsForm, setSettingsForm] = useState(DEFAULT_SETTINGS_FORM);

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: positions, isError, error, refetch } = useQuery<Position[]>({
    queryKey: ["/api/org-functions"],
  });

  const { data: guidelines } = useQuery<Guideline[]>({
    queryKey: ["/api/guidelines"],
  });

  const { data: contactSettings, isLoading: loadingContact } = useQuery<ContactSettings>({
    queryKey: ["/api/contact-settings"],
  });

  const { data: systemSettings, isLoading: loadingSystem } = useQuery<SystemSettings>({
    queryKey: ["/api/system-settings"],
  });

  // ── Sync server data into forms ───────────────────────────────────────────
  useEffect(() => {
    if (!contactSettings) return;
    setContactForm({
      email: contactSettings.email ?? "",
      phone: contactSettings.phone ?? "",
      website: contactSettings.website ?? "",
      address: contactSettings.address ?? "",
      addressRu: contactSettings.addressRu ?? "",
      workingHours: contactSettings.workingHours ?? "",
      workingHoursRu: contactSettings.workingHoursRu ?? "",
    });
  }, [contactSettings]);

  useEffect(() => {
    if (!systemSettings) return;
    setSettingsForm({
      companyName: systemSettings.companyName ?? "Europrint",
      defaultLanguage: systemSettings.defaultLanguage ?? "uz",
      notificationsEnabled: systemSettings.notificationsEnabled ?? true,
      passPercentage: systemSettings.passPercentage ?? 80,
      maxAttempts: systemSettings.maxAttempts ?? 3,
      randomizeQuestions: systemSettings.randomizeQuestions ?? true,
      gptModel: systemSettings.gptModel ?? "gpt-4o",
      promptTemplate: systemSettings.promptTemplate ?? DEFAULT_SETTINGS_FORM.promptTemplate,
      inpsRate: systemSettings.inpsRate ?? 0.12,
      minWage: systemSettings.minWage ?? 1120000,
      qqsRate: systemSettings.qqsRate ?? 12.0,
    });
  }, [systemSettings]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const toastSuccess = (description: string) =>
    toast({ title: tCommon('success'), description });

  const toastError = (description?: string) =>
    toast({
      title: tCommon('error'),
      description: description ?? tCommon('operationFailed'),
      variant: "destructive",
    });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const uploadMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await apiRequest('POST', "/api/guidelines");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guidelines"] });
      setUploadFile(null);
      setSelectedPosition("");
      toastSuccess(tCommon('savedSuccessfully'));
    },
    onError: () => toastError(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/guidelines/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guidelines"] });
      toastSuccess(tCommon('deletedSuccessfully'));
    },
    onError: () => toastError(),
  });

  const updateContactMutation = useMutation({
    mutationFn: (data: typeof contactForm) => apiRequest("PUT", "/api/contact-settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contact-settings"] });
      toastSuccess(tCommon('savedSuccessfully'));
    },
    onError: () => toastError(),
  });

  const updateSystemMutation = useMutation({
    mutationFn: (data: typeof settingsForm) => apiRequest("PUT", "/api/system-settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/system-settings"] });
      toastSuccess(tCommon('savedSuccessfully'));
    },
    onError: () => toastError(),
  });

  type GptTestResponse = { score?: number };
  const testGptMutation = useMutation<GptTestResponse, Error, void>({
    mutationFn: async () => {
      return await apiRequest<GptTestResponse>("POST", "/api/gpt/test", {
        model: settingsForm.gptModel,
        promptTemplate: settingsForm.promptTemplate,
      });
    },
    onSuccess: (data) => toastSuccess(`GPT: ${data.score ?? 0}/100`),
    onError: (error: Error) => toastError(error.message),
  });

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleUpload = () => {
    if (!uploadFile || !selectedPosition) {
      toastError(tCommon('required'));
      return;
    }
    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("positionId", selectedPosition);
    uploadMutation.mutate(formData);
  };

  if (isError) return <EPErrorState onRetry={refetch}  error={error} />;

  // ── Render ────────────────────────────────────────────────────────────────
  const patchSettings = (patch: Partial<typeof settingsForm>) =>
    setSettingsForm((prev) => ({ ...prev, ...patch }));

  const patchContact = (patch: Partial<typeof contactForm>) =>
    setContactForm((prev) => ({ ...prev, ...patch }));

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div>
        <h1 className="ep-h1">{t('settings')}</h1>
        <p className="text-muted-foreground">{t('systemSettings')}</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">{t('generalSettings')}</TabsTrigger>
          <TabsTrigger value="tax">{t("soliqMoliya")}</TabsTrigger>
          <TabsTrigger value="exam">{t('securitySettings')}</TabsTrigger>
          <TabsTrigger value="guidelines">{t('roles')}</TabsTrigger>
          <TabsTrigger value="gpt">GPT</TabsTrigger>
          <TabsTrigger value="contact">{t('integrations')}</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <SettingsTabGeneral
            loading={loadingSystem}
            form={settingsForm}
            onChange={patchSettings}
            onSave={() => updateSystemMutation.mutate(settingsForm)}
            isSaving={updateSystemMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="tax" className="space-y-6">
          <SettingsTabTax
            loading={loadingSystem}
            form={settingsForm}
            onChange={patchSettings}
            onSave={() => updateSystemMutation.mutate(settingsForm)}
            isSaving={updateSystemMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="exam" className="space-y-6">
          <SettingsTabExam
            loading={loadingSystem}
            form={settingsForm}
            onChange={patchSettings}
            onSave={() => updateSystemMutation.mutate(settingsForm)}
            isSaving={updateSystemMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="guidelines" className="space-y-6">
          <SettingsTabGuidelines
            positions={positions}
            guidelines={guidelines}
            selectedPosition={selectedPosition}
            onPositionChange={setSelectedPosition}
            uploadFile={uploadFile}
            onFileChange={setUploadFile}
            onUpload={handleUpload}
            isUploading={uploadMutation.isPending}
            onDelete={(id) => deleteMutation.mutate(id)}
            isDeleting={deleteMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="gpt" className="space-y-6">
          <SettingsTabGpt
            loading={loadingSystem}
            form={settingsForm}
            onChange={patchSettings}
            onSave={() => updateSystemMutation.mutate(settingsForm)}
            isSaving={updateSystemMutation.isPending}
            onTest={() => testGptMutation.mutate()}
            isTesting={testGptMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <SettingsTabContact
            loading={loadingContact}
            form={contactForm}
            onChange={patchContact}
            onSave={() => updateContactMutation.mutate(contactForm)}
            isSaving={updateContactMutation.isPending}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
