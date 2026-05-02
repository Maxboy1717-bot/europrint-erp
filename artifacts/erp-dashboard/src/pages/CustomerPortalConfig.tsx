import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/hooks/use-toast";
import {
  Globe, Link2, Copy, CheckCircle, Code2, Shield,
  Webhook, Phone, FileText, MessageSquare, Eye
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const BASE_URL = window.location.origin;

const WEBHOOK_ENDPOINTS = [
  {
    id: "form",
    name: "Forma orqali murojaat",
    method: "POST",
    url: `${BASE_URL}/api/crm/webhooks/form-lead`,
    icon: FileText,
    description: "Veb-saytdagi aloqa formasidan avtomatik lead yaratish",
    body: JSON.stringify({
      formId: "contact-form-1",
      formName: "Asosiy aloqa formasi",
      fields: {
        name: "Abdullayev Jasur",
        phone: "+998901234567",
        email: "jasur@example.com",
        message: "Gofrokarton qadoqlash kerak"
      }
    }, null, 2),
    headers: {
      "Content-Type": "application/json",
      "x-crm-webhook-signature": "sha256-hmac-signature",
      "x-crm-webhook-timestamp": Date.now().toString()
    }
  },
  {
    id: "call",
    name: "Telefon qo'ng'irog'i",
    method: "POST",
    url: `${BASE_URL}/api/crm/webhooks/call-lead`,
    icon: Phone,
    description: "IP-telefoniya tizimidan kiruvchi qo'ng'iroqlarni CRMga yuborish",
    body: JSON.stringify({
      phone: "+998901234567",
      direction: "incoming",
      callStatus: "answered",
      duration: 125
    }, null, 2),
    headers: {
      "Content-Type": "application/json",
      "x-crm-webhook-signature": "sha256-hmac-signature",
      "x-crm-webhook-timestamp": Date.now().toString()
    }
  },
  {
    id: "telegram",
    name: "Telegram bot",
    method: "POST",
    url: `${BASE_URL}/api/crm/webhooks/telegram-lead`,
    icon: MessageSquare,
    description: "Telegram bot orqali kelgan xabarlarni CRMga yozish",
    body: JSON.stringify({
      chatId: "123456789",
      username: "jasur_uz",
      firstName: "Jasur",
      phone: "+998901234567",
      message: "Salom, narx so'rashmoqchi edim"
    }, null, 2),
    headers: {
      "Content-Type": "application/json",
      "x-crm-webhook-signature": "sha256-hmac-signature",
      "x-crm-webhook-timestamp": Date.now().toString()
    }
  },
  {
    id: "website",
    name: "Sayt tashrif qo'yuvchi",
    method: "POST",
    url: `${BASE_URL}/api/crm/webhooks/website-lead`,
    icon: Eye,
    description: "Veb-sayt analytics — sahifani ko'rgan foydalanuvchini kuzatish",
    body: JSON.stringify({
      visitorId: "v_abc123def456",
      page: "/products/gofrokarton",
      referrer: "https://google.com",
      utmSource: "google",
      utmMedium: "cpc",
      utmCampaign: "packaging-2026"
    }, null, 2),
    headers: {
      "Content-Type": "application/json",
      "x-crm-webhook-signature": "sha256-hmac-signature",
      "x-crm-webhook-timestamp": Date.now().toString()
    }
  },
];

const JS_SNIPPET = `// Europrint CRM integratsiya skripti
// veb-saytingizning <head> qismiga qo'shing

const CRM_WEBHOOK_URL = '${BASE_URL}/api/crm/webhooks/form-lead';
// CRM_SECRET — bu backend .env faylida saqlanadi, brauzerda hech qachon ko'rsatilmaydi

async function submitToERP(formData) {
  const timestamp = Date.now().toString();
  const payload = JSON.stringify(formData);
  
  // HMAC SHA-256 imzo (server-side da hisoblang!)
  const response = await fetch(CRM_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-crm-webhook-timestamp': timestamp,
      // 'x-crm-webhook-signature': backend server tomonidan hisoblanadi va yuboriladi
    },
    body: payload
  });
  
  return response.json();
}

// Forma submit hodisasi
document.getElementById('contact-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = {
    formId: 'contact-form-1',
    formName: 'Asosiy aloqa formasi',
    fields: {
      name: e.target.name.value,
      phone: e.target.phone.value,
      email: e.target.email?.value,
      message: e.target.message?.value,
    }
  };
  await submitToERP(data);
  alert('Murojaatingiz qabul qilindi!');
});`;

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: "Nusxalandi!" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="outline" size="default" onClick={handleCopy} data-testid="button-copy">
      {copied ? <CheckCircle className="w-4 h-4 mr-1 text-green-500" /> : <Copy className="w-4 h-4 mr-1" />}
      {copied ? "Nusxalandi" : "Nusxala"}
    </Button>
  );
}

