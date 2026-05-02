import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { FileUp, Trash2, Download, Phone } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { useTranslation } from "@/lib/i18n";
import { ErrorState } from "@/components/ui/error-state";

interface Position {
  id: string;
  name: string;
}

interface Guideline {
  id: string;
  positionName: string;
  version: string;
  filePath: string;
}

interface ContactSettings {
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  addressRu?: string;
  workingHours?: string;
  workingHoursRu?: string;
}

interface SystemSettings {
  companyName?: string;
  defaultLanguage?: string;
  notificationsEnabled?: boolean;
  passPercentage?: number;
  maxAttempts?: number;
  randomizeQuestions?: boolean;
  gptModel?: string;
  promptTemplate?: string;
  inpsRate?: number;
  minWage?: number;
  qqsRate?: number;
}

export default function Settings() {
  const { t } = useTranslation('settings');
  const { t: tCommon } = useTranslation('common');
  const { toast } = useToast();
  const [selectedPosition, setSelectedPosition] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const { data: positions, isError, refetch} = useQuery<Position[]>({
    queryKey: ["/api/positions"],
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

  const [contactForm, setContactForm] = useState({
    email: "",
    phone: "",
    website: "",
    address: "",
    addressRu: "",
    workingHours: "",
    workingHoursRu: "",
  });

  const [settingsForm, setSettingsForm] = useState({
    companyName: "Europrint",
    defaultLanguage: "uz",
    notificationsEnabled: true,
    passPercentage: 80,
    maxAttempts: 3,
    randomizeQuestions: true,
    gptModel: "gpt-4o",
    promptTemplate: "KONTEKST: Europrint {bo'lim} bo'limi, lavozim: {lavozim}.\nYO'RIQNOMA: {yo'riqnoma_matni}\nRUBRIKA VA VAZNLAR: {rubrika_json}\nTOPSHIRIQ: {savol_matni}\nXODIM JAVOBI: {xodim_javobi}",
    inpsRate: 0.12,
    minWage: 1120000,
    qqsRate: 12.0,
  });

  // Update form when contact settings load
  useEffect(() => {
    if (contactSettings) {
      setContactForm({
        email: contactSettings.email || "",
        phone: contactSettings.phone || "",
        website: contactSettings.website || "",
        address: contactSettings.address || "",
        addressRu: contactSettings.addressRu || "",
        workingHours: contactSettings.workingHours || "",
        workingHoursRu: contactSettings.workingHoursRu || "",
      });
    }
  }, [contactSettings]);

  // Update form when system settings load
  useEffect(() => {
    if (systemSettings) {
      setSettingsForm({
        companyName: systemSettings.companyName || "Europrint",
        defaultLanguage: systemSettings.defaultLanguage || "uz",
        notificationsEnabled: systemSettings.notificationsEnabled !== undefined ? systemSettings.notificationsEnabled : true,
        passPercentage: systemSettings.passPercentage || 80,
        maxAttempts: systemSettings.maxAttempts || 3,
        randomizeQuestions: systemSettings.randomizeQuestions !== undefined ? systemSettings.randomizeQuestions : true,
        gptModel: systemSettings.gptModel || "gpt-4o",
        promptTemplate: systemSettings.promptTemplate || "KONTEKST: Europrint {bo'lim} bo'limi, lavozim: {lavozim}.\nYO'RIQNOMA: {yo'riqnoma_matni}\nRUBRIKA VA VAZNLAR: {rubrika_json}\nTOPSHIRIQ: {savol_matni}\nXODIM JAVOBI: {xodim_javobi}",
        inpsRate: systemSettings.inpsRate ?? 0.12,
        minWage: systemSettings.minWage ?? 1120000,
        qqsRate: systemSettings.qqsRate ?? 12.0,
      });
    }
  }, [systemSettings]);

  const uploadMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch("/api/guidelines", {
        method: "POST",
        body: data,
      });
      if (!response.ok) throw new Error("Upload failed");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guidelines"] });
      setUploadFile(null);
      setSelectedPosition("");
      toast({
        title: tCommon('success'),
        description: tCommon('savedSuccessfully'),
      });
    },
    onError: () => {
      toast({
        title: tCommon('error'),
        description: tCommon('operationFailed'),
        variant: "destructive",
      });
    },
  });

  const testGptMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/gpt/test", {
        model: settingsForm.gptModel,
        promptTemplate: settingsForm.promptTemplate,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: tCommon('success'),
        description: `GPT: ${data.score}/100`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: tCommon('error'),
        description: error.message || tCommon('operationFailed'),
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/guidelines/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guidelines"] });
      toast({
        title: tCommon('success'),
        description: tCommon('deletedSuccessfully'),
      });
    },
    onError: () => {
      toast({
        title: tCommon('error'),
        description: tCommon('operationFailed'),
        variant: "destructive",
      });
    },
  });

  const updateContactMutation = useMutation({
    mutationFn: async (data: typeof contactForm) => {
      return apiRequest("PUT", "/api/contact-settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contact-settings"] });
      toast({
        title: tCommon('success'),
        description: tCommon('savedSuccessfully'),
      });
    },
    onError: () => {
      toast({
        title: tCommon('error'),
        description: tCommon('operationFailed'),
        variant: "destructive",
      });
    },
  });

  const updateSystemMutation = useMutation({
    mutationFn: async (data: typeof settingsForm) => {
      return apiRequest("PUT", "/api/system-settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/system-settings"] });
      toast({
        title: tCommon('success'),
        description: tCommon('savedSuccessfully'),
      });
    },
    onError: () => {
      toast({
        title: tCommon('error'),
        description: tCommon('operationFailed'),
        variant: "destructive",
      });
    },
  });

  const handleUpload = () => {
    if (!uploadFile || !selectedPosition) {
      toast({
        title: tCommon('error'),
        description: tCommon('required'),
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("positionId", selectedPosition);
    uploadMutation.mutate(formData);
  };

  const handleContactUpdate = () => {
    updateContactMutation.mutate(contactForm);
  };

  const handleSystemUpdate = () => {
    updateSystemMutation.mutate(settingsForm);
  };

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">{t('settings')}</h1>
        <p className="text-muted-foreground">
          {t('systemSettings')}
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">{t('generalSettings')}</TabsTrigger>
          <TabsTrigger value="tax">Soliq / Moliya</TabsTrigger>
          <TabsTrigger value="exam">{t('securitySettings')}</TabsTrigger>
          <TabsTrigger value="guidelines">{t('roles')}</TabsTrigger>
          <TabsTrigger value="gpt">GPT</TabsTrigger>
          <TabsTrigger value="contact">{t('integrations')}</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('generalSettings')}</CardTitle>
              <CardDescription>
                {t('systemSettings')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingSystem ? (
                <div className="text-center py-8 text-muted-foreground">{tCommon('loading')}</div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="company-name">{t('companyName')}</Label>
                    <Input
                      id="company-name"
                      value={settingsForm.companyName}
                      onChange={(e) => setSettingsForm({ ...settingsForm, companyName: e.target.value })}
                      data-testid="input-company-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">{t('languageSettings')}</Label>
                    <Select 
                      value={settingsForm.defaultLanguage}
                      onValueChange={(value) => setSettingsForm({ ...settingsForm, defaultLanguage: value })}
                    >
                      <SelectTrigger id="language" data-testid="select-language">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="uz">O'zbek</SelectItem>
                        <SelectItem value="ru">Русский</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{t('notificationSettings')}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t('telegramBot')}
                      </p>
                    </div>
                    <Switch 
                      checked={settingsForm.notificationsEnabled}
                      onCheckedChange={(checked) => setSettingsForm({ ...settingsForm, notificationsEnabled: checked })}
                      data-testid="switch-notifications" 
                    />
                  </div>
                  <Button
                    onClick={handleSystemUpdate}
                    disabled={updateSystemMutation.isPending}
                    data-testid="button-save-general"
                  >
                    {updateSystemMutation.isPending ? tCommon('loading') : tCommon('save')}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tax" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Soliq va Moliya Sozlamalari</CardTitle>
              <CardDescription>
                Davlat tomonidan belgilangan stavkalar o'zgarganda shu yerdan yangilang
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingSystem ? (
                <div className="text-center py-8 text-muted-foreground">{tCommon('loading')}</div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="inps-rate">INPS stavkasi (ulush, masalan 0.12 = 12%)</Label>
                    <Input
                      id="inps-rate"
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={settingsForm.inpsRate}
                      onChange={(e) => setSettingsForm({ ...settingsForm, inpsRate: parseFloat(e.target.value) || 0.12 })}
                      data-testid="input-inps-rate"
                    />
                    <p className="text-xs text-muted-foreground">Joriy qiymat: {(settingsForm.inpsRate * 100).toFixed(1)}%</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="min-wage">Minimal ish haqi (so'm)</Label>
                    <Input
                      id="min-wage"
                      type="number"
                      min="0"
                      step="10000"
                      value={settingsForm.minWage}
                      onChange={(e) => setSettingsForm({ ...settingsForm, minWage: parseInt(e.target.value) || 1120000 })}
                      data-testid="input-min-wage"
                    />
                    <p className="text-xs text-muted-foreground">Hozir: {settingsForm.minWage.toLocaleString('uz-UZ')} so'm</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="qqs-rate">QQS stavkasi (%)</Label>
                    <Input
                      id="qqs-rate"
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      value={settingsForm.qqsRate}
                      onChange={(e) => setSettingsForm({ ...settingsForm, qqsRate: parseFloat(e.target.value) || 12 })}
                      data-testid="input-qqs-rate"
                    />
                    <p className="text-xs text-muted-foreground">Joriy qiymat: {settingsForm.qqsRate}%</p>
                  </div>
                  <Button
                    onClick={handleSystemUpdate}
                    disabled={updateSystemMutation.isPending}
                    data-testid="button-save-tax"
                  >
                    {updateSystemMutation.isPending ? tCommon('loading') : tCommon('save')}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exam" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('securitySettings')}</CardTitle>
              <CardDescription>
                {t('systemSettings')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingSystem ? (
                <div className="text-center py-8 text-muted-foreground">{tCommon('loading')}</div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="pass-percentage">{tCommon('percentage')} (%)</Label>
                    <Input
                      id="pass-percentage"
                      type="number"
                      value={settingsForm.passPercentage}
                      onChange={(e) => setSettingsForm({ ...settingsForm, passPercentage: parseInt(e.target.value) || 80 })}
                      min="0"
                      max="100"
                      data-testid="input-pass-percentage"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="attempts">{tCommon('count')}</Label>
                    <Input
                      id="attempts"
                      type="number"
                      value={settingsForm.maxAttempts}
                      onChange={(e) => setSettingsForm({ ...settingsForm, maxAttempts: parseInt(e.target.value) || 3 })}
                      min="1"
                      max="10"
                      data-testid="input-attempts"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{t('systemSettings')}</Label>
                      <p className="text-sm text-muted-foreground">
                        {tCommon('sortBy')}
                      </p>
                    </div>
                    <Switch 
                      checked={settingsForm.randomizeQuestions}
                      onCheckedChange={(checked) => setSettingsForm({ ...settingsForm, randomizeQuestions: checked })}
                      data-testid="switch-randomize" 
                    />
                  </div>
                  <Button
                    onClick={handleSystemUpdate}
                    disabled={updateSystemMutation.isPending}
                    data-testid="button-save-exam"
                  >
                    {updateSystemMutation.isPending ? tCommon('loading') : tCommon('save')}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guidelines" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('roles')}</CardTitle>
              <CardDescription>
                {t('roleManagement')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="position-select">{tCommon('role')}</Label>
                <Select value={selectedPosition} onValueChange={setSelectedPosition}>
                  <SelectTrigger id="position-select" data-testid="select-position">
                    <SelectValue placeholder={tCommon('select')} />
                  </SelectTrigger>
                  <SelectContent>
                    {positions?.map((position: Position) => (
                      <SelectItem key={position.id} value={position.id}>
                        {position.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="guideline-file">{tCommon('upload')} (PDF, TXT, Word)</Label>
                <Input
                  id="guideline-file"
                  type="file"
                  accept=".pdf,.txt,.doc,.docx"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  data-testid="input-guideline-file"
                />
              </div>

              <Button
                onClick={handleUpload}
                disabled={uploadMutation.isPending || !uploadFile || !selectedPosition}
                data-testid="button-upload-guideline"
              >
                <FileUp className="w-4 h-4 mr-2" />
                {uploadMutation.isPending ? tCommon('loading') : tCommon('upload')}
              </Button>

              <div className="mt-6 space-y-2">
                <Label>{tCommon('attachments')}</Label>
                <div className="space-y-2">
                  {guidelines?.map((guideline: Guideline) => (
                    <div
                      key={guideline.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                      data-testid={`guideline-item-${guideline.id}`}
                    >
                      <div className="flex-1">
                        <p className="font-medium">{guideline.positionName}</p>
                        <p className="text-sm text-muted-foreground">
                          {t('version')}: {guideline.version}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          asChild
                          data-testid={`button-download-${guideline.id}`}
                        >
                          <a href={guideline.filePath} download>
                            <Download className="w-4 h-4" />
                          </a>
                        </Button>
                        <DeleteConfirmDialog
                          title={tCommon('confirmDelete')}
                          description={tCommon('deleteWarning')}
                          onConfirm={() => deleteMutation.mutate(guideline.id)}
                          isPending={deleteMutation.isPending}
                        />
                      </div>
                    </div>
                  ))}
                  {(!guidelines || guidelines.length === 0) && (
                    <p className="text-sm text-muted-foreground p-3">
                      {tCommon('noData')}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gpt" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>GPT {t('integrations')}</CardTitle>
              <CardDescription>
                {t('apiKeys')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingSystem ? (
                <div className="text-center py-8 text-muted-foreground">{tCommon('loading')}</div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="gpt-model">GPT Model</Label>
                    <Select 
                      value={settingsForm.gptModel} 
                      onValueChange={(value) => setSettingsForm({ ...settingsForm, gptModel: value })}
                    >
                      <SelectTrigger id="gpt-model" data-testid="select-gpt-model">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                        <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prompt-template">Prompt</Label>
                    <Textarea
                      id="prompt-template"
                      rows={6}
                      value={settingsForm.promptTemplate}
                      onChange={(e) => setSettingsForm({ ...settingsForm, promptTemplate: e.target.value })}
                      className="font-mono text-sm"
                      data-testid="textarea-prompt"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => testGptMutation.mutate()}
                      disabled={testGptMutation.isPending}
                      data-testid="button-test-prompt"
                    >
                      {testGptMutation.isPending ? tCommon('loading') : "Test"}
                    </Button>
                    <Button 
                      onClick={handleSystemUpdate}
                      disabled={updateSystemMutation.isPending}
                      data-testid="button-save-settings"
                    >
                      {updateSystemMutation.isPending ? tCommon('loading') : tCommon('save')}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                <CardTitle>{t('integrations')}</CardTitle>
              </div>
              <CardDescription>
                {t('telegramBot')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingContact ? (
                <div className="text-center py-8 text-muted-foreground">{tCommon('loading')}</div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email">{tCommon('email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      placeholder="info@europrint.uz"
                      data-testid="input-contact-email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">{tCommon('phone')}</Label>
                    <Input
                      id="phone"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      placeholder="+998 71 123 45 67"
                      data-testid="input-contact-phone"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={contactForm.website}
                      onChange={(e) => setContactForm({ ...contactForm, website: e.target.value })}
                      placeholder="www.europrint.uz"
                      data-testid="input-contact-website"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">{tCommon('address')} (UZ)</Label>
                    <Input
                      id="address"
                      value={contactForm.address}
                      onChange={(e) => setContactForm({ ...contactForm, address: e.target.value })}
                      placeholder="Toshkent shahar, Yashnobod tumani"
                      data-testid="input-contact-address"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="addressRu">{tCommon('address')} (RU)</Label>
                    <Input
                      id="addressRu"
                      value={contactForm.addressRu}
                      onChange={(e) => setContactForm({ ...contactForm, addressRu: e.target.value })}
                      placeholder="г. Ташкент, Яшнабадский район"
                      data-testid="input-contact-address-ru"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="workingHours">{tCommon('time')} (UZ)</Label>
                    <Input
                      id="workingHours"
                      value={contactForm.workingHours}
                      onChange={(e) => setContactForm({ ...contactForm, workingHours: e.target.value })}
                      placeholder="9:00 - 18:00 (Dushanba - Juma)"
                      data-testid="input-contact-hours"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="workingHoursRu">{tCommon('time')} (RU)</Label>
                    <Input
                      id="workingHoursRu"
                      value={contactForm.workingHoursRu}
                      onChange={(e) => setContactForm({ ...contactForm, workingHoursRu: e.target.value })}
                      placeholder="9:00 - 18:00 (Понедельник - Пятница)"
                      data-testid="input-contact-hours-ru"
                    />
                  </div>

                  <Button
                    onClick={handleContactUpdate}
                    disabled={updateContactMutation.isPending}
                    data-testid="button-save-contact"
                  >
                    {updateContactMutation.isPending ? tCommon('loading') : tCommon('save')}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