export default function CustomerPortalConfig() {
  const [selectedEndpoint, setSelectedEndpoint] = useState(WEBHOOK_ENDPOINTS[0]);

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Mijozlar sayti integratsiyasi"
        description="Veb-sayt va tashqi tizimlarni ERP CRM moduliga ulash sozlamalari"
      />

      {/* Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1"><Globe className="w-4 h-4" />Server manzili</div>
            <div className="font-mono text-sm truncate">{BASE_URL}</div>
            <Badge className="mt-2 bg-green-500/10 text-green-700 dark:text-green-400"><CheckCircle className="w-3 h-3 mr-1" />Faol</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1"><Shield className="w-4 h-4" />Webhook xavfsizlik</div>
            <Badge variant="destructive" className="mt-1">CRM_WEBHOOK_SECRET kerak</Badge>
            <p className="text-xs text-muted-foreground mt-1.5">Replit Secrets orqali sozlang</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1"><Webhook className="w-4 h-4" />Webhook endpointlar</div>
            <div className="text-3xl font-bold">{WEBHOOK_ENDPOINTS.length}</div>
            <div className="text-xs text-muted-foreground">forma, qo'ng'iroq, telegram, kuzatish</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="endpoints">
        <TabsList>
          <TabsTrigger value="endpoints" data-testid="tab-endpoints"><Webhook className="w-3.5 h-3.5 mr-1.5" />Webhook endpointlar</TabsTrigger>
          <TabsTrigger value="code" data-testid="tab-code"><Code2 className="w-3.5 h-3.5 mr-1.5" />JavaScript kodi</TabsTrigger>
          <TabsTrigger value="security" data-testid="tab-security"><Shield className="w-3.5 h-3.5 mr-1.5" />Xavfsizlik</TabsTrigger>
        </TabsList>

        <TabsContent value="endpoints" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(Array.isArray(WEBHOOK_ENDPOINTS) ? WEBHOOK_ENDPOINTS : []).map(ep => {
              const Icon = ep.icon;
              return (
                <Card
                  key={ep.id}
                  className={`cursor-pointer transition-colors hover-elevate ${selectedEndpoint.id === ep.id ? "border-primary" : ""}`}
                  onClick={() => setSelectedEndpoint(ep)}
                  data-testid={`card-endpoint-${ep.id}`}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-md bg-primary/10">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{ep.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{ep.description}</div>
                        <Badge variant="outline" className="text-xs mt-2">{ep.method}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Selected endpoint details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Link2 className="w-4 h-4" />{selectedEndpoint.name} — Endpoint tafsilotlari
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>URL</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-muted px-3 py-2 rounded-md font-mono truncate">
                    {selectedEndpoint.method} {selectedEndpoint.url}
                  </code>
                  <CopyButton text={selectedEndpoint.url} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>So'rov tanasi (JSON)</Label>
                <div className="relative">
                  <pre className="text-xs bg-muted rounded-md p-3 overflow-x-auto font-mono leading-relaxed">
                    {selectedEndpoint.body}
                  </pre>
                  <div className="absolute top-2 right-2">
                    <CopyButton text={selectedEndpoint.body} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="code" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Veb-saytga integratsiya kodi</CardTitle>
              <CardDescription>Bu kodni veb-saytingizga qo'shing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="text-xs bg-muted rounded-md p-4 overflow-x-auto font-mono leading-relaxed max-h-96">
                  {JS_SNIPPET}
                </pre>
                <div className="absolute top-2 right-2">
                  <CopyButton text={JS_SNIPPET} />
                </div>
              </div>
              <div className="mt-4 p-3 rounded-md bg-yellow-500/10 border border-yellow-200 dark:border-yellow-800">
                <p className="text-xs text-yellow-700 dark:text-yellow-400">
                  <strong>Muhim:</strong> HMAC imzoni server tomonida hisoblang. JavaScript frontendda secret kalitni ochiq saqlash xavfli!
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Xavfsizlik sozlamalari</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>HMAC SHA-256 imzo kaliti</Label>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    value="••••••••••••••••"
                    readOnly
                    className="font-mono"
                    data-testid="input-webhook-secret"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  <code className="bg-muted px-1 rounded">CRM_WEBHOOK_SECRET</code> env o'zgaruvchisini Replit Secrets orqali sozlang
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-medium">Xavfsizlik protokoli</h4>
                {([
                  "Har bir so'rovda HMAC SHA-256 imzo tekshiriladi",
                  "Timestamp 5 daqiqadan eski so'rovlar rad etiladi",
                  "Rate limiting: IP boshiga 100 so'rov/daqiqa",
                  "Barcha webhook loglari audit jurnalida saqlanadi",
                  "JWT token orqali ham autentifikatsiya qilish mumkin",
                ]).map((item, i) => (
                  <div key={`k-${i}`} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
